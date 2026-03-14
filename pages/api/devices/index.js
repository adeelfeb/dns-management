import crypto from 'crypto';
import { requireDB } from '../../../lib/dbHelper';
import Device from '../../../models/Device';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';
import { PLATFORMS } from '../../../models/Device';

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

export default async function handler(req, res) {
  const { method } = req;
  if (await applyCors(req, res)) return;
  const db = await requireDB(res);
  if (!db) return;

  switch (method) {
    case 'GET': {
      try {
        const user = await authMiddleware(req, res);
        if (!user) return;
        let filter = { user: user._id };
        if (req.query.userId) {
          if (!roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;
          filter = { user: req.query.userId };
        }
        const devices = await Device.find(filter).sort({ createdAt: -1 }).lean();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const base = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
        const devicesWithUrl = devices.map((d) => ({
          ...d,
          dohUrl: `${base}/api/dns-query?device=${d.token}`,
        }));
        return jsonSuccess(res, 200, 'Ok', { devices: devicesWithUrl });
      } catch (err) {
        return jsonError(res, 500, 'Failed to fetch devices', err.message);
      }
    }
    case 'POST': {
      try {
        const user = await authMiddleware(req, res);
        if (!user) return;
        const { name, platform } = req.body || {};
        const trimmedName = typeof name === 'string' ? name.trim() : '';
        const normalizedPlatform = typeof platform === 'string' ? platform.trim().toLowerCase() : '';
        if (!trimmedName) return jsonError(res, 400, 'Name is required');
        if (!PLATFORMS.includes(normalizedPlatform)) {
          return jsonError(res, 400, `Platform must be one of: ${PLATFORMS.join(', ')}`);
        }
        const token = generateToken();
        const device = await Device.create({
          user: user._id,
          name: trimmedName,
          platform: normalizedPlatform,
          token,
        });
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const dohUrl = `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/dns-query?device=${token}`;
        return jsonSuccess(res, 201, 'Device created', {
          device: {
            id: device._id,
            name: device.name,
            platform: device.platform,
            token: device.token,
            dohUrl,
            createdAt: device.createdAt,
          },
        });
      } catch (err) {
        return jsonError(res, 500, 'Failed to create device', err.message);
      }
    }
    default: {
      res.setHeader('Allow', ['GET', 'POST']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}
