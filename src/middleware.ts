import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/lib/i18n/config';

// V2 — first-launch language is ALWAYS English (with Hindi as the explicit
// alternative, surfaced through /language-select). Browser Accept-Language
// detection is disabled so a user with mr-IN/pa-IN/kn-IN headers doesn't get
// dropped onto a Marathi/Punjabi/Kannada splash on first visit. Once the user
// picks any language via /language-select, the NEXT_LOCALE cookie set there
// keeps them on their choice across visits.
export default createMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
});

export const config = {
  // Match all paths except API, static, and Next internals
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
