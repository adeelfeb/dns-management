import { applyCors } from '../../utils';
import { dnsQueryApiHandler } from '../../lib/dnsQueryHandler';

/**
 * Legacy entry: GET/POST /api/dns-query?device=TOKEN&dns=...
 * Prefer /api/dns-query/TOKEN (see [device].js) for Firefox custom DoH.
 */
export default async function handler(req, res) {
  if (await applyCors(req, res)) return;
  const deviceToken = typeof req.query.device === 'string' ? req.query.device.trim() : '';
  if (!deviceToken) {
    return res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Missing device parameter' }));
  }
  return dnsQueryApiHandler(req, res, deviceToken);
}
