# Open Technical Debt

> _Known violations of the invariants, with remediation plan. Each item has an owner, a target phase, and a verification step._

Status legend:
- 🔴 **Must fix before customer 1** — non-negotiable for live launch
- 🟡 **Phase 8 hardening** — ship v0, fix in the immediate post-launch sprint
- 🟢 **Phase 9 hardening** — fix once PMF capital is banked

---

## 🔴 Must fix before customer 1

### D-001 — `prisma db push --accept-data-loss` in build
**Violates invariant #15.** Currently `package.json` `vercel-build` script runs `prisma db push --accept-data-loss && next build`. This is fine for greenfield, lethal once real users exist — first column rename wipes their data.

**Remediation:**
1. Locally: `npx prisma migrate dev --name initial_schema` against a fresh DB to materialize the baseline migration
2. Commit the generated `prisma/migrations/` folder
3. Change `vercel-build` to `prisma migrate deploy && prisma generate && next build`
4. Every future schema change goes through `prisma migrate dev` locally → migration file committed → `migrate deploy` on Vercel

**Verification:** drop a column locally, run `migrate deploy`, confirm data preserved.

---

### D-002 — `DEMO_OTP = '123456'` hardcoded in client bundle
**Violates invariant #14 (partial).** `src/app/[locale]/onboarding/otp/_otp-form.tsx:9` declares `const DEMO_OTP = '123456'`. Even though the demo banner UI is gated on `demoMode` prop, the constant itself ships in the production client bundle — anyone reading the JS knows the backdoor exists.

**Remediation:** move the constant behind `process.env.NEXT_PUBLIC_DEMO_OTP_ENABLED` so it only appears in the bundle when the env flag is set. Default to disabled in production.

**Verification:** build production, search the JS chunks for "123456" — should return zero matches.

---

### D-003 — DEBUG_OTP_KEY may be set during launch
**Operational hygiene.** The diagnostic endpoint at `/api/auth/otp/debug-send` is gated behind a `DEBUG_OTP_KEY` env var. Once OTP is confirmed working, this env var must be deleted from Vercel — the endpoint returns 404 without it.

**Remediation:** delete `DEBUG_OTP_KEY` from Vercel as the final step before public launch. Confirm endpoint returns 404.

**Verification:** `curl -X POST https://gullak-prod.vercel.app/api/auth/otp/debug-send -H 'content-type: application/json' -d '{"phone":"9876543210"}'` returns 404.

---

## 🟡 Phase 8 hardening (post-launch sprint)

### D-004 — CSP allows `unsafe-inline` scripts
**Violates invariant #16.** `next.config.mjs` permits `'unsafe-inline'` in `script-src` because Next.js App Router emits inline RSC hydration chunks and the service-worker registration is inline. Tightening requires a nonce-per-request middleware that:
1. Generates a per-request nonce
2. Adds nonce to all `<Script>` tags (Next.js can inject if `<head>` includes the right meta)
3. Sets the `script-src 'self' 'nonce-{nonce}' ...` header per response

**Remediation:** implement nonce middleware (see Next.js docs on "Strict CSP"). Test under real Razorpay checkout + Sentry CDN load.

**Verification:** browser console shows no CSP violations during a full payment flow.

---

### D-005 — No status page
Stripe, Razorpay, Atlassian, GitHub all publish a real-time status page. We don't.

**Remediation:** sign up for BetterStack or Statuspage (free tier fine for v0). Configure synthetic checks against:
- `/api/health` (200)
- `/api/auth/otp/send` POST (rate-limit response 429 expected without phone)
- `/api/aa/consent/initiate` (401 without auth — confirms route is alive)

Publish at `status.gullak.app`. Link from app `/help` page.

---

### D-006 — No circuit breakers around external providers
Right now an MSG91 outage will eat OTP send attempts indefinitely. Same for Razorpay, SafeGold, BSE StAR MF, Setu.

**Remediation:** wrap external `fetch` calls with `p-retry` + a simple in-memory breaker (open after N consecutive failures, half-open after cooldown). Fall back to mock when breaker is open + log critical alert.

