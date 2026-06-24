# Compliance Map

> _Every Indian regulator that touches Gullak, what they require, and where we satisfy it in code._

This is the map an auditor walks. It's not a substitute for legal sign-off — get counsel before public launch — but it's the truth of what the codebase enforces today.

---

## 1. DPDP Act 2023 (Digital Personal Data Protection)

| Requirement | Our position | Code reference |
|---|---|---|
| Explicit consent before processing personal data | Consent captured at onboarding (`KYCRecord.consentVersion`) and at AA bank-connect (`AAConsent.consentArtefact`) | `src/lib/kyc/gate.ts`, `src/lib/aa/setu.ts` |
| Purpose limitation | Consent records the specific purpose ("savings analysis", "investment execution"). No re-purposing | `UserConsent` model in `prisma/schema.prisma` |
| Data minimisation | PAN: only last 4 stored. Aadhaar: never stored. Bank narrations: masked to 20 chars | `src/lib/kyc/risk-profile.ts`, `src/lib/khata/classify.ts:maskNarration` |
| Storage limitation | AA data: `dataExpiresAt = now + 30 days`. Cron cleans up | `prisma/schema.prisma:AAConsent.dataExpiresAt`, `src/app/api/cron/khata-analysis/route.ts` |
| Right to erasure | User can revoke consent → cascade-deletes Khata-derived data | `src/app/api/aa/consent/revoke/route.ts` |
| Breach notification | Sentry alerts → ops within 5 min. Public notification within 72h (process documented) | Operational, not code |
| Children's data | Not allowed — age ≥ 18 verified at KYC | `src/lib/kyc/gate.ts` |
| Cross-border transfer | All processing in India (Neon Mumbai region) | Infrastructure decision |

---

## 2. RBI Account Aggregator Framework

| Requirement | Our position | Code reference |
|---|---|---|
| Consent artefact stored immutably | `AAConsent.consentArtefact` is a JSON blob, never updated after creation | `prisma/schema.prisma` |
| User-initiated revocation | `/api/aa/consent/revoke` → state machine moves to `REVOKED` | `src/app/api/aa/consent/revoke/route.ts` |
| Consent expiry honoured | `AAConsent.expiresAt` checked on every fetch attempt | `src/lib/aa/setu.ts` |
| Data fetched only for consented duration | Setu API request includes consent ID; provider enforces | External (Setu) |
| FIP (Financial Information Provider) audit trail | Every fetch logged as `AAFetchLog` row | `prisma/schema.prisma:AAFetchLog` |
| No bulk fetches outside consent | Single FIP per consent, single account per FIP | `src/lib/aa/setu.ts` request shape |

---

## 3. SEBI (Securities and Exchange Board of India)

### 3.1 Mutual Fund distribution

| Requirement | Our position | Code reference |
|---|---|---|
| AMFI registration (or sub-broker via BSE) | BSE StAR MF sub-broker model — operational | External (BSE onboarding) |
| Direct plans only (no commission) | `CURATED_FUNDS` are all direct plans | `src/lib/mf/nav-sync.ts:CURATED_FUNDS` |
| Riskometer suitability check | Every buy passes `isSuitable(fund.riskCategory, user.profile)` | `src/app/api/mf/buy/route.ts:67`, `src/lib/kyc/risk-profile.ts` |
| Risk profile questionnaire | 5-question SEBI-compliant assessment, result stored | `src/app/api/risk-profile/route.ts` |
| Expense ratio disclosure | Every buy/redeem response includes `expenseRatioNote` | `src/app/api/mf/buy/route.ts:184` |
| Exit load disclosure | Every buy includes `exitLoadNote` | `src/app/api/mf/buy/route.ts:167` |
| SEBI Riskometer market-risk warning | Verbatim in every buy/redeem response | `src/app/api/mf/buy/route.ts:182` |
| ELSS 3-year lock-in enforced | `setFullYear(purchaseDate.getFullYear() + 3)` — leap-year safe | `src/app/api/mf/redeem/route.ts` |
| Direct AMC contract notes | TODO Phase 7 — PDF generation on success | Open debt D-? |

### 3.2 SEBI SCORES (grievance redressal)

| Requirement | Our position | Code reference |
|---|---|---|
| 3-day acknowledgement SLA | Captured on `GrievanceTicket.createdAt`; ack auto-fires within 24h | `src/app/api/grievance/route.ts` |
| 30-day resolution SLA | Tracked on `GrievanceTicket.resolvedAt` | `prisma/schema.prisma:GrievanceTicket` |
| SCORES escalation link visible in app | Disclosed in grievance API response | `src/app/api/grievance/route.ts` |
| In-app /help route with WhatsApp + email + SCORES link | TODO Phase 3 of plan | Day 3 task |

---

## 4. NPCI UPI Autopay

| Requirement | Our position | Code reference |
|---|---|---|
| Daily debit cap ₹15,000 | `args.amountPaise > 1_500_000` rejects | `src/lib/payments/index.ts:20` |
| Mandate state machine: PENDING → ACTIVE → HALTED → REVOKED → EXPIRED | Full state transitions tracked | `prisma/schema.prisma:Mandate.status` |
| User-initiated revocation | `/api/autopilot/mandate/revoke` (TODO) — currently via Razorpay subscription cancel | Razorpay cascade |
| Mandate authentication via Razorpay Subscriptions | Webhook `subscription.authenticated` → `status: ACTIVE` | `src/app/api/webhooks/razorpay/route.ts:145` |
| No double-debit | Rules engine skips subscription-managed mandates to prevent cron + Razorpay double-fire | `src/lib/rules/engine.ts` |
| Halted mandate notification to user | Webhook `subscription.halted` → notify user + audit log | `src/app/api/webhooks/razorpay/route.ts:223` |

