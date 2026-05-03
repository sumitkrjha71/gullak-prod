import { bannedSubstrings } from './banned';

export type LintHit = { path: string; key: string; word: string; value: string };

/** Walk a translations object and flag any banned substrings in string values. */
export function lintTranslations(messages: Record<string, unknown>, path = ''): LintHit[] {
  const hits: LintHit[] = [];
  for (const [k, v] of Object.entries(messages)) {
    const next = path ? `${path}.${k}` : k;
    if (typeof v === 'string') {
      for (const banned of bannedSubstrings) {
        if (v.toLowerCase().includes(banned.toLowerCase().trim())) {
          hits.push({ path: next, key: k, word: banned, value: v });
        }
      }
    } else if (v && typeof v === 'object') {
      hits.push(...lintTranslations(v as Record<string, unknown>, next));
    }
  }
  return hits;
}
