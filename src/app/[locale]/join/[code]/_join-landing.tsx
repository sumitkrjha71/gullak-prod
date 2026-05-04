'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Lock, Users, BadgeCheck } from 'lucide-react';

type Labels = {
  headline: string;
  sub: string;
  backHome: string;
  loginCta: string;
  alreadyMemberHeadline: string;
  alreadyMemberSub: string;
  openGoal: string;
  inviteHeadline: string;
  inviteSub: string;
  inviterLabel: string;
  goalLabel: string;
  targetLabel: string;
  progressLabel: string;
  joinCta: string;
  joining: string;
  loginNeededTitle: string;
  loginNeededSub: string;
  trustLine: string;
};

export function JoinLanding({
  locale,
  code,
  notFound,
  goalId,
  goalTitle,
  goalTargetPaise,
  goalSavedPaise,
  inviterName,
  loggedIn,
  labels,
}: {
  locale: string;
  code: string;
  notFound?: boolean;
  goalId?: string;
  goalTitle?: string;
  goalType?: string;
  goalTargetPaise?: number;
  goalSavedPaise?: number;
  inviterName?: string | null;
  loggedIn?: boolean;
  labels: Labels;
}) {
  const router = useRouter();
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = (paise: number) =>
    '₹' + new Intl.NumberFormat('en-IN').format(Math.round(paise / 100));

  const join = async () => {
    setJoining(true);
    setError(null);
    try {
      const r = await fetch('/api/goals/join', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setError(j.hint || 'Kuch dikkat aa gayi. Phir try karein.');
        setJoining(false);
        return;
      }
      router.push(`/${locale}/goals/${j.goalId}/family`);
    } catch {
      setError('Kuch dikkat aa gayi. Phir try karein.');
      setJoining(false);
    }
  };

  if (notFound) {
    return (
      <main
        className="anim-screen-enter flex min-h-dvh w-full flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
      >
        <Image
          src="/assets/chiraiya-v2.png"
          alt=""
          width={88}
          height={72}
          priority
          style={{
            width: 88,
            height: 72,
            objectFit: 'contain',
            transform: 'rotate(8deg) scaleX(-1)',
            filter: 'drop-shadow(0 6px 14px rgba(196, 96, 42, 0.18))',
          }}
        />
        <h1 className="mt-3" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
          {labels.headline}
        </h1>
        <p className="mt-2 max-w-[360px] text-[14px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
          {labels.sub}
        </p>
        <Link
          href={`/${locale}`}
          className="cta-primary haptic-press mt-6 inline-flex h-12 items-center justify-center gap-1.5 rounded-btn px-6 text-[15px] font-bold"
        >
          {labels.backHome} <ArrowRight size={14} />
        </Link>
      </main>
    );
  }

  const targetRupees = (goalTargetPaise ?? 0) / 100;
  const savedRupees = (goalSavedPaise ?? 0) / 100;
  const progressPct =
    targetRupees > 0 ? Math.min(100, Math.round((savedRupees / targetRupees) * 100)) : 0;

  return (
    <main
      className="anim-screen-enter flex min-h-dvh w-full flex-col"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-6 pt-8">
        {/* Hero */}
        <div className="text-center">
          <div className="relative mx-auto inline-block">
            <Image
              src="/assets/gullak-pot.png"
              alt=""
              width={130}
              height={110}
              priority
              style={{
                width: 130,
                height: 110,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 22px rgba(212,160,23,0.5))',
                animation: 'potGlow 2.6s ease-in-out infinite, gentleFloat 3s ease-in-out infinite',
              }}
            />
            <Image
              src="/assets/chiraiya-v2.png"
              alt=""
              width={48}
              height={40}
              className="absolute"
              style={{
                top: -8,
                right: -22,
                width: 48,
                height: 40,
                objectFit: 'contain',
                animation: 'celebFly 2.2s ease-in-out infinite',
                transform: 'scaleX(-1)',
              }}
            />
          </div>
          <div
            className="mt-3 inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[11px] font-bold uppercase"
            style={{ background: 'var(--bg-highlight)', color: 'var(--saffron)', letterSpacing: 0.4 }}
          >
            <Users size={11} aria-hidden /> Family Gullak
          </div>
          <h1
            className="mt-2 text-balance"
            style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}
          >
            {labels.inviteHeadline}
          </h1>
          <p className="mt-2 mx-auto max-w-[340px] text-[14.5px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            {labels.inviteSub}
          </p>
        </div>

        {/* Goal info card */}
        <div
          className="mt-5 px-4 py-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <Row
            label={labels.inviterLabel}
            value={inviterName?.split(/\s+/)[0] ?? '—'}
          />
          <Row label={labels.goalLabel} value={goalTitle ?? '—'} bold />
          <Row label={labels.targetLabel} value={fmt(goalTargetPaise ?? 0)} bold />
          {savedRupees > 0 && (
            <>
              <div className="mt-3">
                <div className="flex items-center justify-between text-[12px]">
                  <span style={{ color: 'var(--muted)' }}>{labels.progressLabel}</span>
                  <span className="num font-bold" style={{ color: 'var(--saffron)' }}>
                    {progressPct}%
                  </span>
                </div>
                <div
                  className="mt-1 h-2 w-full overflow-hidden rounded-full"
                  style={{ background: 'rgba(196, 96, 42, 0.12)' }}
                >
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${progressPct}%`,
                      background: 'linear-gradient(90deg, #E8650A, #D4A017)',
                    }}
                  />
                </div>
                <div className="mt-1 num text-[11.5px]" style={{ color: 'var(--muted)' }}>
                  {fmt(goalSavedPaise ?? 0)}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Login-needed prompt */}
        {!loggedIn && (
          <div
            className="mt-5 flex items-start gap-2.5 px-4 py-3"
            style={{
              background: 'var(--trust-soft)',
              border: '1px solid #b8e6dc',
              borderRadius: 'var(--radius-card-lg)',
            }}
          >
            <Lock size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--trust)' }} aria-hidden />
            <div>
              <div className="text-[13px] font-bold" style={{ color: 'var(--trust)' }}>
                {labels.loginNeededTitle}
              </div>
              <div className="mt-0.5 text-[12px]" style={{ color: 'var(--text)' }}>
                {labels.loginNeededSub}
              </div>
            </div>
          </div>
        )}

        {error && (
          <div
            className="mt-4 rounded-card-lg px-3 py-2 text-[13px]"
            style={{ background: 'rgba(192, 57, 43, 0.05)', border: '1px solid rgba(192, 57, 43, 0.25)', color: 'var(--warn)' }}
          >
            ⚠ {error}
          </div>
        )}

        {/* CTA */}
        {loggedIn ? (
          <button
            onClick={join}
            disabled={joining || !goalId}
            className="cta-primary haptic-press mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-60"
          >
            {joining ? labels.joining : labels.joinCta}
            <ArrowRight size={16} />
          </button>
        ) : (
          <Link
            href={`/${locale}/onboarding/phone?next=/${locale}/join/${code}`}
            className="cta-primary haptic-press mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold"
          >
            {labels.loginCta}
            <ArrowRight size={16} />
          </Link>
        )}

        <p
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-center text-[11.5px]"
          style={{ color: 'var(--trust)' }}
        >
          <BadgeCheck size={11} aria-hidden /> {labels.trustLine}
        </p>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0" style={{ borderColor: 'var(--border-light)' }}>
      <span className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
        {label}
      </span>
      <span
        className={'num text-right ' + (bold ? 'text-[14px] font-extrabold' : 'text-[13px] font-semibold')}
        style={{ color: 'var(--text)' }}
      >
        {value}
      </span>
    </div>
  );
}