---

## 5. TRAI / DLT (Telecom Regulatory Authority — SMS)

| Requirement | Our position | Code reference |
|---|---|---|
| Principal entity registered on DLT | Operational (MSG91 dashboard) | External |
| Sender ID DLT-approved | Operational (MSG91 dashboard) | External |
| Every SMS template DLT-approved before send | Template ID in `MSG91_TEMPLATE_ID` env var must be approved status | `src/lib/auth/otp.ts:42` |
| Transactional vs Promotional separation | OTP is transactional template — no promotional content allowed | MSG91 template configuration |
| Opt-out mechanism for promotional SMS (when added) | TODO Phase 8 when WhatsApp / promotional templates ship | Phase 8 |

---

## 6. PCI-DSS equivalent (card data)

Gullak does NOT touch card data directly — Razorpay handles card capture in its own iframe + tokenises. Our scope is **SAQ-A** (e-commerce, no card data touches our servers).

| Requirement | Our position |
|---|---|
| Card data never on Gullak servers | Razorpay Checkout iframe — confirmed |
| HTTPS-only (HSTS 1yr + subdomains) | `next.config.mjs` security headers |
| Sensitive data encrypted at rest | Neon Postgres encryption — managed |
| Access control to production env | Vercel team + Neon project ACLs |

---

## 7. Income Tax Act / TDS

| Requirement | Our position | Code reference |
|---|---|---|
| TDS deduction on MF redemption (if applicable) | BSE StAR MF handles TDS at source — we receive net amount | External (BSE) |
| Capital gains disclosure | Tax note in every redeem response (STCG / LTCG explained) | `src/app/api/mf/redeem/route.ts:143` |
| Tax-loss-harvesting recommendations | TODO v3 Premium feature | Future |
| PAN required for any txn ≥ ₹50K | `ensureKYC()` blocks if PAN not captured | `src/lib/kyc/gate.ts` |

---

## 8. Anti-Money-Laundering (PMLA)

| Requirement | Our position | Code reference |
|---|---|---|
| KYC mandatory before money movement | `ensureKYC()` gate on all investment APIs | `src/lib/kyc/gate.ts` |
| Single transaction limit ₹50,000 (Tier-1 KYC) | Enforced via `amountPaise` Zod max | `src/app/api/mf/buy/route.ts:20` |
| Daily cumulative limit per user | Rate limiter (10 txns/day per asset class) | `src/lib/ratelimit.ts` |
| Suspicious transaction flagging | TODO Phase 9 — pattern-based ML | Future |
| Reconciliation with banking partner | Daily `ReconciliationRun` cron | `prisma/schema.prisma:ReconciliationRun` (admin UI TODO) |
| Records retained for 5 years | Audit log append-only + DB-level retention | `src/lib/audit/log.ts` |

---

## 9. Consumer Protection (RBI Ombudsman + Consumer Protection Act)

| Requirement | Our position | Code reference |
|---|---|---|
| Grievance redressal mechanism in app | `/help` route with WhatsApp + RBI Ombudsman + SEBI SCORES links | Day 3 task |
| Ombudsman ID displayed | TODO `/help` route | Day 3 task |
| Settlement timeline disclosed before user commits | Every buy/sell/redeem includes `settlementNote` | `src/app/api/mf/redeem/route.ts:143` |
| Withdrawal refund within stated SLA | T+3 for MF, T+1 for gold, instant for goals | Disclosed in app |
| No misleading return claims | Charter Commandment 3 — every projection labelled | UI layer |

---

## 10. Operational compliance

| Area | Where |
|---|---|
| Webhook signature verification on every PSP webhook | `src/app/api/webhooks/razorpay/route.ts:26` |
| Idempotency on every state-changing API | `src/lib/idempotency/key.ts` |
| Append-only audit log | `src/lib/audit/log.ts` |
| Reduce-motion respected (accessibility) | `src/styles/globals.css:85` |
| Touch targets ≥ 44px (accessibility) | Tailwind utilities + manual review |
| 5-language support (UDHR Article 27 — culture) | `messages/{en,hi,pa,kn,mr}.json` |
| Content Security Policy | `next.config.mjs` |
| Rate limiting | `src/lib/ratelimit.ts` |

---

## Action items before public launch

- [ ] Counsel sign-off on managed-pool framing (collective-investment-scheme exposure)
- [ ] MSG91 DLT template status verified "Approved" on all 4 operators (Jio, Airtel, Vi, BSNL)
- [ ] Razorpay live-mode KYC complete
- [ ] BSE StAR MF sub-broker registration confirmed (if launching real MF in v1)
- [ ] SafeGold B2B contract signed (if launching real gold in v1)
- [ ] Setu AA production credentials provisioned
- [ ] Grievance redressal SOP documented (3-day ack, 30-day resolution)
- [ ] DPIA (Data Protection Impact Assessment) drafted per DPDP Act Rule 12
- [ ] Privacy policy + Terms of Service published at gullak-prod.vercel.app/legal/*
- [ ] Insurance — D&O + Cyber + E&O coverage in place
- [ ] Reconciliation SOP documented (daily, weekly, monthly check)
- [ ] Internal Compliance Officer designated
