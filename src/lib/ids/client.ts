// Client-generated IDs so the navigation never has to wait for an API
// response just to learn what id the server assigned. Pass these to the API
// as `id`; the API uses them verbatim. This + sessionStorage caching is what
// allows fire-and-forget writes throughout onboarding/setup.

export function generateClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return 'c' + crypto.randomUUID().replace(/-/g, '').slice(0, 23);
  }
  // Fallback for older browsers (very rare).
  return 'c' + Math.random().toString(36).slice(2, 14) + Date.now().toString(36);
}
