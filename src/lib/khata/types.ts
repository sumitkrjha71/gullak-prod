// Shared types for the Khata financial intelligence engine.

export type TxnType = 'CREDIT' | 'DEBIT';

export type TxnCategory =
  | 'salary' | 'freelance_income' | 'business_income' | 'other_income'
  | 'emi' | 'rent' | 'sip' | 'insurance'
  | 'utility' | 'subscription' | 'bnpl'
  | 'food' | 'grocery' | 'shopping' | 'fuel'
  | 'health' | 'travel' | 'education' | 'entertainment'
  | 'tax' | 'transfer_in' | 'transfer_out' | 'atm' | 'other';

export interface RawTransaction {
  externalId:     string;   // provider's transaction ID
  accountId:      string;   // our BankAccount.id
  txnDate:        Date;
  valueDate?:     Date;
  amountPaise:    bigint;
  txnType:        TxnType;
  narration:      string;   // full narration — classified then discarded
  balance?:       bigint;
}

export interface ClassificationResult {
  category:     TxnCategory;
  subCategory?: string;
  confidence:   number;     // 0–100
  isRecurring:  boolean;
  recurringGroup?: string;
  flags:        string[];
}

export interface MonthlyAggregate {
  monthKey:     string;    // "YYYY-MM"
  creditPaise:  bigint;
  debitPaise:   bigint;
  surplusPaise: bigint;
  byCategory:   Record<TxnCategory, bigint>;
  txnCount:     number;
}

export type IncomeType = 'unknown' | 'salaried' | 'freelance' | 'business' | 'pension' | 'mixed';

export interface IncomeSignal {
  incomeType:          IncomeType;
  avgMonthlyCreditPaise: bigint;
  salaryAmountPaise?:  bigint;
  salaryDay?:          number;
  salaryConsistencyPct: number;
}

export interface CashflowSignal {
  avgMonthlySurplusPaise: bigint;
  surplusVolatilityScore: number;  // 0=volatile, 100=stable
  cashflowStabilityScore: number;  // composite 0–100
  debtIncomeRatioPct:     number;
  emiTotalPaise:          bigint;
  emiCount:               number;
  subscriptionCount:      number;
  subscriptionTotalPaise: bigint;
  fixedExpensesPaise:     bigint;
  variableExpensesPaise:  bigint;
}

export interface BehavioralSignal {
  endOfMonthStressScore:  number;  // 0–100
  lifestyleInflationPct:  number;
  savingConsistencyPct:   number;
  impulsiveSpendingScore: number;  // 0–100
}

export type HealthLabel = 'fragile' | 'building' | 'stable' | 'growing' | 'thriving';

export interface FinancialHealthScore {
  score: number;      // 0–100
  label: HealthLabel;
}
