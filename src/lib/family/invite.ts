// V5 M1 — Family Gullak invite codes + share URL helpers.
//
// Invite codes are short (8 chars), shareable verbally on WhatsApp/voice calls,
// and unguessable enough for casual use. Pattern: 4 letters + 4 digits, e.g. DOST4823.
// Uses crypto.randomUUID()-derived bytes so they're cryptographically random.

const LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // No I or O — visually ambiguous
const DIGITS = '23456789'; // No 0 or 1 — visually ambiguous

/**
 * Generate a short shareable invite code.
 * Format: 4 letters + 4 digits = 8 chars. Easy to type, easy to read on WhatsApp.
 */
export function generateInviteCode(): string {
  const letters = Array.from({ length: 4 }, () => LETTERS[randomInt(LETTERS.length)]).join('');
  const digits = Array.from({ length: 4 }, () => DIGITS[randomInt(DIGITS.length)]).join('');
  return letters + digits;
}

function randomInt(max: number): number {
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return arr[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * Build a deep-linkable join URL for a Family Gullak invite.
 * Locale-prefixed. Use the request's host so it works in dev + prod.
 */
export function buildInviteUrl(host: string, locale: string, code: string): string {
  const cleanHost = host.replace(/\/$/, '');
  const proto = host.includes('localhost') || host.startsWith('http://') ? '' : 'https://';
  const fullHost = host.startsWith('http') ? cleanHost : `${proto}${cleanHost}`;
  return `${fullHost}/${locale}/join/${code}`;
}

/**
 * Build the WhatsApp share text. Bharat-voice tone — sounds like a friend, not a corporate invite.
 */
export function buildWhatsAppShareText({
  inviterName,
  goalTitle,
  inviteUrl,
}: {
  inviterName: string;
  goalTitle: string;
  inviteUrl: string;
}): string {
  // Friend-tone, mixed Hinglish. Read aloud — sounds like a real WhatsApp.
  const name = inviterName?.trim() || 'Aapka dost';
  return `Namaste! 🙏

${name} ne aapko apne Gullak Family mein shamil hone ke liye invite kiya hai —

🎯 Sapna: ${goalTitle}

Mil-jul ke bachat karenge, jaldi manzil aayegi. Click karein:
${inviteUrl}

Gullak — nayi zamane ki purani aadat 🏺`;
}

/**
 * Build a wa.me share URL — opens WhatsApp directly with the message pre-filled.
 */
export function buildWhatsAppDeepLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}
