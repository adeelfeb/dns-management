import connectDB from '../lib/db';
import User from '../models/User';
import { jsonError, jsonSuccess } from '../lib/response';
import { normalizeUserLocale } from '../lib/userLocale';

function toSafeUser(doc) {
  if (!doc) return null;
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    role: doc.role || 'base_user',
    roleRef: doc.roleRef || null,
    createdAt: doc.createdAt,
    preferences: {
      locale: normalizeUserLocale(doc.preferences?.locale),
    },
  };
}

export async function getCurrentUser(req, res) {
  if (!req.user) {
    return jsonError(res, 401, 'Authentication required');
  }
  return jsonSuccess(res, 200, 'Ok', { user: toSafeUser(req.user) });
}

export async function updateCurrentUser(req, res) {
  if (!req.user) {
    return jsonError(res, 401, 'Authentication required');
  }

  const { name, locale } = req.body || {};
  const update = {};

  if (name !== undefined && name !== null) {
    if (typeof name !== 'string' || !name.trim()) {
      return jsonError(res, 400, 'Name cannot be empty');
    }
    update.name = name.trim();
  }

  if (locale !== undefined && locale !== null) {
    update['preferences.locale'] = normalizeUserLocale(String(locale));
  }

  if (Object.keys(update).length === 0) {
    return jsonError(res, 400, 'Provide name and/or locale to update');
  }

  try {
    await connectDB();
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updated) {
      return jsonError(res, 404, 'User not found');
    }

    if (update.name !== undefined) req.user.name = updated.name;
    if (update['preferences.locale'] !== undefined) {
      req.user.preferences = req.user.preferences || {};
      req.user.preferences.locale = updated.preferences?.locale;
    }

    const message =
      update.name !== undefined && update['preferences.locale'] !== undefined
        ? 'Profile updated'
        : update['preferences.locale'] !== undefined
          ? 'Language preference saved'
          : 'Profile updated';

    return jsonSuccess(res, 200, message, { user: toSafeUser(updated) });
  } catch (err) {
    return jsonError(res, 500, 'Failed to update profile', err.message);
  }
}

export async function changePassword(req, res) {
  if (!req.user) {
    return jsonError(res, 401, 'Authentication required');
  }

  const { currentPassword, newPassword } = req.body || {};
  if (!currentPassword || !newPassword) {
    return jsonError(res, 400, 'Current and new password are required');
  }
  if (typeof newPassword !== 'string' || newPassword.length < 5) {
    return jsonError(res, 400, 'New password must be at least 5 characters long');
  }

  try {
    await connectDB();
    const userDoc = await User.findById(req.user._id);
    if (!userDoc) {
      return jsonError(res, 404, 'User not found');
    }

    const matches = await userDoc.comparePassword(currentPassword);
    if (!matches) {
      return jsonError(res, 400, 'Current password is incorrect');
    }

    userDoc.password = newPassword;
    await userDoc.save();

    return jsonSuccess(res, 200, 'Password updated');
  } catch (err) {
    return jsonError(res, 500, 'Failed to update password', err.message);
  }
}

