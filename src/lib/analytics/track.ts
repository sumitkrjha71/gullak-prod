// Thin product-analytics wrapper — no-op shim for v0.
//
// Day 1 ships the call-site API so screens can be instrumented now. The
// PostHog client itself is wired in Day 3 polish (see docs/OPEN_DEBT.md D-011)
// by:
//   1. npm install posthog-js
//   2. replace the no-op bodies below with a dynamic import + posthog.capture()
//   3. set NEXT_PUBLIC_POSTHOG_KEY on Vercel
//
// Until then, every call is silent — no console noise, no thrown errors,
// zero runtime cost.
//
// Usage from a Client Component:
//   import { track } from '@/lib/analytics/track';
//   track('nav_tap', { to: 'khata' });
//
// PII discipline (Charter invariant #6):
//   - never pass raw phone numbers, PAN, Aadhaar, OTP codes
//   - one-way hash any identifier that ties back to a user
//   - amounts in paise are fine; categorical bucket labels are fine

const ENABLED = Boolean(process.env.NEXT_PUBLIC_POSTHOG_KEY);

export function track(_event: string, _props?: Record<string, unknown>): void {
  if (!ENABLED) return;
  // Phase 3: dynamic-import posthog-js + posthog.capture(_event, _props)
}

export function identify(_userId: string, _traits?: Record<string, unknown>): void {
  if (!ENABLED) return;
  // Phase 3: posthog.identify(_userId, _traits)
}

export function reset(): void {
  if (!ENABLED) return;
  // Phase 3: posthog.reset()
}
