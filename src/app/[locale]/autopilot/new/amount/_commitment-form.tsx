'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ArrowRight, Sparkles, TrendingUp } from 'lucide-react';
import { planTiers, type SavingsPlan } from '@/lib/autopilot/calculator';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

type Tier = 'comfortable' | 'aggressive' | 'relaxed';
type Mode = 'fixed' | 'roundup' | 'sweep' | 'inflow_pct';

export function CommitmentForm({
  locale,
  goalId,
  goalName,
  goalTargetPaise,
  goalDeadlineIso,
  mode,
  suggestedRupees,
  labels,
}: {
  locale: string;
  goalId: string;
  goalName: string;
  goalTargetPaise: number;
  goalDeadlineIso: string | null;
  mode: Mode;
  suggestedRupees: number;
  labels: {
    title: string;
    sub: string;
    subFallback: string;
    perDay: string;
    tierComfortable: string;
    tierComfortableSub: string;
    tierAggressive: string;
    tierAggressiveSub: string;
    tierRelaxed: string;
    tierRelaxedSub: string;
    tierDailyLabel: string;
    tierUntil: string;
    tierMunafa: string;
    creditBridge: string;
    creditBridgeCta: string;
    projTitle: string;
    projSaved: string;
    projMunafa: string;
    projTotal: string;
    projDisclaimer: string;
    cta: string;
    hint: string;
  };
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [tier, setTier] = useState<Tier>('comfortable');

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  // Compute three tiers if we have target+deadline; otherwise fallback to user input flow.
  const tiers = useMemo(() => {
    if (!goalDeadlineIso || !goalTargetPaise || mode !== 'fixed') return null;
    return planTiers({
      targetPaise: goalTargetPaise,
      deadlineDate: goalDeadlineIso,
    });
  }, [goalTargetPaise, goalDeadlineIso, mode]);

  const selectedPlan: SavingsPlan | null = tiers ? tiers[tier] : null;

  const [override, setOverride] = useState<number | null>(null);
  const dailyRupees = override ?? Math.max(1, Math.round((selectedPlan?.dailyPaise ?? suggestedRupees * 100) / 100));

  // For 1-year forward projection card
  const yearly = dailyRupees * 365;
  const munafa = Math.round(yearly * 0.07);
  const total = yearly + munafa;

  const submit = async (overrideInflowPct?: number) => {
    setLoading(true);
    try {
      const r = await fetch('/api/autopilot/rules', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          goalId,
          mode,
          amountPaise: mode === 'roundup' || mode === 'inflow_pct' ? null : dailyRupees * 100,
          frequency: mode === 'fixed' ? 'daily' : null,
          roundUpTo: mode === 'roundup' ? 10 : null,
          inflowPct: mode === 'inflow_pct' ? overrideInflowPct ?? 500 : null,
        }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error('failed');
      router.push(`/${locale}/mandate?rule=${j.id}`);
    } finally {
      setLoading(false);
    }
  };

  const tierKey = (k: Tier) => ({
    label: k === 'comfortable' ? labels.tierComfortable : k === 'aggressive' ? labels.tierAggressive : labels.tierRelaxed,
    sub: k === 'comfortable' ? labels.tierComfortableSub : k === 'aggressive' ? labels.tierAggressiveSub : labels.tierRelaxedSub,
  });

  const formatTierUntil = (plan: SavingsPlan) => {
    const today = new Date();
    const dt = new Date(today);
    dt.setMonth(dt.getMonth() + plan.months);
    return labels.tierUntil
      .replace('{month}', MONTHS_EN[dt.getMonth()])
      .replace('{year}', String(dt.getFullYear()));
  };

  // INFLOW % branch — totally different UI. User picks percentage of incoming money.
  if (mode === 'inflow_pct') {
    return (
      <InflowForm
        locale={locale}
        goalId={goalId}
        goalName={goalName}
        loading={loading}
        onSubmit={submit}
      />
    );
  }

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/autopilot/new?goal=${goalId}`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/40"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold" style={{ color: 'var(--trust)' }}>
          100% Safe · RBI
        </span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-6 pt-3 pb-2">
        <div className="text-center">
          <div
            className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[11.5px] font-bold"
            style={{ background: 'var(--bg-highlight)', color: 'var(--saffron)' }}
          >
            <Sparkles size={12} aria-hidden /> SMART CALCULATION
          </div>
          <h1
            className="mt-2"
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.2 }}
          >
            {labels.title}
          </h1>
          {selectedPlan ? (
            <p className="mt-1.5 text-[14px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
              {labels.sub
                .replace('{daily}', fmt(Math.round(selectedPlan.dailyPaise / 100)))
                .replace('{months}', String(selectedPlan.months))
                .replace('{goal}', goalName)}
            </p>
          ) : (
            <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
              {labels.subFallback}
            </p>
          )}
        </div>

        {/* Big amount display */}
        <div
          className="mt-4 px-4 py-5 text-center"
          style={{
            background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
            border: '2px solid var(--saffron)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: '0 6px 18px rgba(232,101,10,0.18)',
          }}
        >
          <div className="num" style={{ fontSize: 56, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}>
            ₹{fmt(dailyRupees)}
          </div>
          <div className="mt-1 text-[14px] font-bold" style={{ color: 'var(--terracotta)' }}>
            {labels.perDay}
          </div>
          {selectedPlan && (
            <div className="mt-1 text-[11.5px]" style={{ color: 'var(--muted)' }}>
              <span className="num">~₹{fmt(Math.round(selectedPlan.monthlyPaise / 100))}</span>/mahina · {selectedPlan.months} mahine
            </div>
          )}
        </div>

        {/* Three tier tiles */}
        {tiers && (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {(['relaxed', 'comfortable', 'aggressive'] as Tier[]).map((k) => {
              const plan = tiers[k];
              const sel = tier === k;
              const meta = tierKey(k);
              return (
                <button
                  key={k}
                  onClick={() => {
                    setTier(k);
                    setOverride(null);
                  }}
                  className="haptic-press flex flex-col items-center gap-0.5 px-1.5 py-3 text-center transition-all"
                  style={{
                    background: sel
                      ? 'linear-gradient(145deg, #FFE9D2, #FFF5EC)'
                      : 'var(--surface)',
                    border: `2px solid ${sel ? 'var(--saffron)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-card)',
                    boxShadow: sel ? '0 4px 12px rgba(232,101,10,0.15)' : 'var(--shadow-card)',
                    transform: sel ? 'translateY(-2px)' : 'none',
                  }}
                >
                  <span
                    className="text-[11px] font-bold leading-tight"
                    style={{ color: sel ? 'var(--saffron)' : 'var(--muted)' }}
                  >
                    {meta.label}
                  </span>
                  <span
                    className="num text-[16px] font-extrabold leading-none"
                    style={{ color: 'var(--text)' }}
                  >
                    ₹{fmt(Math.round(plan.dailyPaise / 100))}
                  </span>
                  <span className="text-[9.5px] leading-tight" style={{ color: 'var(--muted-light)' }}>
                    {meta.sub}
                  </span>
                  <span
                    className="num mt-0.5 text-[10px] font-semibold leading-tight"
                    style={{ color: sel ? 'var(--terracotta)' : 'var(--muted)' }}
                  >
                    {formatTierUntil(plan)}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Credit bridge — calm soft suggestion */}
        {selectedPlan?.recommendCredit && (
          <div
            className="mt-3 flex items-start gap-2 rounded-card-lg px-3.5 py-3"
            style={{ background: 'var(--trust-soft)', border: '1px solid #b8e6dc' }}
          >
            <span aria-hidden style={{ fontSize: 18 }}>🔑</span>
            <div className="flex-1">
              <div className="text-[12.5px]" style={{ color: 'var(--text)', lineHeight: 1.5 }}>
                {labels.creditBridge}
              </div>
              <Link
                href={`/${locale}/credit`}
                className="mt-1 inline-block text-[11.5px] font-bold"
                style={{ color: 'var(--trust)' }}
              >
                {labels.creditBridgeCta} →
              </Link>
            </div>
          </div>
        )}

        {/* 1-yr projection */}
        <div
          className="mt-4 px-4 py-3"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
            📊 {labels.projTitle}
          </div>
          <Row label={labels.projSaved} value={`₹${fmt(yearly)}`} />
          <Row label={labels.projMunafa} value={`+₹${fmt(munafa)}`} highlight />
          <Row label={labels.projTotal} value={`₹${fmt(total)}`} bold />
          <p className="mt-2 text-[10.5px]" style={{ color: 'var(--muted-light)' }}>
            {labels.projDisclaimer}
          </p>
        </div>
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2 pt-3">
        <button
          onClick={() => submit()}
          disabled={loading || dailyRupees < 1}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[15.5px] font-bold disabled:opacity-50"
        >
          {labels.cta.replace('{amount}', String(dailyRupees))}
          <ArrowRight size={16} />
        </button>
        <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--trust)' }}>
          {labels.hint}
        </p>
      </div>
    </main>
  );
}

