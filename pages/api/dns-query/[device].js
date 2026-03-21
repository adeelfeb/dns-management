import { applyCors } from '../../../utils';
import { dnsQueryApiHandler } from '../../../lib/dnsQueryHandler';

/**
 * Canonical DoH URL: /api/dns-query/:device
 * Firefox (and others) append ?dns=BASE64 to this URL. Query ?device= breaks that.
 */
export default async function handler(req, res) {
  if (await applyCors(req, res)) return;
  const deviceToken = typeof req.query.device === 'string' ? req.query.device.trim() : '';
  if (!deviceToken) {
    return res.status(400).setHeader('Content-Type', 'application/json').end(JSON.stringify({ error: 'Missing device in path' }));
  }
  return dnsQueryApiHandler(req, res, deviceToken);
}
