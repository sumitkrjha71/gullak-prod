// XIRR — Extended Internal Rate of Return.
// Newton-Raphson numerical solver. Standard in mutual fund & portfolio analytics.
//
// cashflows: array of { amountPaise: bigint (negative = outflow/buy, positive = inflow/sell),
//                       date: Date }
// Returns annual rate as a decimal (0.12 = 12% p.a.) or null if it doesn't converge.

export interface Cashflow {
  amountPaise: bigint;
  date:        Date;
}

const MS_PER_YEAR = 365.25 * 24 * 60 * 60 * 1000;
const MAX_ITER    = 100;
const TOLERANCE   = 1e-7;

function xnpv(rate: number, cashflows: Cashflow[], refDate: Date): number {
  return cashflows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - refDate.getTime()) / MS_PER_YEAR;
    return sum + Number(cf.amountPaise) / Math.pow(1 + rate, years);
  }, 0);
}

function xnpvDeriv(rate: number, cashflows: Cashflow[], refDate: Date): number {
  return cashflows.reduce((sum, cf) => {
    const years = (cf.date.getTime() - refDate.getTime()) / MS_PER_YEAR;
    if (years === 0) return sum;
    return sum - years * Number(cf.amountPaise) / Math.pow(1 + rate, years + 1);
  }, 0);
}

/**
 * Returns XIRR as a decimal annual rate, or null if:
 * - fewer than 2 cashflows
 * - all cashflows are the same sign
 * - Newton-Raphson doesn't converge in MAX_ITER steps
 */
export function computeXirr(cashflows: Cashflow[]): number | null {
  if (cashflows.length < 2) return null;

  const refDate = cashflows[0].date;
  let rate = 0.1; // initial guess: 10% p.a.

  for (let i = 0; i < MAX_ITER; i++) {
    const npv   = xnpv(rate, cashflows, refDate);
    const deriv = xnpvDeriv(rate, cashflows, refDate);
    if (deriv === 0) return null;
    const next = rate - npv / deriv;
    if (Math.abs(next - rate) < TOLERANCE) return next;
    rate = next;
    // Guard: rate must stay in a plausible range to avoid divergence
    if (rate < -0.999 || rate > 100) return null;
  }
  return null; // did not converge
}

/** Format XIRR for display: "12.34%" or "N/A" */
export function formatXirr(rate: number | null): string {
  if (rate === null) return 'N/A';
  return `${(rate * 100).toFixed(2)}%`;
}
