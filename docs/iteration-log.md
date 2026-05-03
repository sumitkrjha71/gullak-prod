# Iteration Log

Append-only record of meaningful changes. Most-recent at the top.

---

## 2026-05-03 — V3 brand pivot to Gullak + Credit + AA + OCEN + cinematic onboarding

**Sections of README affected:** Product Overview, User Flow, Tech & Architecture, Codebase Structure, Core Features, Data Model, Setup & Run.

**Brand pivot.** The product was renamed from "Autopilot" to **Gullak** (नए ज़माने की पुरानी आदत). Mascot: Chiraiya the sparrow. USP terminology: **Savestment** (proprietary — never replace). Colour palette: warm cream `#FFF8F0`, saffron `#E8650A`, terracotta `#C4602A`, gold `#D4A017`, teal `#0E8C7A`, growth green `#1A7A4A`. Fonts: Nunito (Latin) + Hind/Mukta (Devanagari) + Tiro Devanagari Hindi (display). Design handoff source: `.design-handoff/gullak-investment-app/`.

**V2 punch list shipped:** splash 3-act with cinematic upgrade (logo grows 0.2×→1× bezier-bounce + tagline letter reveal + sparrow lands on **G** of GULLAK), Savestment 4-slide explanation deck with Daily Spend Slider on slide 4 (chai/samosa metaphor + 5-year compounding), ChiraiyaLoading component, all onboarding screens rebranded (phone/OTP/name/salary-day with Chiraiya gentle float), trust 5-item checkpoint with AAA info tooltip, 12-tile goal picker (split wedding-family vs wedding-own, split car vs bike, added custom), commitment with live yearly projection card, mandate with bank → Chiraiya-carries-coin → Gullak animation, success with confetti + coin drop + celebFly Chiraiya, dashboard 9-zone V2 (trust strip + chart with `chartDraw` + balance with floating Chiraiya + Gullak + Munafa gradient card + goal progress + next-action + motivational + recent txns + nudge + bottom nav), first-time walkthrough overlay (4 steps, localStorage persisted), `/transparency` with instrument breakdown + 7-row RRTTLLU disclosure.

**V3 new scope:**
- **Credit-as-NBFC-distributor**: 5 mock loan products (two-wheeler / four-wheeler / gold / consumer-durable / emergency credit line). NO home loans. `/credit` list + `/credit/[product]` detail with compare-lenders + apply (auto-disburse via OCEN mock).
- **Account Aggregator (AA) mock layer** at `lib/aa/` — 3 mock FIPs (HDFC / ICICI / SBI), deterministic account snapshots (salary detection, EMI count, average balance, txn count). `/aa/connect` consent screen.
- **OCEN mock layer** at `lib/ocen/` — 3 mock NBFC partners, 5 loan products, `searchOffers` / `applyForLoan` / `disburse` with idempotency.
- **Credit eligibility engine** (`lib/credit/eligibility.ts`) — 30-day savings gate + active mandate gate + AA-derived rate adjustments. Per-product limits derived from monthly inflow.
- **Dashboard credit card** — only renders when eligible. Sits in Zone H. Chiraiya golden-key affordance.
- **Withdrawal flow** with **Gullak-break animation** (master prompt §3.2 — most delightful in app): Chiraiya beak-tap → 4-shard pot shatter → 14-coin burst → celebFly. 2.5s. Skippable. Reduce-motion fallback.
- **Dynamic motivational copy system** (`lib/motivational/copy.ts`) — picks one of 6 contextual keys (new / streak / goal50 / nudge / passive / postWithdraw).
- **Chiraiya 13-state mascot component** (`components/mascot/Chiraiya.tsx`) — single PNG with state-driven CSS poses.
- **Goal feasibility engine** (`lib/goals/feasibility.ts`) — never red-errors a goal; bridges to credit when timeline is tight.

**Schema changes**: added `User.kycCompleted` + `User.aaConsentLinkedAt`, new tables `AAConsent`, `LoanProduct`, `LoanOffer`, `LoanApplication`. Migration `20260503073307_aa_ocen_credit`.

**Seed updates**: demo user now has 35 days of saving (instead of 7) to clear the credit eligibility gate. Pre-linked AA consent with realistic snapshot (₹75K monthly inflow, 1 EMI, salary-detected). 5 loan products seeded.

**i18n**: all 4 locales (en/hi/pa/kn) updated with `motivational.*`, `credit.*`, `aa.*`, `withdraw.*` blocks plus 12-goal taxonomy renames.

---

## 2026-05-01 — V1 first runnable build

**Sections of README affected:** all (scaffold + first runnable code)

- Full V1 scaffold runnable locally on `http://localhost:3001`
- Demo user seeded: phone `9999900000`, OTP `123456`, 2 goals (EMI prepayment + Emergency fund), 1 active fixed-mode rule (₹20/day), 7 days of successful saves, 1 round-up event, 1 simulated failure
- All trust-critical paths verified end-to-end:
  - OTP send/verify → session cookie issued
  - Home dashboard renders 4 questions (saved / munafa / remaining / next)
  - Dev cron `daily-save` fires + returns `isReplay: true` on second run (idempotency confirmed at DB-level)
  - Activity, settings, weekly-summary, goal-detail, round-up routes all 200
  - Hindi locale compiles and serves at `/hi`
- Engineering guardrails wired in:
  - `User.lifecycleState` FSM with route-level state guards
  - `Transaction.idempotencyKey @unique` (sha256 of user|date-IST|rule|slot)
  - Append-only `AuditLog` table + `lib/audit/log.ts` writer
  - `lib/payments/{index,simulate,real}.ts` abstraction
  - `lib/rules/engine.ts` for cron-driven evaluation
  - `lib/flags/index.ts` env-overridable feature flags
  - `lib/events/processor.ts` centralized side-effects (audit + streak + notification)
- UX polish layer:
  - 10s `<UndoToast>` for round-up confirms (server-side reversal txn)
  - First-time tooltips, post-action trust copy, goal breakdown card (Saved / Invested / Munafa)
  - Empty / loading / failure states across every screen
  - Calm warn-amber `#B25E09` for failure (no red anywhere)
  - Framer-motion entry animations, count-up money via react-countup
  - Tabular nums everywhere ₹ appears

---

## 2026-05-01 — V1 initial scaffold

**Author:** initial commit
**Sections of README affected:** all (file created)

- Created Next.js 14 App Router scaffold with TypeScript, Tailwind, Prisma (SQLite local → Postgres prod)
- Created `docs/README.md` (12-section live doc), `docs/iteration-log.md`, `docs/decision-log.md`
- Locked-in stack: next-intl (en/hi/pa/kn fully translated), Framer Motion, react-countup, jose JWT, lucide icons
- Established design tokens: calm palette `#FAFAF7` / `#0F1115` / `#0E7C4A` / `#0B5FFF` / `#B25E09`. No red.
- Configured Vercel cron schedule (3 jobs: daily-save, salary-sweep, weekly-summary)
