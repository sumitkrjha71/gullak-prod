// TrustStrip — single-line regulatory + security badges row.
//
// Used wherever trust signal matters: HeroBalance, mandate confirmation,
// onboarding trust checkpoint, withdraw confirmation. Designed to be sober
// (no glow, no shimmer) and informative — every badge ties to a real
// compliance fact in docs/COMPLIANCE.md.
//
// NEVER decorative. Only render where the user is about to make a money
// decision and deserves the proof.

import { ShieldCheck, Lock, BadgeCheck } from 'lucide-react';

export interface TrustStripProps {
  /** When true, render with smaller font + tighter spacing (for in-card use). */
  compact?: boolean;
}

const items = [
  { icon: ShieldCheck, label: 'RBI Regulated' },
  { icon: BadgeCheck,  label: 'SEBI Compliant' },
  { icon: Lock,        label: '256-bit Secure' },
] as const;

export function TrustStrip({ compact = false }: TrustStripProps) {
  const iconSize = compact ? 11 : 13;
  const fontSize = compact ? 10 : 11;
  const gap      = compact ? 8 : 12;

  return (
    <div
      className="flex flex-wrap items-center"
      style={{ gap, color: 'var(--ink-500)' }}
    >
      {items.map((item, idx) => (
        <span
          key={item.label}
          className="inline-flex items-center gap-1.5"
          style={{ fontSize, fontWeight: 600, letterSpacing: 0.02 }}
        >
          <item.icon size={iconSize} strokeWidth={1.75} aria-hidden />
          {item.label}
          {idx < items.length - 1 && (
            <span
              aria-hidden
              className="ml-1"
              style={{ color: 'var(--ink-300)' }}
            >
              ·
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
