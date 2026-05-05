'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ShieldCheck, TrendingUp } from 'lucide-react';

type Coin = { id: number; left: number; delay: number };

// Rotating educational tips shown during the loading window. Each one is a
// short Hinglish trust-or-feature line — read aloud, sounds like a friend
// telling you what's cool about Gullak. Cycles every ~2 seconds so a viewer
// who hangs on the splash is steadily learning.
const LOADING_TIPS: { icon: string; text: string }[] = [
  { icon: '🔒', text: 'Aapka paisa, aapke naam par — RBI partners' },
  { icon: '🪙', text: 'Roz ₹20 se shuruat — koi pressure nahi' },
  { icon: '🏠', text: 'Family Gullak — saath bachat, saath manzil' },
  { icon: '🪔', text: 'Festival aane se pehle ready — hyper-local nudges' },
  { icon: '📈', text: '7-9% Munafa — tinka-tinka compound hota hai' },
  { icon: '🤝', text: '5 lakh+ Bharat ke users ne bharosa kiya hai' },
];

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
  isLoggedIn,
}: {
  locale: string;
  isLoggedIn: boolean;
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
  // Loading-window state. While `loadingComplete` is false, we show the
  // rotating educational tip card + animated trust shield. Once true, those
  // disappear and a 'Chaliye shuru karein' CTA appears that the user must
  // tap to proceed. NO automatic timeout-based navigation.
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [tipIndex, setTipIndex] = useState(0);
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
    // Loading completes at ~8s, revealing the proceed CTA. The user must
    // tap to navigate forward — no auto-redirect.
    const tDone = setTimeout(() => setLoadingComplete(true), 8000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(tDone);
    };
  }, []);

  // Rotate the educational tip every 1.6s while loading is in progress.
  useEffect(() => {
    if (loadingComplete) return;
    const iv = setInterval(() => {
      setTipIndex((i) => (i + 1) % LOADING_TIPS.length);
    }, 1600);
    return () => clearInterval(iv);
  }, [loadingComplete]);

  const proceed = () => {
    if (isLoggedIn) router.push(`/${locale}/home`);
    else router.push(`/${locale}/language-select`);
  };

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
      {/* Skip — small, top-right. Routes by auth state same as auto-advance. */}
      <Link
        href={isLoggedIn ? `/${locale}/home` : `/${locale}/language-select`}
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

      {/* === Investor CTA — sits just below the tagline. Alluring pill so any
           investor scrolling through the demo can't miss the pitch deck. === */}
      <Link
        href={`/${locale}/pitch`}
        className="haptic-press z-20 mt-4 inline-flex items-center gap-2 rounded-pill px-4 py-2 text-[12.5px] font-extrabold transition-all"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.95), rgba(232,101,10,0.95))',
          color: '#2A1500',
          border: '1.5px solid rgba(245,200,66,0.6)',
          boxShadow: '0 8px 22px rgba(232,101,10,0.35), 0 0 0 4px rgba(245,200,66,0.10)',
          opacity: act >= 3 ? 1 : 0,
          transform: act >= 3 ? 'translateY(0)' : 'translateY(8px)',
          transition: 'opacity 0.6s ease 0.2s, transform 0.6s ease 0.2s',
          letterSpacing: 0.3,
        }}
      >
        <TrendingUp size={14} aria-hidden />
        For Investors · Pitch Dekhein
        <ArrowRight size={14} aria-hidden />
      </Link>

      {/* === Bottom area — flips between (a) trust + rotating tip while loading
           and (b) a 'Chaliye shuru karein' CTA after loading completes. NO
           auto-advance: the user must tap. === */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-full max-w-[420px] px-6"
        style={{ bottom: 'calc(28px + env(safe-area-inset-bottom))' }}
      >
        {!loadingComplete && (
          <div
            className="anim-fade-in flex flex-col items-center gap-3"
            key={tipIndex}
            style={{ animation: 'fadeIn 0.5s ease' }}
          >
            {/* Animated trust shield (replaces the old progress bar) */}
            <div
              className="flex items-center gap-2 rounded-pill px-3 py-1.5"
              style={{
                background: 'rgba(245,200,66,0.10)',
                border: '1px solid rgba(245,200,66,0.30)',
                boxShadow: '0 0 18px rgba(245,200,66,0.18)',
              }}
            >
              <span
                className="flex h-5 w-5 items-center justify-center rounded-full"
                style={{
                  background: 'linear-gradient(135deg, #1A7A4A, #0E8C7A)',
                  animation: 'pulseScale 1.6s ease-in-out infinite',
                }}
                aria-hidden
              >
                <ShieldCheck size={11} color="#FFF8F0" />
              </span>
              <span
                className="text-[11px] font-bold tracking-wide"
                style={{ color: '#FFE7B0' }}
              >
                Aapka paisa, aapke naam par taiyaar ho raha hai…
              </span>
            </div>

            {/* Rotating educational tip — uses the loading window to teach */}
            <div
              className="flex items-center gap-2.5 rounded-pill px-4 py-2"
              style={{
                background: 'rgba(255, 248, 240, 0.06)',
                border: '1px solid rgba(255, 248, 240, 0.12)',
                backdropFilter: 'blur(6px)',
                minHeight: 36,
              }}
            >
              <span style={{ fontSize: 16 }} aria-hidden>
                {LOADING_TIPS[tipIndex].icon}
              </span>
              <span
                className="text-[12px] font-semibold"
                style={{ color: '#FFF8F0', letterSpacing: 0.2 }}
              >
                {LOADING_TIPS[tipIndex].text}
              </span>
            </div>

            {/* Tip-progress dots — visual rhythm without a literal loading bar */}
            <div className="flex items-center gap-1.5">
              {LOADING_TIPS.map((_, i) => (
                <span
                  key={i}
                  className="rounded-full transition-all"
                  style={{
                    width: i === tipIndex ? 18 : 5,
                    height: 5,
                    background:
                      i === tipIndex
                        ? 'linear-gradient(90deg, #E8650A, #D4A017)'
                        : 'rgba(255,255,255,0.25)',
                  }}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        )}

        {loadingComplete && (
          <button
            type="button"
            onClick={proceed}
            className="haptic-press anim-fade-in inline-flex w-full items-center justify-center gap-2 rounded-pill py-3.5 text-[15px] font-extrabold"
            style={{
              background: 'linear-gradient(135deg, #E8650A 0%, #D4A017 100%)',
              color: '#FFF8F0',
              boxShadow:
                '0 10px 28px rgba(232,101,10,0.45), 0 0 0 4px rgba(245,200,66,0.18)',
              letterSpacing: 0.4,
              animation: 'fadeIn 0.6s ease, pulseScale 2.4s ease-in-out infinite',
            }}
          >
            Chaliye shuru karein
            <ArrowRight size={18} aria-hidden />
          </button>
        )}
      </div>
    </main>
  );
}
