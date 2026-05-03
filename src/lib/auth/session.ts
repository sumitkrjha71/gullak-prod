// Session = signed JWT in httpOnly cookie. jose for Edge-runtime compatibility.

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const COOKIE = 'ap_session';
const ALG = 'HS256';

function getSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET ?? 'dev-secret-change-me-in-production-please-use-32-bytes';
  return new TextEncoder().encode(s);
}

export type SessionPayload = { userId: string; phone: string };

export async function createSession(payload: SessionPayload, maxAgeSeconds = 60 * 60 * 24 * 30) {
  const token = await new SignJWT({ userId: payload.userId, phone: payload.phone })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${maxAgeSeconds}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function readSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    if (typeof payload.userId === 'string' && typeof payload.phone === 'string') {
      return { userId: payload.userId, phone: payload.phone };
    }
    return null;
  } catch {
    return null;
  }
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE);
}

/** Edge-safe verify (used by middleware where cookies()-server is unavailable). */
export async function verifyToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    if (typeof payload.userId === 'string' && typeof payload.phone === 'string') {
      return { userId: payload.userId, phone: payload.phone };
    }
    return null;
  } catch {
    return null;
  }
}

export const SESSION_COOKIE = COOKIE;
