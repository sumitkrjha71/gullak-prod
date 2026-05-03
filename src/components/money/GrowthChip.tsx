import { ArrowUpRight } from 'lucide-react';
import { formatInr } from '@/lib/format/money';

export function GrowthChip({ paise }: { paise: number | bigint }) {
  const n = typeof paise === 'bigint' ? Number(paise) : paise;
  if (n <= 0) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-growth/10 px-2 py-0.5 text-[11px] font-medium text-growth money">
      <ArrowUpRight size={11} aria-hidden />
      <span>{formatInr(paise)}</span>
    </span>
  );
}
