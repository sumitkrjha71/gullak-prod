// V5 M1 — Group Gullak themes. Bharat-rooted contexts where Indians actually
// pool money: monthly kitty, society committee, cricket contri, friends trip,
// family dinner, festival pool, group gift. Read aloud — every label feels
// like a friend texting, not a banking product.

export type GroupTheme = {
  type: string;
  emoji: string;
  /** English label — falls back if locale key missing */
  label: string;
  /** One-line Hinglish hook */
  sub: string;
  /** Suggested target in paise for the whole pool */
  suggestedTargetPaise: number;
  /** Suggested member count for sub-copy hint */
  typicalMembers: string;
};

export const GROUP_THEMES: ReadonlyArray<GroupTheme> = [
  {
    type: 'kitty',
    emoji: '👯‍♀️',
    label: 'Monthly Kitty',
    sub: 'Saheliyon ki bachat',
    suggestedTargetPaise: 60_000_00, // ₹60K
    typicalMembers: '6–10 members',
  },
  {
    type: 'committee',
    emoji: '🏘️',
    label: 'Committee / Bhishi',
    sub: 'Society ya mohalla pool',
    suggestedTargetPaise: 1_00_000_00, // ₹1L
    typicalMembers: '8–12 members',
  },
  {
    type: 'cricket',
    emoji: '🏏',
    label: 'Cricket Contri',
    sub: 'Match, jersey, ground bookings',
    suggestedTargetPaise: 30_000_00, // ₹30K
    typicalMembers: '11–15 members',
  },
  {
    type: 'trip',
    emoji: '🏔️',
    label: 'Friends Trip',
    sub: 'Goa, Manali, Rishikesh — chalein',
    suggestedTargetPaise: 80_000_00, // ₹80K
    typicalMembers: '4–8 dost',
  },
  {
    type: 'family-dinner',
    emoji: '🍛',
    label: 'Family Dinner',
    sub: 'Saath khaana, saath bachat',
    suggestedTargetPaise: 20_000_00, // ₹20K
    typicalMembers: '5–8 members',
  },
  {
    type: 'festival-pool',
    emoji: '🪔',
    label: 'Festival Pool',
    sub: 'Diwali, Holi, Eid mil-jul ke',
    suggestedTargetPaise: 40_000_00, // ₹40K
    typicalMembers: '6–10 members',
  },
  {
    type: 'group-gift',
    emoji: '🎁',
    label: 'Group Gift',
    sub: 'Dost ki shaadi, bhai ka birthday',
    suggestedTargetPaise: 25_000_00, // ₹25K
    typicalMembers: '4–8 dost',
  },
  {
    type: 'wedding-family',
    emoji: '💍',
    label: 'Family Wedding',
    sub: 'Beti ki shaadi, mil-jul ke',
    suggestedTargetPaise: 5_00_000_00, // ₹5L
    typicalMembers: '4–6 family',
  },
  {
    type: 'farewell',
    emoji: '🎓',
    label: 'Farewell / Reunion',
    sub: 'College batch, office team',
    suggestedTargetPaise: 35_000_00, // ₹35K
    typicalMembers: '8–20 members',
  },
  {
    type: 'temple',
    emoji: '🛕',
    label: 'Temple / Yatra',
    sub: 'Vaishno Devi, Tirupati, Haridwar',
    suggestedTargetPaise: 60_000_00, // ₹60K
    typicalMembers: '4–10 members',
  },
  {
    type: 'sports-club',
    emoji: '🏐',
    label: 'Sports Club',
    sub: 'Society team, gym buddies',
    suggestedTargetPaise: 40_000_00, // ₹40K
    typicalMembers: '6–15 members',
  },
  {
    type: 'custom-group',
    emoji: '🎯',
    label: 'Apni Manzil',
    sub: 'Aap khud decide karein',
    suggestedTargetPaise: 50_000_00, // ₹50K
    typicalMembers: 'Aap decide',
  },
];

export function groupThemeFor(type: string): GroupTheme {
  return GROUP_THEMES.find((g) => g.type === type) ?? GROUP_THEMES[0];
}
