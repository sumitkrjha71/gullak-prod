# Decision Log

Append-only record of architecturally-significant decisions. Most-recent at the top.

---

## 2026-05-03 — V3: Brand pivot to Gullak (Autopilot → Gullak)

**Decision.** Replace the Stripe/Wise/Cred-style "Autopilot" calm-fintech aesthetic with a culturally-anchored **Gullak** brand: terracotta earthen pot logo, Chiraiya the sparrow mascot, warm Hinglish dost-tone, cream `#FFF8F0` background, saffron `#E8650A` CTAs.

**Why.** V1's calm-fintech aesthetic was emotionally cold for the Bharat-first mass-market user. The Gullak metaphor delivers zero-cost brand recall — every Indian household associates the earthen pot with childhood saving. The Chiraiya carries the emotional layer that calm fintech can't. Source: master prompt §1, Savestment Canvas §1.

---

## 2026-05-03 — V3: Credit cross-sell as NBFC-distributor model with AA + OCEN

**Decision.** Build credit (two-wheeler / four-wheeler / gold / consumer-durable / emergency) as a parallel revenue layer on top of savings — Gullak plays the AA-licensed data layer + NBFC-distributor role. Mocked AA + OCEN integration in V3; production drops in behind the same surface.

**Why.** AA framework gives us a strong credit-profile signal (UPI mandate history + bank account snapshot + salary detection). Distributor model means we don't lend ourselves but route to NBFC partners — clean unit economics, no balance-sheet risk. **Explicitly no home loans** (different regulatory regime + different ticket size + different sales motion).

**30-day savings gate** is non-negotiable: credit only appears after the user has demonstrated saving discipline. Master prompt §9: "DO NOT push credit if user has not saved for at least 30 days. Respect the savings-first relationship."

---

## 2026-05-03 — Cinematic onboarding intro

**Decision.** Splash logo grows 0.2× → 1× with bezier-bounce, tagline reveals letter-by-letter, sparrow flies in from off-screen and lands precisely on the **G** of GULLAK. After the cinematic, a 4-slide Savestment deck with the Daily Spend Slider on slide 4 (chai/samosa metaphor + 5-year compounding).

**Why.** First-impression handshake. User explicitly asked for "logo coming out of itself, growing from small to big, sparrow flies and lands on top of the G". The Daily Spend Slider is the canvas-§3 PLG conversion driver — quantifies compounding using metaphors the target user understands instinctively.

---

## 2026-05-03 — 12-goal taxonomy

**Decision.** 12 categories per master prompt §5.1: Family Wedding, Own Wedding, Home, Car, Bike, EMI Prepay, Emergency, Education, Festival, Travel, Gold, Custom.

**Why.** V2 had 9 with `car` covering both — category error in Bharat. ₹1L bike vs ₹5L car has very different daily-save math and very different credit needs.

---

## 2026-05-03 — Goal feasibility engine never red-errors

**Decision.** When a goal can't fit current pace, show calendar copy + suggested-pace projection + bridge-to-credit if timeline is tight. **Never** "not possible" or red error.

**Why.** Master prompt §5: friction-on-aspiration is the V0 sin we're fixing.

---

## 2026-05-03 — Withdrawal Gullak-break animation

**Decision.** Withdrawal triggers a 2.5s cinematic: Chiraiya beak-tap → 4-shard pot shatter → coin burst → celebFly. Skippable. Reduce-motion fallback.

**Why.** Master prompt §3.2: "the app's most delightful animation". The earthen-pot metaphor only completes when you can break it.

---

## 2026-05-01 — Stack: Next.js 14 App Router

**Decision.** Use Next.js 14 (App Router) + TypeScript as a single full-stack codebase.

**Why.** One deploy target (Vercel). RSC reduces JS bundle for low-end Indian devices. Server actions handle the payment simulator without a separate API service. Locale-prefixed routing fits 4 languages cleanly.

**Alternatives considered.** Vite SPA + Express (rejected — two services, two deploys, no native cron). Pure-client SPA (rejected — no audit trail, no fintech credibility).

---

## 2026-05-01 — Money stored in paise (BigInt)

**Decision.** Every monetary value is stored as `BigInt` representing paise. Display layer divides by 100.

**Why.** Floats lose precision; in fintech, even sub-rupee drift across millions of transactions destroys trust and reconciliation. Industry standard.

---

## 2026-05-01 — `AuditLog` separate from `SavingsEvent`

**Decision.** Two tables, not one.

**Why.** They serve different consumers with different retention/shape requirements. `SavingsEvent` drives UI (notifications, weekly summary). `AuditLog` is append-only system truth for debugging, dispute resolution, and (eventually) compliance. Mixing them couples UX evolution to compliance retention rules.

---

## 2026-05-01 — Idempotency at the DB level

**Decision.** `Transaction.idempotencyKey String @unique`. Key = `sha256(userId|date-IST|ruleId|slot)`.

**Why.** Code paths forget; DB constraints don't. Vercel Cron retries, network blips, and rapid client clicks all become safe. The DB enforces the invariant of the highest fintech sin: duplicate debits.

---

## 2026-05-01 — Mocked OTP for V1

**Decision.** Phone OTP is mocked. Any phone, code `123456` (configurable via `OTP_DEMO_CODE`).

**Why.** Demo loop must work without an SMS provider account or per-message cost. `lib/auth/otp.ts` is a drop-in surface — swap to Twilio Verify post-V1 with no other changes.

---

## 2026-05-01 — Payment abstraction layer

**Decision.** `lib/payments/index.ts` exports `execute()` and `validate()`. Real implementation hot-swappable via `lib/payments/real.ts` later.

**Why.** Cron routes, audit logic, UI, and tests all bind to the abstraction. Going live with a real PSP becomes a one-line route change plus a flag flip — no refactor.

---

## 2026-05-01 — Languages: en + hi + pa + kn fully translated; Marathi deferred

**Decision.** V1 ships with reviewed strings in 4 languages. No `_MT` machine-translation placeholders.

**Why.** User direction. The product's mass-market thesis depends on language fit. Shipping with stub translations breaks the trust contract on day one. Marathi added post-validation.

---

## 2026-05-01 — Industry-benchmark design fidelity

**Decision.** Hold the visual + interaction bar to Stripe / Wise / Cred level: count-up money, animated progress rings, security-seal chips, tabular nums, soft motion, full keyboard navigation, WCAG AA contrast.

**Why.** A first-time user must subconsciously read "this looks like real money software" within 3 seconds. Polish IS the trust signal.

---

## 2026-05-01 — Notifications: dedicated `/notifications` inbox + inline home feed

**Decision.** Both surfaces. Inline feed for at-a-glance, inbox route for full history.

**Why.** User direction. Full MVP per spec; inline-only would lose the categorisation (Actionable / Info / Milestones) that the spec calls for.

---

## 2026-05-01 — README lives in repo only

**Decision.** `docs/README.md` is a repo-only living document. Not served as an in-app route.

**Why.** It's reference material for product + engineering teams browsing the repo on GitHub or in IDE. Serving it inside the app would conflate user-facing UX with internal docs.
