# Gullak — Bharat's first Savestment platform

> _नए ज़माने की पुरानी आदत_ — An old habit for a new era.
> Save smart. Invest smarter. Grow rich — the way Bharat does.

Gullak combines the warmth of a Hinglish dost with the discipline of a fintech-grade money guardian. Users save daily through UPI Autopay, see their money invested in regulated instruments (Govt Bonds, Digital Gold, AAA-rated MF), and watch real returns compound — without the friction or jargon of conventional wealth platforms.

This README is the single document a new engineer, designer, PM, investor, or regulator reads on day one. It covers **what** the app is (business), **how** it works (technical), and **why** decisions were made (the Charter).

---

## 1 — What this app is (product layer)

### 1.1 The user

- **Target**: T2/T3 Indian, gig worker / lower-middle class / first-job earner, age 22–40
- **Pain**: Wants to save and invest, but every existing app speaks English, demands KYC trauma, and charges hidden fees
- **Aspiration**: Beti's wedding, ghar ka down-payment, mummy-papa ka treatment, festival savings, emergency fund
- **Constraint**: Low-end Android, patchy data, limited financial literacy, deep distrust of "banking apps"

### 1.2 The product

- **Daily savings via UPI Autopay** — ₹20/day, ₹50/day, ₹100/day, user picks
- **Goal-led** — every save ties to a sapna (dream): wedding, gold, bike, education
- **Auto-invested** in a curated mix: Govt Bonds (safe), Digital Gold (inflation hedge), AAA-rated MF (growth)
- **Khata intelligence** — connects bank via Account Aggregator, surfaces insights ("EMI thoda zyada", "Subscription overload", "Salary aane wali hai — pehle save karo")
- **Withdrawals at par, anytime** — no penalty, no jargon
- **Group Gullak** — pool savings with friends/family for shared goals
- **Refer & Earn** — viral loop, ₹100 each
- **Credit when eligible** — once a 30-day savings habit is established + active mandate, pre-approved loan offers (two-wheeler, gold, consumer durable, emergency)

### 1.3 Why now

- UPI penetration > 400M users
- DPDP Act 2023 + Account Aggregator framework opens consented data sharing
- BSE StAR MF + SafeGold B2B APIs unlock retail investment without legacy broker stack
- Vernacular fintech is a wide-open category — Cred / Jupiter speak English; PhonePe / Paytm focus on payments not wealth; nobody owns Bharat-voice + investment + AA-intelligence in one product

### 1.4 The moat

1. **Bharat-voice copy** — every line read-aloud-test passed; banned-words list enforced
2. **Trust-first design** — fintech-grade visual restraint, mascot as guest not host
3. **Account Aggregator + classification engine** — 50+ regex rules, 24 categories, profile inference
4. **Khata as differentiator** — Cred-grade financial intelligence layer that Indian competitors lack
5. **Phased provider strategy** — mock seam for every paid provider lets us ship UX before vendor onboarding completes

### 1.5 Business model

- **v0 – v1**: Zero revenue. PMF + retention + trust. Burn from seed capital.
- **v1.5**: Take rate on managed-pool gold/MF (≈0.5% AUM fee — direct-plan only, transparent)
- **v2**: Credit referral fees from NBFC partners (Lendingkart, KreditBee, etc.) on Phase 7 loan disbursals (1.5 – 3% of principal)
- **v3**: Premium tier (Gullak Plus) — advanced Khata insights, family Gullak, priority support, tax-loss-harvesting (₹99/mo)

### 1.6 v0 GTM motion

- 50 – 200 WhatsApp invites to first cohort (controlled rollout)
- Hinglish + regional language content marketing on Instagram / YouTube Shorts
- Refer & Earn ₹100 loop from day one
- Festival-driven seasonal pushes (Diwali, Akshaya Tritiya for gold)
- AA-first onboarding as the conversion lever (show insights before asking for ₹)

---

## 2 — The Gullak Charter (read before contributing anything)

Three commandments above every line of code, every pixel, every word. Anyone building on Gullak inherits these. They are non-negotiable. Violation = revert.

### Commandment 1 — Money is sacred. Trust is the product.

Before any feature ships, answer out loud:

> _"Would a 35-year-old mother trust her ₹50,000 emergency fund here?"_

If **no** → redesign. If **unsure** → hold. If **yes** → ship.

