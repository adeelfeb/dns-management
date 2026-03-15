import { defineRouting } from 'next-intl/routing';
import { defaultLocale, locales, localeCookieName } from './config';

export const routing = defineRouting({
  locales,
  defaultLocale,
  localePrefix: 'always',
  localeCookie: {
    name: localeCookieName,
    maxAge: 365 * 24 * 60 * 60, // 1 year
  },
});
