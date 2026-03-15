import dnsPacket from 'dns-packet';
import { requireDB } from '../../lib/dbHelper';
import Device from '../../models/Device';
import DnsRule from '../../models/DnsRule';
import DnsBlockLog from '../../models/DnsBlockLog';
import { applyCors } from '../../utils';

const UPSTREAM_DOH = 'https://cloudflare-dns.com/dns-query';

function getDoHLandingHtml(dohUrl, baseUrl) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DNS Control – DoH endpoint</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 560px; margin: 2rem auto; padding: 0 1rem; color: #1c1917; line-height: 1.6; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    p { margin: 0.75rem 0; }
    code { background: #f5f5f4; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.9em; word-break: break-all; }
    .url-box { background: #faf8f5; border: 1px solid #e7e5e4; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    a { color: #0d9488; }
    .note { font-size: 0.9rem; color: #57534e; }
  </style>
</head>
<body>
  <h1>DNS Control – DNS over HTTPS</h1>
  <p>This URL is a <strong>DoH (DNS over HTTPS) endpoint</strong>. It is not a normal web page. Your device or browser must use it as its DNS server so your block/allow rules apply.</p>
  <p><strong>How to use it:</strong></p>
  <ul>
    <li>Copy the URL below and set it as your <strong>DNS over HTTPS</strong> server in your system or browser settings (e.g. Windows, macOS, Android, or in your browser’s DoH option).</li>
    <li>Or use the <strong>setup file</strong> from your dashboard: Devices → Add device → Download setup file for your platform.</li>
  </ul>
  <div class="url-box">
    <p style="margin-top:0;"><strong>Your DoH URL (copy this):</strong></p>
    <code id="doh">${dohUrl.replace(/</g, '&lt;')}</code>
    <p style="margin-bottom:0;"><button type="button" onclick="navigator.clipboard.writeText(document.getElementById('doh').textContent); this.textContent='Copied!'; setTimeout(()=>this.textContent='Copy', 1500)">Copy</button></p>
  </div>
  <p class="note">When a program or OS resolves a domain, it will call this URL with a DNS query. Blocked domains get no answer; others are resolved via our upstream DNS. You don’t need to open this page again—just configure the URL once.</p>
  <p><a href="${baseUrl.replace(/"/g, '&quot;')}/dashboard">Open dashboard</a></p>
</body>
</html>`;
}

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
    if (!b64) {
      // No DNS query = opened in browser. Return a friendly landing page so "one click" shows something useful.
      const conn = await requireDB(res);
      if (!conn) return;
      const device = await Device.findOne({ token: deviceToken }).lean();
      if (!device) {
        return res.status(404).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Device not found' }));
      }
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || (req.headers.host ? `${req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http'}://${req.headers.host}` : 'http://localhost:3000');
      const base = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
      const dohUrl = `${base}/api/dns-query?device=${encodeURIComponent(deviceToken)}`;
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).end(getDoHLandingHtml(dohUrl, base));
    }
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
    DnsBlockLog.create({ device: device._id, domain }).catch(() => {});
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