Features that exist to look cool, drive engagement metrics, or signal "innovation" — and do not directly serve that mother's trust — go on the v3+ delight backlog. Not v0 – v2.

### Commandment 2 — The dost stays the dost. The bank gets the bank.

Two voices coexist, never compete:

- **Bharat-voice Hinglish dost** is the *copy* layer. Permanent. Warm. Vernacular. Read-aloud-test mandatory.
  - Banned: "Submit", "Click here", "Verify your KYC", "Continue to dashboard", "Welcome aboard"
  - Required: Aapne, Chaliye, Bachat, Munafa, Sapna, Roz thoda, Mubarak ho
- **Fintech-grade institutional** is the *visual* layer. Permanent. Sober. Restrained.
  - Ink-on-cool-cream surfaces. Lucide over emoji. Tabular numerals on every ₹. Calm motion. Mascot as guest, not host.

Anyone trying to make the app "professional" by stripping Hinglish copy loses an arm. Anyone trying to make it "fun" by adding cartoony visuals loses the other. The combination *is* the moat.

### Commandment 3 — No fake data. No fake trust. No fake returns.

Every number visible is either:

- **Real** (computed from `Transaction`, `MFHolding`, `InvestmentHolding`, `Goal`), or
- **Labelled clearly** as projected / simulated / estimated — with the source named

No "12% returns!" without the footnote. No "RBI Regulated" badge without the actual partner. No managed-pool messaging without "Real units at SafeGold/BSE unlock at ₹X cumulative — currently {progress}% there." **Trust by transparency, not by performance.**

→ Full Charter + 20 engineering invariants: [`docs/INVARIANTS.md`](docs/INVARIANTS.md)

---

## 3 — How this app works (technical layer)

### 3.1 Stack

- **Framework**: Next.js 14.2 App Router (RSC + edge middleware)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS + custom CSS tokens (`src/styles/globals.css`)
- **State**: React Server Components + small client islands for interactivity
- **DB**: Neon Serverless Postgres + Prisma ORM (pooler connection)
- **Auth**: JWT in httpOnly cookie (`jose`, Edge-compatible)
- **i18n**: `next-intl` — 5 locales (en / hi / pa / kn / mr)
- **PWA**: Manifest + service worker + maskable icons
- **Animation**: Framer Motion (sparingly) + CSS keyframes
- **Icons**: `lucide-react`
- **Hosting**: Vercel (production + preview deploys)
- **Observability**: Sentry (errors) + Pino (structured logs) + PostHog (analytics)

### 3.2 Phase progression

| Phase | Scope | Status |
|---|---|---|
| P0 | Foundation: JWT auth, OTP hardening, Pino logger, Sentry | ✅ |
| P1 | KYC: PAN last-4 storage, DPDP consent, `ensureKYC()` gate | ✅ |
| P2 | UPI payments: Razorpay UPI Intent, webhook handler, rate limiting | ✅ |
| P3 | UPI Autopay mandate: Razorpay Subscriptions, state machine, cron-skip | ✅ |
| P4 | Digital Gold: SafeGold seam, micrograms × 1M math, price cache | ✅ |
| P5 | Mutual Funds: BSE StAR MF seam, NAV sync cron, curated direct-plan funds | ✅ |
| Pro upgrade | SEBI Risk Profile + suitability gate, XIRR (Newton-Raphson), grievance redressal, compliance disclosures, security headers | ✅ |
| P6 | Khata: AA (Setu), classify engine, analysis (income/cashflow/behavior/health), 12 insights, recommendations, event-bus pipeline | ✅ |
| **v0 launch** | **Real OTP + real KYC + real UPI Intent + transparent managed-pool holdings** | **🟡 in progress** |
| P7 | Credit (OCEN) — real loan offers from NBFC partners | planned |
| P8 | Multi-channel (WhatsApp + SMS + email) notifications + circuit breakers + status page | planned |
| P9 | Compliance ops dashboard, ReconciliationRun admin, nonce-per-request CSP | planned |
| v2 | Vernacular Chiraiya mascot (LLM + TTS) + Mobile app (FCM push, Play Store alpha) | parked |

### 3.3 Key integrations

