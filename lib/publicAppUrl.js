/**
 * Canonical public base URL for links in emails, DoH URLs, and setup files.
 * Prefer NEXT_PUBLIC_APP_URL; fall back to the incoming request host in server handlers.
 */
export function getPublicBaseUrl(req) {
  const env = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL;
  if (env) {
    return env.startsWith('http') ? env : `https://${env}`;
  }
  if (req?.headers?.host) {
    const proto = req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    return `${proto}://${req.headers.host}`;
  }
  return 'http://localhost:3000';
}

/**
 * Path-style DoH URL (no ?device=) so Firefox/custom clients can append ?dns=… safely.
 * Legacy ?device= still works via pages/api/dns-query.js.
 */
export function buildDohUrl(baseUrl, deviceToken) {
  const base = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
  const t = String(deviceToken || '').trim();
  return `${base}/api/dns-query/${encodeURIComponent(t)}`;
}
