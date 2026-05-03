# V3 Acceptance Audit

Self-audit per master prompt §11. Tick-box of Definition-of-Done for each module.

| Module | DoD criteria | Status |
|---|---|---|
| 🏺 Brand System | Logo (terracotta Gullak PNG) renders on all densities. "Savestment" appears ≥5 times in onboarding (splash + savestment deck + commitment + success + dashboard). All taglines correct. | ✅ |
| ✨ Splash Screen | All 3 acts play. Cinematic upgrade: logo grows from 0.2× → 1× with bezier-bounce, byline letter-by-letter reveal, sparrow flies in and lands on the **G** of GULLAK. Coins fall. SAVESTMENT shimmer reveal in act 3. CTA visible. | ✅ |
| 📝 Onboarding Flow | Max 2 inputs per screen (phone, otp, name, salary-day each have 1). Trust checkpoint after onboarding. KYC deferred. First commitment moment shows bank → Chiraiya-coin → Gullak animation. | ✅ |
| 🐦 Chiraiya System | Single PNG asset reused with state-driven CSS poses. 14 named states defined in `Chiraiya.tsx` (idle, thinking, save-success, streak, milestone, processing, error-shield, withdrawal, gullak-break, inactive, support, kyc, new-feature, credit-key). | ✅ |
| 📱 Dashboard | All 9 zones present (trust strip, chart, balance, munafa, goal, next-action, motivational, transactions, nudge + bottom nav). Single-line chart with toggle pills. Single nudge. Chiraiya animates. Tappable balance → /transparency. | ✅ |
| 🎯 Goal Engine | 12 categories with Bharat-realistic defaults. Feasibility engine in `lib/goals/feasibility.ts` (never red-errors, bridges to credit on tight timelines). | ✅ |
| 🔐 Trust Architecture | RBI badge persistent on every major screen. False-promise copy removed. Instrument transparency on tap (`/transparency` shows breakdown + RRTTLLU). T+1 withdrawal communicated. | ✅ |
| 🌐 Language System | en + hi + pa + kn all fully translated, including motivational + credit + AA + withdraw blocks. Fonts loaded: Nunito (Latin) + Hind/Mukta (Devanagari) + Tiro Devanagari Hindi (display). | ✅ |
| 🎨 Color & Theme | Warm cream `#FFF8F0` background. Saffron `#E8650A` CTAs. Teal `#0E8C7A` trust signals. No blue/grey corporate palette. Soft red `#C0392B` for errors only. | ✅ |
| 💳 Credit Feature | Pre-approval gated by 30-day savings + active mandate. Chiraiya golden-key reveal on `/credit`. 5 products (two-wheeler / four-wheeler / gold / consumer-durable / emergency). Compare lenders. Apply + auto-disburse mock. Dashboard card only when eligible. | ✅ |
| 🏦 AA + OCEN | `lib/aa/` mock with 3 mock FIPs and deterministic snapshots. `lib/ocen/` mock with 3 NBFC partners + 5 product types. `/aa/connect` consent screen. `LoanProduct` / `LoanOffer` / `LoanApplication` Prisma models with idempotency. Eligibility computed from AA snapshot (salary detection, EMI count, average balance) | ✅ |
| 🎬 Animations | All P0 animations functional: dropIn (splash Gullak), gentleFloat (everywhere), coinDrop (success + splash + savestment), coinFly + birdCarry (mandate + Savestment slide 2), shimmer (SAVESTMENT text), celebFly (success + transparency), chartDraw (dashboard chart). Gullak-break (withdrawal): 4-shard shatter, coin burst, celebFly. Reduce Motion respected via `prefers-reduced-motion` media query in `globals.css`. | ✅ |
| 💡 Daily Spend Slider | On Savestment deck slide 4. Chai/samosa metaphor. 5-year compounding projection. Mini Gullak fills as slider grows. | ✅ |
| 🛤️ Walkthrough | First-time overlay on dashboard. 4 steps (chart, balance, munafa, goal). Persisted in `localStorage` `gullak_walkthrough_done`. | ✅ |
| 📜 Transparency / RRTTLLU | `/transparency` page with instrument breakdown (Govt Bonds 55% / Gold Bonds 25% / AAA Paper 20%) + 7-row RRTTLLU panel (Risk / Returns / Time / Tenure / Liquidity / Lock-in / Understanding) in plain Hinglish. | ✅ |
| 💔 Withdrawal | `/goals/[id]/withdraw` with amount slider, T+1 disclosure, Gullak-break animation (Chiraiya beak-tap → 4-shard shatter → 14-coin burst → celebFly). API: `/api/withdraw` writes Transaction + AuditLog + decrements goal. | ✅ |
| 📈 Motivational copy | `lib/motivational/copy.ts` picks one of 6 keys based on user state. i18n in all 4 locales. | ✅ |

Notes / known follow-ups:
- KYC entry stub deferred — `User.kycCompleted` column added but the entry screen isn't built (V3 is mock-only; production KYC needs DigiLocker / Aadhaar integration).
- Credit dashboard card uses lucide `KeyRound` — for the pixel-perfect golden-key animation per master prompt §3.1, a custom SVG animation could replace it later.
- Gullak-break animation reduce-motion fallback is functional but minimal (just shows the amount).
- `lib/credit/eligibility.ts` evaluates AA snapshot for rate adjustments but doesn't yet vary product limits per snapshot — uses heuristic monthly-inflow multiplier.
