// Mock AA provider — generates realistic 12-month Indian bank transaction history.
// Deterministic: same userId always produces the same transactions (demo-safe).
// Three personas driven by userId hash:
//   0: SALARIED_STABLE   — ₹72K salary, good surplus, under-saving (default demo)
//   1: SALARIED_STRESSED — ₹45K salary, high EMIs, end-of-month stress
//   2: FREELANCER        — irregular income, variable expenses

import crypto from 'crypto';
import type { IAAProvider, ConsentParams, ConsentResult, ConsentStatusResult, DateRange, FetchSessionResult } from './provider';
import type { RawTransaction } from '@/lib/khata/types';

type TxnTemplate = {
  day: number; daysJitter?: number;
  type: 'CREDIT' | 'DEBIT';
  amountPaise: bigint; amountJitterPct?: number;
  narration: string; category: string;
};

const PERSONAS = ['SALARIED_STABLE', 'SALARIED_STRESSED', 'FREELANCER'] as const;
type Persona = typeof PERSONAS[number];

function seedHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function jitter(base: bigint, pct: number, seed: number): bigint {
  const factor = 1 + ((seed % (pct * 2 + 1)) - pct) / 100;
  return BigInt(Math.round(Number(base) * factor));
}

function dayOffset(base: number, jitterDays: number, seed: number): number {
  return Math.max(1, Math.min(28, base + ((seed % (jitterDays * 2 + 1)) - jitterDays)));
}

