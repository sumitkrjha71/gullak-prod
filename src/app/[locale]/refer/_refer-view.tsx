'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Copy, Check, Share2, Gift, Users } from 'lucide-react';

type Ref = {
  id: string;
  status: string;
  rewardPaise: number;
  joinedAt: string | null;
  createdAt: string;
};

export function ReferView({
  locale,
  code,
  totalEarnedPaise,
  referrals,
}: {
  locale: string;
  code: string;
  totalEarnedPaise: number;
  referrals: Ref[];
}) {
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const fmt = (paise: number) => '₹' + new Intl.NumberFormat('en-IN').format(Math.round(paise / 100));
  const inviteUrl = `${origin}/${locale}/onboarding/phone?ref=${code}`;
  const earnedRupees = Math.round(totalEarnedPaise / 100);

  const message = `Namaste! 🙏

Maine Gullak app try kiya — chai-samosa wale paise se invest karne ka shaandar tareeka. Aap bhi try karein —

🎁 Mera referral code: ${code}
₹100 dono ko milega Gullak mein.

${inviteUrl}`;

  const copyCode = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Gullak — Bachat ki nayi aadat', text: message, url: inviteUrl });
      } catch {
        // user cancelled
      }
    } else {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    }
  };

  const successCount = referrals.filter((r) => r.status === 'REWARDED' || r.status === 'JOINED').length;
  const pendingCount = referrals.filter((r) => r.status === 'PENDING').length;

  return (
    <main
      className="anim-screen-enter flex min-h-dvh w-full flex-col"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${locale}/profile`}
          aria-label="Back"
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold" style={{ color: 'var(--trust)' }}>
          Refer & Earn
        </span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pt-3 pb-2">
        {/* Hero */}
        <div className="text-center">
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={84}
            height={70}
            priority
            style={{
              width: 84,
              height: 70,
              objectFit: 'contain',
              animation: 'gentleFloat 2.6s ease-in-out infinite',
            }}
            className="mx-auto"
          />
          <h1 className="mt-2 text-balance" style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>
            Yaar ko Gullak dilao, dono ko ₹100!
          </h1>
          <p className="mt-1.5 mx-auto max-w-[340px] text-[13.5px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            Aapka referral code share karein. Jab woh signup karein, ₹100 aapke Gullak mein, ₹100 unke Gullak mein — instantly.
          </p>
        </div>

        {/* Earnings card */}
        <div
          className="mt-5 px-4 py-4 text-center"
          style={{
            background: 'linear-gradient(145deg, #f0f7e6, #e6f7f4)',
            border: '2px solid var(--growth)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: '0 6px 18px rgba(26, 122, 74, 0.18)',
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--growth)' }}>
            Aapne kamaye
          </div>
          <div className="num mt-1 leading-none" style={{ fontSize: 38, fontWeight: 900, color: 'var(--text)' }}>
            ₹{new Intl.NumberFormat('en-IN').format(earnedRupees)}
          </div>
          <div className="mt-1 text-[11.5px]" style={{ color: 'var(--muted)' }}>
            referrals se · seedha aapke Gullak mein
          </div>
        </div>

        {/* Code card */}
        <div
          className="mt-4 px-4 py-4"
          style={{
            background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
            border: '2px solid var(--saffron)',
            borderRadius: 'var(--radius-card-lg)',
          }}
        >
          <div className="text-center">
            <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--saffron)' }}>
              Aapka referral code
            </div>
            <div
              className="num mt-1.5 select-all"
              style={{
                fontSize: 30,
                fontWeight: 900,
                color: 'var(--text)',
                letterSpacing: 4,
                fontFamily: "'Courier New', monospace",
              }}
            >
              {code}
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              onClick={copyCode}
              className="haptic-press flex h-11 items-center justify-center gap-1.5 rounded-btn font-bold"
              style={{
                background: copied ? 'var(--growth)' : 'var(--surface)',
                border: `1px solid ${copied ? 'var(--growth)' : 'var(--border)'}`,
                color: copied ? '#fff' : 'var(--text)',
                fontSize: 13,
                transition: 'all 0.2s ease',
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copy hua' : 'Copy karein'}
            </button>
            <button
              onClick={share}
              className="haptic-press flex h-11 items-center justify-center gap-1.5 rounded-btn font-bold"
              style={{ background: '#25D366', color: '#fff', fontSize: 13 }}
            >
              <Share2 size={14} />
              WhatsApp
            </button>
          </div>
        </div>

        {/* How it works */}
        <div
          className="mt-4 px-4 py-3.5"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <div className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
            Kaise kaam karta hai
          </div>
          <ol className="mt-2 flex flex-col gap-2 text-[13px]" style={{ color: 'var(--text)' }}>
            <li className="flex gap-2.5">
              <span className="num flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: 'var(--saffron)', color: '#fff' }}>1</span>
              <span>Apna code yaar ko bhejein WhatsApp pe</span>
            </li>
            <li className="flex gap-2.5">
              <span className="num flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: 'var(--saffron)', color: '#fff' }}>2</span>
              <span>Wo Gullak app install kare, code daale</span>
            </li>
            <li className="flex gap-2.5">
              <span className="num flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: 'var(--saffron)', color: '#fff' }}>3</span>
              <span>₹100 dono ko milega — instantly Gullak mein</span>
            </li>
          </ol>
        </div>

        {/* Referrals list */}
        {referrals.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Aapke {referrals.length} referrals
            </h3>
            <div className="flex flex-col gap-2">
              {referrals.slice(0, 8).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-3 py-2.5"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                  }}
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                    style={{
                      background:
                        r.status === 'REWARDED'
                          ? 'var(--growth)'
                          : r.status === 'JOINED'
                          ? 'var(--saffron)'
                          : 'var(--muted-light)',
                      color: '#fff',
                    }}
                  >
                    {r.status === 'REWARDED' ? <Check size={16} /> : <Users size={14} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                      {r.status === 'REWARDED'
                        ? 'Reward credit ho gaya'
                        : r.status === 'JOINED'
                        ? 'Join ho gaye, reward processing'
                        : 'Pending — invite bheja, abhi tak join nahi kiya'}
                    </div>
                    <div className="num mt-0.5 text-[10.5px]" style={{ color: 'var(--muted)' }}>
                      {new Date(r.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {r.joinedAt && ` · joined ${new Date(r.joinedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`}
                    </div>
                  </div>
                  {r.status === 'REWARDED' && (
                    <span className="num text-[13px] font-extrabold" style={{ color: 'var(--growth)' }}>
                      +{fmt(r.rewardPaise)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {referrals.length === 0 && (
          <div
            className="mt-5 flex items-start gap-2.5 rounded-card-lg px-3.5 py-3"
            style={{ background: 'var(--bg-highlight)', border: '1px dashed var(--saffron)' }}
          >
            <Gift size={18} className="flex-shrink-0" style={{ color: 'var(--saffron)' }} aria-hidden />
            <div className="flex-1">
              <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
                Pehla yaar bulao
              </div>
              <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
                Code share karein WhatsApp pe — Gullak grow karte raho!
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
