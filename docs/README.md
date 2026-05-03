# Autopilot Investment App (India) — V1

> **Living document.** Updated alongside every meaningful change. Reference for both engineers and product team.

---

## 1. Product Overview

**What it is.** A trust-first, multilingual, habit-driven savings-to-investment engine for India. The product helps users automatically save small amounts every day, simulates moving that money into life-goal buckets (EMI prepayment, ghar, beti ki shaadi, retirement…), and shows progress in plain Hindi/English/Punjabi/Kannada language.

**Who it's for.** Mass-market Indian users — UPI-comfortable, salaried or semi-salaried, who want to save but struggle with discipline. First-time smartphone users must understand the app in 3 seconds.

**Core problem.** People want to save, but discretionary spending leaks income. Most apps speak finance jargon, hide their fees, and feel intimidating. We replace decision fatigue with automation, and replace finance jargon with life-goal language.

**Product philosophy:**
1. **Trust > Speed** — every money movement is explained. No silent failures.
2. **Determinism > Flexibility** — every flow is predictable, every action reproducible.
3. **Visibility > Abstraction** — users always see money movement, progress, growth.
4. **Simplicity > Feature Depth** — one loop working perfectly beats many features partially.

**This is not a trading app.** No portfolio screens. No CAGR / NAV / AUM jargon. No urgency timers. No red.

---

## 2. User Flow

End-to-end journey:

```
Landing
  └─ Language pick (en / hi / pa / kn)
       └─ Phone + OTP (mocked: 123456)
            └─ Name → Profile → Salary day
                 └─ Trust checkpoint  ⭐ (the most-rehearsed screen)
                      └─ Goal pick (EMI / Emergency / Ghar / Shaadi / Retirement / Festival)
                           └─ Autopilot mode (Fixed / Round-up / Salary-sweep)
                                └─ First commitment (₹10/₹20/₹50/day)
                                     └─ Mandate consent (simulated)
                                          └─ Success (post-action trust copy)
                                               └─ Home dashboard
```

**Steady-state loop:**
- Cron `daily-save` runs at 09:00 IST → fixed-mode debits via simulator
- Cron `salary-sweep` runs at 10:00 IST → checks who has salary day == today
- User-triggered `/api/sim/spend` → roundup bucket → end-of-day batch screen
- Weekly summary cron runs Mondays 08:30 IST

**Home dashboard answers exactly 4 questions:**
1. Kitna save kiya? (Total saved)
2. Kitna badha? (Munafa — never "growth")
3. Kitna baaki? (Remaining + progress)
4. Next kya hoga? (Next debit date + amount)

---

## 3. Tech & Architecture

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router + TypeScript |
| Styling | Tailwind CSS + shadcn-style primitives owned in repo |
| i18n | next-intl (locale-prefixed routes `/en`, `/hi`, `/pa`, `/kn`) |
| Motion | Framer Motion (sparingly, calm easing only) |
| Counting | react-countup for ₹ amounts |
| State | Zustand for UI state; Server Actions / API for mutations |
| ORM | Prisma |
| DB | SQLite (local) → Vercel Postgres (prod) |
| Auth | Mocked OTP via signed httpOnly cookie (jose JWT) |
| Cron | Vercel Cron (3 schedules) |
| Hosting | Vercel |

**System design (high level):**
```
Client (RSC/RCC)
   │  Server Actions / fetch
   ▼
API routes / Server actions
   │
   ├── lib/state-machine    (route-level guards)
   ├── lib/payments         (execute / validate)
   │       └── simulate     (95% success / 5% fail simulator)
   ├── lib/rules            (mode-specific evaluators)
   ├── lib/idempotency      (sha256 keys, @unique on Transaction)
   ├── lib/events/processor (one ingress, all side-effects)
   ├── lib/audit            (append-only AuditLog writes)
   └── lib/flags            (feature flag registry)
        ▼
       Prisma → SQLite/Postgres
```

**Data flow for a debit (the trust-critical path):**
1. Cron route computes idempotency key for today + rule
2. Calls `payments.execute()` — checks for existing txn; inserts pending row if new
3. Simulator runs: 95% success, deterministic growth applied on success
4. Updates `Transaction.status`, `Goal.savedPaise/investedPaise/growthPaise`
5. Dispatches `PAYMENT_SUCCESS` event → processor writes audit log + bumps streak + creates notification
6. Client revalidates and renders the new amount with count-up animation

---

## 4. Codebase Structure

