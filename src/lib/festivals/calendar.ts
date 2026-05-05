// V5 M6 — Hyper-local festival calendar.
//
// Top 12 India festivals with state-keyed visibility. Pan-India ones (Diwali,
// Holi, Eid, Rakhi) show for everyone; regional ones (Onam, Pongal, Bihu, etc.)
// only when the user's `state` matches. Dates spanning 2026-2027 so we cover
// the user's V5 window without re-deploys.
//
// Each festival has a Hinglish nudge headline, a default fund target, and a
// "metaphor" line that grounds the savings amount in the festival's cost-reality
// (e.g., Diwali sweets ~₹3000, Pongal feast ~₹2000).

export type Festival = {
  id: string;
  /** Festival display name in Hinglish (also keys into messages.festivals.{id}.name when available) */
  name: string;
  /** Date of festival as YYYY-MM-DD (IST). One per year, two upcoming years. */
  dates: string[];
  /** ISO 3166-2:IN state codes where this festival is most prominent. Empty array = pan-India. */
  states: string[];
  /** Default fund target in rupees. Bharat-realistic per festival. */
  defaultTargetRupees: number;
  /** Emoji for visual */
  emoji: string;
  /** Hinglish headline ("Diwali aa rahi hai!") */
  headline: string;
  /** Metaphor / sub copy ("mithai, diye, gifts — sab kuch") */
  sub: string;
};

// Note: dates are best-effort. Festivals like Diwali / Holi / Pongal / Onam
// shift slightly each year (lunar calendars). For V5 demo we hardcode known
// dates; a real calendar service would replace this in production.
export const FESTIVALS: Festival[] = [
  // === Pan-India (states: []) ===
  {
    id: 'diwali',
    name: 'Diwali',
    dates: ['2026-11-08', '2027-10-29'],
    states: [],
    defaultTargetRupees: 3000,
    emoji: '🪔',
    headline: 'Diwali aa rahi hai!',
    sub: 'Mithai, diye, family ke gifts, pooja samaan — sab kuch',
  },
  {
    id: 'holi',
    name: 'Holi',
    dates: ['2026-03-04', '2027-03-22'],
    states: [],
    defaultTargetRupees: 1500,
    emoji: '🎨',
    headline: 'Holi ka rang aa raha hai',
    sub: 'Gulaal, mithai, family lunch — Holi is mast banao',
  },
  {
    id: 'eid',
    name: 'Eid-ul-Fitr',
    dates: ['2026-03-20', '2027-03-10'],
    states: [],
    defaultTargetRupees: 5000,
    emoji: '🌙',
    headline: 'Eid Mubarak aa rahi hai',
    sub: 'Kapde, sevai, gifts, dawat — sab ke liye',
  },
  {
    id: 'rakhi',
    name: 'Raksha Bandhan',
    dates: ['2026-08-28', '2027-08-17'],
    states: [],
    defaultTargetRupees: 2000,
    emoji: '🪢',
    headline: 'Rakhi pe behen ke liye',
    sub: 'Bhai-behen ka tyohaar — gifts, mithai, shagun',
  },
  // === State-specific ===
  {
    id: 'onam',
    name: 'Onam',
    dates: ['2026-09-04', '2027-08-25'],
    states: ['KL'],
    defaultTargetRupees: 4000,
    emoji: '🌺',
    headline: 'Onam mubarak ka jashan',
    sub: 'Sadya, pookalam, kapde — taiyaari abhi se',
  },
  {
    id: 'pongal',
    name: 'Pongal',
    dates: ['2027-01-14', '2028-01-14'],
    states: ['TN', 'PY'],
    defaultTargetRupees: 2500,
    emoji: '🍚',
    headline: 'Pongal aa raha hai',
    sub: 'Sakkarai pongal, naya kapda, pooja — sab ke liye',
  },
  {
    id: 'bihu',
    name: 'Bihu',
    dates: ['2027-01-14', '2028-01-14'],
    states: ['AS'],
    defaultTargetRupees: 2000,
    emoji: '🌾',
    headline: 'Bihu ka jashan',
    sub: 'Gamosa, pitha, family feast — shuruat karein',
  },
  {
    id: 'chhath',
    name: 'Chhath Puja',
    dates: ['2026-10-26', '2027-11-15'],
    states: ['BR', 'UP', 'JH'],
    defaultTargetRupees: 3500,
    emoji: '☀️',
    headline: 'Chhath ki taiyaari',
    sub: 'Soop, prasad, ghat ki vyavastha — Surya devta ko arghya',
  },
  {
    id: 'vishu',
    name: 'Vishu',
    dates: ['2026-04-14', '2027-04-15'],
    states: ['KL'],
    defaultTargetRupees: 1500,
    emoji: '🌼',
    headline: 'Vishu Kani ki taiyaari',
    sub: 'Kani, kaineettam, sadya — naya saal ki shuruat',
  },
  {
    id: 'baisakhi',
    name: 'Baisakhi',
    dates: ['2026-04-14', '2027-04-13'],
    states: ['PB', 'HR'],
    defaultTargetRupees: 2000,
    emoji: '🌾',
    headline: 'Baisakhi ka mela',
    sub: 'Naye kapde, gurudwara seva, mela — sab kuch',
  },
  {
    id: 'ugadi',
    name: 'Ugadi',
    dates: ['2026-03-19', '2027-04-07'],
    states: ['KA', 'AP', 'TG'],
    defaultTargetRupees: 2500,
    emoji: '🌿',
    headline: 'Ugadi naya saal',
    sub: 'Pachadi, naya kapda, family feast — taiyaari shuru',
  },
  {
    id: 'gudipadwa',
    name: 'Gudi Padwa',
    dates: ['2026-03-19', '2027-04-07'],
    states: ['MH', 'GA'],
    defaultTargetRupees: 2500,
    emoji: '🚩',
    headline: 'Gudi Padwa ka jashan',
    sub: 'Gudi, puran poli, naya kapda — Marathi naya saal',
  },
];

/**
 * Get the most relevant upcoming festival for a user's state.
 * Returns null if nothing in the next 90 days.
 */
export function nextFestivalFor(stateCode: string | null | undefined, now: Date = new Date()): {
  festival: Festival;
  date: Date;
  daysAway: number;
} | null {
  const upcoming: Array<{ festival: Festival; date: Date; daysAway: number }> = [];

  for (const f of FESTIVALS) {
    // Skip state-specific festivals where user's state doesn't match.
    if (f.states.length > 0 && (!stateCode || !f.states.includes(stateCode))) continue;

    for (const dateStr of f.dates) {
      const d = new Date(dateStr + 'T00:00:00+05:30');
      const daysAway = Math.ceil((d.getTime() - now.getTime()) / (86400000));
      if (daysAway >= 0 && daysAway <= 90) {
        upcoming.push({ festival: f, date: d, daysAway });
      }
    }
  }

  if (upcoming.length === 0) return null;
  upcoming.sort((a, b) => a.daysAway - b.daysAway);
  return upcoming[0];
}

/**
 * Compute auto-calc daily save amount: target / days-remaining.
 * Returns rounded-up to nearest ₹5 for reasonable daily commitment.
 */
export function festivalDailySaveRupees(targetRupees: number, daysAway: number): number {
  if (daysAway <= 0) return targetRupees;
  const raw = targetRupees / daysAway;
  // Round up to nearest 5
  return Math.ceil(raw / 5) * 5;
}
