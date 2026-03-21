import { requireDB } from '../../lib/dbHelper';
import Device from '../../models/Device';
import { getPublicBaseUrl, buildDohUrl } from '../../lib/publicAppUrl';

/**
 * JSON bundle for the DNS Control browser extension and other clients.
 * Device token is the secret (same model as /api/setup-file).
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }

  const deviceToken = typeof req.query.device === 'string' ? req.query.device.trim() : '';
  if (!deviceToken) {
    return res.status(400).setHeader('Content-Type', 'application/json').end(
      JSON.stringify({ error: 'Missing device parameter' })
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
  const q = `device=${encodeURIComponent(deviceToken)}`;

  const payload = {
    schemaVersion: 1,
    product: 'dns-control',
    about:
      'dohUrl uses /api/dns-query/<token> (path) so Firefox can append ?dns=…. Do not use ?device= in Firefox custom DNS. When configured, lookups hit your DNS Control server; only explicit block rules (and optional adult list) are blocked; the rest resolve normally.',
    deviceToken,
    deviceName: device.name,
    platform: device.platform,
    dohUrl,
    dashboardUrl: `${base}/dashboard`,
    devicesUrl: `${base}/dashboard#devices`,
    blockAllowUrl: `${base}/dashboard#block-allow-list`,
    setupGuidePageUrl: dohUrl,
    downloads: {
      windows: `${base}/api/setup-file?${q}&os=windows`,
      linux: `${base}/api/setup-file?${q}&os=linux`,
      androidGuide: `${base}/api/setup-file?${q}&os=android`,
      ios: `${base}/api/setup-file?${q}&os=ios`,
      mac: `${base}/api/setup-file?${q}&os=mac`,
      extensionConfig: `${base}/api/extension-config?${q}`,
    },
    extension: {
      loadInstructions:
        'Chrome/Edge: open chrome://extensions → Developer mode → Load unpacked → select the extension folder in this repo. In extension options, import this JSON or paste dohUrl. For day-to-day use, browser Secure DNS with dohUrl is usually simpler.',
    },
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="dns-control-config.json"');
  res.setHeader('Cache-Control', 'no-store');
  return res.status(200).end(JSON.stringify(payload, null, 2));
}
