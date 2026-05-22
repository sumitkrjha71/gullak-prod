// Transaction classification engine — rule-based, Indian bank narration patterns.
// Returns category, subCategory, confidence (0–100), isRecurring flag.
// ML hook: when classifiedBy='ml' rows exist, this runs first and ML overrides low-confidence.

import type { TxnCategory, TxnType, ClassificationResult } from './types';

interface Rule {
  pattern:     RegExp;
  category:    TxnCategory;
  subCategory?: string;
  confidence:  number;
  recurringGroup?: string;
}

// Rules are evaluated in order; first match with highest confidence wins on ties.
// Narration is uppercased before matching.
const CREDIT_RULES: Rule[] = [
  // Salary — highest confidence
  { pattern: /SALARY|PAYROLL|SAL\s|WAGES|STIPEND/,         category: 'salary',           confidence: 95 },
  { pattern: /NEFT.*(LTD|PVT|CORP|TECHNOLOGIES|SOLUTIONS|INFOSYS|WIPRO|TCS|HCL|ACCENTURE|COGNIZANT)/, category: 'salary', confidence: 88 },
  { pattern: /NACH.*CREDIT|ECS.*CREDIT.*SALARY/,            category: 'salary',           confidence: 85 },
  // Freelance / business income
  { pattern: /FIVERR|UPWORK|TOPTAL|FREELANCE/,              category: 'freelance_income', confidence: 92 },
  { pattern: /RAZORPAY.*SETTLEMENT|STRIPE.*PAYOUT|PAYONEER/, category: 'freelance_income', confidence: 88 },
  { pattern: /PROJECT.*PAYMENT|CONSULTING.*FEE|INVOICE/,    category: 'freelance_income', confidence: 80 },
  // Refunds
  { pattern: /REFUND|REVERSAL|CASHBACK|REWARDS/,            category: 'other_income',     confidence: 85 },
  // Inter-account transfer
  { pattern: /TRANSFER.*FROM|SELF.*TRANSFER|OWN.*ACCOUNT/,  category: 'transfer_in',      confidence: 82 },
  { pattern: /UPI.*SELF|NEFT.*SELF/,                         category: 'transfer_in',      confidence: 75 },
];

