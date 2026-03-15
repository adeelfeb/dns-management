import { requireDB } from '../../../../lib/dbHelper';
import Device from '../../../../models/Device';
import DnsBlockLog from '../../../../models/DnsBlockLog';
import authMiddleware from '../../../../middlewares/authMiddleware';
import roleMiddleware from '../../../../middlewares/roleMiddleware';
import { jsonError, jsonSuccess } from '../../../../lib/response';
import { applyCors } from '../../../../utils';

const DEFAULT_LIMIT = 100;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return jsonError(res, 405, `Method ${req.method} not allowed`);
  }
  if (await applyCors(req, res)) return;
  const db = await requireDB(res);
  if (!db) return;

  const deviceId = req.query.id;
  const device = await Device.findById(deviceId);
  if (!device) return jsonError(res, 404, 'Device not found');

  const user = await authMiddleware(req, res);
  if (!user) return;
  const own = device.user.toString() === user._id.toString();
  if (!own && !roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;

  const limit = Math.min(Number(req.query.limit) || DEFAULT_LIMIT, 500);
  try {
    const logs = await DnsBlockLog.find({ device: device._id })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
    return jsonSuccess(res, 200, 'Ok', { logs });
  } catch (err) {
    return jsonError(res, 500, 'Failed to fetch block log', err.message);
  }
}
