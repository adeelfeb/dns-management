'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { locales } from '../i18n/config';

/**
 * Renders a simple language switcher (e.g. EN | NL).
 * Uses next-intl: switching to a locale path (/en, /nl) lets the middleware
 * set the NEXT_LOCALE cookie so the choice persists.
 */
export default function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname() || '';

  // pathname may include current locale (e.g. /en or /en/...); strip it for a stable base path
  const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, '') || '/';
  const getLocalizedPath = (newLocale) =>
    pathWithoutLocale === '/' ? `/${newLocale}` : `/${newLocale}${pathWithoutLocale}`;

  return (
    <div className="flex items-center gap-1 text-sm font-medium text-stone-600" role="group" aria-label="Language">
      {locales.map((loc) => {
        const isActive = locale === loc;
        return (
          <span key={loc} className="inline-flex items-center gap-1">
            <Link
              href={getLocalizedPath(loc)}
              className={isActive ? 'text-primary-600 font-semibold' : 'hover:text-primary-600 transition-colors'}
              aria-current={isActive ? 'true' : undefined}
            >
              {loc.toUpperCase()}
            </Link>
            {loc !== locales[locales.length - 1] && <span className="text-stone-300" aria-hidden>|</span>}
          </span>
        );
      })}
    </div>
  );
}
