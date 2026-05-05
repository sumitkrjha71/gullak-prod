'use client';

// Friendly error boundary for any unhandled server error in /[locale]/* pages.
// Replaces Next's default 'Application error: a server-side exception...' with
// a Hinglish dost-tone fallback the user can recover from.

import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[locale-error]', error?.message, error?.digest);
  }, [error]);

  return (
    <main
      className="flex min-h-dvh w-full flex-col items-center justify-center px-6 py-10 text-center"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <Image
        src="/assets/chiraiya-v2.png"
        alt=""
        width={108}
        height={88}
        priority
        style={{
          width: 108,
          height: 88,
          objectFit: 'contain',
          filter: 'drop-shadow(0 6px 14px rgba(196,96,42,0.18))',
        }}
        className="anim-float"
      />
      <h1
        className="mt-4 font-tiro"
        style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}
      >
        Server thoda dheere chal raha hai
      </h1>
      <p className="mt-2 max-w-xs text-[14px]" style={{ color: 'var(--muted)' }}>
        Fikar not — 5 second wait karein, phir try karein. Aapka data safe hai.
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="haptic-press cta-primary mt-6 inline-flex h-12 items-center justify-center rounded-pill px-6 text-[14.5px] font-bold"
        style={{ minWidth: 200 }}
      >
        Phir try karein
      </button>
      <Link
        href="/en/onboarding/phone"
        className="mt-3 text-[12.5px] font-bold"
        style={{ color: 'var(--saffron)' }}
      >
        Wapas shuruat se →
      </Link>
    </main>
  );
}