```
docs/                 — this README, iteration-log.md, decision-log.md
prisma/               — schema.prisma + seed.ts
messages/             — en.json, hi.json, pa.json, kn.json (full translations)
src/
  app/                — Next.js App Router (locale-prefixed routes + API)
  components/
    ui/               — primitives (Button, Card, Sheet, Dialog, Input, …)
    trust/            — TrustBadge, WhyWeAsk, PrivacyNote, NoSurpriseRow,
                        ConfirmSheet, MoneyMovedToast, UndoToast, PostActionTrust,
                        SecuritySeal
    money/            — AmountDisplay, AnimatedCounter, GrowthChip, ProgressRing,
                        GoalCard, GoalBreakdown, Sparkline
    flow/             — StepHeader, OneActionScreen, LanguageSwitcher,
                        FirstTimeTooltip, HapticPress
    patterns/         — EmptyState, LoadingState, FailureState, SuccessState
    feed/             — NotificationFeed (inline), NotificationCard, NotificationInbox
  lib/
    auth/             — session cookie + mock OTP
    db/               — prisma client singleton
    state-machine/    — user lifecycle FSM
    events/           — types, bus, processor
    payments/         — abstraction + simulate engine
    rules/            — engine + per-mode evaluators
    flags/            — feature flag registry
    audit/            — append-only audit log
    idempotency/      — key generation
    undo/             — 10s reversal window
    i18n/             — next-intl config
    trust/            — trust copy registry
    format/           — money / date / eta formatters
    goals/            — math, defaults, breakdown
    autopilot/        — mode logic helpers
    streak/           — streak logic
    copy-lint/        — banned-words guard
  styles/             — globals.css (design tokens)
```

---

## 5. Core Features

### 5.1 Onboarding (5 steps + trust checkpoint)
- **What:** language → phone+OTP → name → profile → salary day → trust checkpoint
- **Why:** minimum data, maximum trust. Each field has a `WhyWeAsk` chip
- **How:** state machine progresses `NEW → ONBOARDING → TRUST_ACKNOWLEDGED`. Routes are guarded by middleware

### 5.2 Goal buckets
- **What:** 6 default goals (Emergency / EMI / Ghar / Shaadi / Retirement / Festival)
- **Why:** users think in life outcomes, not financial instruments
- **How:** `lib/goals/defaults.ts` defines the 6 templates; goal creation transitions `TRUST_ACKNOWLEDGED → GOAL_CREATED`

### 5.3 Autopilot saving — 3 modes
- **What:** Fixed daily / Round-up / Salary-sweep
- **Why:** different income patterns; users pick what fits
- **How:** each mode has an evaluator in `lib/rules/`. Cron jobs call `evaluateSaving(user, ctx)` then `payments.execute()`

### 5.4 Dummy UPI / Payment simulator
- **What:** realistic-feeling payment lifecycle (intent → debit → settled)
- **Why:** prove the loop works end-to-end without real banking rails
- **How:** see §6 below

### 5.5 Goal dashboard (the home screen)
- **What:** primary goal card + breakdown (Saved / Invested / Munafa) + secondary goals + inline notification feed + recent paisa movement + post-action trust footer
- **Why:** the user must see the 4 answers (kitna save / kitna badha / kitna baaki / next kya)
- **How:** RSC with revalidation triggered after every txn

### 5.6 Activity / Paisa movement
- **What:** every debit visible; filter by All/Saved/Failed/This week
- **Why:** visibility = trust. Hidden money = distrust
- **How:** reads `Transaction` table reverse-chronologically; failure rows in warn-amber, never red

### 5.7 Round-up batch
- **What:** end-of-day single-confirm batch with itemised breakdown
- **Why:** batched ≪ per-transaction noise. Users see "₹480 → ₹500 = ₹20 save"
- **How:** spends accumulate in `RoundupBucket`; `/round-up` page shows the day's items

### 5.8 Undo (10 seconds)
- **What:** post-action undo for round-up add, manual save, goal adjustment
- **Why:** "galti se paisa chala gaya toh?" — reversibility = confidence
- **How:** `lib/undo/window.ts` writes a compensating reversal txn (status = `reversed`); audit-logged

### 5.9 Streaks
- **What:** day/week saving streak with one-day-per-week buffer
- **Why:** rigid systems break habits; flexible ones sustain them
- **How:** `lib/streak/logic.ts` updated on every PAYMENT_SUCCESS event

