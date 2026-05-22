import createNextIntlPlugin from 'next-intl/plugin';
import { withSentryConfig } from '@sentry/nextjs';

const withNextIntl = createNextIntlPlugin('./src/lib/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: false,
    instrumentationHook: true,
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
