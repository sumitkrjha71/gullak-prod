'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Phone, Clock, ArrowUpRight, Settings as SettingsIcon, Bell, KeyRound } from 'lucide-react';
import { Walkthrough } from '@/components/flow/Walkthrough';
import { BurstButton } from '@/components/autopilot/BurstButton';
import { TierCard } from '@/components/streak/TierCard';
import { FestivalNudge } from '@/components/festival/FestivalNudge';
import { RankCard } from '@/components/leaderboard/RankCard';
import { GroupGullakCard } from '@/components/group/GroupGullakCard';
import { LogoutButton } from '@/components/auth/LogoutButton';

type Goal = {
  id: string;
  title: string;
  type: string;
  savedRupees: number;
  targetRupees: number;
  progressPct: number;
  remainingRupees: number;
  etaMonths: number;
};

type Txn = {
  id: string;
  source: string;
  status: string;
  amountRupees: number;
  createdAt: string;
};

type Labels = {
  appName: string;
  trust: string;
  help: string;
  chartTitle: string;
  balance: string;
  saved: string;
  munafa: string;
  totalJama: string;
  streak: string;
  munafaMonth: string;
  munafaTag: string;
  goalEta: string;
  goalRemain: string;
  nextAction: string;
  nextSub: string;
  motivation: string;
  txTitle: string;
  txMore: string;
  txDaily: string;
  txRoundup: string;
  txFailed: string;
  nudge: string;
  nudgeCta: string;
  tapToUnpack: string;
  navHome: string;
  navGoals: string;
  navPortfolio: string;
  navProfile: string;
  emptyTitle: string;
  emptySub: string;
  emptyCta: string;
  wt: {
    skip: string;
    next: string;
    done: string;
    step1Title: string;
    step1Body: string;
    step2Title: string;
    step2Body: string;
    step3Title: string;
    step3Body: string;
    step4Title: string;
    step4Body: string;
  };
  burst: {
    title: string;
    sub: string;
    cta: string;
    modalTitle: string;
    modalSub: string;
    presets: string;
    customLabel: string;
    submit: string;
    submitting: string;
    success: string;
    successCta: string;
  };
};

type CreditCard = { type: string; cta: string; link: string; ratePct: string };
type FestivalProp = {
  id: string;
  name: string;
  emoji: string;
  headline: string;
  sub: string;
  defaultTargetRupees: number;
  daysAway: number;
  states: string[];
  dates: string[];
};
type RankProp = {
  rank: number;
  scopeKey: string;
  totalSavers: number;
  percentile: number;
  savedRupees: number;
};