const DEBIT_RULES: Rule[] = [
  // ── Fixed / structured debits ─────────────────────────────────────────────
  // EMI
  { pattern: /NACH|ECS.*DR|EMI|LOAN\s?(REPAY|INST|PAYMENT)|HOME\s?LOAN|CAR\s?LOAN|PERSONAL\s?LOAN|BIKE\s?LOAN|EDUC.*LOAN/, category: 'emi', subCategory: 'loan', confidence: 95, recurringGroup: 'emi' },
  { pattern: /BAJAJ.*FIN|HDFC.*LOAN|ICICI.*LOAN|AXIS.*LOAN|TATA.*CAPITAL|FULLERTON|MUTHOOT/, category: 'emi', subCategory: 'loan', confidence: 88, recurringGroup: 'emi' },
  // Rent
  { pattern: /RENT|HOUSE.*RENT|MONTHLY.*RENT|LANDLORD|FLATMATE|HOSTEL.*FEE|PG.*RENT/, category: 'rent', confidence: 92, recurringGroup: 'rent' },
  // SIP / Investments
  { pattern: /SIP|MUTUAL\s?FUND|MF\s?(INST|PAY)|BSE.*MF|PPFAS|HDFC\s?MF|ICICI\s?PRU\s?MF|UTI\s?MF|AXIS\s?MF|NIPPON|MIRAE|QUANT\s?MF/, category: 'sip', confidence: 95, recurringGroup: 'sip' },
  { pattern: /KUVERA|GROWW.*MF|ZERODHA.*COIN|PAYTM.*MF/, category: 'sip', confidence: 90, recurringGroup: 'sip' },
  // Insurance
  { pattern: /LIC|PREMIUM|INSURANCE|POLICY|BAJAJ.*ALLIANZ|HDFC.*ERGO|ICICI.*LOMBARD|STAR\s?HEALTH|NIVA\s?BUPA|MAX\s?LIFE/, category: 'insurance', confidence: 90, recurringGroup: 'insurance' },
  // BNPL
  { pattern: /LAZYPAY|SIMPL|ZEST|BNPL|BUY\s?NOW\s?PAY|SLICE.*REPAY|ONECARD.*REPAY/, category: 'bnpl', confidence: 90, recurringGroup: 'bnpl' },

  // ── Subscriptions ─────────────────────────────────────────────────────────
  { pattern: /NETFLIX|PRIME.*VIDEO|AMAZON.*PRIME|HOTSTAR|DISNEY\+|JIOCINEMA|SONY\s?LIV|ZEE5|VOOT|ALT\s?BALAJI/, category: 'subscription', subCategory: 'streaming', confidence: 95, recurringGroup: 'streaming' },
  { pattern: /SPOTIFY|GAANA|JIOSAAVN|WYNK|APPLE\s?MUSIC|YOUTUBE.*PREMIUM/, category: 'subscription', subCategory: 'music', confidence: 95, recurringGroup: 'music_sub' },
  { pattern: /ADOBE|FIGMA|NOTION|SLACK|GITHUB|ZOOM|MICROSOFT.*365|GOOGLE.*ONE|DROPBOX|GRAMMARLY/, category: 'subscription', subCategory: 'productivity', confidence: 93, recurringGroup: 'productivity_sub' },
  { pattern: /GYM|FITNESS|CULT\.FIT|FITTERNITY|HEALTHIFY/, category: 'subscription', subCategory: 'fitness', confidence: 88, recurringGroup: 'gym' },

  // ── Utilities ─────────────────────────────────────────────────────────────
  { pattern: /BESCOM|MSEB|TATA\s?POWER|BSES|CESC|ELECTRICITY|ELECTRIC\s?BILL|POWER\s?BILL/, category: 'utility', subCategory: 'electricity', confidence: 95, recurringGroup: 'electricity' },
  { pattern: /GAS\s?(BILL|PAYMENT)|MAHANAGAR\s?GAS|INDRAPRASTHA\s?GAS|PIPED\s?GAS|IGL|MGL/, category: 'utility', subCategory: 'gas', confidence: 93, recurringGroup: 'gas' },
  { pattern: /BROADBAND|INTERNET|FIBER|ACT\s?FIB|AIRTEL.*FIBER|JIOFIBER|HATHWAY|TATA.*PLAY\s?FIBER/, category: 'utility', subCategory: 'internet', confidence: 93, recurringGroup: 'internet' },
  { pattern: /JIO.*RECHARGE|AIRTEL.*RECHARGE|VI\s?RECHARGE|BSNL.*RECHARGE|MOBILE.*RECHARGE/, category: 'utility', subCategory: 'mobile', confidence: 90, recurringGroup: 'mobile_recharge' },
  { pattern: /WATER\s?(BILL|TAX)|BWSSB|MCGM.*WATER|WATER.*CHARGE/, category: 'utility', subCategory: 'water', confidence: 90, recurringGroup: 'water' },

  // ── Food & Dining ─────────────────────────────────────────────────────────
  { pattern: /SWIGGY|ZOMATO|BLINKIT|ZEPTO|DUNZO|INSTAMART|MAGICPIN/, category: 'food', subCategory: 'delivery', confidence: 97 },
  { pattern: /DOMINOS|PIZZA\s?HUT|KFC|MCDONALDS|BURGER\s?KING|SUBWAY|STARBUCKS|CAFE\s?COFFEE|HALDIRAMS/, category: 'food', subCategory: 'dining', confidence: 92 },

  // ── Grocery ───────────────────────────────────────────────────────────────
  { pattern: /DMART|BIGBASKET|GROFERS|JIOMART|RELIANCE\s?(FRESH|SMART|RETAIL)|NATURE'S\s?BASKET|STAR\s?BAZAAR|MORE\s?RETAIL/, category: 'grocery', subCategory: 'supermarket', confidence: 93 },
  { pattern: /GROCERY|KIRANA|VEGETABLES|FRUITS.*SHOP|SUPERMARKET/, category: 'grocery', subCategory: 'supermarket', confidence: 80 },

  // ── Shopping ──────────────────────────────────────────────────────────────
  { pattern: /MYNTRA|FLIPKART|AMAZON(?!.*PRIME)|AJIO|MEESHO|NYKAA|SNAPDEAL|SHOPSY/, category: 'shopping', subCategory: 'ecommerce', confidence: 90 },
  { pattern: /H&M|ZARA|WESTSIDE|LIFESTYLE|PANTALOONS|SHOPPERS\s?STOP|CENTRAL\s?MALL/, category: 'shopping', subCategory: 'retail', confidence: 88 },

  // ── Fuel ──────────────────────────────────────────────────────────────────
  { pattern: /PETROL|DIESEL|FUEL|HPCL|IOCL|BPCL|BHARAT\s?PETROLEUM|HINDUSTAN\s?PETROLEUM|SHELL|PUMP/, category: 'fuel', confidence: 93 },

  // ── Travel & Transport ────────────────────────────────────────────────────
  { pattern: /UBER|OLA|RAPIDO|MERU|TAXI|CAB\s?BOOKING/, category: 'travel', subCategory: 'cab', confidence: 92 },
  { pattern: /IRCTC|RAILWAY|INDIAN\s?RAILWAYS|TRAIN\s?TICKET/, category: 'travel', subCategory: 'train', confidence: 95 },
  { pattern: /MAKEMYTRIP|GOIBIBO|YATRA|CLEARTRIP|IXIGO|EASEMYTRIP/, category: 'travel', subCategory: 'booking', confidence: 90 },
  { pattern: /INDIGO|SPICEJET|AIRINDIA|VISTARA|AIRASIAIND|AKASA/, category: 'travel', subCategory: 'flight', confidence: 90 },
  { pattern: /METRO|BMTC|BEST\s?BUS|KSRTC|MSRTC|DTC.*BUS|TRANSIT/, category: 'travel', subCategory: 'public', confidence: 85 },

  // ── Health ────────────────────────────────────────────────────────────────
  { pattern: /APOLLO|MEDPLUS|NETMEDS|1MG|PHARMEASY|PRACTO|PHARMACY|MEDICAL\s?STORE|HOSPITAL|CLINIC|DOCTOR/, category: 'health', confidence: 88 },

  // ── Education ─────────────────────────────────────────────────────────────
  { pattern: /SCHOOL\s?FEE|COLLEGE\s?FEE|TUITION|COACHING|BYJU|UNACADEMY|VEDANTU|COURSERA|UDEMY|SCALER|LEARNR/, category: 'education', confidence: 88 },

  // ── Entertainment ─────────────────────────────────────────────────────────
  { pattern: /BOOKMYSHOW|PVRINOX|INOX|CINEPOLIS|CARNIVAL\s?CINEMAS/, category: 'entertainment', subCategory: 'movies', confidence: 92 },
  { pattern: /GAMING|STEAM|PUBG|MOBILE\s?LEGENDS|BATTLEGROUNDS/, category: 'entertainment', subCategory: 'gaming', confidence: 85 },

  // ── Tax ───────────────────────────────────────────────────────────────────
  { pattern: /INCOME\s?TAX|TDS\s?PAYMENT|GST\s?PAYMENT|ADVANCE\s?TAX|NSDL|TRACES/, category: 'tax', confidence: 95 },

  // ── ATM ───────────────────────────────────────────────────────────────────
  { pattern: /ATM.*(WITHDRAWAL|CASH|DR)|CASH\s?WITHDRAWAL/, category: 'atm', confidence: 95 },

  // ── Transfers ─────────────────────────────────────────────────────────────
  { pattern: /TRANSFER\s?TO|SELF\s?TRANSFER|IMPS|NEFT(?!.*SALARY)|UPI\/[0-9]{10}/, category: 'transfer_out', confidence: 70 },
];

function normalize(narration: string): string {
  return narration.toUpperCase().replace(/[^A-Z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function detectFlags(amountPaise: bigint, txnDate: Date, category: TxnCategory): string[] {
  const flags: string[] = [];
  if (amountPaise > 5000000n) flags.push('high_value');     // > ₹50,000
  const hour = txnDate.getHours();
  if (hour >= 22 || hour < 5) flags.push('unusual_time');   // 10 PM – 5 AM
  const dow = txnDate.getDay();
  if ((dow === 0 || dow === 6) && ['food', 'shopping', 'entertainment'].includes(category)) {
    flags.push('weekend_spend');
  }
  return flags;
}

export function classifyTransaction(
  narration: string,
  txnType: TxnType,
  amountPaise: bigint,
  txnDate: Date,
): ClassificationResult {
  const norm = normalize(narration);
  const rules = txnType === 'CREDIT' ? CREDIT_RULES : DEBIT_RULES;

  let best: { rule: Rule; confidence: number } | null = null;

  for (const rule of rules) {
    if (rule.pattern.test(norm)) {
      if (!best || rule.confidence > best.confidence) {
        best = { rule, confidence: rule.confidence };
      }
    }
  }

  const category = best?.rule.category ?? 'other';
  const flags = detectFlags(amountPaise, txnDate, category);

  // Recurring detection: categories that are always recurring
  const ALWAYS_RECURRING: TxnCategory[] = ['emi', 'rent', 'sip', 'insurance'];
  const isRecurring = ALWAYS_RECURRING.includes(category) ||
    (best?.rule.recurringGroup !== undefined && best.confidence >= 85);

  return {
    category,
    subCategory:    best?.rule.subCategory,
    confidence:     best?.confidence ?? 40,
    isRecurring,
    recurringGroup: best?.rule.recurringGroup,
    flags,
  };
}

/** Classify a batch and return per-category totals */
export function summarizeByCategory(txns: { category: string; amountPaise: bigint; txnType: string }[]): Record<string, bigint> {
  const totals: Record<string, bigint> = {};
  for (const t of txns) {
    if (t.txnType === 'DEBIT') {
      totals[t.category] = (totals[t.category] ?? 0n) + t.amountPaise;
    }
  }
  return totals;
}
