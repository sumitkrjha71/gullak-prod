import { Clock } from 'lucide-react';

export function NoSurpriseRow({ when, amount }: { when: string; amount: string }) {
  return (
    <div className="flex items-center gap-2 rounded-card border border-divider bg-surface px-3 py-2.5 text-[13px]">
      <Clock size={14} className="text-muted" aria-hidden />
      <span className="text-muted">{when}</span>
      <span className="ml-auto font-semibold money">{amount}</span>
    </div>
  );
}
