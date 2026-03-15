import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const handleI18nRouting = createMiddleware(routing);

export default function middleware(request) {
  return handleI18nRouting(request);
}

export const config = {
  // Run on all pathnames except api, _next, _vercel, and static files
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