const TEMPLATES: Record<Persona, TxnTemplate[]> = {
  SALARIED_STABLE: [
    { day: 1,  type: 'CREDIT', amountPaise: 7200000n, narration: 'NEFT-TECHSOLUTIONS-SALARY', category: 'salary' },
    { day: 2,  type: 'DEBIT',  amountPaise: 1800000n, narration: 'NEFT-RENT-HDFC-APTS-12B', category: 'rent' },
    { day: 5,  type: 'DEBIT',  amountPaise: 1240000n, narration: 'NACH/000012345/HDFC HOME LOAN EMI', category: 'emi' },
    { day: 7,  type: 'DEBIT',  amountPaise: 420000n,  narration: 'ECS DR-ICICI CAR LOAN EMI 4567', category: 'emi' },
    { day: 8,  type: 'DEBIT',  amountPaise: 64900n,   narration: 'UPI/NETFLIX.COM/SUBSCRIPTION', category: 'subscription' },
    { day: 8,  type: 'DEBIT',  amountPaise: 11900n,   narration: 'UPI/SPOTIFY.COM/PREMIUM', category: 'subscription' },
    { day: 8,  type: 'DEBIT',  amountPaise: 17900n,   narration: 'UPI/AMAZON PRIME/SUBSCRIPTION', category: 'subscription' },
    { day: 10, type: 'DEBIT',  amountPaise: 99900n,   narration: 'UPI/BESCOM ELECTRICITY BILL', category: 'utility' },
    { day: 10, type: 'DEBIT',  amountPaise: 59900n,   narration: 'UPI/MAHANAGAR GAS/BILL PAYMENT', category: 'utility' },
    { day: 11, type: 'DEBIT',  amountPaise: 99900n,   narration: 'UPI/ACT BROADBAND/INTERNET BILL', category: 'utility' },
    { day: 7,  type: 'DEBIT',  amountPaise: 100000n,  narration: 'UPI/PPFAS MF/SIP INSTALLMENT', category: 'sip' },
    { day: 3,  type: 'DEBIT',  amountPaise: 34900n,   narration: 'UPI/919876543210/SWIGGY/OKICIC', category: 'food', amountJitterPct: 40 },
    { day: 6,  type: 'DEBIT',  amountPaise: 28700n,   narration: 'UPI/ZOMATO ONLINE FD/FOOD ORDER', category: 'food', amountJitterPct: 40 },
    { day: 9,  type: 'DEBIT',  amountPaise: 41200n,   narration: 'UPI/SWIGGY/FOOD DELIVERY', category: 'food', amountJitterPct: 35 },
    { day: 13, type: 'DEBIT',  amountPaise: 32500n,   narration: 'UPI/ZOMATO/FOOD', category: 'food', amountJitterPct: 40 },
    { day: 17, type: 'DEBIT',  amountPaise: 29800n,   narration: 'UPI/SWIGGY/ORDER', category: 'food', amountJitterPct: 35 },
    { day: 21, type: 'DEBIT',  amountPaise: 38400n,   narration: 'UPI/ZOMATO/FOOD DELIVERY', category: 'food', amountJitterPct: 40 },
    { day: 25, type: 'DEBIT',  amountPaise: 26300n,   narration: 'UPI/BLINKIT/GROCERY DELIVERY', category: 'grocery', amountJitterPct: 50 },
    { day: 28, type: 'DEBIT',  amountPaise: 31700n,   narration: 'UPI/SWIGGY INSTAMART/ORDER', category: 'food', amountJitterPct: 40 },
    { day: 14, type: 'DEBIT',  amountPaise: 380000n,  narration: 'POS/DMT DMART STORES/GROCERY', category: 'grocery', amountJitterPct: 20 },
    { day: 28, type: 'DEBIT',  amountPaise: 210000n,  narration: 'UPI/ZEPTO/GROCERY', category: 'grocery', amountJitterPct: 30 },
    { day: 4,  type: 'DEBIT',  amountPaise: 22400n,   narration: 'UPI/UBER INDIA/RIDE', category: 'travel', amountJitterPct: 60 },
    { day: 12, type: 'DEBIT',  amountPaise: 18600n,   narration: 'UPI/OLA/BOOKING', category: 'travel', amountJitterPct: 60 },
    { day: 19, type: 'DEBIT',  amountPaise: 31200n,   narration: 'UPI/UBER INDIA/TRIP', category: 'travel', amountJitterPct: 60 },
    { day: 24, type: 'DEBIT',  amountPaise: 19800n,   narration: 'UPI/RAPIDO/RIDE BOOKING', category: 'travel', amountJitterPct: 50 },
    { day: 15, type: 'DEBIT',  amountPaise: 250000n,  narration: 'POS/HPCL PETROL PUMP/FUEL', category: 'fuel', amountJitterPct: 20 },
    { day: 20, type: 'DEBIT',  amountPaise: 84500n,   narration: 'UPI/APOLLO PHARMACY/MEDICINES', category: 'health', amountJitterPct: 60 },
    { day: 16, type: 'DEBIT',  amountPaise: 189900n,  narration: 'UPI/MYNTRA/ONLINE SHOPPING', category: 'shopping', amountJitterPct: 80 },
  ],

  SALARIED_STRESSED: [
    { day: 5,  type: 'CREDIT', amountPaise: 4500000n, narration: 'NEFT-FASTRETAIL-SALARY', category: 'salary' },
    { day: 6,  type: 'DEBIT',  amountPaise: 1400000n, narration: 'NEFT-RENT-SAIDULAJAB-FLAT', category: 'rent' },
    { day: 7,  type: 'DEBIT',  amountPaise: 980000n,  narration: 'NACH/BAJAJ-BIKE-LOAN/EMI', category: 'emi' },
    { day: 7,  type: 'DEBIT',  amountPaise: 560000n,  narration: 'ECS DR-HDFC PERSONAL LOAN EMI', category: 'emi' },
    { day: 7,  type: 'DEBIT',  amountPaise: 340000n,  narration: 'NACH/BNPL-LAZYPAY/REPAYMENT', category: 'bnpl' },
    { day: 8,  type: 'DEBIT',  amountPaise: 64900n,   narration: 'UPI/NETFLIX/SUBSCRIPTION', category: 'subscription' },
    { day: 10, type: 'DEBIT',  amountPaise: 119000n,  narration: 'UPI/JIO/RECHARGE', category: 'utility' },
    { day: 10, type: 'DEBIT',  amountPaise: 89000n,   narration: 'UPI/BESCOM/ELECTRICITY', category: 'utility' },
    { day: 3,  type: 'DEBIT',  amountPaise: 45000n,   narration: 'UPI/SWIGGY/FOOD', category: 'food', amountJitterPct: 50 },
    { day: 9,  type: 'DEBIT',  amountPaise: 38000n,   narration: 'UPI/ZOMATO/ORDER', category: 'food', amountJitterPct: 50 },
    { day: 16, type: 'DEBIT',  amountPaise: 42000n,   narration: 'UPI/SWIGGY/DINNER', category: 'food', amountJitterPct: 50 },
    { day: 23, type: 'DEBIT',  amountPaise: 36000n,   narration: 'UPI/BLINKIT/QUICK', category: 'grocery', amountJitterPct: 40 },
    { day: 14, type: 'DEBIT',  amountPaise: 290000n,  narration: 'POS/RELIANCE FRESH/GROCERY', category: 'grocery', amountJitterPct: 25 },
    { day: 12, type: 'DEBIT',  amountPaise: 24000n,   narration: 'UPI/OLA/RIDE', category: 'travel', amountJitterPct: 60 },
    { day: 20, type: 'DEBIT',  amountPaise: 180000n,  narration: 'POS/IOCL FUEL/PETROL', category: 'fuel', amountJitterPct: 20 },
    { day: 27, type: 'DEBIT',  amountPaise: 200000n,  narration: 'ATM-9876-HDFC-WITHDRAWAL', category: 'atm' },
    { day: 29, type: 'DEBIT',  amountPaise: 100000n,  narration: 'ATM-1234-ICICI-CASH', category: 'atm' },
  ],

  FREELANCER: [
    { day: 8,  type: 'CREDIT', amountPaise: 5500000n, narration: 'NEFT-DESIGNCO-PROJECT PAYMENT', category: 'freelance_income', amountJitterPct: 60 },
    { day: 18, type: 'CREDIT', amountPaise: 2800000n, narration: 'UPI/FIVERR-WITHDRAWAL/TRANSFER', category: 'freelance_income', amountJitterPct: 80 },
    { day: 2,  type: 'DEBIT',  amountPaise: 2200000n, narration: 'NEFT-RENT-WHITEFIELD-APT', category: 'rent' },
    { day: 6,  type: 'DEBIT',  amountPaise: 64900n,   narration: 'UPI/ADOBE/CREATIVE-CLOUD', category: 'subscription' },
    { day: 6,  type: 'DEBIT',  amountPaise: 64900n,   narration: 'UPI/FIGMA/PROFESSIONAL-PLAN', category: 'subscription' },
    { day: 6,  type: 'DEBIT',  amountPaise: 11900n,   narration: 'UPI/NOTION/WORKSPACE', category: 'subscription' },
    { day: 10, type: 'DEBIT',  amountPaise: 99900n,   narration: 'UPI/TATA PLAY FIBER/INTERNET', category: 'utility' },
    { day: 10, type: 'DEBIT',  amountPaise: 120000n,  narration: 'UPI/BESCOM/ELECTRICITY', category: 'utility' },
    { day: 5,  type: 'DEBIT',  amountPaise: 48000n,   narration: 'UPI/SWIGGY/FOOD', category: 'food', amountJitterPct: 50 },
    { day: 12, type: 'DEBIT',  amountPaise: 39000n,   narration: 'UPI/ZOMATO/ORDER', category: 'food', amountJitterPct: 50 },
    { day: 19, type: 'DEBIT',  amountPaise: 52000n,   narration: 'UPI/SWIGGY/DELIVERY', category: 'food', amountJitterPct: 50 },
    { day: 15, type: 'DEBIT',  amountPaise: 420000n,  narration: 'POS/DMART/GROCERY SHOPPING', category: 'grocery', amountJitterPct: 25 },
    { day: 22, type: 'DEBIT',  amountPaise: 240000n,  narration: 'UPI/BLINKIT/GROCERY', category: 'grocery', amountJitterPct: 30 },
    { day: 10, type: 'DEBIT',  amountPaise: 27000n,   narration: 'UPI/UBER/RIDE', category: 'travel', amountJitterPct: 60 },
    { day: 24, type: 'DEBIT',  amountPaise: 35000n,   narration: 'UPI/OLA/BOOKING', category: 'travel', amountJitterPct: 60 },
    { day: 18, type: 'DEBIT',  amountPaise: 299000n,  narration: 'POS/HPCL FUEL/PETROL', category: 'fuel', amountJitterPct: 20 },
  ],
};