### 5.10 Weekly summary
- **What:** "This week you saved ₹X. Your money grew by ₹Y. Your goal is Z% complete."
- **Why:** less noise than daily; reinforces habit
- **How:** Monday 08:30 IST cron generates a summary; user navigates to `/summary/weekly`

### 5.11 Settings + dev controls
- **What:** language, privacy, payment-simulation controls (dev-flavored), saving-rules pause
- **Why:** for local testing without waiting for cron timers
- **How:** Settings → "Run daily save now" / "Simulate ₹480 spend" / "Force fail next debit" buttons hit `/api/dev/run-cron` and `/api/sim/*`

---

## 6. Payment Simulation (Dummy UPI)

**Goal:** make the loop feel real without real banking rails.

**Lifecycle:**
1. Caller computes `idempotencyKey = sha256(userId|YYYY-MM-DD-IST|ruleId|slot)`
2. `payments.execute({ idempotencyKey, userId, ruleId, amountPaise, source, goalId })`
3. Validation: mandate active? amount within cap? rule active? user lifecycle ACTIVE?
4. Idempotency check: existing txn with same key → return prior result (no double debit)
5. Insert `Transaction { status: 'pending', simulatedRefId: 'SIM-XXXXXXXX' }`
6. Simulator: 95% success / 5% fail (overridable via `UserPreference.forceFailNext` for testing)
7. **Success:** `Transaction.status = 'success'`; increment `Goal.savedPaise/investedPaise`; apply tiny deterministic growth `floor(invested * 0.0002)` to `Goal.growthPaise`
8. **Failure:** `Transaction.status = 'failed'`, `failureReason ∈ {insufficient_balance, mandate_revoked, network_timeout}` — surfaced to user as plain-language "Aaj save nahi ho paya. Kal fir try karenge"
9. Dispatch `PAYMENT_SUCCESS` or `PAYMENT_FAILED` event → processor handles audit + streak + notification
10. Return serialisable `SimResult` to UI

**Trigger surfaces** (all go through `payments.execute`):
- Cron `daily-save` (fixed-mode rules)
- Cron `salary-sweep` (sweep rules where `salaryDay == today.IST.date()`)
- User confirm on `/round-up` page (round-up rules)
- Dev-only `/api/dev/run-cron` for instant local testing

**Why this matters:** the abstraction layer (`lib/payments/`) means switching to a real PSP later is a one-line change in `payments/index.ts` plus a flag flip — no refactor of cron routes, audit logic, or UI.

---

## 7. Trust & UX System

The trust layer is the core product, not a coat of paint.

### 7.1 Visual primitives
- **Calm palette:** bg `#FAFAF7`, text `#0F1115`, growth `#0E7C4A`, trust `#0B5FFF`, warn `#B25E09`. **No red.**
- **Inter** typeface only; tabular nums for all money
- **Cards:** 16px radius, hairline border, soft shadow only
- **Motion:** 200ms ease-out default; respects `prefers-reduced-motion`
- **Money format:** Indian numbering (`₹ 1,00,000`), non-breaking space

### 7.2 Reusable trust components
- `<TrustBadge>` — lock + 1 phrase
- `<WhyWeAsk>` — inline expandable explanation per field
- `<PrivacyNote>` — muted reassurance
- `<NoSurpriseRow>` — "Tomorrow at 9am, ₹20 will move"
- `<ConfirmSheet>` — bottom-sheet confirm with explicit summary
- `<MoneyMovedToast>` — confirmation after debit
- `<UndoToast>` — 10s reversal window
- `<PostActionTrust>` — "Aapka paisa aapke naam par invest ho gaya hai" — shown after every successful save
- `<GoalBreakdown>` — Saved / Invested / Munafa
- `<SecuritySeal>` — encrypted-data lock chip on sensitive screens
- `<FirstTimeTooltip>` — one-shot, dismissible orientation
- `<EmptyState>` / `<LoadingState>` / `<FailureState>` / `<SuccessState>` — universal patterns

### 7.3 Microcopy registry
All trust strings live in `src/lib/trust/copy.ts` with i18n message keys. Every screen imports — never hardcodes — to guarantee consistency across en/hi/pa/kn.

### 7.4 Word substitutions (enforced by `lib/copy-lint`)
| Banned | Use instead |
|---|---|
| Growth | **Munafa** |
| Activity | **Paisa movement** |
| Returns | Munafa |
| Transaction failed | "Aaj save nahi ho paya. Kal fir try karenge." |
| guaranteed / risk-free / 100% safe / CAGR / NAV / AUM / alpha / beta / portfolio | (banned outright) |