| Provider | Purpose | Real flag | Mock fallback |
|---|---|---|---|
| MSG91 | SMS OTP (DLT-registered) | `MSG91_AUTH_KEY` + `MSG91_TEMPLATE_ID` set | Demo code `123456` in dev only |
| Razorpay | UPI Intent + Autopay | `PAYMENTS_REAL=true` | `src/lib/payments/simulate.ts` |
| SafeGold | Digital gold | `GOLD_REAL=true` | `src/lib/gold/safegold.ts` mock branch |
| BSE StAR MF | Mutual funds | `FUND_REAL=true` | `src/lib/mf/bsemf.ts` mock branch |
| Setu AA | Account Aggregator | `AA_REAL=true` | `src/lib/aa/mock.ts` (3 deterministic personas) |
| Setu KYC | PAN + Aadhaar | always real if keys present | dev-only stub |
| Neon | Postgres | always | Vercel-provisioned |
| Upstash Redis | Rate limiting | always (fail-closed in prod when missing) | dev-only bypass |
| Sentry | Error tracking | DSN-gated | disabled when DSN absent |
| PostHog | Product analytics | DSN-gated | disabled when key absent |

### 3.4 Data model (Prisma) — key models

- `User` — phone, name, salary day, KYC state, lifecycle state
- `Goal` — title, type, targetPaise, savedPaise, investedPaise, growthPaise
- `Transaction` — every money movement, idempotency-keyed, audit-trailed
- `Mandate` — UPI Autopay state machine (`PENDING → ACTIVE → HALTED → REVOKED → EXPIRED`)
- `AutopilotRule` — daily/weekly/monthly debit configuration
- `InvestmentHolding` + `InvestmentTransaction` — gold (micrograms × 1M)
- `MutualFund` + `MFHolding` + `MFTransaction` — MF units (micro-units × 1M)
- `AAConsent` + `BankAccount` + `BankTransaction` — Account Aggregator data
- `UserFinancialProfile` + `CashflowSnapshot` — Khata derived intelligence
- `FinancialInsight` + `AutopilotRecommendation` — Khata user-facing layer
- `AuditLog` — append-only event log
- `WebhookEvent` — provider webhook idempotency (`eventId @unique`)
- `RiskProfile` — SEBI suitability questionnaire result
- `ReconciliationRun` — daily recon audit trail
- `GrievanceTicket` — SEBI / RBI complaint flow

Full schema: `prisma/schema.prisma`.

### 3.5 Compliance posture

- **DPDP Act 2023** — explicit consent captured, narrations masked to 20 chars, accounts last-4 only, 30-day `dataExpiresAt`
- **RBI Account Aggregator framework** — consent artefact stored immutably, revocation honored
- **SEBI Riskometer** — every MF buy passes suitability check against user's risk profile
- **SEBI SCORES** — grievance redressal disclosed in app + grievance API
- **NPCI UPI Autopay** — ₹15K daily debit cap enforced, mandate state machine compliant
- **DLT (TRAI)** — every SMS template registered, sender ID approved
- **Security headers** — HSTS (1yr), X-Frame-Options DENY, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **CSP** — tight policy (one v0 debt: `unsafe-inline` until nonce-per-request shipped — see [`docs/OPEN_DEBT.md`](docs/OPEN_DEBT.md))

Full map: [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md).

---

## 4 — Repo structure