**Verification:** kill MSG91 mock (set bad URL), confirm send falls through to demo path within 3 retries, alert fires.

---

### D-007 — No multi-channel confirmation
**Violates invariant #18.** Every payment success today only updates in-app state + optional push (if user opted in). No SMS confirmation. No WhatsApp. No email.

**Remediation:** add a job queue (Inngest or Vercel Queues) triggered on `payment.captured` webhook. Send:
1. SMS (MSG91 promotional template) within 30s
2. WhatsApp message (via MSG91 WhatsApp Business or AiSensy) within 60s
3. Email receipt with PDF (via Resend) within 5min — for amounts ≥ ₹500

**Verification:** real ₹10 transaction triggers SMS + WhatsApp + (skipped email) within SLA.

---

### D-008 — No public charge calculator
Zerodha-style transparency. We claim "no hidden fees" but offer no way for a user to verify before signing up.

**Remediation:** new `/calculator` route — user enters daily amount + years, sees: projected portfolio, expense ratio impact, exit load scenarios, tax implications. All math from `CURATED_FUNDS` real numbers.

---

### D-009 — `framer-motion` over-used for simple opacity/y fades
Dashboard imports five `motion.*` components for what could be pure CSS. Bundle bloat.

**Remediation:** audit `src/app/[locale]/home/_dashboard.tsx` and similar — convert any `<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>` to existing `.anim-slide-up` CSS class. Saves ~30-50kb gzipped.

**Verification:** Lighthouse JS bundle size on `/home` drops by ≥ 30kb.

---

### D-010 — `tabular-nums` is a no-op on Devanagari/Kannada/Punjabi fonts
**Violates invariant #13 silently on regional locales.** `font-variant-numeric: tabular-nums` works on Nunito (Latin) but is no-op on Tiro Devanagari Hindi, Mukta, Hind. Money columns in Hindi locale will not align vertically in tables.

**Remediation:** force money strings to render in Nunito regardless of `:lang` by adding `font-family: 'Nunito', system-ui` to the `.num` class (overrides the locale fallback). Indian numerals stay readable in Nunito.

**Verification:** switch to `hi` locale, scroll through dashboard recent transactions, confirm ₹ columns align.

---

## 🟢 Phase 9 hardening (post-PMF)

### D-011 — No PostHog instrumentation (Day 1 in plan)
Without funnel events we can't tell whether the trust revamp moved the needle.

**Remediation:** see Day 1 plan — `src/lib/analytics/track.ts` thin PostHog wrapper, `track('nav_tap')`, `track('otp_send')`, `track('payment_success')`, etc. Add `NEXT_PUBLIC_POSTHOG_KEY` to env.

---

### D-012 — No A/B framework
Acceptable for v0 but blocks data-driven iteration.

**Remediation:** GrowthBook or PostHog Feature Flags. Wrap risky UX choices (mascot ON/OFF, ink CTA vs saffron CTA) behind flags. Run 4-week experiments with retention as the north star.

---

### D-013 — Read replicas for analytics queries
Cron jobs (NAV sync, Khata analysis, daily recon) read from the same Postgres instance that serves user requests.

**Remediation:** Neon supports cheap read replicas — point cron `prisma.*.findMany` queries at the replica connection string via `DATABASE_REPLICA_URL`.

---

### D-014 — No reconciliation admin dashboard
`ReconciliationRun` model exists. Cron writes daily recon results. No UI to view + investigate.

**Remediation:** internal `/admin/recon` route — table of recon runs, drill-down to discrepancies, manual resolution workflow.

---

### D-015 — Demo seed data still references "Autopilot" (V1 era brand)
`prisma/seed.ts` may reference the old product name in some user/goal fields.

**Remediation:** audit + rewrite to "Gullak" everywhere. Verify with `grep -rn "Autopilot" prisma/ messages/`.

---

## Tracking discipline

- Every PR closing a debt item references the D-### ID in the commit message
- Quarterly review: any 🔴 items still open? launch is on pause
- New debt incurred during a sprint is added here within 24h
