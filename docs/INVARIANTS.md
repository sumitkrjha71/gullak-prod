# The Gullak Charter + 20 Engineering Invariants

> _Read this before contributing anything. These are the floor — not aspirations._

---

## The Charter (three commandments above everything)

### Commandment 1 — Money is sacred. Trust is the product.

Before any feature ships, ask out loud:

> _"Would a 35-year-old mother trust her ₹50,000 emergency fund here?"_

- If **no** → redesign.
- If **unsure** → hold.
- If **yes** → ship.

Features that exist to look cool, drive engagement metrics, or signal "innovation" — and do not directly serve that mother's trust — go on the v3+ delight backlog. Not v0 – v2.

### Commandment 2 — The dost stays the dost. The bank gets the bank.

Two voices coexist, never compete:

- **Bharat-voice Hinglish dost** is the *copy* layer. Permanent.
  - Banned phrases: "Submit", "Click here", "Verify your KYC", "Continue to dashboard", "Welcome aboard", "AUM/NAV/CAGR/alpha/compounding rate" (in raw form), "100% guaranteed returns"
  - Required vocabulary: Aapne, Chaliye, Bachat, Munafa, Bharosa, Mubarak ho, Sapna, Manzil, Roz thoda, Aadat, Mummy-papa, Beti, Ghar, Pakka
- **Fintech-grade institutional** is the *visual* layer. Permanent.
  - Ink-on-cool-cream surfaces (not warm cream)
  - Lucide icons over emoji (emoji allowed only where functional, e.g. spending categories)
  - Tabular numerals on every ₹ value (`.num` class)
  - Calm motion (no bounce easing in everyday UI, no infinite animations on production screens)
  - Mascot as guest, not host (feature-flagged via `NEXT_PUBLIC_MASCOT_LEVEL`)

Strip Hinglish copy to "go professional" → lose an arm. Add cartoony visuals to "be fun" → lose the other. The combination *is* the moat.

### Commandment 3 — No fake data. No fake trust. No fake returns.

Every number visible to a user is either:

- **Real** — computed from on-chain state (`Transaction`, `MFHolding`, `InvestmentHolding`, `Goal`)
- **Labelled clearly** — projected / simulated / estimated, with the source named

No "12% returns!" without the footnote.
No "RBI Regulated" badge without the actual partner relationship behind it.
No managed-pool messaging without "Real units at SafeGold/BSE unlock at ₹X cumulative — currently {progress}% there."

**Trust by transparency, not by performance.**

---

## The 20 engineering invariants

These ride on top of the three commandments. Any PR that violates them fails review.

| # | Invariant | Where it lives |
|---|---|---|
| 1 | All money in **paise (BigInt)**. No floats. | `prisma/schema.prisma` — every `*Paise` field is `BigInt` |
| 2 | **Idempotency** on every state-changing API. Client sends `X-Idempotency-Key`. | `src/lib/idempotency/key.ts` |
| 3 | **Audit log append-only** on every state change. No update / delete code paths. | `src/lib/audit/log.ts` |
| 4 | **Webhooks HMAC-verified** always. | `src/app/api/webhooks/razorpay/route.ts:26` — `verifyWebhookSignature` |
| 5 | **Webhook idempotency** via `WebhookEvent.eventId @unique`. | `prisma/schema.prisma` — unique constraint |
| 6 | **PII never logged in plaintext.** Pino auto-redacts phone, PAN, Aadhaar. | `src/lib/logger.ts` |
| 7 | **Phone never in logs.** Narration masked to 20 chars in DB. | `src/lib/khata/classify.ts` |
| 8 | **Rate-limit every external-facing route. Fail-closed in production.** | `src/lib/ratelimit.ts` |
| 9 | **Mock seam for every paid provider.** Real flag flips behaviour, not contract. | `PAYMENTS_REAL`, `GOLD_REAL`, `FUND_REAL`, `AA_REAL` |
| 10 | **5-locale support.** Copy never hardcoded in components. | `messages/{en,hi,pa,kn,mr}.json` + `next-intl` |
| 11 | **`prefers-reduced-motion` respected** on every animation. | `src/styles/globals.css:85` global + per-component checks |
| 12 | **Touch targets ≥ 44px.** Verified on 360px viewport. | Tailwind `min-h-[44px]` on all clickable rows |
| 13 | **Tabular numerals on every ₹ value.** | `.num` class — `font-variant-numeric: tabular-nums` |
| 14 | **Demo backdoor gated on `NODE_ENV !== 'production'`.** | `src/app/api/auth/otp/verify/route.ts:25` |
| 15 | **Schema changes via `prisma migrate deploy`**, NOT `db push --accept-data-loss`. | `package.json` `vercel-build` script |
| 16 | **CSP `unsafe-inline` is v0-only debt.** Phase 9 hardening: nonce per request. | `next.config.mjs` |
| 17 | **Sentry sampling ≤ 0.1 in production.** DSN-gated. | `instrumentation.ts` |
| 18 | **Every payment success → multi-channel confirmation** (in-app + SMS + push; later: WhatsApp + email). | Phase 8 queue |
| 19 | **Settlement timeline always disclosed** on money-moving screen. | Disclosure block in every buy/sell/withdraw success |
| 20 | **Bharat-voice copy passes Read-Aloud Test before merge.** | PR checklist — reviewer reads new copy out loud |

---

## Charter violation examples (catch these in review)

- ❌ Copy: "Click here to verify KYC." → ✅ "Pakka karein — bas ek tap mein."
- ❌ Visual: Saffron CTA + saffron border + saffron header on the same screen → ✅ saffron used **once** as the primary action accent
- ❌ Number: `Math.round(value / 100)` floored to integer in display → ✅ `new Intl.NumberFormat('en-IN').format(...)` with tabular-num class
- ❌ Money: `value * 0.05` for 5% calculation → ✅ `(amountPaise * 5n) / 100n` (BigInt, no float)
- ❌ Logging: `logger.info({ phone: user.phone }, 'sent')` → ✅ `logger.info({ phone: '[REDACTED]' }, 'sent')`
- ❌ Schema: `npx prisma db push` on production → ✅ create migration, `prisma migrate deploy`
- ❌ Animation: `animation: gentleFloat 3s ease-in-out infinite` on a daily-engagement screen → ✅ static, with a one-shot fade-in
- ❌ Mascot: Chiraiya on the OTP form, the phone form, the language picker, the name form, the salary-day form → ✅ Chiraiya on splash + name welcome + milestone + error empathy only
- ❌ Emoji: `🏠🎯📒📊👤` in bottom nav → ✅ Lucide icons at stroke 1.75, size 22
- ❌ Returns claim: "Get 12% guaranteed returns!" → ✅ "Aapke paise har saal ~8% badh rahe hain (last 12-month average)"

---

## Pattern: every new money-moving endpoint must include

1. **Idempotency key** — read `X-Idempotency-Key` header, fall back to content-derived slot
2. **Rate limit check** — appropriate `ratelimit.*` per route
3. **Validation** — Zod schema for inputs
4. **Audit log entry** — `writeAudit(...)` after the mutation succeeds
5. **Mock branch** — `if (!isProviderReal) return mockImpl(...)` — gated on `*_REAL` env
6. **Bharat-voice error messages** — every error code maps to a Hinglish user-facing string
7. **Settlement disclosure** — response includes `disclosures.{settlementNote, taxNote, exitLoadNote, sebiWarning}` where applicable

Templates: see `src/app/api/mf/buy/route.ts` and `src/app/api/payments/order/route.ts`.

---

## When in doubt

Re-read Commandment 1. Then ask the reviewer.
