'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

type Coin = { id: number; left: number; delay: number };

/**
 * V4 Splash — cinematic 4-act, auto-advances under 10s.
 *  Act 1 (0–1.6s)   : SAVESTMENT shimmer-reveal at TOP. Tagline definition fades in.
 *  Act 2 (1.6–3.2s) : GULLAK logo grows 0.2 → 1× with bezier-bounce. Pot drops in + glows.
 *  Act 3 (3.2–7.0s) : Tagline types in (typewriter). Sparrow flies in along an arc and lands precisely on the G.
 *  Act 4 (7.0–9.0s) : Coins drop into Gullak. Pot pulses with golden glow.
 *  At 9.0s          : Auto router.push → /language-select.
 *
 * Sparrow landing is anchored to the rendered G via ref + getBoundingClientRect, so it
 * stays precisely on the letter on any viewport.
 */
export function SplashScreen({
  locale,
  labels,
}: {
  locale: string;
  labels: {
    appName: string;
    tagline: string;
    savestmentTop: string;
    savestmentDef: string;
    skip: string;
  };
}) {
  const [act, setAct] = useState(0);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [typedChars, setTypedChars] = useState(0);
  const [gPos, setGPos] = useState<{ left: number; top: number } | null>(null);
  const router = useRouter();
  const gRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sequence the acts.
  useEffect(() => {
    const t1 = setTimeout(() => setAct(1), 100);
    const t2 = setTimeout(() => setAct(2), 1600);
    const t3 = setTimeout(() => setAct(3), 3200);
    const t4 = setTimeout(() => {
      setAct(4);
      let id = 0;
      const iv = setInterval(() => {
        setCoins((prev) => [
          ...prev,
          { id: id++, left: 38 + Math.random() * 28, delay: Math.random() * 0.25 },
        ]);
        if (id > 7) clearInterval(iv);
      }, 280);
    }, 7000);
    const tAuto = setTimeout(() => {
      router.push(`/${locale}/language-select`);
    }, 9200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tAuto);
    };
  }, [locale, router]);

  // Typewriter cadence — variable 60–110ms per char. Starts when act >= 3.
  useEffect(() => {
    if (act < 3) return;
    const total = labels.tagline.length;
    if (typedChars >= total) return;
    const ch = labels.tagline.charAt(typedChars);
    const cadence = ch === ',' || ch === '।' ? 240 : ch === ' ' ? 70 : 60 + Math.random() * 50;
    const t = setTimeout(() => setTypedChars((c) => c + 1), cadence);
    return () => clearTimeout(t);
  }, [act, typedChars, labels.tagline]);

  // Anchor the sparrow to the rendered G letterform.
  useEffect(() => {
    function place() {
      if (!gRef.current || !containerRef.current) return;
      const gRect = gRef.current.getBoundingClientRect();
      const cRect = containerRef.current.getBoundingClientRect();
      setGPos({ left: gRect.left - cRect.left, top: gRect.top - cRect.top });
    }
    place();
    window.addEventListener('resize', place);
    const ro = new ResizeObserver(place);
    if (gRef.current) ro.observe(gRef.current);
    return () => {
      window.removeEventListener('resize', place);
      ro.disconnect();
    };
  }, [act]);

  return (
    <main
      ref={containerRef}
      className="relative flex min-h-dvh w-full flex-col items-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, var(--splash-top) 0%, var(--splash-bottom) 100%)',
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {/* Skip — small, top-right */}
      <Link
        href={`/${locale}/language-select`}
        className="absolute right-4 top-3 z-30 text-[12px] font-semibold text-[#D4A017]/70 hover:text-[#D4A017] transition-colors"
      >
        {labels.skip} →
      </Link>

      {/* === ACT 1 — SAVESTMENT at TOP, the headline === */}
      <div className="mt-[14vh] flex w-full flex-col items-center px-6">
        <div
          className="shimmer-text font-tiro"
          style={{
            fontSize: 'clamp(38px, 11vw, 56px)',
            fontWeight: 900,
            letterSpacing: 'clamp(2px, 0.8vw, 5px)',
            lineHeight: 1,
            opacity: act >= 1 ? 1 : 0,
            transform: act >= 1 ? 'translateY(0) scale(1)' : 'translateY(-12px) scale(0.92)',
            transition: 'opacity 0.9s ease, transform 1s var(--ease-bounce)',
          }}
        >
          {labels.savestmentTop}
        </div>
        <div
          className="mt-2.5 max-w-[300px] text-center text-[12.5px] leading-relaxed"
          style={{
            color: '#FFE7B0',
            opacity: act >= 1 ? 0.92 : 0,
            transition: 'opacity 1.2s ease 0.4s',
          }}
        >
          {labels.savestmentDef}
        </div>
      </div>

      {/* === ACT 2 — Gullak pot drops + glows === */}
      <div className="relative z-[2] mt-[5vh]">
        <Image
          src="/assets/gullak-pot.png"
          alt="Gullak"
          width={170}
          height={140}
          priority
          style={{
            width: 170,
            height: 140,
            objectFit: 'contain',
            opacity: act >= 2 ? 1 : 0,
            animation:
              act < 2
                ? 'none'
                : act < 4
                  ? 'dropIn 1.0s ease-out forwards, gentleFloat 3s ease-in-out 1s infinite'
                  : 'gentleFloat 3s ease-in-out infinite, potGlow 2.6s ease-in-out infinite',
            filter:
              act < 4
                ? 'drop-shadow(0 8px 16px rgba(0,0,0,0.45))'
                : undefined,
            transition: 'opacity 0.7s ease',
          }}
        />
        {/* Coins falling into pot — Act 4 */}
        {coins.map((c) => (
          <span
            key={c.id}
            aria-hidden
            className="absolute z-[3]"
            style={{
              top: -22,
              left: `${c.left}%`,
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 35% 35%, #f5d442, #D4A017, #a07800)',
              border: '1.5px solid #c49a00',
              animation: `coinDrop 0.85s ease-in ${c.delay}s forwards`,
              opacity: 0,
              boxShadow: '0 0 8px rgba(212,160,23,0.7)',
            }}
          />
        ))}
      </div>

      {/* === GULLAK letterform — scales from 0.2 to 1 with bezier-bounce === */}
      <div
        className="relative mt-3"
        style={{
          transform: act >= 2 ? 'scale(1)' : 'scale(0.2)',
          opacity: act >= 2 ? 1 : 0,
          transition: 'transform 1.3s var(--ease-bounce), opacity 0.8s ease',
        }}
      >
        <h1
          className="font-tiro relative inline-block m-0"
          style={{
            fontSize: 42,
            fontWeight: 800,
            color: '#E8650A',
            letterSpacing: 7,
            textShadow: '0 2px 18px rgba(232, 101, 10, 0.5), 0 0 32px rgba(212,160,23,0.25)',
          }}
        >
          <span ref={gRef} id="splash-G" className="relative inline-block">
            G
          </span>
          ULLAK
        </h1>
      </div>

      {/* === Sparrow flies in along an arc and lands on the G === */}
      {gPos && (
        <Image
          src="/assets/chiraiya-v2.png"
          alt=""
          width={56}
          height={48}
          priority
          className="absolute pointer-events-none z-[4]"
          style={{
            width: act >= 3 ? 44 : 92,
            height: act >= 3 ? 38 : 80,
            objectFit: 'contain',
            // Land position: just above the G, anchored to its measured bounding rect.
            left: act < 3 ? -100 : gPos.left - 6,
            top: act < 3 ? '14vh' : gPos.top - 30,
            transform:
              act < 3
                ? 'scaleX(-1) rotate(-12deg)'
                : 'scaleX(-1) rotate(0deg)',
            transition:
              'left 1.8s cubic-bezier(0.32, 1.42, 0.5, 1), top 1.8s cubic-bezier(0.34, 1.56, 0.64, 1), transform 1.6s ease, width 1.2s ease, height 1.2s ease',
            opacity: act < 2 ? 0 : 1,
            filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.55))',
          }}
        />
      )}

      {/* === ACT 3 — Tagline (typewriter) === */}
      <div
        className="font-tiro mt-6 text-center px-8"
        style={{
          fontSize: 'clamp(15px, 4vw, 18px)',
          color: '#F5C842',
          letterSpacing: 0.4,
          minHeight: 26,
          opacity: act >= 3 ? 1 : 0,
          transition: 'opacity 0.5s ease',
        }}
        aria-label={labels.tagline}
      >
        {labels.tagline.slice(0, typedChars)}
        <span
          aria-hidden
          style={{
            display: 'inline-block',
            width: 2,
            height: 18,
            marginLeft: 3,
            background: '#F5C842',
            verticalAlign: -3,
            animation: 'caretBlink 0.9s steps(2) infinite',
            opacity: typedChars < labels.tagline.length ? 1 : 0,
          }}
        />
      </div>

      {/* === Bottom progress bar (subtle) — fills as we approach auto-advance === */}
      <div
        className="absolute left-1/2 -translate-x-1/2 overflow-hidden rounded-full"
        style={{
          bottom: 'calc(36px + env(safe-area-inset-bottom))',
          width: 120,
          height: 3,
          background: 'rgba(255,255,255,0.08)',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #E8650A, #D4A017)',
            transformOrigin: 'left',
            transform: `scaleX(${act === 0 ? 0 : Math.min((act + 1) / 5, 1)})`,
            transition: 'transform 1.5s ease',
          }}
        />
      </div>
      <div
        className="absolute left-0 right-0 text-center text-[10.5px] tracking-[0.18em]"
        style={{
          bottom: 'calc(20px + env(safe-area-inset-bottom))',
          color: 'rgba(255, 248, 240, 0.45)',
          textTransform: 'uppercase',
        }}
      >
        Loading your Gullak…
      </div>
    </main>
  );
}