export class MockAAProvider implements IAAProvider {
  readonly providerType = 'mock';

  async createConsent(params: ConsentParams): Promise<ConsentResult> {
    const consentHandle = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + params.durationDays * 86400000);
    return { consentHandle, redirectUrl: `/aa/mock-approve?handle=${consentHandle}`, expiresAt };
  }

  async getConsentStatus(consentHandle: string): Promise<ConsentStatusResult> {
    return {
      consentHandle,
      status: 'ACTIVE',
      artefact: JSON.stringify({ handle: consentHandle, status: 'ACTIVE', ts: new Date().toISOString() }),
      accessToken: `mock-token-${consentHandle}`,
    };
  }

  async fetchFIData(_accessToken: string, _dateRange: DateRange): Promise<FetchSessionResult> {
    return {
      sessionId: `mock-session-${Date.now()}`,
      accounts: [{ accountId: 'mock-acc-1', fipId: 'MOCK_HDFC', accountMasked: 'XXXX4321', accountType: 'SAVINGS' }],
    };
  }

  async getTransactions(sessionId: string, _accountId: string): Promise<RawTransaction[]> {
    const userId = sessionId.replace('mock-session-', '').slice(0, 20);
    return generateMockTransactions(userId, 'mock-acc-1');
  }

  async revokeConsent(_accessToken: string): Promise<void> { /* no-op */ }
}

