'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pause, Square, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { useToast } from '@/components/ui/Toaster';

type Labels = {
  edit: string;
  pause: string;
  stop: string;
  pauseSheetTitle: string;
  pauseSeven: string;
  pauseSalary: string;
  pauseIndefinite: string;
  stopConfirmTitle: string;
  stopConfirmBody: string;
  confirm: string;
  cancel: string;
};

export function GoalActions({
  locale,
  goalId,
  ruleId,
  labels,
}: {
  locale: string;
  goalId: string;
  ruleId: string | null;
  labels: Labels;
}) {
  const router = useRouter();
  const [pauseSheet, setPauseSheet] = useState(false);
  const [stopSheet, setStopSheet] = useState(false);
  const push = useToast((s) => s.push);

  const pause = async (kind: 'seven' | 'salary' | 'indefinite') => {
    if (!ruleId) return;
    await fetch('/api/autopilot/rules/pause', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ ruleId, kind }),
    });
    setPauseSheet(false);
    push({ intent: 'success', title: labels.pause, ttlMs: 3000 });
    router.refresh();
  };

  const stop = async () => {
    await fetch(`/api/goals/${goalId}/stop`, { method: 'POST' });
    setStopSheet(false);
    router.push(`/${locale}/home`);
  };

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      <Button variant="secondary" size="md" disabled>
        <Edit3 size={14} /> {labels.edit}
      </Button>
      <Button variant="secondary" size="md" onClick={() => setPauseSheet(true)} disabled={!ruleId}>
        <Pause size={14} /> {labels.pause}
      </Button>
      <Button variant="secondary" size="md" onClick={() => setStopSheet(true)}>
        <Square size={14} /> {labels.stop.split(' ')[0]}
      </Button>

      <Sheet open={pauseSheet} onOpenChange={setPauseSheet} title={labels.pauseSheetTitle}>
        <div className="grid gap-2 pb-2">
          <Button variant="secondary" block onClick={() => pause('seven')}>
            {labels.pauseSeven}
          </Button>
          <Button variant="secondary" block onClick={() => pause('salary')}>
            {labels.pauseSalary}
          </Button>
          <Button variant="ghost" block onClick={() => pause('indefinite')}>
            {labels.pauseIndefinite}
          </Button>
        </div>
      </Sheet>

      <Sheet open={stopSheet} onOpenChange={setStopSheet} title={labels.stopConfirmTitle} description={labels.stopConfirmBody}>
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Button variant="secondary" onClick={() => setStopSheet(false)}>
            {labels.cancel}
          </Button>
          <Button variant="warn" onClick={stop}>
            {labels.confirm}
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
