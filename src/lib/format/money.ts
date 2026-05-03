// Money is stored as paise (integer). Display layer divides by 100.
// Indian numbering grouping: 1,00,000 — never 100,000.

const NBSP = ' ';

export function paiseToInr(paise: number | bigint): number {
  const n = typeof paise === 'bigint' ? Number(paise) : paise;
  return n / 100;
}

export function inrToPaise(inr: number): number {
  return Math.round(inr * 100);
}

const formatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
});

const formatterWithDecimals = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Format paise as "₹ 1,00,000". Shows decimals only if non-zero paise. */
export function formatInr(paise: number | bigint, opts: { showDecimals?: boolean } = {}): string {
  const n = typeof paise === 'bigint' ? Number(paise) : paise;
  const inr = n / 100;
  const isWhole = n % 100 === 0;
  const formatted = isWhole && !opts.showDecimals ? formatter.format(inr) : formatterWithDecimals.format(inr);
  return `₹${NBSP}${formatted}`;
}

/** Format paise as just the number portion ("1,00,000") — for use inside count-up animations. */
export function formatInrNumber(paise: number | bigint, opts: { showDecimals?: boolean } = {}): string {
  const n = typeof paise === 'bigint' ? Number(paise) : paise;
  const inr = n / 100;
  const isWhole = n % 100 === 0;
  return isWhole && !opts.showDecimals ? formatter.format(inr) : formatterWithDecimals.format(inr);
}

/** For react-countup which needs a numeric value — returns rupees as number. */
export function paiseToRupeeNumber(paise: number | bigint): number {
  const n = typeof paise === 'bigint' ? Number(paise) : paise;
  return Math.round(n / 100);
}
