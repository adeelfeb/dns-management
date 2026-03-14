import { requireDB } from '../../../../lib/dbHelper';
import Device from '../../../../models/Device';
import DnsRule from '../../../../models/DnsRule';
import authMiddleware from '../../../../middlewares/authMiddleware';
import roleMiddleware from '../../../../middlewares/roleMiddleware';
import { jsonError, jsonSuccess } from '../../../../lib/response';
import { applyCors } from '../../../../utils';
import { RULE_ACTIONS, RULE_TYPES } from '../../../../models/DnsRule';

export default async function handler(req, res) {
  const { method, query: { id: deviceId } } = req;
  if (await applyCors(req, res)) return;
  const db = await requireDB(res);
  if (!db) return;

  const getDeviceAndCheck = async () => {
    const device = await Device.findById(deviceId);
    if (!device) return { err: jsonError(res, 404, 'Device not found'), device: null };
    const user = await authMiddleware(req, res);
    if (!user) return { err: null, device: null };
    const own = device.user.toString() === user._id.toString();
    if (!own && !roleMiddleware(['admin', 'superadmin', 'developer'])(req, res)) {
      return { err: null, device: null };
    }
    return { err: null, device, user };
  };

  switch (method) {
    case 'GET': {
      try {
        const { err, device } = await getDeviceAndCheck();
        if (err) return err;
        if (!device) return;
        const deviceRules = await DnsRule.find({ device: device._id }).lean();
        const userRules = await DnsRule.find({ user: device.user, device: null }).lean();
        return jsonSuccess(res, 200, 'Ok', {
          rules: [...deviceRules, ...userRules],
        });
      } catch (err) {
        return jsonError(res, 500, 'Failed to fetch rules', err.message);
      }
    }
    case 'POST': {
      try {
        const { err, device } = await getDeviceAndCheck();
        if (err) return err;
        if (!device) return;
        const { domain, action, type, scope } = req.body || {};
        const domainStr = typeof domain === 'string' ? domain.trim().toLowerCase() : '';
        const actionStr = typeof action === 'string' ? action.trim().toLowerCase() : '';
        const typeStr = typeof type === 'string' ? type.trim().toLowerCase() : 'exact';
        const scopeStr = typeof scope === 'string' ? scope.trim().toLowerCase() : 'device';
        if (!domainStr) return jsonError(res, 400, 'Domain is required');
        if (!RULE_ACTIONS.includes(actionStr)) {
          return jsonError(res, 400, `Action must be one of: ${RULE_ACTIONS.join(', ')}`);
        }
        if (!RULE_TYPES.includes(typeStr)) {
          return jsonError(res, 400, `Type must be one of: ${RULE_TYPES.join(', ')}`);
        }
        const ruleData = {
          domain: domainStr,
          action: actionStr,
          type: typeStr,
        };
        if (scopeStr === 'user') {
          ruleData.user = device.user;
          ruleData.device = null;
        } else {
          ruleData.device = device._id;
          ruleData.user = null;
        }
        const rule = await DnsRule.create(ruleData);
        return jsonSuccess(res, 201, 'Rule created', { rule: rule.toObject() });
      } catch (err) {
        return jsonError(res, 500, 'Failed to create rule', err.message);
      }
    }
    default: {
      res.setHeader('Allow', ['GET', 'POST']);
      return jsonError(res, 405, `Method ${method} not allowed`);
    }
  }
}
