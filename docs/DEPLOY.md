# Deployment Reference

> _End-to-end notes for shipping Gullak to Vercel + Neon._

## Hosting topology

```
Browser
  ↓ HTTPS (Vercel Edge)
Next.js App Router (Vercel functions)
  ↓ DATABASE_URL (Neon Pooler)
Neon Postgres (serverless)

Cron: Vercel Scheduled Functions
  → /api/cron/nav-sync     (8 PM IST weekdays)
  → /api/cron/khata-analysis  (03:00 IST daily)
```

## Branches

- `production/v1` — preview-deploy branch (gullak-app/main mirror lives there)
- `main` on `gullak-prod` repo — production deploy. Pushed via `git push prod production/v1:main`

## Environment variables

See `.env.vercel.example` at repo root for the full paste-ready list. Critical ones (app will not boot without them):

| Var | Source | Notes |
|---|---|---|
| `DATABASE_URL` | Neon → Project → Connection Details → Pooled connection | Must include `-pooler` and `?sslmode=require&channel_binding=require` |
| `AUTH_SECRET` | `openssl rand -base64 32` | JWT signing — never rotate without coordinated session invalidation |
| `OTP_HMAC_SECRET` | `openssl rand -base64 32` | OTP code hashing — never share |
| `MSG91_AUTH_KEY` | msg91.com → Settings → Auth Keys → v5 API Key | Must be **v5**, not legacy v2 |
| `MSG91_TEMPLATE_ID` | msg91.com → SMS Templates → your DLT-approved template | Confirm "Approved" status |

Recommended (features degrade to mock without these):

| Var | Source | Behaviour when absent |
|---|---|---|
| `UPSTASH_REDIS_REST_URL` + `_TOKEN` | upstash.com (free tier) | Rate limiter **fails closed in prod** (rejects all rate-limited routes) |
| `PAYMENTS_REAL=true` + `RAZORPAY_*` | razorpay.com → API Keys + Webhooks | Falls back to `simulate.ts` mock |
| `GOLD_REAL=true` + `SAFEGOLD_*` | safegold.com/b2b | Falls back to mock SG-XXXXXXXX IDs |
| `FUND_REAL=true` + `BSEMF_*` | bsestarmf.in (enterprise) | Falls back to instant-allotment BSE-XXXXXXXX mocks |
| `AA_REAL=true` + `SETU_AA_*` | setu.co/aa | Falls back to 3 deterministic personas |
| `NEXT_PUBLIC_SENTRY_DSN` | sentry.io | Sentry disabled |
| `NEXT_PUBLIC_POSTHOG_KEY` | posthog.com | Analytics no-op |

Optional / feature flags:

| Var | Default | Effect |
|---|---|---|
| `NEXT_PUBLIC_MASCOT_LEVEL` | `minimal` | `off` / `minimal` / `standard` / `hero` — controls Chiraiya appearance density |
| `NEXT_PUBLIC_DEMO_MODE` | unset | When `true`, shows demo OTP banner even in production (use only for staging demos) |
| `NEXT_PUBLIC_DEMO_OTP_ENABLED` | unset | When `true`, ships the `DEMO_OTP` constant to the client bundle (dev only) |
| `DEBUG_OTP_KEY` | unset | When set, exposes `/api/auth/otp/debug-send` diagnostic endpoint. Delete after debugging |
| `CRON_SECRET` | unset | Vercel injects automatically when a cron is registered in `vercel.json` |
| `FLAGS_ENABLE_*` | all `true` | Round-up, salary sweep, notifications, undo window, force-fail dev toggle |

## First deploy checklist