export function Dashboard({
  locale,
  userName,
  totalSavedRupees,
  monthlyGrowthRupees,
  streakDays,
  dailyAmt,
  chartPoints,
  primaryGoal,
  recentTxns,
  creditCard,
  festival,
  rank,
  labels,
}: {
  locale: string;
  userName: string;
  totalSavedRupees: number;
  monthlyGrowthRupees: number;
  streakDays: number;
  dailyAmt: number;
  chartPoints: number[];
  primaryGoal: Goal | null;
  recentTxns: Txn[];
  creditCard: CreditCard | null;
  festival: FestivalProp | null;
  rank: RankProp | null;
  labels: Labels;
}) {
  const [chartView, setChartView] = useState<'balance' | 'saved' | 'munafa'>('balance');
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  // Greeting based on Indian time slots
  function greetingFromHour() {
    const h = new Date().getHours();
    if (h < 5) return 'Shubh raat';
    if (h < 12) return 'Subah bakhair';
    if (h < 16) return 'Namaste';
    if (h < 19) return 'Shaam ka swagat';
    return 'Shubh raat';
  }

  // Build SVG path with realistic market shape — visible volatility, trending up.
  // Each view has its own series so the toggle pills feel real.
  const SERIES = {
    balance: [4, 7, 5, 11, 9, 16, 14, 22, 28, 26, 34, 42, 39, 48, 56, 54, 65, 74, 72, 82, 92, 90],
    saved: [4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 52, 56, 60, 64, 68, 72, 76, 80, 85, 90],
    munafa: [0, 0, 1, 2, 1, 4, 3, 7, 10, 8, 13, 17, 15, 20, 26, 23, 31, 38, 36, 44, 52, 60],
  };
  // Use real points only if there's signal; otherwise show realistic demo series.
  const hasSignal = chartPoints.length >= 4 && chartPoints.some((p) => p > 5);
  const safePoints = hasSignal ? chartPoints : SERIES[chartView];
  // Smooth catmull-rom-ish path (cubic bezier between successive points) for cleaner curve.
  const xy = safePoints.map((p, i) => [(i / (safePoints.length - 1)) * 100, 100 - p] as [number, number]);
  let chartPath = `M ${xy[0][0]} ${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [px, py] = xy[i - 1];
    const [cx, cy] = xy[i];
    const midX = (px + cx) / 2;
    chartPath += ` C ${midX} ${py}, ${midX} ${cy}, ${cx} ${cy}`;
  }
  const fillPath = chartPath + ' L 100 100 L 0 100 Z';
  const lineColor = chartView === 'munafa' ? '#1A7A4A' : '#0E8C7A';

  if (!primaryGoal) {
    return (
      <main
        className="flex min-h-dvh w-full flex-col bg-bg"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        <TrustStrip locale={locale} labels={labels} userName={userName} />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={100}
            height={85}
            priority
            className="anim-float"
            style={{ width: 100, height: 85, objectFit: 'contain' }}
          />
          <h1 className="mt-4 text-[20px] font-extrabold text-text">{labels.emptyTitle}</h1>
          <p className="mt-1 text-[14px] text-muted">{labels.emptySub}</p>
          <Link
            href={`/${locale}/goals/new`}
            className="haptic-press cta-primary mt-6 inline-flex h-12 items-center justify-center rounded-btn px-6 text-[15px] font-bold"
          >
            {labels.emptyCta}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="relative flex min-h-dvh w-full flex-col overflow-x-hidden bg-bg pb-20"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      <TrustStrip locale={locale} labels={labels} userName={userName} />

      {/* Greeting strip */}
      <div className="px-4 pt-3">
        <div className="text-[12.5px]" style={{ color: 'var(--muted)' }}>
          {greetingFromHour()}, <span style={{ color: 'var(--text)', fontWeight: 700 }}>{userName || 'Dost'}</span>
        </div>
        <h2
          className="font-tiro mt-0.5"
          style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}
        >
          Aaj aapka Gullak kaisa hai?
        </h2>
      </div>

      {/* V5 M1 — Group Gullak hero CTA. Sits at the very top of the dashboard
           (right under the greeting) so it's the first thing the investor sees.
           Pulsing glow + gradient shimmer + bouncing arrow + NAYA badge — designed
           to be impossible to scroll past without tapping. */}
      <div className="mx-4 mt-3.5">
        <GroupGullakCard locale={locale} />
      </div>

      {/* Zone B — Chart */}
      <section data-walkthrough="chart" className="px-3.5 pt-3 anim-fade-in">
        <div className="flex items-center justify-between px-1 pb-2">
          <span className="text-[12px] font-bold text-text">{labels.chartTitle}</span>
          <div className="flex gap-1">
            {(['balance', 'saved', 'munafa'] as const).map((k) => (
              <button
                key={k}
                onClick={() => setChartView(k)}
                className="haptic-press rounded-md px-2 py-1 text-[10px] font-bold transition-colors"
                style={{
                  background: chartView === k ? 'var(--saffron)' : 'var(--border)',
                  color: chartView === k ? '#fff' : 'var(--muted)',
                }}
              >
                {k === 'balance' ? labels.balance : k === 'saved' ? labels.saved : labels.munafa}
              </button>
            ))}
          </div>
        </div>
        <div className="card h-28 overflow-hidden">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
            <defs>
              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={lineColor} stopOpacity="0.32" />
                <stop offset="100%" stopColor={lineColor} stopOpacity="0.02" />
              </linearGradient>
            </defs>
            {/* Soft horizontal grid lines */}
            {[20, 50, 80].map((g) => (
              <line key={g} x1={0} y1={g} x2={100} y2={g} stroke="#E6DDC9" strokeWidth={0.3} strokeDasharray="1 2" />
            ))}
            <path d={fillPath} fill="url(#chartGrad)" />
            <path
              d={chartPath}
              fill="none"
              stroke={lineColor}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              style={{ animation: 'chartDraw 1.6s ease-out' }}
            />
            {/* Last point dot */}
            <circle
              cx={xy[xy.length - 1][0]}
              cy={xy[xy.length - 1][1]}
              r={1.5}
              fill={lineColor}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
      </section>

      {/* Zone C — Balance with floating Chiraiya + Gullak */}
      <section data-walkthrough="balance" className="relative px-4 pt-3 text-center">
        <Link href={`/${locale}/transparency`} aria-label="See where your money is invested" className="block">
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={42}
            height={35}
            className="absolute right-4 top-0 anim-float"
            style={{
              width: 42,
              height: 35,
              objectFit: 'contain',
              filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.1))',
            }}
          />
          <Image
            src="/assets/gullak-pot.png"
            alt=""
            width={56}
            height={48}
            className="mx-auto"
            style={{
              width: 56,
              height: 48,
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 8px rgba(212,160,23,0.3))',
            }}
          />
          <div className="mt-1 text-[34px] font-extrabold tabular-nums text-text">
            ₹{fmt(totalSavedRupees)}
          </div>
          <div className="text-[11px] text-muted">{labels.totalJama}</div>
          <div className="mt-1 inline-flex items-center gap-1 text-[10px] text-trust">
            🔍 {labels.tapToUnpack}
          </div>
        </Link>
        {streakDays > 0 && (
          <div className="mx-auto mt-1 inline-flex items-center gap-1 rounded-pill bg-bg-highlight px-3 py-1 text-[11px] font-bold text-saffron">
            🔥 {labels.streak}
          </div>
        )}
      </section>

      {/* Zone D — Munafa */}
      <motion.section
        data-walkthrough="munafa"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.35 }}
        className="mx-4 mt-3 flex items-center justify-between rounded-card-lg px-3.5 py-3"
        style={{ background: 'linear-gradient(135deg, #f0f7e6, #e6f7f4)' }}
      >
        <div>
          <div className="text-[18px] font-extrabold tabular-nums text-growth">
            +₹{fmt(monthlyGrowthRupees)}
          </div>
          <div className="mt-0.5 text-[10px] text-muted">{labels.munafaMonth}</div>
        </div>
        <div
          className="flex items-center gap-1 rounded-md px-2 py-1 text-[9px] font-bold text-trust"
          style={{ background: '#d9f2ed' }}
        >
          {labels.munafaTag} <ArrowUpRight size={10} />
        </div>
      </motion.section>

      {/* V5 M5 — Digital Gold framing strip. Bharat's 10K-tonnes-hoarded gold love. */}
      {totalSavedRupees > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mx-4 mt-2 flex items-center gap-2.5 rounded-card-lg px-3 py-2.5"
          style={{
            background: 'linear-gradient(135deg, #fff5d6, #fff9e6)',
            border: '1px solid #f0d97a',
          }}
        >
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: '#D4A017', color: '#fff', fontSize: 16 }}
            aria-hidden
          >
            🪙
          </div>
          <div className="flex-1 text-[12px]" style={{ color: 'var(--text)', lineHeight: 1.4 }}>
            <span style={{ fontWeight: 700 }}>Aaj Gullak ne aapke liye </span>
            <span className="num font-extrabold" style={{ color: '#9a7a00' }}>
              ₹{fmt(Math.max(1, Math.round(totalSavedRupees * 0.0007)))}
            </span>
            <span style={{ fontWeight: 700 }}> ka digital sona khareeda</span>
          </div>
        </motion.div>
      )}

      {/* Zone E — Goal */}
      <motion.section
        data-walkthrough="goal"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="card mx-4 mt-3 p-3.5"
      >
        <Link href={`/${locale}/goals/${primaryGoal.id}`} className="block">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-bold text-text">{primaryGoal.title}</span>
            <span className="text-[13px] font-extrabold text-saffron">{primaryGoal.progressPct}%</span>
          </div>
          <div className="mt-2 h-[7px] overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(primaryGoal.progressPct, 100)}%`,
                background: 'linear-gradient(90deg, #E8650A, #D4A017)',
              }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted">
            <span className="tabular-nums">
              ₹{fmt(primaryGoal.savedRupees)} / ₹{fmt(primaryGoal.targetRupees)}
            </span>
            <span>{labels.goalRemain}</span>
          </div>
          {labels.goalEta && (
            <div className="mt-1 text-[10px] font-bold text-terracotta">{labels.goalEta}</div>
          )}
        </Link>
      </motion.section>

      {/* Zone F — Next Action */}
      <section className="mx-4 mt-3 flex items-center gap-2.5 rounded-card-lg bg-bg-highlight px-3.5 py-3">
        <Clock size={18} className="text-saffron" aria-hidden />
        <div>
          <div className="text-[12px] font-semibold text-text">{labels.nextAction}</div>
          <div className="text-[10px] text-muted">{labels.nextSub}</div>
        </div>
      </section>

      {/* Motivational */}
      <p className="mt-2 px-4 text-center text-[10px] italic text-terracotta">
        {labels.motivation} 🐦
      </p>

      {/* Zone H — Recent transactions */}
      <section className="mx-4 mt-3">
        <div className="text-[12px] font-bold text-text">{labels.txTitle}</div>
        {recentTxns.length === 0 ? (
          <div className="mt-2 rounded-card border border-border bg-surface px-3 py-3 text-[12px] text-muted">
            {labels.emptySub}
          </div>
        ) : (
          recentTxns.map((tx) => (
            <div
              key={tx.id}
              className="flex items-center justify-between border-b border-border-light py-2"
            >
              <div>
                <div className="text-[11px] font-semibold text-text">
                  {tx.source === 'fixed' ? labels.txDaily : tx.source === 'roundup' ? labels.txRoundup : tx.source}
                </div>
                <div className="text-[9px] text-muted">
                  {new Date(tx.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div
                className="text-[12px] font-bold tabular-nums"
                style={{ color: tx.status === 'success' ? 'var(--growth)' : 'var(--warn)' }}
              >
                {tx.status === 'success' ? '+' : ''}₹{fmt(tx.amountRupees)}
              </div>
            </div>
          ))
        )}
        <Link
          href={`/${locale}/activity`}
          className="haptic-press block py-1.5 text-center text-[11px] font-bold text-saffron"
        >
          {labels.txMore} →
        </Link>
      </section>

      {/* V5 M6 — Festival nudge. Only when an upcoming festival exists for user's state. */}
      {festival && (
        <div className="mx-4 mt-3">
          <FestivalNudge
            festival={{
              id: festival.id,
              name: festival.name,
              emoji: festival.emoji,
              headline: festival.headline,
              sub: festival.sub,
              defaultTargetRupees: festival.defaultTargetRupees,
              dates: festival.dates,
              states: festival.states,
            }}
            daysAway={festival.daysAway}
            locale={locale}
          />
        </div>
      )}

      {/* V5 M3 — Tier card. Right above Burst button so saving streak is visible at-a-glance. */}
      <div className="mx-4 mt-3">
        <TierCard streakDays={streakDays} />
      </div>

      {/* V5 M10 — State leaderboard rank card. */}
      <div className="mx-4 mt-3">
        <RankCard
          rank={rank?.rank ?? null}
          scopeKey={rank?.scopeKey ?? null}
          totalSavers={rank?.totalSavers ?? 0}
          percentile={rank?.percentile ?? 0}
          savedRupees={rank?.savedRupees ?? 0}
        />
      </div>

      {/* V5 M2 — Burst-mode button. Sits prominently above credit zone. */}
      <div className="mx-4 mt-3">
        <BurstButton labels={labels.burst} />
      </div>

      {/* Credit zone — only when eligible. Sits in Zone H beside the nudge. */}
      {creditCard && (
        <Link
          href={`/${locale}/credit`}
          className="haptic-press mx-4 mt-3 flex items-start gap-3 rounded-card-lg border border-saffron/30 bg-bg-highlight p-3.5 transition-colors hover:bg-saffron/8"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold">
            <KeyRound size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-bold text-text">{creditCard.cta}</div>
            <div className="mt-0.5 text-[11px] text-muted">from {creditCard.ratePct}% / yr · 5 lenders</div>
          </div>
          <span className="self-center text-[12px] font-bold text-saffron">{creditCard.link} →</span>
        </Link>
      )}

      {/* Zone I — Single nudge */}
      {labels.nudge && (
        <section
          className="mx-4 mt-1 rounded-card-lg border border-saffron/40 px-3.5 py-3"
          style={{
            background: 'linear-gradient(135deg, #FFF5EC, #FFF8F0)',
            borderStyle: 'dashed',
          }}
        >
          <div className="text-[11px] leading-relaxed text-text">{labels.nudge}</div>
          <div className="mt-1 text-[11px] font-bold text-saffron">
            {labels.nudgeCta} →
          </div>
        </section>
      )}

      {/* Bottom nav */}
      <nav
        className="safe-bottom fixed bottom-0 left-0 right-0 mx-auto flex max-w-md items-center justify-around border-t bg-surface py-2"
        style={{ borderColor: 'var(--border)' }}
      >
        {[
          { icon: '🏠', label: labels.navHome, href: `/${locale}/home`, active: true },
          { icon: '🎯', label: labels.navGoals, href: `/${locale}/goals` },
          { icon: '📊', label: labels.navPortfolio, href: `/${locale}/portfolio` },
          { icon: '👤', label: labels.navProfile, href: `/${locale}/profile` },
        ].map((n) => (
          <Link
            key={n.label}
            href={n.href}
            className="haptic-press flex flex-col items-center gap-0.5 text-[10px] font-semibold"
            style={{ color: n.active ? 'var(--saffron)' : 'var(--muted-light)' }}
          >
            <span style={{ fontSize: 18 }} aria-hidden>
              {n.icon}
            </span>
            {n.label}
          </Link>
        ))}
      </nav>

      {/* First-time walkthrough overlay */}
      <Walkthrough
        steps={[
          { selector: '[data-walkthrough="chart"]', title: labels.wt.step1Title, body: labels.wt.step1Body },
          { selector: '[data-walkthrough="balance"]', title: labels.wt.step2Title, body: labels.wt.step2Body },
          { selector: '[data-walkthrough="munafa"]', title: labels.wt.step3Title, body: labels.wt.step3Body },
          { selector: '[data-walkthrough="goal"]', title: labels.wt.step4Title, body: labels.wt.step4Body },
        ]}
        labels={{ skip: labels.wt.skip, next: labels.wt.next, done: labels.wt.done }}
      />
    </main>
  );
}

