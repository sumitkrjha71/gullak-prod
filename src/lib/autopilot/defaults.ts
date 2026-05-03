// Suggested saving amounts based on income range. All in paise.

export type IncomeRange = '<25k' | '25-50k' | '50-100k' | '100k+';
export type AutopilotMode = 'fixed' | 'roundup' | 'sweep';

export function suggestedDailyPaise(income?: string | null): number {
  switch (income as IncomeRange | undefined) {
    case '<25k':
      return 10_00; // ₹10/day
    case '25-50k':
      return 20_00; // ₹20/day
    case '50-100k':
      return 50_00; // ₹50/day
    case '100k+':
      return 100_00; // ₹100/day
    default:
      return 20_00; // ₹20/day default
  }
}

export function suggestedSweepPaise(income?: string | null): number {
  switch (income as IncomeRange | undefined) {
    case '<25k':
      return 200_00; // ₹200
    case '25-50k':
      return 500_00; // ₹500
    case '50-100k':
      return 1000_00; // ₹1,000
    case '100k+':
      return 2500_00; // ₹2,500
    default:
      return 500_00;
  }
}

export function suggestedRoundUpTo(): number {
  return 10; // round to nearest ₹10
}

export function preselectedMode(args: { isSalaried: boolean; salaryDay: number | null }): AutopilotMode {
  if (args.isSalaried && args.salaryDay) return 'sweep';
  return 'fixed';
}