```
□ Create Neon project + database
□ Copy pooled connection string → Vercel DATABASE_URL (Production scope)
□ Run prisma db push against prod DB (one-time bootstrap — see "Schema migration" below)
□ Vercel → Settings → Environment Variables → paste critical block from .env.vercel.example
□ MSG91 dashboard:
  □ DLT template approved (status = "Approved", not "Pending")
  □ Sender ID DLT-registered
  □ Account balance ≥ ₹500
  □ Template variable format matches code: {{otp}} (we send "otp" field)
□ Razorpay dashboard:
  □ Account in live-mode (not test-mode) — KYC complete
  □ Webhook URL registered: https://<your-domain>/api/webhooks/razorpay
  □ Webhook events: payment.captured, payment.failed, subscription.authenticated,
    subscription.charged, subscription.halted, subscription.cancelled, subscription.completed
  □ Webhook secret copied to RAZORPAY_WEBHOOK_SECRET
□ Setu dashboard (if using real AA + KYC):
  □ Product instance configured for AA + KYC
  □ Webhook URL registered for AA consent updates
□ Set DEBUG_OTP_KEY temporarily, hit /api/auth/otp/debug-send with your real phone,
  confirm response.msg91Response.type === "success" AND SMS arrives
□ Delete DEBUG_OTP_KEY (the debug endpoint disappears)
□ Vercel deploys automatically on push to main
□ Hard-refresh production URL, walk full flow with a real phone
```

## Schema migration

**Current (v0 only):** `vercel-build` runs `prisma db push --accept-data-loss` — fine pre-launch.

**Once any real user data exists:** switch to `prisma migrate deploy`. See `docs/OPEN_DEBT.md` D-001.

Local migration workflow:
```
# Make schema change in prisma/schema.prisma
npx prisma migrate dev --name describe_the_change
# This generates prisma/migrations/<timestamp>_describe_the_change/migration.sql
# Commit the migration file
git add prisma/migrations/
git commit -m "schema: <what changed>"
# On deploy, Vercel runs `prisma migrate deploy` which applies pending migrations
```

## Cron jobs

Registered in `vercel.json`:

| Path | Schedule (UTC) | Purpose |
|---|---|---|
| `/api/cron/nav-sync` | `30 14 * * 1-5` (8 PM IST weekdays) | Pull NAV from BSE / refresh fund catalog |
| `/api/cron/khata-analysis` | `30 21 * * *` (03:00 IST daily) | Re-run Khata pipeline for all users + DPDP-driven data deletion |

Authentication: Vercel injects `Authorization: Bearer ${CRON_SECRET}` header automatically. Routes verify this before processing.

To trigger manually for debugging:
```
curl -X GET https://<domain>/api/cron/nav-sync \
     -H "Authorization: Bearer $CRON_SECRET"
```

## Observability

- **Errors**: Sentry — DSN-gated. Sample rate `0.1` in production. Tags include `userId`, `route`, `provider`.
- **Logs**: Vercel runtime logs — structured Pino JSON. Search by `eventId`, `userId`, `pspRefId`. Auto-redacts phone/PAN.
- **Analytics**: PostHog — funnel events (auth, payment, mandate, withdrawal). Identifies users by hashed phone (one-way).
- **Status**: BetterStack / Statuspage (Phase 8) — synthetic checks every 60s.

## Common debug commands

```bash
# Check current deploys
vercel deployments

# Tail production logs
vercel logs --follow

# List env vars on production
vercel env ls production

# Force redeploy without code change
vercel --prod --force

# Local production-mode build (catches CSP issues)
npm run build && npm run start

# Hit debug-send (only works when DEBUG_OTP_KEY is set on Vercel)
curl -X POST https://gullak-prod.vercel.app/api/auth/otp/debug-send \
  -H "content-type: application/json" \
  -H "x-debug-key: <your-key>" \
  -d '{"phone":"9876543210"}'
```

## Rollback procedure

If a deploy breaks production:

1. Vercel dashboard → Deployments → find last green deploy → **Promote to Production**
2. While rollback applies (~30s), investigate the broken deploy:
   - Vercel logs
   - Sentry issues
   - Browser DevTools (CSP violations? Hydration errors?)
3. Fix on a branch, push to a preview, verify, then promote forward

**NEVER** force-push to `main` to "fix" a broken deploy — promote the last good deploy first.

## Security checklist (review before every public push)

- [ ] No new `unsafe-*` directives in CSP beyond the existing v0 `unsafe-inline` debt
- [ ] No new endpoints under `/api/dev/`, `/api/debug/`, `/api/sim/` reachable in production (middleware blocks these)
- [ ] No new env vars logged or echoed in responses
- [ ] No PII added to client bundles (search for `process.env.*` outside `NEXT_PUBLIC_*`)
- [ ] All new rate-limit-eligible routes registered in `src/lib/ratelimit.ts`
- [ ] All new webhooks verify HMAC before any DB write
- [ ] All new schema fields with PII added to Pino redact list
