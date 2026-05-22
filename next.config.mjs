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
  // Content-Security-Policy — tightened for a fintech app
  // unsafe-inline for styles is needed by Next.js; script-src uses nonce in prod via middleware.
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self + Razorpay checkout, Sentry CDN
      "script-src 'self' 'unsafe-eval' https://checkout.razorpay.com https://js.sentry-cdn.com",
      // Styles: self + unsafe-inline (Next.js CSS-in-JS requirement)
      "style-src 'self' 'unsafe-inline'",
      // Images: self + data URIs (for inline SVG/icons)
      "img-src 'self' data: https:",
      // Fonts: self
      "font-src 'self'",
      // Connect: self + APIs we call from the browser
      "connect-src 'self' https://checkout.razorpay.com https://sentry.io https://*.ingest.sentry.io",
      // Frames: Razorpay payment iframe
      "frame-src https://api.razorpay.com https://checkout.razorpay.com",
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
