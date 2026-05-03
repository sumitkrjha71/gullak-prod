// Words and phrases that must never appear in user-facing copy.
// Enforced by the optional copy-lint check (see checker.ts).

export const bannedSubstrings: ReadonlyArray<string> = [
  'guaranteed',
  '100% safe',
  'risk-free',
  'secure returns',
  'CAGR',
  ' NAV ',
  ' AUM ',
  'alpha',
  'beta',
  'portfolio',
];

export const bannedRedHexes: ReadonlyArray<string> = [
  '#FF0000',
  '#F44',
  '#E53',
  '#D32',
];
