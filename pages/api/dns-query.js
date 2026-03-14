import dnsPacket from 'dns-packet';
import { requireDB } from '../../lib/dbHelper';
import Device from '../../models/Device';
import DnsRule from '../../models/DnsRule';
import { applyCors } from '../../utils';

const UPSTREAM_DOH = 'https://cloudflare-dns.com/dns-query';

function domainMatchesRule(domain, rule) {
  const d = domain.toLowerCase().trim();
  const r = rule.domain.toLowerCase().trim();
  if (rule.type === 'exact') return d === r;
  if (rule.type === 'suffix') return d === r || d.endsWith('.' + r);
  return d === r;
}

export default async function handler(req, res) {
  if (await applyCors(req, res)) return;
  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).end();
  }

  const deviceToken = typeof req.query.device === 'string' ? req.query.device.trim() : '';
  if (!deviceToken) {
    return res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Missing device parameter' }));
  }

  let wire;
  if (req.method === 'GET') {
    const b64 = req.query.dns;
    if (!b64) return res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Missing dns parameter' }));
    try {
      wire = Buffer.from(b64, 'base64url');
    } catch {
      return res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Invalid dns parameter' }));
    }
  } else {
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('application/dns-message')) {
      return res.status(415).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Unsupported content type' }));
    }
    try {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      wire = Buffer.concat(chunks);
    } catch (e) {
      return res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Invalid body' }));
    }
  }

  let decoded;
  try {
    decoded = dnsPacket.decode(wire);
  } catch {
    return res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Invalid DNS message' }));
  }

  const questions = decoded.questions || [];
  if (questions.length === 0) {
    return res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'No question in DNS message' }));
  }
  const domain = (questions[0].name || '').replace(/\.$/, '');

  const conn = await requireDB(res);
  if (!conn) return;

  const device = await Device.findOne({ token: deviceToken }).lean();
  if (!device) {
    return res.status(404).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Device not found' }));
  }

  const [deviceRules, userRules] = await Promise.all([
    DnsRule.find({ device: device._id }).lean(),
    DnsRule.find({ user: device.user, device: null }).lean(),
  ]);
  const allRules = [...deviceRules, ...userRules];

  let shouldBlock = false;
  for (const rule of allRules) {
    if (rule.action !== 'block') continue;
    if (domainMatchesRule(domain, rule)) {
      shouldBlock = true;
      break;
    }
  }
  if (!shouldBlock) {
    for (const rule of allRules) {
      if (rule.action !== 'allow') continue;
      if (domainMatchesRule(domain, rule)) {
        shouldBlock = false;
        break;
      }
    }
  }

  if (shouldBlock) {
    const flags = (decoded.flags || 0) & 0xfff0;
    const response = {
      id: decoded.id,
      type: 'response',
      flags: flags | 3,
      questions: decoded.questions,
      answers: [],
      authorities: [],
      additionals: [],
    };
    const out = dnsPacket.encode(response);
    res.setHeader('Content-Type', 'application/dns-message');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).end(out);
  }

  try {
    const url = UPSTREAM_DOH + '?dns=' + Buffer.from(wire).toString('base64url');
    const upstreamRes = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/dns-message' },
    });
    if (!upstreamRes.ok) {
      const flags = (decoded.flags || 0) & 0xfff0;
      const response = {
        id: decoded.id,
        type: 'response',
        flags: flags | 2,
        questions: decoded.questions,
        answers: [],
        authorities: [],
        additionals: [],
      };
      const out = dnsPacket.encode(response);
      res.setHeader('Content-Type', 'application/dns-message');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).end(out);
    }
    const buf = Buffer.from(await upstreamRes.arrayBuffer());
    res.setHeader('Content-Type', 'application/dns-message');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).end(buf);
  } catch (err) {
    const flags = (decoded.flags || 0) & 0xfff0;
    const response = {
      id: decoded.id,
      type: 'response',
      flags: flags | 2,
      questions: decoded.questions,
      answers: [],
      authorities: [],
      additionals: [],
    };
    const out = dnsPacket.encode(response);
    res.setHeader('Content-Type', 'application/dns-message');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).end(out);
  }
}
