import { requireDB } from '../../lib/dbHelper';
import Device from '../../models/Device';
import { getPublicBaseUrl, buildDohUrl } from '../../lib/publicAppUrl';

const SERVER_DNS_EXPLAINER = `All lookups for this device go to DNS Control on the web: your phone, PC, or browser sends DNS-over-HTTPS (DoH) questions to YOUR personal URL. Our server applies your block/allow lists and optional adult blocking, logs blocked domains to your dashboard, then answers or forwards to a public DNS resolver.`;

function escapeHtmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function androidSetupHtml(dohUrl, base, deviceName, deviceToken) {
  const d = JSON.stringify(dohUrl);
  const dashboard = JSON.stringify(`${base}/dashboard#devices`);
  const extConfig = JSON.stringify(`${base}/api/extension-config?device=${encodeURIComponent(deviceToken)}`);
  const safeName = escapeHtmlText(deviceName);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>DNS Control – Android setup</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 520px; margin: 0 auto; padding: 1.25rem; color: #1c1917; line-height: 1.55; }
    h1 { font-size: 1.35rem; margin: 0 0 0.5rem 0; }
    .lead { color: #44403c; margin: 0 0 1rem 0; }
    .box { background: #f0fdfa; border: 1px solid #99f6e4; border-radius: 10px; padding: 1rem; margin: 1rem 0; word-break: break-all; }
    code { font-size: 0.82rem; background: #f5f5f4; padding: 0.2em 0.4em; border-radius: 4px; }
    ol { padding-left: 1.2rem; }
    li { margin-bottom: 0.5rem; }
    button { margin-top: 0.5rem; padding: 0.45rem 0.9rem; border-radius: 8px; border: 1px solid #0d9488; background: #fff; color: #0f766e; font-weight: 600; cursor: pointer; }
    .note { font-size: 0.88rem; color: #57534e; margin-top: 1rem; }
    a { color: #0d9488; font-weight: 600; }
  </style>
</head>
<body>
  <h1>DNS Control on Android</h1>
  <p class="lead"><strong>${safeName}</strong> — ${SERVER_DNS_EXPLAINER}</p>
  <p>Android’s <strong>Private DNS</strong> setting only accepts a <em>hostname</em> (DNS-over-TLS), not a full HTTPS URL, so it cannot use this DoH link directly. Use one of the options below so traffic still hits <strong>our server</strong> and your rules apply.</p>

  <h2>Option A — Firefox (recommended)</h2>
  <p>Covers sites you open in Firefox. DNS queries from Firefox go to our website.</p>
  <ol>
    <li>Install <strong>Firefox</strong> from the Play Store.</li>
    <li>Menu (≡) → <strong>Settings</strong> → <strong>DNS over HTTPS</strong>.</li>
    <li>If you see <strong>Default / Increased / Max / Off</strong>: choose <strong>Increased</strong> or <strong>Max</strong> (not Default—not your URL—and not Off), then <strong>Custom</strong> and paste below. If you only see On + Custom, use that.</li>
    <li>Paste the URL below (or tap Copy, then long-press in the field).</li>
  </ol>
  <div class="box">
    <div><strong>Your DoH URL</strong></div>
    <code id="doh">${escapeHtmlText(dohUrl)}</code><br>
    <button type="button" id="copy">Copy URL</button>
  </div>

  <h2>Option B — Whole-device DoH app</h2>
  <p>Install an app from the Play Store that supports <strong>custom DNS over HTTPS</strong> and paste the same URL. (Search for “DNS over HTTPS” or “private DNS DoH”.) All apps can then use our resolver, same as iOS/macOS profile or Windows script.</p>

  <h2>Option C — Chrome on Android</h2>
  <p>Chrome → Settings → Privacy and security → <strong>Use secure DNS</strong> → choose custom provider → paste the same URL. Applies to Chrome only.</p>

  <h2>Chrome extension (desktop)</h2>
  <p>On a computer, download <a id="cfg" href="#">dns-control-config.json</a> and import it in the DNS Control extension options (Load unpacked from the project <code>extension</code> folder). The file contains this DoH URL and links to every setup download.</p>

  <p class="note">Open your <a id="dash" href="#">dashboard Devices</a> anytime to copy the URL or download Windows, iOS, Mac, and Linux helpers.</p>

  <script>
    var DOH = ${d};
    var DASH = ${dashboard};
    var CFG = ${extConfig};
    document.getElementById('copy').onclick = function() {
      navigator.clipboard.writeText(DOH).then(function() {
        this.textContent = 'Copied!';
        setTimeout(function() { this.textContent = 'Copy URL'; }.bind(this), 2000);
      }.bind(this));
    };
    document.getElementById('dash').href = DASH;
    document.getElementById('cfg').href = CFG;
  </script>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const deviceToken = typeof req.query.device === 'string' ? req.query.device.trim() : '';
  const os = typeof req.query.os === 'string' ? req.query.os.trim().toLowerCase() : '';
  if (!deviceToken || !os) {
    return res.status(400).setHeader('Content-Type', 'application/json').end(
      JSON.stringify({ error: 'Missing device or os parameter' })
    );
  }

  const conn = await requireDB(res);
  if (!conn) return;

  const device = await Device.findOne({ token: deviceToken }).lean();
  if (!device) {
    return res.status(404).setHeader('Content-Type', 'application/json').end(
      JSON.stringify({ error: 'Device not found' })
    );
  }

  const base = getPublicBaseUrl(req);
  const dohUrl = buildDohUrl(base, deviceToken);
  const deviceLabel = device.name || 'This device';

  if (os === 'android') {
    const html = androidSetupHtml(dohUrl, base, deviceLabel, deviceToken);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="dns-control-android-setup.html"');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).end(html);
  }

  if (os === 'windows') {
    const script = `# DNS Control - Windows DoH setup
# ${SERVER_DNS_EXPLAINER}
#
# STEPS:
# 1. Right-click this file -> "Run with PowerShell"
# 2. If prompted "execution of scripts is disabled", open PowerShell as Administrator and run:
#    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
#    Then run this script again (right-click -> Run with PowerShell).
# 3. If it still fails, set DoH manually: Settings -> Network & Internet -> Wi-Fi/Ethernet -> DNS -> DNS over HTTPS -> On (manual template) -> paste the URL below.
#
# Extension + JSON bundle: ${base}/api/extension-config?device=${deviceToken}

$dohUrl = "${dohUrl}"
Write-Host "DNS Control - Configuring DNS over HTTPS..."
Write-Host "DoH URL: $dohUrl"
Write-Host ""

try {
  Add-DnsClientDohServerAddress -ServerAddress 0.0.0.0 -DohTemplate $dohUrl -AllowFallbackToUdp $false -AutoUpgrade $true
  Write-Host "SUCCESS. DNS over HTTPS is now enabled. Your block/allow rules will apply."
} catch {
  Write-Host "Could not set DoH automatically. Set it manually:"
  Write-Host "  Settings -> Network & Internet -> your connection -> DNS"
  Write-Host "  Turn on DNS over HTTPS and use this URL: $dohUrl"
  Write-Host ""
  Write-Host "Or run this script as Administrator: open PowerShell as admin, cd to the folder where you saved this file, then run: .\\dns-control-setup.ps1"
}
`;
    res.setHeader('Content-Type', 'application/x-powershell');
    res.setHeader('Content-Disposition', 'attachment; filename="dns-control-setup.ps1"');
    return res.status(200).end(script);
  }

  if (os === 'linux') {
    const script = `#!/bin/sh
# DNS Control - Linux setup
# ${SERVER_DNS_EXPLAINER}
#
# Run: chmod +x dns-control-setup.sh   then   ./dns-control-setup.sh
#
# Extension JSON (all links): ${base}/api/extension-config?device=${deviceToken}

DOH_URL="${dohUrl}"
echo "=============================================="
echo "  DNS Control - Your DoH URL (copy this):"
echo "=============================================="
echo ""
echo "$DOH_URL"
echo ""
echo "=============================================="
echo "  EASIEST: Use in your browser (browser-only)"
echo "=============================================="
echo ""
echo "Chrome: Settings -> Privacy and security -> Security -> Use secure DNS -> With: paste the URL above"
echo "Firefox: Settings -> General -> Network Settings -> Settings... -> DNS over HTTPS: choose Increased Protection (or Max), then Custom provider -> paste the URL above (NOT Default Protection or Off)"
echo ""
echo "=============================================="
echo "  Full system (optional)"
echo "=============================================="
echo "Install a DoH-capable stub (e.g. dnscrypt-proxy) and set its DoH URL to the one above."
echo "Or use systemd-resolved with a DoH template if your distribution supports it."
echo ""
echo "Dashboard: ${base}/dashboard"
`;
    res.setHeader('Content-Type', 'application/x-sh');
    res.setHeader('Content-Disposition', 'attachment; filename="dns-control-setup.sh"');
    return res.status(200).end(script);
  }

  if (os === 'ios' || os === 'mac') {
    const payloadId = `com.dnscontrol.profile.${device._id}`;
    const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>PayloadContent</key>
  <array>
    <dict>
      <key>DNSSettings</key>
      <dict>
        <key>DNSProtocol</key>
        <string>HTTPS</string>
        <key>ServerURL</key>
        <string>${dohUrl}</string>
      </dict>
      <key>PayloadDescription</key>
      <string>DNS Control - DNS over HTTPS for this device. Rules and logging are enforced on the DNS Control server.</string>
      <key>PayloadDisplayName</key>
      <string>DNS Control</string>
      <key>PayloadIdentifier</key>
      <string>${payloadId}</string>
      <key>PayloadType</key>
      <string>com.apple.dnsSettings.managed</string>
      <key>PayloadUUID</key>
      <string>${device._id}-${Date.now()}</string>
      <key>PayloadVersion</key>
      <integer>1</integer>
    </dict>
  </array>
  <key>PayloadDisplayName</key>
  <string>DNS Control</string>
  <key>PayloadIdentifier</key>
  <string>${payloadId}</string>
  <key>PayloadType</key>
  <string>Configuration</string>
  <key>PayloadUUID</key>
  <string>${device._id}-root-${Date.now()}</string>
  <key>PayloadVersion</key>
  <integer>1</integer>
</dict>
</plist>
`;
    res.setHeader('Content-Type', 'application/x-apple-aspen-config');
    res.setHeader('Content-Disposition', 'attachment; filename="dns-control.mobileconfig"');
    return res.status(200).end(plist);
  }

  return res.status(400).setHeader('Content-Type', 'application/json').end(
    JSON.stringify({ error: 'Unsupported os. Use: windows, linux, android, ios, mac' })
  );
}
