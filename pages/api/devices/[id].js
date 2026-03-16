import { requireDB } from '../../../lib/dbHelper';
import Device from '../../../models/Device';
import DnsRule from '../../../models/DnsRule';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  const { method, query: { id } } = req;
  if (await applyCors(req, res)) return;
  const db = await requireDB(res);
  if (!db) return;

  switch (method) {
    case 'GET': {
      try {
        const user = await authMiddleware(req, res);
        if (!user) return;
        const device = await Device.findById(id).lean();
        if (!device) return jsonError(res, 404, 'Device not found');
        const ownDevice = device.user.toString() === user._id.toString();
        if (!ownDevice && !roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const dohUrl = `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/dns-query?device=${device.token}`;
        return jsonSuccess(res, 200, 'Ok', {
          device: { ...device, dohUrl },
        });
      } catch (err) {
        return jsonError(res, 500, 'Failed to fetch device', err.message);
      }
    }
    case 'PUT': {
      try {
        const user = await authMiddleware(req, res);
        if (!user) return;
        const device = await Device.findById(id);
        if (!device) return jsonError(res, 404, 'Device not found');
        const ownDevice = device.user.toString() === user._id.toString();
        if (!ownDevice && !roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;
        const { name, platform } = req.body || {};
        if (typeof name === 'string' && name.trim()) device.name = name.trim();
        if (typeof platform === 'string' && platform.trim()) {
          const p = platform.trim().toLowerCase();
          if (['windows', 'linux', 'android', 'ios', 'mac'].includes(p)) device.platform = p;
        }
        await device.save();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const dohUrl = `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/dns-query?device=${device.token}`;
        return jsonSuccess(res, 200, 'Device updated', {
          device: { ...device.toObject(), dohUrl },
        });
      } catch (err) {
        return jsonError(res, 500, 'Failed to update device', err.message);
      }
    }
    case 'PATCH': {
      try {
        const user = await authMiddleware(req, res);
        if (!user) return;
        const device = await Device.findById(id);
        if (!device) return jsonError(res, 404, 'Device not found');
        const ownDevice = device.user.toString() === user._id.toString();
        if (!ownDevice && !roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;
        const { blockAdultContent } = req.body || {};
        if (typeof blockAdultContent === 'boolean') {
          device.blockAdultContent = blockAdultContent;
        }
        await device.save();
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || 'http://localhost:3000';
        const dohUrl = `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/dns-query?device=${device.token}`;
        return jsonSuccess(res, 200, 'Device updated', {
          device: { ...device.toObject(), dohUrl },
        });
      } catch (err) {
        return jsonError(res, 500, 'Failed to update device', err.message);
      }
    }
    case 'DELETE': {
      try {
        const user = await authMiddleware(req, res);
        if (!user) return;
        const device = await Device.findById(id);
        if (!device) return jsonError(res, 404, 'Device not found');
        const ownDevice = device.user.toString() === user._id.toString();
        if (!ownDevice && !roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;
        await DnsRule.deleteMany({ device: device._id });
        await Device.findByIdAndDelete(id);
        return jsonSuccess(res, 200, 'Device deleted', {});
      } catch (err) {
        return jsonError(res, 500, 'Failed to delete device', err.message);
      }
    }
    default: {
      res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}
