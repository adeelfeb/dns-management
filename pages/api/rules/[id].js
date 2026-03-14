import { requireDB } from '../../../lib/dbHelper';
import Device from '../../../models/Device';
import DnsRule from '../../../models/DnsRule';
import authMiddleware from '../../../middlewares/authMiddleware';
import roleMiddleware from '../../../middlewares/roleMiddleware';
import { jsonError, jsonSuccess } from '../../../lib/response';
import { applyCors } from '../../../utils';

export default async function handler(req, res) {
  const { method, query: { id: ruleId } } = req;
  if (await applyCors(req, res)) return;
  const db = await requireDB(res);
  if (!db) return;

  if (method !== 'DELETE') {
    res.setHeader('Allow', ['DELETE']);
    return jsonError(res, 405, `Method ${method} not allowed`);
  }

  try {
    const user = await authMiddleware(req, res);
    if (!user) return;
    const rule = await DnsRule.findById(ruleId);
    if (!rule) return jsonError(res, 404, 'Rule not found');
    if (rule.device) {
      const device = await Device.findById(rule.device);
      if (!device) return jsonError(res, 404, 'Device not found');
      const own = device.user.toString() === user._id.toString();
      if (!own && !roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;
    } else if (rule.user) {
      if (rule.user.toString() !== user._id.toString() && !roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) return;
    } else {
      return jsonError(res, 404, 'Rule not found');
    }
    await DnsRule.findByIdAndDelete(ruleId);
    return jsonSuccess(res, 200, 'Rule deleted', {});
  } catch (err) {
    return jsonError(res, 500, 'Failed to delete rule', err.message);
  }
}
