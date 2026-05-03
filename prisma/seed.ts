// Seed: one demo user with 2 goals, 1 active rule, 7 days of realistic activity.
// Run via `npm run db:seed`.

import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

function buildKey(userId: string, dateKey: string, ruleId: string, slot: string) {
  return crypto
    .createHash('sha256')
    .update(`${userId}|${dateKey}|${ruleId}|${slot}`)
    .digest('hex')
    .slice(0, 32);
}

function refId() {
  return `SIM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

function dateKey(date: Date) {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + 330 * 60000);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function main() {
  console.log('Seeding…');

  // Wipe demo user if it exists.
  await prisma.user.deleteMany({ where: { phone: '9999900000' } });

  const user = await prisma.user.create({
    data: {
      phone: '9999900000',
      name: 'Lakshay',
      locale: 'en',
      ageRange: '25-34',
      incomeRange: '50-100k',
      state: 'Maharashtra',
      isSalaried: true,
      salaryDay: 1,
      lifecycleState: 'ACTIVE',
      preferences: { create: {} },
      streak: {
        create: {
          currentDays: 5,
          longestDays: 9,
          lastSavedDate: new Date(),
        },
      },
    },
  });

  const emiGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      type: 'emi',
      title: 'EMI prepayment',
      targetPaise: BigInt(12_00_000), // ₹12,000
      isPrimary: true,
    },
  });

  const emergencyGoal = await prisma.goal.create({
    data: {
      userId: user.id,
      type: 'emergency',
      title: 'Emergency fund',
      targetPaise: BigInt(50_00_000), // ₹50,000
    },
  });

  const fixedRule = await prisma.autopilotRule.create({
    data: {
      userId: user.id,
      goalId: emiGoal.id,
      mode: 'fixed',
      amountPaise: BigInt(20_00), // ₹20/day
      frequency: 'daily',
    },
  });

  await prisma.mandate.create({
    data: {
      userId: user.id,
      ruleId: fixedRule.id,
      maxPerDebitPaise: BigInt(100_00), // ₹100 cap
      cap: 'daily',
    },
  });

  // 35 days of successful saves — enough to unlock the credit eligibility gate.
  let totalSaved = 0n;
  let totalGrowth = 0n;
  for (let i = 34; i >= 0; i--) {
    const ts = new Date(Date.now() - i * 86400000 + 9 * 3600 * 1000); // ~9am IST
    const amt = BigInt(20_00);
    const dk = dateKey(ts);
    await prisma.transaction.create({
      data: {
        userId: user.id,
        goalId: emiGoal.id,
        ruleId: fixedRule.id,
        source: 'fixed',
        amountPaise: amt,
        status: 'success',
        simulatedRefId: refId(),
        idempotencyKey: buildKey(user.id, dk, fixedRule.id, 'cron'),
        createdAt: ts,
      },
    });
    totalSaved += amt;
    totalGrowth += BigInt(Math.floor(Number(amt) * 0.0002));
  }
  // One nice round-up event.
  const roundupTs = new Date(Date.now() - 2 * 86400000 + 21 * 3600 * 1000);
  await prisma.transaction.create({
    data: {
      userId: user.id,
      goalId: emiGoal.id,
      source: 'roundup',
      amountPaise: BigInt(60_00), // ₹60
      status: 'success',
      simulatedRefId: refId(),
      idempotencyKey: buildKey(user.id, dateKey(roundupTs), 'roundup', 'manual-roundup'),
      createdAt: roundupTs,
    },
  });
  totalSaved += BigInt(60_00);
  totalGrowth += BigInt(Math.floor(60_00 * 0.0002));

  // One realistic failure 3 days ago to demonstrate the failure UX.
  const failTs = new Date(Date.now() - 3 * 86400000 + 9 * 3600 * 1000);
  await prisma.transaction.create({
    data: {
      userId: user.id,
      goalId: emiGoal.id,
      ruleId: fixedRule.id,
      source: 'fixed',
      amountPaise: BigInt(20_00),
      status: 'failed',
      failureReason: 'insufficient_balance',
      simulatedRefId: refId(),
      idempotencyKey: buildKey(user.id, dateKey(failTs), fixedRule.id, 'cron-fail-demo'),
      createdAt: failTs,
    },
  });

  await prisma.goal.update({
    where: { id: emiGoal.id },
    data: {
      savedPaise: totalSaved,
      investedPaise: totalSaved,
      growthPaise: totalGrowth,
    },
  });

  // A single notification to populate inbox.
  await prisma.notification.create({
    data: {
      userId: user.id,
      category: 'milestone',
      titleKey: 'notifications.templates.milestone.title',
      bodyKey: 'notifications.templates.milestone.body',
      bodyParams: JSON.stringify({ goal: emiGoal.title, pct: 25 }),
      deepLink: `/goals/${emiGoal.id}`,
    },
  });

  // OCEN catalogue (idempotent product seeding).
  const products = [
    { type: 'two-wheeler',     name: 'Two-Wheeler Loan',      minAmountPaise: BigInt(30_000_00),  maxAmountPaise: BigInt(3_00_000_00),  minTenureDays: 365,        maxTenureDays: 365 * 3, baseRatePctBps: 1400 },
    { type: 'four-wheeler',    name: 'Four-Wheeler Loan',     minAmountPaise: BigInt(1_00_000_00), maxAmountPaise: BigInt(15_00_000_00), minTenureDays: 365,        maxTenureDays: 365 * 5, baseRatePctBps: 1100 },
    { type: 'gold',            name: 'Gold Loan',             minAmountPaise: BigInt(25_000_00),  maxAmountPaise: BigInt(5_00_000_00),  minTenureDays: 90,         maxTenureDays: 365,     baseRatePctBps: 950  },
    { type: 'consumer-durable',name: 'Consumer Durable Loan', minAmountPaise: BigInt(5_000_00),   maxAmountPaise: BigInt(50_000_00),    minTenureDays: 90,         maxTenureDays: 365 * 2, baseRatePctBps: 1700 },
    { type: 'emergency',       name: 'Emergency Credit Line', minAmountPaise: BigInt(5_000_00),   maxAmountPaise: BigInt(1_00_000_00),  minTenureDays: 30,         maxTenureDays: 180,     baseRatePctBps: 1800 },
  ];
  for (const p of products) {
    await prisma.loanProduct.upsert({
      where: { type: p.type },
      update: { name: p.name, minAmountPaise: p.minAmountPaise, maxAmountPaise: p.maxAmountPaise, minTenureDays: p.minTenureDays, maxTenureDays: p.maxTenureDays, baseRatePctBps: p.baseRatePctBps, active: true },
      create: p,
    });
  }

  // AA consent — pre-linked so the demo user has account snapshot from day one.
  await prisma.aAConsent.create({
    data: {
      userId: user.id,
      fipId: 'MOCK_HDFC',
      consentHandle: crypto.randomUUID(),
      status: 'ACTIVE',
      fetchedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 86400000),
      payload: JSON.stringify({
        bankName: 'HDFC Bank (mock)',
        accountMasked: 'XXXX1234',
        monthlyInflowPaise: 7_500_000,    // ₹75K
        monthlyOutflowPaise: 5_000_000,
        averageBalancePaise: 3_500_000,
        salaryDetected: true,
        salaryDay: 1,
        emiCount: 1,
        emiTotalMonthlyPaise: 1_200_000,
        txnCount6mo: 215,
      }),
    },
  });
  await prisma.user.update({
    where: { id: user.id },
    data: { aaConsentLinkedAt: new Date() },
  });

  // Feature flag rows (defaults).
  for (const key of [
    'enable_roundup',
    'enable_salary_sweep',
    'enable_notifications',
    'enable_undo_window',
    'enable_force_fail_dev_toggle',
  ]) {
    await prisma.featureFlag.upsert({
      where: { key },
      update: {},
      create: { key, enabled: true },
    });
  }

  console.log(`Seeded user ${user.id} (phone 9999900000, OTP 123456).`);
  console.log(`  Goals: ${emiGoal.title}, ${emergencyGoal.title}`);
  console.log(`  Total saved (paise): ${totalSaved.toString()}`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
