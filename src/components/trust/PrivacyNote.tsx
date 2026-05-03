import { Lock } from 'lucide-react';

export function PrivacyNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="inline-flex items-start gap-1.5 text-[12px] leading-relaxed text-muted">
      <Lock size={12} className="mt-0.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}