```
src/
  app/
    [locale]/         — locale-prefixed routes (en/hi/pa/kn/mr)
      _splash.tsx     — landing splash
      home/           — dashboard
      onboarding/     — phone, OTP, name, salary-day, chiraiya, trust
      goals/          — list, new, [id], withdraw
      autopilot/      — 3-mode picker, commitment
      mandate/        — UPI Autopay mandate creation
      success/        — confetti success screen
      portfolio/      — holdings + XIRR + chart
      khata/          — financial intelligence dashboard
      profile/        — user profile + settings
      transparency/   — instrument breakdown + RRTTLLU
      ... 30+ routes
    api/
      auth/           — OTP send/verify/signout
      payments/       — UPI Intent order
      autopilot/      — mandate creation
      gold/           — buy/sell
      mf/             — buy/redeem
      aa/             — consent + fetch
      financial-profile/ insights/ cashflow/ recommendations/  — Khata
      webhooks/razorpay/  — webhook handler
      cron/           — NAV sync + Khata analysis
      ... 25+ routes
  components/
    ds/               — design system primitives (HeroBalance, StatCard, etc.)
    ui/               — atomic UI (Button, Card, Input)
    nav/              — bottom nav
    mascot/           — Chiraiya (feature-flagged)
    khata/            — Khata UI components
    money/            — chart + pie + amount display
    group/            — Group Gullak card
    animations/       — Gullak break, etc.
    flow/             — Walkthrough overlay
    push/             — push subscribe button
  lib/
    auth/             — session + OTP
    kyc/              — gate + risk-profile
    payments/         — index + simulate + real + razorpay seam
    gold/             — safegold seam + price cache
    mf/               — bsemf seam + nav sync
    aa/               — Setu + mock providers
    khata/            — classify + analyze + profile + insights + recommendations + pipeline
    events/           — event bus
    portfolio/        — XIRR
    rules/            — autopilot engine
    audit/            — append-only log
    idempotency/      — key builder
    ratelimit/        — Upstash limiter
    redis/            — singleton
    i18n/             — config
    analytics/        — PostHog wrapper
prisma/
  schema.prisma       — full DB schema
  seed.ts             — demo user + 35-day saving history
messages/
  en.json hi.json pa.json kn.json mr.json
public/
  assets/             — chiraiya, gullak pot, logos
  icons/              — PWA icons
  manifest.json       — PWA manifest
docs/
  README.md           — V1 product overview (historical, deep-dive)
  INVARIANTS.md       — 20 engineering invariants (the floor)
  OPEN_DEBT.md        — known technical debt + remediation plan
  DEPLOY.md           — deployment + env var reference
  COMPLIANCE.md       — DPDP/SEBI/RBI/NPCI map
  acceptance-audit.md — known limitations
  decision-log.md     — architectural decisions
  iteration-log.md    — change history
```

---

## 5 — Getting started (engineer onboarding)

```bash
# 1. Clone + install
git clone https://github.com/sumitkrjha71/gullak-prod
cd gullak-prod
npm install

# 2. Configure env
cp .env.example .env
# Edit .env — minimum required:
#   DATABASE_URL   (Neon dev branch URL)
#   AUTH_SECRET    (openssl rand -base64 32)
#   OTP_HMAC_SECRET (openssl rand -base64 32)

# 3. Sync schema + seed
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts

# 4. Run
npm run dev
# Open http://localhost:3000/en
# Sign in: 9999900000 / 123456 (dev only — gated on NODE_ENV !== 'production')
```

### Smoke-test the full flow

`/en` splash → tap "Chaliye shuru karein" → language picker → savestment 4-slide deck → phone `9999900000` → OTP `123456` → Chiraiya intro → name → salary-day → trust checkpoint → goal picker → autopilot mode → commitment → mandate → success → home dashboard.

From dashboard: tap 📒 (or new Lucide BookOpen icon) Khata → AA bank connect (HDFC mock) → wait ~3s → financial picture appears.

---

## 6 — Contributing

| Rule | Why |
|---|---|
| One PR = one concern | Reviewability + revert-ability |
| Bharat-voice copy passes Read-Aloud Test | PR reviewer reads new copy out loud before approve |
| New money path? Idempotency + audit log + mock seam required | Three invariants in one workflow |
| New screen? 5-locale copy + 360px viewport + reduce-motion respected | Charter Commandment 2 |
| Schema change? `prisma migrate dev` locally, merge migration file | Never `db push --accept-data-loss` once live users exist |
| Demo features gated on `NODE_ENV !== 'production'` | No exceptions — Charter Commandment 3 |
| `npx tsc --noEmit` clean before commit | Type safety is part of the floor |

---

## 7 — Where to look next

- 🏛️ **Charter + invariants**: [`docs/INVARIANTS.md`](docs/INVARIANTS.md)
- 📋 **Compliance map**: [`docs/COMPLIANCE.md`](docs/COMPLIANCE.md)
- 🚀 **Deployment + env**: [`docs/DEPLOY.md`](docs/DEPLOY.md)
- ⚠️ **Known debt + remediation**: [`docs/OPEN_DEBT.md`](docs/OPEN_DEBT.md)
- 📖 **Product deep-dive** (V1 era, historical): [`docs/README.md`](docs/README.md)
- 🗂️ **Architectural decisions**: [`docs/decision-log.md`](docs/decision-log.md)
- 📜 **Change history**: [`docs/iteration-log.md`](docs/iteration-log.md)

---

## 8 — License

Proprietary. © 2026 Spyne. Contact: lakshay.narang@spyne.ai
