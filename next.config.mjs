import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

const securityHeaders = [
  // Prevent clickjacking
  { key: 'X-Frame-Options', value: 'DENY' },
  // Block MIME sniffing
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limit referrer info leaving the site
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disable browser features not used by this app
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
  // Force HTTPS for 1 year, include subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Content-Security-Policy — tightened for a fintech app.
  //
  // script-src includes 'unsafe-inline': Next.js App Router emits inline
  // <script>self.__next_f.push(...)</script> chunks for the streaming RSC
  // payload and an inline service-worker registration. Stripping
  // 'unsafe-inline' blocks hydration entirely — server HTML renders but
  // every client component (clicks, language picker, form submits) is
  // dead. The proper nonce-per-request setup is a Phase-9 hardening item.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + inline (RSC hydration) + eval (framer-motion / dynamic
      // imports) + Razorpay checkout + Sentry CDN
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://js.sentry-cdn.com",
      // Styles: self + unsafe-inline (Next.js CSS-in-JS + next/font requirement)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs (for inline SVG/icons) + any https (Razorpay icons, etc.)
      "img-src 'self' data: blob: https:",
      // Fonts: self (next/font self-hosts Google fonts at build time) + data: for inlined
      "font-src 'self' data:",
      // Connect: self + Razorpay + Sentry + Vercel Insights
      "connect-src 'self' https://checkout.razorpay.com https://api.razorpay.com https://sentry.io https://*.ingest.sentry.io https://vitals.vercel-insights.com https://*.vercel-insights.com",
      // Frames: Razorpay payment iframe
      "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
      // Service worker — same-origin
      "worker-src 'self'",
      // Manifest (PWA)
      "manifest-src 'self'",
      // Form submissions must stay on same origin
      "form-action 'self'",
      // Disallow <base> tag hijack
      "base-uri 'self'",
      // Upgrade insecure requests in production
      'upgrade-insecure-requests',
    ].join('; '),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
    instrumentationHook: true,
  },
  async headers() {
    return [
      {
        // Apply to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

const withIntl = withNextIntl(nextConfig);

export default withSentryConfig(withIntl, {
  // Suppress Sentry CLI output in CI logs.
  silent: true,
  // Don't upload source maps unless SENTRY_AUTH_TOKEN is set.
  // This keeps local builds and preview deploys fast.
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
});
