// V5 M11 — Web Push send helpers using web-push library + VAPID keys.
//
// VAPID public key is exposed to the client (used in subscription).
// Private key stays server-side, used to sign push messages.
//
// Generate keys once:  npx web-push generate-vapid-keys
// Set on Vercel:
//   VAPID_PUBLIC_KEY      = <public>
//   VAPID_PRIVATE_KEY     = <private>
//   VAPID_SUBJECT         = mailto:support@gullak.app  (or any URL)
// If keys are missing, sendPush() returns { ok: false, reason: 'no_vapid' }
// — the demo still works (subscriptions are recorded; remote push just doesn't
// fire until keys are added).

import webpush from 'web-push';

let configured = false;
function configure(): boolean {
  if (configured) return true;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT ?? 'mailto:support@gullak.app';
  if (!pub || !priv) return false;
  try {
    webpush.setVapidDetails(subj, pub, priv);
    configured = true;
    return true;
  } catch {
    return false;
  }
}

export const PUBLIC_VAPID_KEY = process.env.VAPID_PUBLIC_KEY ?? '';

export type PushSendInput = {
  endpoint: string;
  p256dh: string;
  auth: string;
  payload: { title: string; body: string; url?: string; icon?: string };
};

export async function sendPush(input: PushSendInput): Promise<{ ok: boolean; reason?: string }> {
  if (!configure()) return { ok: false, reason: 'no_vapid' };
  try {
    await webpush.sendNotification(
      {
        endpoint: input.endpoint,
        keys: { p256dh: input.p256dh, auth: input.auth },
      },
      JSON.stringify({
        title: input.payload.title,
        body: input.payload.body,
        url: input.payload.url ?? '/',
        icon: input.payload.icon ?? '/icons/icon-192.png',
      }),
    );
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown';
    return { ok: false, reason: msg };
  }
}
