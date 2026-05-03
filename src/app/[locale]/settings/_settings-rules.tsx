'use client';

import { useRouter } from 'next/navigation';
import { Repeat, Wallet, CalendarClock, Pause, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/patterns/EmptyState';
import { useToast } from '@/components/ui/Toaster';
import { formatInr } from '@/lib/format/money';
import { cn } from '@/lib/utils';

type Rule = { id: string; mode: string; goalTitle: string; amountPaise: number | null; status: string };

type Labels = {
  fixedLabel: string;
  roundupLabel: string;
  sweepLabel: string;
  active: string;
  paused: string;
  stopped: string;
  pause: string;
  resume: string;
  stop: string;
  noneTitle: string;
  noneSub: string;
};

export function SettingsRules({ rules, labels }: { rules: Rule[]; labels: Labels }) {
  const router = useRouter();
  const push = useToast((s) => s.push);

  if (rules.length === 0) {
    return <EmptyState title={labels.noneTitle} body={labels.noneSub} />;
  }

  const act = async (ruleId: string, action: 'pause' | 'resume' | 'stop') => {
    const url = action === 'pause' ? '/api/autopilot/rules/pause' : action === 'resume' ? '/api/autopilot/rules/resume' : '/api/autopilot/rules/stop';
    const body = action === 'pause' ? JSON.stringify({ ruleId, kind: 'indefinite' }) : JSON.stringify({ ruleId });
    const r = await fetch(url, { method: 'POST', headers: { 'content-type': 'application/json' }, body });
    if (r.ok) {
      push({
        intent: 'success',
        title: action === 'pause'
          ? labels.paused
          : action === 'resume'
          ? labels.active
          : labels.stopped,
        ttlMs: 3000
      });      router.refresh();
    }
  };

  return (
    <div className="grid gap-2">
      {rules.map((r) => {
        const Icon = r.mode === 'fixed' ? Repeat : r.mode === 'roundup' ? Wallet : CalendarClock;
        const label = r.mode === 'fixed' ? labels.fixedLabel : r.mode === 'roundup' ? labels.roundupLabel : labels.sweepLabel;
        const statusLabel = r.status === 'active' ? labels.active : r.status === 'paused' ? labels.paused : labels.stopped;
        return (
          <div key={r.id} className="card flex items-start gap-3 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-divider/40">
              <Icon size={16} aria-hidden />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[14px] font-semibold">{label}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    r.status === 'active' && 'bg-growth/10 text-growth',
                    r.status === 'paused' && 'bg-warn/10 text-warn',
                    r.status === 'stopped' && 'bg-divider/40 text-muted',
                  )}
                >
                  {statusLabel}
                </span>
              </div>
              <div className="mt-0.5 text-[12px] text-muted truncate">→ {r.goalTitle}</div>
              {r.amountPaise && <div className="mt-1 text-[13px] font-semibold tabular-nums money">{formatInr(r.amountPaise)}</div>}
              {r.status !== 'stopped' && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.status === 'active' ? (
                    <Button size="sm" variant="secondary" onClick={() => act(r.id, 'pause')}>
                      <Pause size={12} /> {labels.pause}
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => act(r.id, 'resume')}>
                      <Play size={12} /> {labels.resume}
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => act(r.id, 'stop')}>
                    <Square size={12} /> {labels.stop}
                  </Button>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
