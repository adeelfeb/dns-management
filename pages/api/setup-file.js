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
# STEPS:
# 1. Right-click this file -> "Run with PowerShell"
# 2. If prompted "execution of scripts is disabled", open PowerShell as Administrator and run:
#    Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
#    Then run this script again (right-click -> Run with PowerShell).
# 3. If it still fails, set DoH manually: Settings -> Network & Internet -> Wi-Fi/Ethernet -> DNS -> DNS over HTTPS -> On (manual template) -> paste the URL below.

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
# Run: chmod +x dns-control-setup.sh   then   ./dns-control-setup.sh

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
echo "Firefox: Settings -> Network Settings -> Enable DNS over HTTPS -> Custom -> paste the URL above"
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
