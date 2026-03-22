import { locales, defaultLocale } from '../i18n/config';

export function normalizeUserLocale(value) {
  const s = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (s && locales.includes(s)) return s;
  return defaultLocale;
}
