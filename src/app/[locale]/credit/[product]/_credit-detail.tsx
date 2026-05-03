'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Lock, ArrowRight, BadgeCheck } from 'lucide-react';
import type { LoanProductType } from '@/lib/ocen';

type Offer = {
  id: string;
  principalRupees: number;
  tenureMonths: number;
  ratePct: string;
  emiRupees: number;
  lender: string;
};

export function CreditDetail({
  locale,
  productType,
  productName,
  maxRupees,
  defaultPrincipalRupees,
  defaultTenureDays,
  offers,
  labels,
}: {
  locale: string;
  productType: LoanProductType;
  productName: string;
  maxRupees: number;
  defaultPrincipalRupees: number;
  defaultTenureDays: number;
  offers: Offer[];
  labels: {
    detailTitle: string;
    principal: string;
    tenure: string;
    rate: string;
    emi: string;
    lender: string;
    lenders: string;
    applyCta: string;
    applying: string;
    applySuccess: string;
    applyTrust: string;
    tenureMonths: string;
  };
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string>(offers[0]?.id ?? '');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
  const offer = offers.find((o) => o.id === selected) ?? offers[0];

  const apply = async () => {
    if (!offer) return;
    setLoading(true);
    try {
      const r = await fetch('/api/credit/apply', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ offerId: offer.id }),
      });
      if (!r.ok) throw new Error('apply_failed');
      setDone(true);
      setTimeout(() => router.push(`/${locale}/home`), 2400);
    } finally {
      setLoading(false);
    }
  };

  if (!offer) return null;

  return (
    <main className="flex min-h-dvh w-full flex-col bg-bg" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/credit`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full text-text/70 hover:bg-border/40"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold text-trust">100% Safe · RBI</span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-6 pt-3 pb-4">
        <div className="text-center">
          <h1 className="text-[20px] font-extrabold text-text">{productName}</h1>
          <p className="mt-1 text-[13px] text-muted">{labels.detailTitle}</p>
        </div>

        {/* Selected offer summary */}
        <div className="card mt-4 p-4">
          <div className="text-center">
            <div className="text-[11px] uppercase tracking-wider text-muted">{labels.principal}</div>
            <div className="mt-0.5 text-[34px] font-extrabold tabular-nums text-text">
              ₹{fmt(offer.principalRupees)}
            </div>
            <div className="text-[10px] text-muted-light">Eligible up to ₹{fmt(maxRupees)}</div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 rounded-card border border-border-light bg-bg p-3">
            <Stat label={labels.tenure} value={labels.tenureMonths.replace('__N__', String(offer.tenureMonths))} />
            <Stat label={labels.rate} value={`${offer.ratePct}%`} highlight />
            <Stat label={labels.emi} value={`₹${fmt(offer.emiRupees)}`} />
          </div>
        </div>

        {/* Compare lenders */}
        {offers.length > 1 && (
          <div className="mt-4">
            <div className="mb-2 text-[12px] font-bold text-text">{labels.lenders}</div>
            <div className="grid gap-2">
              {offers.map((o) => (
                <motion.button
                  key={o.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelected(o.id)}
                  className="haptic-press flex items-center gap-3 rounded-card-lg border-2 bg-surface px-3 py-2.5 text-left"
                  style={{
                    borderColor: selected === o.id ? 'var(--saffron)' : 'var(--border)',
                  }}
                >
                  <div className="flex-1">
                    <div className="text-[13px] font-bold text-text">{o.lender}</div>
                    <div className="text-[11px] text-muted">
                      ₹{fmt(o.emiRupees)}/mo · {o.ratePct}% · {o.tenureMonths} mo
                    </div>
                  </div>
                  {selected === o.id && <BadgeCheck size={16} className="text-saffron" aria-hidden />}
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-6 pb-2">
        {done ? (
          <div
            className="flex h-14 w-full items-center justify-center gap-2 rounded-btn bg-growth-soft text-[14px] font-bold text-growth"
          >
            <BadgeCheck size={16} aria-hidden /> {labels.applySuccess}
          </div>
        ) : (
          <button
            onClick={apply}
            disabled={loading}
            className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[16px] font-bold disabled:opacity-50"
          >
            {loading ? labels.applying : labels.applyCta} {!loading && <ArrowRight size={16} />}
          </button>
        )}
        <p className="mt-2 inline-flex w-full items-center justify-center gap-1.5 text-center text-[10px] text-trust">
          <Lock size={10} aria-hidden /> {labels.applyTrust}
        </p>
      </div>
    </main>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-muted">{label}</div>
      <div
        className={'mt-0.5 text-[14px] font-bold tabular-nums ' + (highlight ? 'text-saffron' : 'text-text')}
      >
        {value}
      </div>
    </div>
  );
}
