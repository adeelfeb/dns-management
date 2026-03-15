import { getRequestConfig } from 'next-intl/server';
import { defaultLocale, locales } from './config';

/** Load all namespaced messages for a locale and merge into one object */
function loadMessages(locale) {
  if (!locales.includes(locale)) {
    locale = defaultLocale;
  }
  const namespaces = [
    'common',
    'landing',
    'auth',
    'dashboard',
    'privacy',
    'contact',
    'notFound',
  ];
  const messages = {};
  for (const ns of namespaces) {
    try {
      // Dynamic require for Node (build/server); path relative to project root
      const mod = require(`../messages/${locale}/${ns}.json`);
      messages[ns] = mod.default || mod;
    } catch (e) {
      messages[ns] = {};
    }
  }
  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }
  const messages = loadMessages(locale);
  return {
    locale,
    messages,
    timeZone: 'Europe/Amsterdam',
    now: new Date(),
  };
});
