// 12 goal templates per master prompt §5.1 — Bharat-level realistic amounts.

export type GoalType =
  | 'wedding-family'
  | 'wedding-own'
  | 'home'
  | 'car'
  | 'bike'
  | 'emi'
  | 'emergency'
  | 'education'
  | 'festival'
  | 'travel'
  | 'gold'
  | 'custom';

export type GoalTemplate = {
  type: GoalType;
  emoji: string;
  /** Suggested target in paise. */
  suggestedTargetPaise: number;
  /** Display label for the range. */
  rangeLabel: string;
  popular?: boolean;
};

export const goalTemplates: ReadonlyArray<GoalTemplate> = [
  { type: 'wedding-family', emoji: '💍', suggestedTargetPaise: 10_00_00_000, rangeLabel: '₹5L–₹40L', popular: true },
  { type: 'wedding-own',    emoji: '💑', suggestedTargetPaise: 5_00_00_000,  rangeLabel: '₹3L–₹15L' },
  { type: 'home',           emoji: '🏠', suggestedTargetPaise: 10_00_00_000, rangeLabel: '₹5L–₹30L' },
  { type: 'car',            emoji: '🚗', suggestedTargetPaise: 5_00_00_000,  rangeLabel: '₹3L–₹15L' },
  { type: 'bike',           emoji: '🛵', suggestedTargetPaise: 1_00_00_000,  rangeLabel: '₹50K–₹3L' },
  { type: 'emi',            emoji: '📋', suggestedTargetPaise: 1_00_00_000,  rangeLabel: '₹20K–₹5L' },
  { type: 'emergency',      emoji: '🛡️', suggestedTargetPaise: 50_00_000,    rangeLabel: '₹25K–₹2L', popular: true },
  { type: 'education',      emoji: '🎓', suggestedTargetPaise: 5_00_00_000,  rangeLabel: '₹2L–₹20L' },
  { type: 'festival',       emoji: '🪔', suggestedTargetPaise: 15_00_000,    rangeLabel: '₹5K–₹50K' },
  { type: 'travel',         emoji: '✈️', suggestedTargetPaise: 50_00_000,    rangeLabel: '₹20K–₹2L' },
  { type: 'gold',           emoji: '✨', suggestedTargetPaise: 1_00_00_000,  rangeLabel: '₹30K–₹5L' },
  { type: 'custom',         emoji: '🎯', suggestedTargetPaise: 50_00_000,    rangeLabel: 'You decide' },
];

export function templateFor(type: GoalType): GoalTemplate {
  return goalTemplates.find((g) => g.type === type) ?? goalTemplates[6];
}

/** Map goal type → suggested daily save range in paise (master prompt §5.1) */
export function suggestedDailyRangePaise(type: GoalType): { lo: number; hi: number } {
  switch (type) {
    case 'wedding-family':
    case 'home':       return { lo: 200_00, hi: 2000_00 };
    case 'wedding-own':
    case 'car':
    case 'education': return { lo: 100_00, hi: 500_00 };
    case 'bike':       return { lo: 50_00,  hi: 150_00 };
    case 'emi':        return { lo: 50_00,  hi: 200_00 };
    case 'emergency':  return { lo: 30_00,  hi: 100_00 };
    case 'festival':   return { lo: 20_00,  hi: 100_00 };
    case 'travel':
    case 'gold':       return { lo: 50_00,  hi: 200_00 };
    default:           return { lo: 20_00,  hi: 100_00 };
  }
}
