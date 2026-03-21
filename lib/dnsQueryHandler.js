import dnsPacket from 'dns-packet';
import { requireDB } from './dbHelper';
import Device from '../models/Device';
import DnsRule from '../models/DnsRule';
import DnsBlockLog from '../models/DnsBlockLog';
import adultDomains from '../data/adultDomains.sample.json';
import { getPublicBaseUrl, buildDohUrl } from './publicAppUrl';

const UPSTREAM_DOH = 'https://cloudflare-dns.com/dns-query';

function escapeHtml(s) {
  if (!s) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getDoHLandingHtml(dohUrl, baseUrl) {
  const d = escapeHtml(dohUrl);
  const b = escapeHtml(baseUrl);
  const dashboardLink = b + '/dashboard';
  const insecureLocal =
    /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?\//i.test(dohUrl) || /^http:\/\/(localhost|127\.0\.0\.1)\//i.test(dohUrl);
  const localHttpCallout = insecureLocal
    ? `<div class="callout" style="background:#fffbeb;border-color:#fde68a;">
    <strong>Firefox: Increased vs Max Protection</strong><br>
    <strong>Increased Protection</strong> + custom provider often works with <code>http://localhost…</code> for development.<br>
    <strong>Max Protection</strong> is stricter: it usually requires a valid <strong>HTTPS</strong> DoH URL. Plain <code>http://</code> often shows <strong>Provider: Invalid URL</strong> or “trouble finding this site”—that is Firefox, not your block list. Fix: use <strong>Increased Protection</strong> for local HTTP, or run the app over HTTPS (<code>npm run dev:https</code> and accept the self-signed cert in Firefox once), or deploy with a real HTTPS URL and paste that DoH link.
  </div>`
    : '';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DNS Control – DoH endpoint</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 2rem auto; padding: 0 1rem; color: #1c1917; line-height: 1.6; }
    h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
    h2 { font-size: 1.1rem; margin: 1.25rem 0 0.4rem 0; color: #44403c; }
    p { margin: 0.5rem 0; }
    code { background: #f5f5f4; padding: 0.2em 0.4em; border-radius: 4px; font-size: 0.88em; word-break: break-all; }
    .url-box { background: #faf8f5; border: 1px solid #e7e5e4; border-radius: 8px; padding: 1rem; margin: 1rem 0; }
    .steps { margin: 0.25rem 0 0 1rem; padding-left: 1rem; }
    .steps li { margin-bottom: 0.4rem; }
    a { color: #0d9488; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .note { font-size: 0.9rem; color: #57534e; }
    .platform { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 0.75rem 1rem; margin-top: 0.5rem; }
    .platform h2 { margin-top: 0; }
    .links { margin-top: 1.25rem; }
    .links a { display: inline-block; margin-right: 1rem; }
    .callout { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 0.75rem 1rem; margin: 1rem 0; font-size: 0.92rem; }
    .accordion-section { border: 1px solid #e7e5e4; border-radius: 8px; margin-top: 0.5rem; overflow: hidden; }
    .accordion-section summary { list-style: none; cursor: pointer; padding: 0.75rem 1rem; background: #fafaf9; font-weight: 600; color: #1c1917; display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
    .accordion-section summary::-webkit-details-marker { display: none; }
    .accordion-section summary .accordion-icon { width: 1.5rem; height: 1.5rem; flex-shrink: 0; text-align: center; line-height: 1.5rem; font-size: 1.25rem; color: #0d9488; }
    .accordion-section[open] summary .accordion-icon::before { content: '−'; }
    .accordion-section:not([open]) summary .accordion-icon::before { content: '+'; }
    .accordion-section .platform { margin: 0; border: none; border-radius: 0; border-top: 1px solid #e7e5e4; }
  </style>
</head>
<body>
  <h1>DNS Control – DNS over HTTPS</h1>
  <p>This URL is a <strong>DoH endpoint</strong>. Set it as your DNS-over-HTTPS server on your device so your block/allow rules apply.</p>
  <div class="callout">
    <strong>Firefox “Invalid URL”?</strong> Use this <strong>path-style</strong> link (no <code>?device=</code>). Firefox appends <code>?dns=…</code> to whatever you paste; an old <code>?device=</code> URL breaks that. Copy the URL below — dashboard and setup files already use this format.
  </div>
  ${localHttpCallout}
  <div class="callout" style="background:#f0f9ff;border-color:#bae6fd;">
    <strong>How blocking works</strong>: Domains <em>not</em> on your block list resolve normally (we forward to a public DNS). Only domains you added under <strong>Block</strong> (and optional <strong>adult</strong> list, if enabled) get no answer. <strong>Allow</strong> rules override block/adult for that domain.
  </div>
  <div class="url-box">
    <p style="margin-top:0;"><strong>Your DoH URL (copy this):</strong></p>
    <code id="doh">${d}</code>
    <p style="margin-bottom:0;"><button type="button" onclick="navigator.clipboard.writeText(document.getElementById('doh').textContent); this.textContent='Copied!'; setTimeout(function(){this.textContent='Copy';}.bind(this), 1500)">Copy</button></p>
  </div>

  <h2>Easiest: use the setup file</h2>
  <p>In the dashboard go to <strong>Devices</strong> → select your device → <strong>Download setup file</strong> for your platform. Click your device below to expand steps.</p>

  <details class="accordion-section">
    <summary>Windows <span class="accordion-icon" aria-hidden="true"></span></summary>
  <div class="platform">
    <p><strong>Option A – Setup file (easiest)</strong></p>
    <ol class="steps">
      <li>Download the setup file from the dashboard: <strong>Get setup file for Windows</strong> (saves as <code>dns-control-setup.ps1</code>).</li>
      <li>Right‑click <code>dns-control-setup.ps1</code> → <strong>Run with PowerShell</strong>. If prompted, choose <strong>Run as Administrator</strong>.</li>
      <li>If a script execution error appears: open PowerShell as Administrator and run <code>Set-ExecutionPolicy RemoteSigned -Scope CurrentUser</code>, then run the script again.</li>
      <li>Done. Windows will use DNS Control for this device.</li>
    </ol>
    <p><strong>Option B – Manual</strong></p>
    <ol class="steps">
      <li>Settings → Network &amp; Internet → your connection (Wi‑Fi or Ethernet) → DNS.</li>
      <li>Under “DNS over HTTPS” choose <strong>On (automatic template)</strong> or <strong>On (manual template)</strong>.</li>
      <li>If manual: paste your DoH URL above into the template field.</li>
    </ol>
  </div>
  </details>

  <details class="accordion-section">
    <summary>Linux <span class="accordion-icon" aria-hidden="true"></span></summary>
  <div class="platform">
    <p><strong>Option A – Setup script + browser (easiest)</strong></p>
    <ol class="steps">
      <li>Download the setup file from the dashboard: <strong>Get setup file for Linux</strong> (saves as <code>dns-control-setup.sh</code>).</li>
      <li>In a terminal: <code>chmod +x dns-control-setup.sh</code> then <code>./dns-control-setup.sh</code>. It will print your DoH URL.</li>
      <li>For <strong>Firefox (Ubuntu/Linux desktop)</strong>: Settings → General → <strong>Network Settings</strong> → <strong>Settings…</strong> → scroll to <strong>DNS over HTTPS</strong> → <strong>Increased Protection</strong> or <strong>Max Protection</strong> → <strong>Custom</strong> → paste your DoH URL (must look like <code>…/api/dns-query/YOURTOKEN</code>, not <code>?device=</code>).</li>
      <li>For <strong>Chrome</strong>: Settings → Privacy and security → Security → <strong>Use secure DNS</strong> → <strong>With</strong> → paste your DoH URL.</li>
    </ol>
    <p><strong>Option B – Full system (systemd-resolved)</strong></p>
    <ol class="steps">
      <li>Install a DoH stub (e.g. <code>dnscrypt-proxy</code>) and point it at your DoH URL, or use a recent systemd with DoH support and configure the template in <code>/etc/systemd/resolved.conf.d/</code>.</li>
      <li>Your DoH URL is the one shown at the top of this page.</li>
    </ol>
  </div>
  </details>

  <details class="accordion-section">
    <summary>Android <span class="accordion-icon" aria-hidden="true"></span></summary>
  <div class="platform">
    <p><strong>Easiest: browser-only (Firefox)</strong></p>
    <ol class="steps">
      <li>Install <strong>Firefox</strong> from the Play Store if you don’t have it.</li>
      <li>Menu (≡) → <strong>Settings</strong> → <strong>DNS over HTTPS</strong>.</li>
      <li>If you see <strong>Default / Increased / Max / Off</strong>: pick <strong>Increased</strong> or <strong>Max</strong>, then <strong>Custom</strong>, and paste your DoH URL. If you only see On + Custom, turn On and choose Custom.</li>
      <li>Done. Sites opened in Firefox use DNS Control; other apps use the system DNS.</li>
    </ol>
    <p><strong>Full device</strong>: Android’s built‑in “Private DNS” uses DoT, not DoH, so it can’t use this URL directly. Download <strong>Android</strong> from the dashboard (saves <code>dns-control-android-setup.html</code>) for a step‑by‑step page, use Firefox (above), or a Play Store app that supports custom DoH.</p>
  </div>
  </details>

  <details class="accordion-section">
    <summary>iOS <span class="accordion-icon" aria-hidden="true"></span></summary>
  <div class="platform">
    <p><strong>Setup file (easiest)</strong></p>
    <ol class="steps">
      <li>Download the setup file from the dashboard: <strong>Get setup file for iOS</strong> (saves as <code>dns-control.mobileconfig</code>).</li>
      <li>Open the file (e.g. from Mail or Files). Tap <strong>Install</strong> and enter your passcode if asked.</li>
      <li>Go to Settings → General → VPN &amp; Device Management → DNS Control → tap <strong>Install</strong> again if needed.</li>
      <li>Done. Your iPhone/iPad will use DNS Control.</li>
    </ol>
  </div>
  </details>

  <details class="accordion-section">
    <summary>macOS <span class="accordion-icon" aria-hidden="true"></span></summary>
  <div class="platform">
    <p><strong>Setup file (easiest)</strong></p>
    <ol class="steps">
      <li>Download the setup file from the dashboard: <strong>Get setup file for Mac</strong> (saves as <code>dns-control.mobileconfig</code>).</li>
      <li>Double‑click the file to open it. In System Preferences (or System Settings) the profile will appear; click <strong>Install</strong> and confirm.</li>
      <li>Your Mac will use DNS Control. You can remove it later from System Settings → Profiles.</li>
    </ol>
  </div>
  </details>

  <p class="note">By default, only domains on your block list (and optional adult list) are blocked; everything else is resolved normally. Blocked lookups are logged in the dashboard.</p>
  <div class="links">
    <a href="${dashboardLink}">Open dashboard</a>
  </div>
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

/**
 * Shared DoH handler. deviceToken from path <code>/api/dns-query/:device</code> avoids
 * <code>?device=</code> which breaks Firefox custom DoH (it appends <code>?dns=</code>).
 */
export async function dnsQueryApiHandler(req, res, deviceToken) {
  // Some clients probe the endpoint with HEAD before sending DoH queries.
  if (req.method === 'HEAD') {
    const conn = await requireDB(res);
    if (!conn) return;
    const device = await Device.findOne({ token: deviceToken }).lean();
    if (!device) {
      return res.status(404).end();
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Content-Type', 'application/dns-message');
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.setHeader('Allow', 'GET, POST, HEAD');
    return res.status(405).end();
  }

  let wire;
  if (req.method === 'GET') {
    const b64 = req.query.dns;
    if (!b64) {
      const conn = await requireDB(res);
      if (!conn) return;
      const device = await Device.findOne({ token: deviceToken }).lean();
      if (!device) {
        return res.status(404).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Device not found' }));
      }
      const base = getPublicBaseUrl(req);
      const dohUrl = buildDohUrl(base, deviceToken);
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

  const normalizedAdult = Array.isArray(adultDomains)
    ? adultDomains.map((d) => String(d).toLowerCase().trim()).filter(Boolean)
    : [];

  let shouldBlock = false;
  for (const rule of allRules) {
    if (rule.action !== 'block') continue;
    if (domainMatchesRule(domain, rule)) {
      shouldBlock = true;
      break;
    }
  }
  if (!shouldBlock && device.blockAdultContent && normalizedAdult.length > 0) {
    for (const ad of normalizedAdult) {
      if (domain === ad || domain.endsWith('.' + ad)) {
        shouldBlock = true;
        break;
      }
    }
  }
  // Allow rules override block + adult (exceptions / whitelist).
  for (const rule of allRules) {
    if (rule.action !== 'allow') continue;
    if (domainMatchesRule(domain, rule)) {
      shouldBlock = false;
      break;
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