function Row({
  label,
  value,
  highlight,
  bold,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  bold?: boolean;
}) {
  return (
    <div className="mt-2.5 flex items-center justify-between text-[13px]">
      <span style={{ color: 'var(--muted)' }}>{label}</span>
      <span
        className={'num ' + (bold ? 'text-[15px] font-extrabold ' : 'font-bold ')}
        style={{ color: highlight ? 'var(--growth)' : 'var(--text)' }}
      >
        {value}
      </span>
    </div>
  );
}

/**
 * V5 M2 — Inflow-percentage UI. User picks "5% / 10% / 15% of every kamai".
 * Live example below shows: ₹{x} kamaye → ₹{y} bachat. Bharat-voice: speaks
 * the user's mental model of monthly cash inflow, not a fixed daily amount.
 */
function InflowForm({
  locale,
  goalId,
  goalName,
  loading,
  onSubmit,
}: {
  locale: string;
  goalId: string;
  goalName: string;
  loading: boolean;
  onSubmit: (inflowPctBps: number) => void;
}) {
  const [bps, setBps] = useState(500); // default 5%
  const [exampleInflow, setExampleInflow] = useState(10000); // ₹10K example
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
  const pctDisplay = bps / 100;
  const exampleSave = Math.round(exampleInflow * (bps / 10000));
  const exampleRemain = exampleInflow - exampleSave;

  const presets = [
    { bps: 300, label: '3%', sub: 'Aaram se' },
    { bps: 500, label: '5%', sub: 'Aksar log' },
    { bps: 1000, label: '10%', sub: 'Tagde' },
    { bps: 1500, label: '15%', sub: 'Pakka Yodha' },
  ];

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/autopilot/new?goal=${goalId}`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/40"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold" style={{ color: 'var(--trust)' }}>
          100% Safe · RBI
        </span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-6 pt-3 pb-2">
        <div className="text-center">
          <div
            className="inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[11.5px] font-bold"
            style={{ background: 'var(--trust-soft)', color: 'var(--trust)' }}
          >
            <TrendingUp size={12} aria-hidden /> KAMAI KA HISSA
          </div>
          <h1
            className="mt-2 text-balance"
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.2 }}
          >
            Har kamai ka kitna hissa Gullak mein?
          </h1>
          <p className="mt-1.5 text-[13.5px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            Jab bhi paisa aaye — UPI, salary, bonus — uska {pctDisplay}% automatically {goalName} ke liye
          </p>
        </div>

        {/* Big % display */}
        <div
          className="mt-4 px-4 py-5 text-center"
          style={{
            background: 'linear-gradient(145deg, #e6f7f4, #f0fdf9)',
            border: '2px solid var(--trust)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: '0 6px 18px rgba(14, 140, 122, 0.18)',
          }}
        >
          <div className="num leading-none" style={{ fontSize: 64, fontWeight: 900, color: 'var(--text)' }}>
            {pctDisplay}<span style={{ fontSize: 36 }}>%</span>
          </div>
          <div className="mt-1 text-[13.5px] font-bold" style={{ color: 'var(--trust)' }}>
            har kamai ka
          </div>
        </div>

        {/* 4 preset tiles */}
        <div className="mt-4 grid grid-cols-4 gap-2">
          {presets.map((p) => {
            const sel = bps === p.bps;
            return (
              <button
                key={p.bps}
                onClick={() => setBps(p.bps)}
                className="haptic-press flex flex-col items-center gap-0.5 px-1 py-2.5 transition-all"
                style={{
                  background: sel
                    ? 'linear-gradient(145deg, #e6f7f4, #f0fdf9)'
                    : 'var(--surface)',
                  border: `2px solid ${sel ? 'var(--trust)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-card)',
                  boxShadow: sel ? '0 4px 12px rgba(14,140,122,0.15)' : 'var(--shadow-card)',
                  transform: sel ? 'translateY(-2px)' : 'none',
                }}
              >
                <span
                  className="num text-[18px] font-extrabold leading-none"
                  style={{ color: sel ? 'var(--trust)' : 'var(--text)' }}
                >
                  {p.label}
                </span>
                <span className="text-[9.5px] leading-tight" style={{ color: 'var(--muted)' }}>
                  {p.sub}
                </span>
              </button>
            );
          })}
        </div>

        {/* Live example card */}
        <div
          className="mt-4 px-4 py-4"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Live example
            </span>
            <input
              type="number"
              min={1000}
              max={500000}
              step={1000}
              value={exampleInflow}
              onChange={(e) => setExampleInflow(Math.max(1000, Number(e.target.value) || 0))}
              className="num w-24 rounded-md px-2 py-1 text-right text-[13px] font-bold outline-none"
              style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', color: 'var(--text)' }}
            />
          </div>
          <div className="mt-2.5 grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                Kamai
              </div>
              <div className="num mt-0.5 text-[15px] font-extrabold" style={{ color: 'var(--text)' }}>
                ₹{fmt(exampleInflow)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--trust)' }}>
                Bachat
              </div>
              <div className="num mt-0.5 text-[15px] font-extrabold" style={{ color: 'var(--trust)' }}>
                ₹{fmt(exampleSave)}
              </div>
            </div>
            <div>
              <div className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                Aapke pass
              </div>
              <div className="num mt-0.5 text-[15px] font-extrabold" style={{ color: 'var(--text)' }}>
                ₹{fmt(exampleRemain)}
              </div>
            </div>
          </div>
        </div>

        {/* Trust strip */}
        <div
          className="mt-3 flex items-start gap-2 rounded-card-lg px-3.5 py-2.5"
          style={{ background: 'var(--bg-highlight)', border: '1px solid var(--border)' }}
        >
          <span aria-hidden style={{ fontSize: 16 }}>🚀</span>
          <p className="text-[12px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            Burst-mode bhi available — bonus aaye to dashboard se ek tap mein lock
          </p>
        </div>
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2 pt-3">
        <button
          onClick={() => onSubmit(bps)}
          disabled={loading}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[15.5px] font-bold disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, var(--trust), #0a7565)' }}
        >
          {loading ? 'Saving…' : `${pctDisplay}% — Gullak shuru karein`}
          <ArrowRight size={16} />
        </button>
        <p className="mt-2 text-center text-[11px]" style={{ color: 'var(--trust)' }}>
          Mode aap kabhi bhi badal sakte hain
        </p>
      </div>
    </main>
  );
}
