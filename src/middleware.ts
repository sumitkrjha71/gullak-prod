import { NextRequest, NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { verifyToken, SESSION_COOKIE } from '@/lib/auth/session';
import { locales, defaultLocale } from '@/lib/i18n/config';

const intlMiddleware = createIntlMiddleware({
  locales: [...locales],
  defaultLocale,
  localePrefix: 'always',
  localeDetection: false,
});

// API routes accessible without a session
const PUBLIC_API_PREFIXES = [
  '/api/auth/',     // OTP send, verify, signout
  '/api/health',    // uptime monitoring
  '/api/webhooks/', // PSP webhooks — verified by HMAC, not session
];

// Routes that only accept CRON_SECRET (not session-based)
const CRON_PREFIXES = ['/api/cron/'];

// Routes that return 404 in production — dev/test tooling only
const DEV_ONLY_PREFIXES = [
  '/api/dev/',
  '/api/debug/',
  '/api/sim/',
];

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  // 1. Block dev tooling in production
  if (process.env.NODE_ENV === 'production') {
    if (DEV_ONLY_PREFIXES.some(p => pathname.startsWith(p))) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
  }

  // 2. API routes: enforce session unless public or cron
  if (pathname.startsWith('/api/')) {
    const isPublic = PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p));
    const isCron   = CRON_PREFIXES.some(p => pathname.startsWith(p));

    if (!isPublic && !isCron) {
      const token   = req.cookies.get(SESSION_COOKIE)?.value;
      const session = await verifyToken(token);
      if (!session) {
        return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
      }
      // Stamp userId so API routes don't need to re-verify the JWT.
      const res = NextResponse.next();
      res.headers.set('x-user-id', session.userId);
      res.headers.set('x-user-phone', session.phone);
      return res;
    }

    return NextResponse.next();
  }

  // 3. Page routes: i18n
  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next|_vercel|.*\\..*).*)'],
};
