'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Heart, Gift, Check } from 'lucide-react';

const OCCASIONS = [
  { id: 'diwali', label: 'Diwali', emoji: '🪔' },
  { id: 'rakhi', label: 'Rakhi', emoji: '🪢' },
  { id: 'bhai-dooj', label: 'Bhai Dooj', emoji: '🌸' },
  { id: 'birthday', label: 'Birthday', emoji: '🎂' },
  { id: 'wedding', label: 'Shaadi', emoji: '💍' },
  { id: 'random', label: 'Yun hi', emoji: '💝' },
];

const PRESETS = [101, 251, 501, 1001, 2501, 5001];

export function ShagunForm({
  locale,
  goalId,
  goalTitle,
  recipients,
  availableMunafaPaise,
}: {
  locale: string;
  goalId: string;
  goalTitle: string;
  recipients: { userId: string; name: string }[];
  availableMunafaPaise: number;
}) {
  const router = useRouter();
  const [recipientId, setRecipientId] = useState<string>(recipients[0]?.userId ?? '');
  const [amount, setAmount] = useState(501);
  const [occasion, setOccasion] = useState('diwali');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);
  const availableRupees = Math.round(availableMunafaPaise / 100);

  const submit = async () => {
    if (!recipientId) {
      setError('Recipient choose karein');
      return;
    }
    if (amount * 100 > availableMunafaPaise) {
      setError(`Aapke paas itna munafa nahi hai. Available: ₹${fmt(availableRupees)}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch('/api/shagun', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          goalId,
          recipientUserId: recipientId,
          amountPaise: amount * 100,
          occasion,
          message,
        }),
      });
      const j = await r.json();
      if (r.ok && j.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push(`/${locale}/goals/${goalId}/family`);
        }, 2400);
      } else {
        setError(j.hint || 'Kuch dikkat aa gayi.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <main
        className="flex min-h-dvh w-full flex-col items-center justify-center px-6 text-center"
        style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
      >
        <div
          className="flex h-24 w-24 items-center justify-center rounded-full"
          style={{
            background: 'linear-gradient(135deg, #1A7A4A, #0E8C7A)',
            color: '#fff',
            animation: 'dropIn 0.7s ease-out',
            boxShadow: '0 0 32px rgba(26,122,74,0.4)',
          }}
        >
          <Check size={48} strokeWidth={3} />
        </div>
        <h2 className="mt-4" style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)' }}>
          🎉 Shagun bhej diya!
        </h2>
        <p className="mt-2 max-w-[320px]" style={{ fontSize: 14, color: 'var(--muted)', lineHeight: 1.55 }}>
          ₹{fmt(amount)} ka shagun{' '}
          {recipients.find((r) => r.userId === recipientId)?.name} ke Gullak mein add ho gaya.{' '}
          Mubarak ho!
        </p>
      </main>
    );
  }

  return (
    <main
      className="anim-screen-enter flex min-h-dvh w-full flex-col"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/goals/${goalId}/family`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold" style={{ color: 'var(--trust)' }}>
          Gullak Shagun
        </span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pt-3 pb-2">
        {/* Hero */}
        <div className="text-center">
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={72}
            height={60}
            priority
            style={{
              width: 72,
              height: 60,
              objectFit: 'contain',
              animation: 'celebFly 2.4s ease-in-out infinite',
              transform: 'scaleX(-1)',
            }}
            className="mx-auto"
          />
          <h1 className="mt-2 text-balance" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            Apne Munafa se Shagun bhejein
          </h1>
          <p className="mt-1 text-[13px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            <span className="num font-bold" style={{ color: 'var(--growth)' }}>
              ₹{fmt(availableRupees)}
            </span>{' '}
            available · seedha{' '}
            <span style={{ fontWeight: 700 }}>{goalTitle}</span> mein
          </p>
        </div>

        {/* Recipient picker */}
        <div className="mt-5">
          <label className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Kisko bhejna hai?
          </label>
          <div className="mt-2 flex flex-col gap-2">
            {recipients.length === 0 && (
              <div
                className="rounded-card-lg px-4 py-3 text-[12.5px]"
                style={{ background: 'var(--bg-soft)', color: 'var(--muted)' }}
              >
                Family Gullak mein abhi koi nahi hai. Pehle kisi ko invite karein.
              </div>
            )}
            {recipients.map((r) => (
              <button
                key={r.userId}
                onClick={() => setRecipientId(r.userId)}
                className="haptic-press flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{
                  background: recipientId === r.userId ? 'linear-gradient(145deg, #FFE9D2, #FFF5EC)' : 'var(--surface)',
                  border: `2px solid ${recipientId === r.userId ? 'var(--saffron)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius-card)',
                }}
              >
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
                  style={{ background: 'linear-gradient(135deg, #0E8C7A, #1A7A4A)' }}
                >
                  {r.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-[14px] font-bold" style={{ color: 'var(--text)' }}>
                  {r.name}
                </span>
                {recipientId === r.userId && (
                  <Heart size={16} className="ml-auto" style={{ color: 'var(--saffron)' }} aria-hidden />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Occasion */}
        <div className="mt-4">
          <label className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Kaisa shagun?
          </label>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {OCCASIONS.map((o) => {
              const sel = occasion === o.id;
              return (
                <button
                  key={o.id}
                  onClick={() => setOccasion(o.id)}
                  className="haptic-press flex flex-col items-center gap-0.5 px-2 py-2.5"
                  style={{
                    background: sel ? '#FFE9D2' : 'var(--surface)',
                    border: `1.5px solid ${sel ? 'var(--saffron)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-card)',
                  }}
                >
                  <span style={{ fontSize: 22 }} aria-hidden>{o.emoji}</span>
                  <span className="text-[11px] font-bold" style={{ color: sel ? 'var(--saffron)' : 'var(--text)' }}>
                    {o.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Amount */}
        <div className="mt-4">
          <label className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Kitna shagun?
          </label>
          <div
            className="mt-2 px-4 py-3.5 text-center"
            style={{
              background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
              border: '2px solid var(--saffron)',
              borderRadius: 'var(--radius-card-lg)',
            }}
          >
            <input
              type="number"
              min={100}
              max={availableRupees}
              value={amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              className="num w-full bg-transparent text-center outline-none"
              style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)' }}
            />
            <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
              shagun ki rakam
            </div>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {PRESETS.filter((p) => p <= availableRupees).map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className="haptic-press num rounded-pill px-2.5 py-1 text-[12px] font-bold transition-all"
                style={{
                  background: amount === p ? 'var(--saffron)' : 'var(--surface)',
                  color: amount === p ? '#fff' : 'var(--text)',
                  border: `1px solid ${amount === p ? 'var(--saffron)' : 'var(--border)'}`,
                }}
              >
                ₹{fmt(p)}
              </button>
            ))}
          </div>
        </div>

        {/* Optional message */}
        <div className="mt-4">
          <label className="text-[11.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value.slice(0, 200))}
            placeholder="Ek pyaara message likhein…"
            className="mt-1.5 w-full px-3.5 py-3 text-[13px] outline-none"
            rows={2}
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              color: 'var(--text)',
              resize: 'none',
            }}
          />
        </div>

        {error && (
          <div
            className="mt-3 rounded-card-lg px-3 py-2 text-[12.5px]"
            style={{ background: 'rgba(192, 57, 43, 0.05)', border: '1px solid rgba(192, 57, 43, 0.25)', color: 'var(--warn)' }}
          >
            ⚠ {error}
          </div>
        )}
      </div>

      <div className="safe-bottom mx-auto w-full max-w-md px-5 pb-2 pt-2">
        <button
          onClick={submit}
          disabled={submitting || !recipientId || amount * 100 > availableMunafaPaise || amount < 1}
          className="haptic-press cta-primary flex h-14 w-full items-center justify-center gap-2 rounded-btn text-[15.5px] font-bold disabled:opacity-50"
        >
          {submitting ? 'Bhej rahe hain…' : `₹${fmt(amount)} Shagun bhejein`} <Gift size={16} />
        </button>
      </div>
    </main>
  );
}
