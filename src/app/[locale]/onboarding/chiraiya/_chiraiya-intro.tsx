'use client';

import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, ArrowRight } from 'lucide-react';

// Trust-building intro between OTP verify and name entry.
// One screen, one mascot, one promise. Read aloud — sounds like a friend
// saying hello, not a bank welcoming a new account.

export function ChiraiyaIntro({ locale }: { locale: string }) {
  const router = useRouter();
  const next = () => router.push(`/${locale}/onboarding/name`);

  return (
    <main
      className="relative flex min-h-dvh w-full flex-col anim-screen-enter overflow-hidden"
      style={{
        background:
          'radial-gradient(ellipse at top, #FFF5EC 0%, var(--bg) 60%)',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Decorative tinka (twig) backdrop — very subtle, low opacity */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, var(--saffron) 1px, transparent 2px), radial-gradient(circle at 70% 80%, var(--growth) 1px, transparent 2px), radial-gradient(circle at 90% 20%, var(--saffron) 1px, transparent 2px)',
          backgroundSize: '60px 60px',
        }}
      />

      <header className="safe-top relative z-10 mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/onboarding/otp`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/40"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span
          className="text-[11px] font-bold"
          style={{ color: 'var(--trust)' }}
        >
          100% Safe · RBI
        </span>
        <span className="h-9 w-9" />
      </header>

      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col items-center px-6 pt-4 text-center">
        {/* Floating Chiraiya — large + glowing */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.85 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative mt-2"
        >
          {/* Soft glow halo */}
          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            style={{
              width: 240,
              height: 240,
              background:
                'radial-gradient(circle, rgba(232,101,10,0.30) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3.4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative"
          >
            <Image
              src="/assets/chiraiya-v2.png"
              alt="Chiraiya — Gullak ka mascot"
              width={220}
              height={180}
              priority
              style={{
                width: 220,
                height: 180,
                objectFit: 'contain',
                filter:
                  'drop-shadow(0 12px 24px rgba(196,96,42,0.30)) drop-shadow(0 4px 8px rgba(196,96,42,0.20))',
              }}
            />
          </motion.div>
        </motion.div>

        {/* Speech bubble — tail points up to Chiraiya */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4, ease: 'easeOut' }}
          className="relative mt-5 w-full max-w-[380px]"
        >
          {/* Tail */}
          <div
            aria-hidden
            className="absolute left-1/2 -top-2 -translate-x-1/2 rotate-45"
            style={{
              width: 16,
              height: 16,
              background: 'var(--surface)',
              border: '2px solid var(--saffron)',
              borderBottom: 'none',
              borderRight: 'none',
            }}
          />
          <div
            className="relative px-5 py-5"
            style={{
              background: 'var(--surface)',
              border: '2px solid var(--saffron)',
              borderRadius: 'var(--radius-card-lg)',
              boxShadow: '0 8px 24px rgba(232,101,10,0.18)',
            }}
          >
            <p
              className="font-tiro text-[16.5px] leading-[1.55]"
              style={{ color: 'var(--text)', fontWeight: 700 }}
            >
              <span style={{ color: 'var(--saffron)' }}>Namaste,</span> main{' '}
              <span style={{ color: 'var(--saffron)' }}>Chiraiya</span> hoon!
            </p>
            <p
              className="mt-2 text-[14px] leading-[1.6]"
              style={{ color: 'var(--text)' }}
            >
              Main bhi <span className="font-extrabold">tinka-tinka</span> ghar banati hoon…
            </p>
            <p
              className="mt-1 text-[14px] leading-[1.6]"
              style={{ color: 'var(--text)' }}
            >
              Aur aap{' '}
              <span
                className="font-extrabold"
                style={{ color: 'var(--growth)' }}
              >
                rupaiya-rupaiya
              </span>{' '}
              sapna banaiye!
            </p>
            <p
              className="mt-3 font-tiro text-[16px] leading-[1.5]"
              style={{ color: 'var(--saffron)', fontWeight: 800 }}
            >
              Saath chalein? 🤝
            </p>
          </div>
        </motion.div>

        {/* Trust micro-row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.9 }}
          className="mt-5 flex items-center gap-3 text-[11px]"
          style={{ color: 'var(--muted)' }}
        >
          <span className="inline-flex items-center gap-1">
            🔒 <span className="font-bold">Aapka paisa, aapke naam par</span>
          </span>
          <span style={{ color: 'var(--border)' }}>·</span>
          <span className="inline-flex items-center gap-1">
            🇮🇳 <span className="font-bold">RBI partners</span>
          </span>
        </motion.div>

        <div className="flex-1" />

        {/* CTA */}
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.1 }}
          onClick={next}
          className="haptic-press cta-primary mb-6 mt-6 inline-flex h-14 w-full max-w-[380px] items-center justify-center gap-2 rounded-pill text-[16px] font-bold"
        >
          Haan, saath chalein
          <ArrowRight size={18} />
        </motion.button>
      </div>
    </main>
  );
}