### 7.5 Failure handling rules
- Never blame the user
- Never use technical wording
- Always give the next step
- Use warn-amber `#B25E09`, never red

### 7.6 Cognitive-load reduction
- ≤1 primary CTA per screen (`<OneActionScreen>` enforces at the type level)
- Defaults pre-filled (₹10/₹20/₹50/day suggestions by income)
- Progressive disclosure (round-up items collapsed if >3)
- First-time tooltips dismissible, max 3 across the whole app

### 7.7 Global UX rules (encoded in component contracts)
- Every screen explains what is happening + what happens next
- Every action shows confirmation + effect + reversibility
- Every money movement is visible + explainable + traceable

---

## 8. Data Model

All money in **paise (BigInt)** — no float drift.

```
User             — phone, name, locale, profile, salaryDay, lifecycleState
  └─ Goal              — type, title, target/saved/invested/growth, status
       └─ AutopilotRule    — mode, amount, frequency, status, pauseUntil
            └─ Mandate        — maxPerDebit, cap, authorisedAt, revokedAt
                 └─ Transaction   — amount, status, source, idempotencyKey @unique,
                                    simulatedRefId, reversedAt, reversalOfId
  ├─ SavingsEvent  — domain events for UX (success/failure/milestone)
  ├─ AuditLog      — APPEND-ONLY system truth (state transitions, txns, mandates, flags)
  ├─ Streak        — currentDays, longestDays, lastSavedDate, freebiesUsed
  ├─ Notification  — category, titleKey, bodyKey, deepLink
  ├─ UserPreference— notifySalary/Roundup/Weekly, forceFailNext (dev)
  └─ RoundupBucket — dateKey, pendingPaise, items (JSON)

FeatureFlag       — key, enabled, rolloutPct (global, not per-user)
```

`AuditLog` is **immutable** — no update/delete code paths exist. Every state transition / txn / mandate auth / flag flip writes a row. This is the system of record for debugging, dispute resolution, and (later) compliance.

---

## 9. Setup & Run

### Local dev
```bash
# from repo root
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
# → http://localhost:3000
```

**Demo credentials:** phone `9999900000`, OTP `123456`. The seed pre-populates 7 days of activity so the dashboard looks lived-in on first run.

**Exercise the full loop locally** (Settings → Payment simulation):
- "Run daily save now" → triggers fixed-mode debit
- "Simulate ₹480 spend" → adds to round-up bucket → visit `/round-up` to confirm
- "Force fail next debit" + "Run daily save now" → see failure UX
- "Generate weekly summary"
- "Simulate salary credit" → triggers sweep

### Deploy (Vercel)
1. `git init && git add . && git commit -m "v1: initial scaffold"`
2. Push to GitHub → import to Vercel
3. Vercel → Storage → Create Postgres → injects `DATABASE_URL`
4. Add env vars: `AUTH_SECRET`, `OTP_DEMO_CODE`, `CRON_SECRET`, flag overrides as needed
5. `vercel.json` already declares the cron schedule

---

## 10. Decision Log

See [decision-log.md](./decision-log.md). High-impact decisions:
- **Stack:** Next.js 14 App Router (single deployable, RSC for low-end devices)
- **DB:** Prisma + SQLite locally → Postgres in prod (one schema, two backends)
- **Auth:** mocked OTP via httpOnly JWT — easy Twilio swap later
- **Money in paise (BigInt)** — float drift is a fintech foot-gun
- **`AuditLog` separate from `SavingsEvent`** — system truth vs UX events have different shapes and retention needs
- **Idempotency at DB level** (`@unique idempotencyKey`) — DB enforces what code might forget
- **Industry-benchmark design** — Stripe / Wise / Cred fidelity, not "good enough"

---

## 11. Iteration Log

See [iteration-log.md](./iteration-log.md). Updated after every meaningful change.

---

## 12. Limitations + Next Steps

**Not in V1:**
- Real OTP (Twilio Verify) — drop-in for `lib/auth/otp.ts`
- Real PSP (Razorpay UPI AutoPay / Setu) — drop-in for `lib/payments/real.ts`
- KYC (DigiLocker / Aadhaar)
- Real fund routing (liquid-fund AMC partner)
- Marathi (mr) translation — i18n infra ready, just needs strings
- Dark mode (CSS-variable tokens already abstracted)
- Push notifications via FCM (browser Notification API contract is in place)



- Multiple investment products
- Jargon-heavy investor screens
