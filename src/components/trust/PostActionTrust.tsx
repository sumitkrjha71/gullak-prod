import { BadgeCheck } from 'lucide-react';

export function PostActionTrust({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-start gap-2 rounded-card bg-growth/6 px-3 py-2.5 text-[13px] leading-relaxed text-growth">
      <BadgeCheck size={14} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </div>
  );
}
