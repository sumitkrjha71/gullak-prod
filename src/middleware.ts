import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n/config';

export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
  localeDetection: true,
});

export const config = {
  // Match all paths except API, static, and Next internals
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
