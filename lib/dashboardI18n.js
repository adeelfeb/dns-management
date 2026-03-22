import en from '../messages/en/dashboard.json';
import nl from '../messages/nl/dashboard.json';
import { normalizeUserLocale } from './userLocale';

const byLocale = { en, nl };

export function getDashboardMessages(locale) {
  const key = normalizeUserLocale(locale);
  return byLocale[key] || byLocale.en;
}

/**
 * Dot-path lookup with optional {placeholders}.
 */
export function createDashboardT(messages) {
  return function t(key, values) {
    const parts = key.split('.');
    let cur = messages;
    for (const p of parts) {
      cur = cur?.[p];
    }
    if (typeof cur !== 'string') return key;
    if (!values || typeof values !== 'object') return cur;
    return cur.replace(/\{(\w+)\}/g, (_, k) =>
      Object.prototype.hasOwnProperty.call(values, k) ? String(values[k]) : `{${k}}`
    );
  };
}
