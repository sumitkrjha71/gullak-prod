'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, KeyRound, Lock, Bike, Car, Coins, ShoppingBag, ShieldAlert, ArrowRight } from 'lucide-react';

type ProductType = 'two-wheeler' | 'four-wheeler' | 'gold' | 'consumer-durable' | 'emergency';

type Product = {
  type: ProductType;
  name: string;
  desc: string;
  maxRupees: number;
  ratePct: string;
};

const ICON_FOR: Record<ProductType, any> = {  'two-wheeler': Bike,
  'four-wheeler': Car,
  'gold': Coins,
  'consumer-durable': ShoppingBag,
  'emergency': ShieldAlert,
};

export function CreditList({
  locale,
  eligible,
  reason,
  daysSinceFirstSave,
  hasAAConsent,
  products,
  labels,
}: {
  locale: string;
  eligible: boolean;
  reason: string;
  daysSinceFirstSave: number;
  hasAAConsent: boolean;
  products: Product[];
  labels: {
    title: string;
    sub: string;
    preApproved: string;
    savingFirst: string;
    viewDetails: string;
    needs30Days: string;
    needsMandate: string;
    needsAA: string;
    connectAA: string;
    skip: string;
    indicativeRate: string;
    applyTrust: string;
  };
}) {
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <main className="flex min-h-dvh w-full flex-col bg-bg" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/home`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full text-text/70 hover:bg-border/40"
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold text-trust">100% Safe · RBI</span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md px-6 pt-3 text-center">
        <div className="relative inline-block">
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={70}
            height={56}
            priority
            className="anim-float"
            style={{ width: 70, height: 56, objectFit: 'contain' }}
          />
          {/* Golden key */}
          <span
            aria-hidden
            className="absolute -bottom-2 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-gold/20 text-gold"
            style={{ animation: 'gentleFloat 2.5s ease-in-out infinite' }}
          >
            <KeyRound size={14} />
          </span>
        </div>
        <h1 className="mt-2 text-[20px] font-extrabold text-text">{labels.title}</h1>
        <p className="mt-1 text-[13px] text-muted">{labels.sub}</p>
      </div>

      {!eligible && (
        <div className="mx-auto w-full max-w-md px-6 pt-5">
          <div className="card flex items-start gap-3 p-4">
            <Lock size={18} className="mt-0.5 text-trust" aria-hidden />
            <div>
              <div className="text-[14px] font-bold text-text">
                {reason === 'needs_30_days' && labels.needs30Days}
                {reason === 'no_active_mandate' && labels.needsMandate}
                {reason === 'no_aa_consent' && labels.needsAA}
              </div>
              <div className="mt-1 text-[12px] text-muted">
                {daysSinceFirstSave > 0
                  ? `${daysSinceFirstSave} / 30 days`
                  : 'Start saving from the home screen'}
              </div>
              {!hasAAConsent && (
                <Link
                  href={`/${locale}/aa/connect`}
                  className="haptic-press mt-3 inline-flex h-10 items-center gap-2 rounded-btn bg-trust px-4 text-[13px] font-bold text-white"
                >
                  {labels.connectAA} <ArrowRight size={12} />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {eligible && (
        <div className="mx-auto w-full max-w-md px-5 pt-4">
          {!hasAAConsent && (
            <div className="card mb-3 flex items-start gap-3 p-3">
              <Lock size={16} className="mt-0.5 text-trust" aria-hidden />
              <div className="flex-1">
                <div className="text-[12px] font-bold text-text">{labels.needsAA}</div>
                <Link
                  href={`/${locale}/aa/connect`}
                  className="haptic-press mt-2 inline-flex h-9 items-center gap-2 rounded-btn bg-trust px-3 text-[12px] font-bold text-white"
                >
                  {labels.connectAA} <ArrowRight size={11} />
                </Link>
              </div>
            </div>
          )}
          <div className="grid gap-2.5">
            {products.map((p, i) => {
              const Icon = ICON_FOR[p.type];
              const rateLine = labels.indicativeRate.replace('__RATE__', p.ratePct);
              return (
                <motion.div
                  key={p.type}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="card relative p-4"
                >
                  <span className="absolute right-3 top-3 rounded-md bg-bg-highlight px-2 py-0.5 text-[10px] font-bold text-saffron">
                    {labels.preApproved}
                  </span>
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-card text-saffron"
                      style={{ background: 'var(--bg)' }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-text">{p.name}</div>
                      <p className="mt-0.5 text-[12px] leading-snug text-muted">{p.desc}</p>
                      <div className="mt-1 flex items-center gap-3 text-[11px] text-trust">
                        <span className="font-semibold">Up to ₹{fmt(p.maxRupees)}</span>
                        <span>·</span>
                        <span>{rateLine}</span>
                      </div>
                      <Link
                        href={`/${locale}/credit/${p.type}`}
                        className="haptic-press mt-2.5 inline-flex h-9 items-center gap-1 rounded-btn bg-text/5 px-3 text-[12px] font-bold text-text hover:bg-text/10"
                      >
                        {labels.viewDetails} <ArrowRight size={11} />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <p className="mt-4 text-center text-[11px] text-muted leading-relaxed">{labels.savingFirst}</p>
          <p className="mt-3 inline-flex w-full items-center justify-center gap-1.5 text-[10px] text-trust">
            <Lock size={10} aria-hidden /> {labels.applyTrust}
          </p>
        </div>
      )}
    </main>
  );
}