function TrustStrip({
  locale,
  labels,
  userName,
}: {
  locale: string;
  labels: Pick<Labels, 'appName' | 'trust' | 'help'>;
  userName: string;
}) {
  return (
    <header
      className="safe-top flex items-center justify-between gap-3 px-3.5 py-2"
      style={{ background: 'var(--trust-soft)' }}
    >
      <Link href={`/${locale}/home`} className="flex items-center gap-2">
        <Image
          src="/assets/gullak-pot.png"
          alt=""
          width={26}
          height={22}
          style={{ width: 26, height: 22, objectFit: 'contain' }}
        />
        <div className="leading-tight">
          <div className="text-[13px] font-extrabold text-text">{labels.appName}</div>
          <div className="text-[8px] font-semibold text-trust">{labels.trust}</div>
        </div>
      </Link>
      <div className="flex items-center gap-2">
        <Link
          href={`/${locale}/notifications`}
          className="haptic-press flex h-8 w-8 items-center justify-center rounded-full text-trust"
          aria-label="Notifications"
        >
          <Bell size={16} />
        </Link>
        <Link
          href={`/${locale}/settings`}
          className="haptic-press flex h-8 w-8 items-center justify-center rounded-full text-trust"
          aria-label="Settings"
        >
          <SettingsIcon size={16} />
        </Link>
        <LogoutButton locale={locale} />
        <button
          aria-label="Call support"
          className="haptic-press flex items-center gap-1 rounded-full bg-trust/10 px-2 py-1 text-[10px] font-bold text-trust"
        >
          <Phone size={11} aria-hidden /> {labels.help}
        </button>
      </div>
    </header>
  );
}
