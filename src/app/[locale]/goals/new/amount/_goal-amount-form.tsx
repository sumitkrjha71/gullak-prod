'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ArrowRight, Calendar } from 'lucide-react';
import { generateClientId } from '@/lib/ids/client';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function GoalAmountForm({
  locale,
  type,
  goalName,
  goalEmoji,
  goalSub,
  suggestedTargetPaise,
  labels,
}: {
  locale: string;
  type: string;
  goalName: string;
  goalSub: string;
  goalEmoji: string;
  suggestedTargetPaise: number;
  labels: {
    amountTitle: string;
    amountSub: string;
    suggestion: string;
    timelineTitle: string;
    timelineSub: string;
    timelineReadout: string;
    monthLabel: string;
    yearLabel: string;
    cta: string;
  };
}) {
  const router = useRouter();
  const suggestedRupees = Math.round(suggestedTargetPaise / 100);
  const [rupees, setRupees] = useState<number>(suggestedRupees);
  const [loading, setLoading] = useState(false);

  // Timeline default: 24 months from today
  const today = new Date();
  const defaultDeadline = new Date(today);
  defaultDeadline.setMonth(defaultDeadline.getMonth() + 24);
  const [month, setMonth] = useState<number>(defaultDeadline.getMonth());
  const [year, setYear] = useState<number>(defaultDeadline.getFullYear());

  const yearOptions = useMemo(() => {
    const cur = today.getFullYear();
    return Array.from({ length: 11 }, (_, i) => cur + i);
  }, [today]);

  const monthsAway = useMemo(() => {
    return (year - today.getFullYear()) * 12 + (month - today.getMonth());
  }, [month, year, today]);

  // Bharat-realistic preset amounts.
  const presets: number[] = useMemo(() => {
    return [
      Math.max(10_000, Math.round(suggestedRupees / 4)),
      Math.round(suggestedRupees / 2),
      suggestedRupees,
      suggestedRupees * 2,
    ];
  }, [suggestedRupees]);

  const submit = () => {
    if (loading) return;
    setLoading(true);
    const deadline = new Date(year, month, 1);
    const targetPaise = rupees * 100;
    // Client-generated id — server uses it verbatim.
    const goalId = generateClientId();
    // Cache for downstream pages (autopilot picker, commitment form).
    try {
      sessionStorage.setItem(
        'gullak_pending_goal',
        JSON.stringify({
          id: goalId,
          type,
          title: goalName,
          targetPaise,
          deadlineIso: deadline.toISOString(),
        }),
      );
    } catch {
      // sessionStorage blocked — downstream falls back to placeholders
    }
    // Fire-and-forget the API write. The user navigates immediately.
    try {
      fetch('/api/goals', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: goalId,
          type,
          title: goalName,
          targetPaise,
          deadline: deadline.toISOString(),
        }),
      }).catch(() => {});
    } catch {
      // ignore
    }
    router.push(`/${locale}/autopilot/new?goal=${goalId}`);
  };

  const formatInr = (r: number) => '₹' + new Intl.NumberFormat('en-IN').format(r);

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/goals/new`}
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

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-6 pt-3">
        <div className="text-center">
          <span style={{ fontSize: 44 }} aria-hidden>
            {goalEmoji}
          </span>
          <h1
            className="mt-1"
            style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.2 }}
          >
            {labels.amountTitle.replace('{goal}', goalName)}
          </h1>
          <p className="mt-1 text-[13px] italic" style={{ color: 'var(--terracotta)' }}>
            {goalSub}
          </p>
          <p className="mt-1 text-[12.5px]" style={{ color: 'var(--muted)' }}>
            {labels.amountSub}
          </p>
        </div>

        {/* Amount input card */}
        <div
          className="mt-5 px-5 py-5 text-center"
          style={{
            background: 'var(--surface)',
            border: '2px solid var(--border)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="flex items-baseline justify-center gap-2">
            <span style={{ fontSize: 26, fontWeight: 700, color: 'var(--muted)' }}>₹</span>
            <input
              type="text"
              inputMode="numeric"
              value={rupees ? new Intl.NumberFormat('en-IN').format(rupees) : ''}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ''));
                setRupees(Number.isFinite(n) ? n : 0);
              }}
              className="num w-full max-w-[240px] bg-transparent text-center outline-none"
              style={{ fontSize: 40, fontWeight: 800, color: 'var(--text)' }}
            />
          </div>
          <p className="mt-1.5 text-[11px]" style={{ color: 'var(--muted)' }}>
            {labels.suggestion}
          </p>
        </div>

        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {presets.map((r) => {
            const sel = rupees === r;
            return (
              <button
                key={r}
                onClick={() => setRupees(r)}
                className="haptic-press num rounded-pill px-4 py-2 text-[13px] font-bold transition-all"
                style={{
                  background: sel ? 'var(--saffron)' : 'var(--surface)',
                  color: sel ? '#FFF8F0' : 'var(--text)',
                  border: `2px solid ${sel ? 'var(--saffron)' : 'var(--border)'}`,
                  boxShadow: sel ? '0 4px 14px rgba(232,101,10,0.22)' : 'none',
                }}
              >
                {formatInr(r)}
              </button>
            );
          })}
        </div>

        {/* Timeline picker */}
        <div
          className="mt-6 px-4 py-4"
          style={{
            background: 'linear-gradient(145deg, var(--bg-highlight), var(--bg-soft))',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card-lg)',
          }}
        >
          <div className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ background: 'var(--saffron)', color: '#FFF8F0' }}
              aria-hidden
            >
              <Calendar size={16} />
            </span>
            <div className="flex-1">
              <div style={{ fontSize: 14.5, fontWeight: 800, color: 'var(--text)' }}>
                {labels.timelineTitle}
              </div>
              <div className="text-[11.5px]" style={{ color: 'var(--muted)' }}>
                {labels.timelineSub}
              </div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5">
            <label className="block">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                {labels.monthLabel}
              </span>
              <select
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="mt-1 w-full appearance-none px-3 py-3 text-[15px] font-bold outline-none"
                style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  color: 'var(--text)',
                }}
              >
                {MONTHS_EN.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold" style={{ color: 'var(--muted)' }}>
                {labels.yearLabel}
              </span>
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="num mt-1 w-full appearance-none px-3 py-3 text-[15px] font-bold outline-none"
                style={{
                  background: 'var(--surface)',
                  border: '2px solid var(--border)',
                  borderRadius: 'var(--radius-card)',
                  color: 'var(--text)',
                }}
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {monthsAway > 0 && (
            <div
              className="mt-3 rounded-pill px-3 py-1.5 text-center text-[12px] font-semibold"
              style={{ background: 'var(--surface)', color: 'var(--text)' }}
            >
              {labels.timelineReadout
                .replace('{month}', MONTHS_EN[month])
                .replace('{year}', String(year))
                .replace('{n}', String(monthsAway))}
            </div>
          )}
          {monthsAway <= 0 && (
            <div
              className="mt-3 rounded-pill px-3 py-1.5 text-center text-[12px] font-semibold"
              style={{ background: '#FFF1E5', color: 'var(--saffron)' }}
            >
              Bhai, future date chunein
            </div>
          )}
        </div>
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2 pt-3">
        <button
          onClick={submit}
          disabled={!rupees || rupees < 100 || loading || monthsAway <= 0}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-50"
        >
          {labels.cta} <ArrowRight size={16} />
        </button>
      </div>
    </main>
  );
}
