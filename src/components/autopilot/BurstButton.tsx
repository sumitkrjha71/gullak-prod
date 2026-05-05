'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Rocket, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type Labels = {
  title: string;
  sub: string;
  cta: string;
  modalTitle: string;
  modalSub: string;
  presets: string;
  customLabel: string;
  submit: string;
  submitting: string;
  success: string;
  successCta: string;
};

const PRESETS = [500, 1000, 2500, 5000, 10000];

export function BurstButton({ labels }: { labels: Labels }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(1000);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const fmt = (n: number) => '₹' + new Intl.NumberFormat('en-IN').format(n);

  const submit = async () => {
    if (submitting || amount < 1) return;
    setSubmitting(true);
    try {
      const r = await fetch('/api/autopilot/burst', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amountPaise: amount * 100 }),
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        setSuccess(true);
        setTimeout(() => {
          setOpen(false);
          setSuccess(false);
          router.refresh();
        }, 2200);
      } else {
        alert(j.hint || 'Kuch dikkat aa gayi');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Compact card on dashboard */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="haptic-press flex w-full items-center gap-3 px-4 py-3.5 text-left"
        style={{
          background: 'linear-gradient(145deg, #FFE9D2, #FFF5EC)',
          border: '1.5px solid var(--saffron)',
          borderRadius: 'var(--radius-card-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <div
          className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
          style={{
            background: 'linear-gradient(135deg, #E8650A, #C4602A)',
            color: '#fff',
          }}
          aria-hidden
        >
          <Rocket size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>
            {labels.title}
          </div>
          <div className="mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>
            {labels.sub}
          </div>
        </div>
        <span
          className="rounded-pill px-3 py-1 text-[11.5px] font-bold"
          style={{ background: 'var(--saffron)', color: '#fff' }}
        >
          {labels.cta}
        </span>
      </button>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
            style={{ background: 'rgba(15, 17, 21, 0.45)', backdropFilter: 'blur(2px)' }}
            onClick={() => !submitting && setOpen(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 240 }}
              className="w-full max-w-md p-5"
              style={{
                background: 'var(--bg)',
                borderTopLeftRadius: 24,
                borderTopRightRadius: 24,
                boxShadow: 'var(--shadow-sheet)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {success ? (
                <div className="flex flex-col items-center px-4 py-8 text-center">
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-full"
                    style={{
                      background: 'linear-gradient(135deg, #1A7A4A, #0E8C7A)',
                      color: '#fff',
                      animation: 'dropIn 0.6s ease-out',
                    }}
                  >
                    <Check size={32} strokeWidth={3} />
                  </div>
                  <h3 className="mt-3" style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
                    🎉 {labels.success.replace('{amount}', new Intl.NumberFormat('en-IN').format(amount))}
                  </h3>
                </div>
              ) : (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 style={{ fontSize: 19, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.2 }}>
                        {labels.modalTitle}
                      </h3>
                      <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)' }}>
                        {labels.modalSub}
                      </p>
                    </div>
                    <button
                      onClick={() => setOpen(false)}
                      className="haptic-press flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ color: 'var(--muted)' }}
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div
                    className="mt-4 px-4 py-4 text-center"
                    style={{
                      background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
                      border: '2px solid var(--saffron)',
                      borderRadius: 'var(--radius-card-lg)',
                    }}
                  >
                    <div className="num leading-none" style={{ fontSize: 44, fontWeight: 900, color: 'var(--text)' }}>
                      {fmt(amount)}
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="mb-2 text-[11.5px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {labels.presets}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {PRESETS.map((p) => {
                        const sel = amount === p;
                        return (
                          <button
                            key={p}
                            onClick={() => setAmount(p)}
                            className="haptic-press num rounded-pill px-3.5 py-1.5 text-[13px] font-bold transition-all"
                            style={{
                              background: sel ? 'var(--saffron)' : 'var(--surface)',
                              color: sel ? '#fff' : 'var(--text)',
                              border: `1.5px solid ${sel ? 'var(--saffron)' : 'var(--border)'}`,
                            }}
                          >
                            {fmt(p)}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mt-3">
                    <label className="text-[11.5px] font-semibold" style={{ color: 'var(--muted)' }}>
                      {labels.customLabel}
                    </label>
                    <input
                      type="number"
                      min={100}
                      max={1000000}
                      value={amount}
                      onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
                      className="num mt-1 w-full px-4 py-3 text-[16px] font-bold outline-none"
                      style={{
                        background: 'var(--surface)',
                        border: '2px solid var(--border)',
                        borderRadius: 'var(--radius-card)',
                        color: 'var(--text)',
                      }}
                    />
                  </div>

                  <button
                    onClick={submit}
                    disabled={submitting || amount < 1}
                    className="haptic-press cta-primary mt-5 flex h-13 w-full items-center justify-center gap-2 rounded-btn py-3 text-[16px] font-bold disabled:opacity-50"
                  >
                    {submitting ? labels.submitting : labels.submit} 🔒
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
