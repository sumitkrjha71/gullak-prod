// HeroBalance — the single most important primitive.
//
// This component answers the user's first question on the dashboard, on the
// portfolio, on any screen where their money lives: "kitna paisa hai?"
//
// Design rules:
//   - The ₹ amount is the visual hero (40px / 800 / tabular).
//   - Caption above ("TOTAL JAMA") sets context — uppercase tracked.
//   - Optional delta chip: small, monochrome with up/down arrow.
//   - Optional trust strip below: RBI · SEBI · 256-bit — single line, sober.
//   - No gradient. No mascot. No saffron border. No animation loop.
//   - All money rendered via Intl.NumberFormat('en-IN'); never raw paise.
//
// Charter alignment:
//   Commandment 1 — Money is sacred. This is the screen where trust is won.
//   Commandment 2 — Calm visual. Hinglish caption ("TOTAL JAMA") preserves voice.
//   Commandment 3 — No fake numbers. Caller passes real `amountPaise` BigInt or string.

import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { TrustStrip } from './TrustStrip';

export interface HeroBalanceProps {
  /** Amount in paise — pass BigInt or string-of-bigint (Server-Component-safe). */
  amountPaise: bigint | string | number;
  /** Hinglish caption above the number — defaults to "Total Jama". */
  caption?: string;
  /** Optional small line below the amount — e.g. "as of today" / "Pichle 7 din mein +₹420". */
  subtext?: string;
  /** Delta vs previous period. Positive = green up, negative = red down. */
  delta?: {
    paise: bigint | string | number;
    label: string;       // e.g. "is hafte", "is mahine"
  };
  /** Show the trust strip (RBI · SEBI · 256-bit) below the amount. */
  trustStrip?: boolean;
}

function toNumber(v: bigint | string | number): number {
  if (typeof v === 'bigint') return Number(v);
  if (typeof v === 'string') return Number(v);
  return v;
}

const fmt = (rupees: number) =>
  new Intl.NumberFormat('en-IN').format(Math.round(rupees));

export function HeroBalance({
  amountPaise,
  caption = 'Total Jama',
  subtext,
  delta,
  trustStrip = false,
}: HeroBalanceProps) {
  const rupees = Math.round(toNumber(amountPaise) / 100);
  const deltaRupees = delta ? Math.round(toNumber(delta.paise) / 100) : 0;
  const deltaPositive = deltaRupees >= 0;

  return (
    <div className="card-elev px-5 py-5">
      <div className="text-caption">{caption}</div>

      <div className="mt-1 num text-hero-num">
        ₹{fmt(rupees)}
      </div>

      {(subtext || delta) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {delta && (
            <span
              className="num inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[12px] font-bold"
              style={{
                background: deltaPositive ? 'rgba(11, 122, 69, 0.10)' : 'rgba(184, 50, 50, 0.10)',
                color: deltaPositive ? 'var(--money-up)' : 'var(--money-down)',
              }}
              aria-label={`${deltaPositive ? 'up' : 'down'} ${Math.abs(deltaRupees)} rupees ${delta.label}`}
            >
              {deltaPositive
                ? <ArrowUpRight size={12} strokeWidth={2.25} aria-hidden />
                : <ArrowDownRight size={12} strokeWidth={2.25} aria-hidden />}
              {deltaPositive ? '+' : '−'}₹{fmt(Math.abs(deltaRupees))} · {delta.label}
            </span>
          )}
          {subtext && (
            <span className="text-[12px]" style={{ color: 'var(--ink-500)' }}>
              {subtext}
            </span>
          )}
        </div>
      )}

      {trustStrip && (
        <div className="mt-4">
          <TrustStrip />
        </div>
      )}
    </div>
  );
}
