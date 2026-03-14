import { requireDB } from '../../lib/dbHelper';
import Device from '../../models/Device';

const PLATFORMS = ['windows', 'linux', 'android', 'ios', 'mac'];

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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
  const base = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  const dohUrl = `${base}/api/dns-query?device=${deviceToken}`;

  if (os === 'android') {
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).end(
      'Android: Install our app from the dashboard (or Play Store link when available). Open the app and tap Enable to use our DNS.\n\nYour DoH URL: ' + dohUrl
    );
  }

  if (os === 'windows') {
    const script = `# DNS Control - Windows DoH setup
# Run this script as Administrator (right-click -> Run with PowerShell as Administrator)
$dohUrl = "${dohUrl}"
$template = $dohUrl
try {
  Add-DnsClientDohServerAddress -ServerAddress 0.0.0.0 -DohTemplate $template -AllowFallbackToUdp $false -AutoUpgrade $true
  Write-Host "DNS over HTTPS has been configured. Your device will use our DNS."
} catch {
  Write-Host "If you see an error, you may need to set DoH manually in Settings -> Network -> DNS, and use: $dohUrl"
}
`;
    res.setHeader('Content-Type', 'application/x-powershell');
    res.setHeader('Content-Disposition', 'attachment; filename="dns-control-setup.ps1"');
    return res.status(200).end(script);
  }

  if (os === 'linux') {
    const script = `#!/bin/sh
# DNS Control - Linux setup
# Run with: sudo sh dns-control-setup.sh
# Your DoH URL (use this in systemd-resolved or your DNS manager):
DOH_URL="${dohUrl}"
echo "DoH URL: $DOH_URL"
echo ""
echo "To use our DNS on Linux, configure your system to use DNS over HTTPS."
echo "With systemd-resolved: add the URL to /etc/systemd/resolved.conf or use a DoH stub like dnscrypt-proxy."
echo "Alternatively, install our browser extension for browser-only filtering."
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
      <string>DNS Control - DNS over HTTPS</string>
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
