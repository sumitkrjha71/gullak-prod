// SEBI-aligned investor risk profiling.
// Five questions, max 4 points each = 20 total.
// Buckets map to SEBI Riskometer categories for suitability gating.

export type RiskProfileLabel = 'conservative' | 'moderate' | 'moderately_aggressive' | 'aggressive';

export interface RiskQuestion {
  id:      string;
  text:    string;
  options: { label: string; points: number }[];
}

export interface RiskAnswer {
  questionId: string;
  answer:     string;
  points:     number;
}

// Five SEBI-aligned questions.
export const RISK_QUESTIONS: RiskQuestion[] = [
  {
    id:   'investment_horizon',
    text: 'How long do you plan to stay invested?',
    options: [
      { label: 'Less than 1 year',  points: 1 },
      { label: '1–3 years',         points: 2 },
      { label: '3–5 years',         points: 3 },
      { label: 'More than 5 years', points: 4 },
    ],
  },
  {
    id:   'loss_reaction',
    text: 'Your investment drops 20% in a month. What do you do?',
    options: [
      { label: 'Sell everything immediately',          points: 1 },
      { label: 'Sell some to reduce risk',             points: 2 },
      { label: 'Hold and wait for recovery',           points: 3 },
      { label: 'Buy more — it\'s a buying opportunity', points: 4 },
    ],
  },
  {
    id:   'income_stability',
    text: 'How stable is your monthly income?',
    options: [
      { label: 'Very uncertain (freelance / gig)',    points: 1 },
      { label: 'Somewhat variable',                   points: 2 },
      { label: 'Mostly stable (salaried)',            points: 3 },
      { label: 'Very stable with other income too',  points: 4 },
    ],
  },
  {
    id:   'experience',
    text: 'What best describes your investing experience?',
    options: [
      { label: 'I have never invested',                   points: 1 },
      { label: 'I invest in FD / gold / RD only',         points: 2 },
      { label: 'I have mutual funds / stocks',            points: 3 },
      { label: 'I actively trade or invest in multiple asset classes', points: 4 },
    ],
  },
  {
    id:   'goal_importance',
    text: 'How important is it that your invested money doesn\'t fall below what you put in?',
    options: [
      { label: 'Extremely important — I cannot afford any loss', points: 1 },
      { label: 'Very important',                                 points: 2 },
      { label: 'Somewhat important',                             points: 3 },
      { label: 'Not important — I\'m okay with short-term dips', points: 4 },
    ],
  },
];

// Score → SEBI Riskometer bucket.
// Conservative:          5–8   → low / low_to_moderate funds only
// Moderate:              9–12  → up to moderate funds
// Moderately Aggressive: 13–16 → up to moderately_high funds
// Aggressive:            17–20 → all funds including high/very_high
export function scoreToProfile(score: number): RiskProfileLabel {
  if (score <= 8)  return 'conservative';
  if (score <= 12) return 'moderate';
  if (score <= 16) return 'moderately_aggressive';
  return 'aggressive';
}

// SEBI Riskometer string → numeric order (higher = riskier).
const RISK_ORDER: Record<string, number> = {
  low:              1,
  low_to_moderate:  2,
  moderate:         3,
  moderately_high:  4,
  high:             5,
  very_high:        6,
};

// Returns max permissible riskometer level for each profile.
const PROFILE_MAX_RISK: Record<RiskProfileLabel, number> = {
  conservative:          2, // low_to_moderate
  moderate:              3, // moderate
  moderately_aggressive: 4, // moderately_high
  aggressive:            6, // very_high
};

/**
 * Returns true if the fund's riskCategory is within the investor's risk tolerance.
 * Used to gate MF purchases.
 */
export function isSuitable(
  fundRiskCategory: string,
  investorProfile: RiskProfileLabel,
): boolean {
  const fundLevel = RISK_ORDER[fundRiskCategory] ?? 3;
  return fundLevel <= PROFILE_MAX_RISK[investorProfile];
}

/**
 * Compute total score from an array of answers. Validates all 5 questions present.
 */
export function computeScore(answers: RiskAnswer[]): number {
  return answers.reduce((sum, a) => sum + a.points, 0);
}
