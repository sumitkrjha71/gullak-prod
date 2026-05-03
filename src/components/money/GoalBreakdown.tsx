import { formatInr } from '@/lib/format/money';

export function GoalBreakdown({
  saved,
  invested,
  munafa,
  labels,
}: {
  saved: number | bigint;
  invested: number | bigint;
  munafa: number | bigint;
  labels: { saved: string; invested: string; munafa: string };
}) {
  return (
    <div className="grid grid-cols-3 gap-2 rounded-card border border-divider bg-surface p-4">
      <Cell label={labels.saved} value={formatInr(saved)} />
      <Cell label={labels.invested} value={formatInr(invested)} />
      <Cell label={labels.munafa} value={formatInr(munafa)} accent />
    </div>
  );
}

function Cell({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-[11px] uppercase tracking-wider text-muted">{label}</span>
      <span className={`mt-1 text-[15px] font-semibold tabular-nums ${accent ? 'text-growth' : 'text-text'}`}>
        {value}
      </span>
    </div>
  );
}
