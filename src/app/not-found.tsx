import Link from 'next/link';
import { Home } from 'lucide-react';
import { Chiraiya } from '@/components/mascot/Chiraiya';

// Polished 404 — matches the v2 design system.
//
// Chiraiya shows up in `support` state because being lost is a moment that
// deserves an empathetic guide, not a stack trace.

export default function NotFound() {
  return (
    <main
      className="flex min-h-dvh w-full flex-col items-center justify-center px-6"
      style={{ background: 'var(--surface-base)' }}
    >
      <div className="mb-4">
        <Chiraiya state="support" size={96} priority />
      </div>

      <h1
        className="text-center"
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'var(--ink-900)',
          letterSpacing: -0.3,
          lineHeight: 1.15,
        }}
      >
        Yeh raasta nahi mila
      </h1>

      <p
        className="mt-3 max-w-sm text-center"
        style={{ fontSize: 14, color: 'var(--ink-500)', lineHeight: 1.55 }}
      >
        Page exist nahi karta ya hat gaya hai. Chiraiya aapko ghar tak chhod degi —
        ek tap mein.
      </p>

      <Link
        href="/"
        className="haptic-press cta-primary-v2 mt-8 inline-flex h-12 items-center gap-2 rounded-btn px-6 text-[15px] font-bold"
      >
        <Home size={16} strokeWidth={2} aria-hidden />
        Ghar wapas
      </Link>

      <p
        className="mt-10 text-center text-[10.5px] tracking-[0.16em]"
        style={{ color: 'var(--ink-500)', textTransform: 'uppercase' }}
      >
        GULLAK · Bharose ke saath
      </p>
    </main>
  );
}
