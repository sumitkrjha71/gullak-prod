'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play, Wallet, CalendarClock, AlertTriangle, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toaster';
import { cn } from '@/lib/utils';

type Labels = {
  runDailySave: string;
  runDailySaveSub: string;
  simulateSpend: string;
  simulateSpendSub: string;
  simulateSpendInput: string;
  runRoundup: string;
  simulateSalary: string;
  simulateSalarySub: string;
  forceFailNext: string;
  forceFailNextSub: string;
  generateWeekly: string;
  generateWeeklySub: string;
};

export function SettingsSimulation({
  locale,
  labels,
  forceFailEnabled,
}: {
  locale: string;
  labels: Labels;
  forceFailEnabled: boolean;
}) {
  const router = useRouter();
  const push = useToast((s) => s.push);
  const [busy, setBusy] = useState<string | null>(null);
  const [spend, setSpend] = useState<number>(480);
  const [forceFail, setForceFail] = useState(forceFailEnabled);

  const run = async (label: string, fn: () => Promise<unknown>) => {
    setBusy(label);
    try {
      await fn();
      push({ intent: 'success', title: label, body: 'Done.' });
      router.refresh();
    } catch (e: unknown) {
      push({ intent: 'warn', title: label, body: e instanceof Error ? e.message : 'Failed' });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid gap-2">
      <SimRow
        icon={<Play size={16} />}
        title={labels.runDailySave}
        sub={labels.runDailySaveSub}
        onClick={() =>
          run('Daily save', async () => {
            const r = await fetch('/api/dev/run-cron', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ which: 'daily-save' }),
            });
            if (!r.ok) throw new Error('failed');
          })
        }
        busy={busy === 'Daily save'}
      />

      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-divider/40">
            <Wallet size={16} aria-hidden />
          </div>
          <div className="flex-1">
            <div className="text-[14px] font-semibold">{labels.simulateSpend}</div>
            <div className="mt-0.5 text-[12px] text-muted">{labels.simulateSpendSub}</div>
            <div className="mt-3 flex items-center gap-2">
              <Input
                type="number"
                min={1}
                max={10000}
                value={spend}
                onChange={(e) => setSpend(Number(e.target.value))}
                className="h-10 w-32 text-[14px]"
              />
              <Button
                size="sm"
                variant="secondary"
                onClick={() =>
                  run('Spend simulated', async () => {
                    const r = await fetch('/api/sim/spend', {
                      method: 'POST',
                      headers: { 'content-type': 'application/json' },
                      body: JSON.stringify({ amountRupees: spend }),
                    });
                    if (!r.ok) throw new Error('failed');
                  })
                }
                loading={busy === 'Spend simulated'}
              >
                Add spend
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => router.push(`/${locale}/round-up`)}
              >
                {labels.runRoundup} <ArrowRight size={12} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SimRow
        icon={<CalendarClock size={16} />}
        title={labels.simulateSalary}
        sub={labels.simulateSalarySub}
        onClick={() =>
          run('Salary sweep', async () => {
            const r = await fetch('/api/dev/run-cron', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ which: 'salary-sweep' }),
            });
            if (!r.ok) throw new Error('failed');
          })
        }
        busy={busy === 'Salary sweep'}
      />

      <button
        onClick={() =>
          run(forceFail ? 'Force-fail off' : 'Force-fail on', async () => {
            const next = !forceFail;
            const r = await fetch('/api/me/preferences', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ forceFailNext: next }),
            });
            if (!r.ok) throw new Error('failed');
            setForceFail(next);
          })
        }
        className={cn(
          'haptic-press card flex items-start gap-3 p-4 text-left transition-colors',
          forceFail && 'border-warn/40 bg-warn/4',
        )}
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
            forceFail ? 'bg-warn/12 text-warn' : 'bg-divider/40 text-muted',
          )}
        >
          <AlertTriangle size={16} aria-hidden />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold">{labels.forceFailNext}</div>
          <div className="mt-0.5 text-[12px] text-muted">{labels.forceFailNextSub}</div>
          <div className="mt-1 text-[12px] font-semibold text-warn">{forceFail ? 'ON' : 'OFF'}</div>
        </div>
      </button>

      <SimRow
        icon={<FileText size={16} />}
        title={labels.generateWeekly}
        sub={labels.generateWeeklySub}
        onClick={() =>
          run('Weekly summary', async () => {
            const r = await fetch('/api/dev/run-cron', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({ which: 'weekly-summary' }),
            });
            if (!r.ok) throw new Error('failed');
          })
        }
        busy={busy === 'Weekly summary'}
      />
    </div>
  );
}

function SimRow({
  icon,
  title,
  sub,
  onClick,
  busy,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
  onClick: () => void;
  busy?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="haptic-press card flex items-start gap-3 p-4 text-left transition-colors hover:bg-divider/15 disabled:opacity-60"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-divider/40">{icon}</div>
      <div className="flex-1">
        <div className="text-[14px] font-semibold">{title}</div>
        <div className="mt-0.5 text-[12px] text-muted">{sub}</div>
      </div>
    </button>
  );
}