export function generateMockTransactions(userId: string, accountId: string): RawTransaction[] {
  const seed = seedHash(userId);
  const personaIdx = seed % PERSONAS.length;
  const persona = PERSONAS[personaIdx];
  const templates = TEMPLATES[persona];
  const transactions: RawTransaction[] = [];
  const now = new Date();
  const currentYear  = now.getFullYear();
  const currentMonth = now.getMonth();

  for (let mOffset = 11; mOffset >= 0; mOffset--) {
    const targetMonth = currentMonth - mOffset;
    const year  = currentYear + Math.floor(targetMonth / 12);
    const month = ((targetMonth % 12) + 12) % 12;
    const isStressMonth = [2, 6, 8].includes(mOffset);
    const isGoodMonth   = mOffset === 0;
    let txnSeed = seedHash(`${userId}-${year}-${month}`);

    for (const tmpl of templates) {
      txnSeed = (txnSeed * 1103515245 + 12345) >>> 0;
      const day = dayOffset(tmpl.day, tmpl.daysJitter ?? 1, txnSeed);
      let amount = tmpl.amountJitterPct ? jitter(tmpl.amountPaise, tmpl.amountJitterPct, txnSeed) : tmpl.amountPaise;

      if (isStressMonth && tmpl.type === 'DEBIT' && !['emi', 'rent', 'sip', 'utility'].includes(tmpl.category)) {
        amount = BigInt(Math.round(Number(amount) * 1.28));
      }
      if (isGoodMonth && tmpl.category === 'salary') {
        amount = BigInt(Math.round(Number(amount) * 1.12));
      }
      if (tmpl.amountJitterPct && (txnSeed % 10) < 3) continue;

      const txnDate = new Date(year, month, day);
      if (txnDate > now) continue;

      const hashInput = `${userId}|${year}|${month}|${day}|${tmpl.narration}`;
      const externalId = `MOCK-${crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 16).toUpperCase()}`;

      transactions.push({ externalId, accountId, txnDate, amountPaise: amount, txnType: tmpl.type, narration: tmpl.narration });
    }

    // 2–3 random misc debits per month
    for (let r = 0; r < 3; r++) {
      txnSeed = (txnSeed * 1103515245 + 12345) >>> 0;
      if (txnSeed % 2 === 0) continue;
      const MISC = [
        { narration: 'UPI/APOLLO PHARMACY/MED', amount: BigInt(800 + (txnSeed % 2200)) * 100n },
        { narration: 'POS/PETROL PUMP/FUEL', amount: BigInt(500 + (txnSeed % 1500)) * 100n },
        { narration: 'UPI/IRCTC/TRAIN TICKET', amount: BigInt(400 + (txnSeed % 2000)) * 100n },
        { narration: 'UPI/PHONEPE/P2P TRANSFER', amount: BigInt(500 + (txnSeed % 3000)) * 100n },
      ];
      const pick = MISC[txnSeed % MISC.length];
      const day  = 1 + (txnSeed % 28);
      const txnDate = new Date(year, month, day);
      if (txnDate > now) continue;
      transactions.push({
        externalId: `MOCK-RAND-${crypto.randomBytes(8).toString('hex').toUpperCase()}`,
        accountId, txnDate, amountPaise: pick.amount, txnType: 'DEBIT', narration: pick.narration,
      });
    }
  }

  return transactions.sort((a, b) => a.txnDate.getTime() - b.txnDate.getTime());
}
