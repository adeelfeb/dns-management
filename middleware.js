import createMiddleware from 'next-intl/middleware';
import { NextResponse } from 'next/server';
import { routing } from './i18n/routing';
import { localeCookieName } from './i18n/config';

const handleI18nRouting = createMiddleware(routing);

/** Pages Router routes that live at /signup, /login, etc. (no locale prefix). */
const PAGES_ROUTES = ['signup', 'login', 'dashboard', 'privacy-policy', 'verify-email', 'contact'];
const LOCALES = routing.locales;

export default function middleware(request) {
  const pathname = request.nextUrl.pathname;

  // Match /en/signup, /nl/login, etc. → redirect to /signup, /login and set locale cookie
  const localePathMatch = pathname.match(new RegExp(`^/(${LOCALES.join('|')})/(${PAGES_ROUTES.join('|')})(?:/|$)`));
  if (localePathMatch) {
    const [, locale, route] = localePathMatch;
    const rest = pathname.slice(`/${locale}/${route}`.length);
    const response = NextResponse.redirect(new URL(`/${route}${rest}${request.nextUrl.search}`, request.url));
    response.cookies.set(localeCookieName, locale, {
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
    });
    return response;
  }

  // Let Pages Router handle /signup, /login, /dashboard, etc. without running next-intl
  const isPagesRoute = PAGES_ROUTES.some((r) => pathname === `/${r}` || pathname.startsWith(`/${r}/`));
  if (isPagesRoute) {
    return NextResponse.next();
  }

  return handleI18nRouting(request);
}

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
