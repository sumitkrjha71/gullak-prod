import * as Sentry from '@sentry/nextjs';

// Sentry stays dormant unless NEXT_PUBLIC_SENTRY_DSN is populated AND we're in
// production. This keeps preview deploys (no DSN configured) from emitting
// noisy "Sentry Logger [warn]: No DSN provided" lines on every request.
const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
const sentryEnabled = Boolean(dsn) && process.env.NODE_ENV === 'production';

export async function register() {
  if (!sentryEnabled) return;

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV,
      tracesSampleRate: 0.1,
    });
  }
}
