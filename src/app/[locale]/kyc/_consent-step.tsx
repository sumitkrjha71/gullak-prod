'use client';

import { useState } from 'react';

const CONSENT_ITEMS = [
  {
    icon: '🔒',
    title: 'Aapka data sirf aapka',
    body: 'Hum aapki koi bhi jaankari kisi ko bechte nahi — kabhi nahi.',
  },
  {
    icon: '📋',
    title: 'Hamare niyam',
    body: 'Gullak ki Terms of Service aur Privacy Policy aap ne padhi aur maani.',
  },
  {
    icon: '🏦',
    title: 'Pehchaan zaroori hai',
    body: 'RBI ke niyam ke mutabiq, asli nivesh ke liye PAN zaroori hai.',
  },
];

interface Props {
  onAccepted: () => void;
}

export function ConsentStep({ onAccepted }: Props) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleAccept() {
    if (!checked) return;
    setLoading(true);
    setError('');
    try {
      // Record TERMS + PRIVACY consent in a single compound call
      await Promise.all([
        fetch('/api/kyc/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consentType: 'TERMS', action: 'ACCEPTED' }),
        }),
        fetch('/api/kyc/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ consentType: 'PRIVACY', action: 'ACCEPTED' }),
        }),
      ]);
      onAccepted();
    } catch {
      setError('Kuch gadbad ho gayi — dobara try karein.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-5 py-10" style={{ background: '#FFF8F0' }}>
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-5xl mb-3">🤝</div>
        <h1 className="font-bold text-2xl mb-1" style={{ color: '#3E1F00' }}>
          Ek chhota sa vaada
        </h1>
        <p className="text-sm" style={{ color: '#C4602A' }}>
          Aage badhne se pehle — bas yeh teen baatein
        </p>
      </div>

      {/* Trust points */}
      <div className="flex flex-col gap-4 mb-8">
        {CONSENT_ITEMS.map((item) => (
          <div
            key={item.title}
            className="flex items-start gap-4 rounded-2xl p-4"
            style={{ background: '#fff', border: '1px solid #F5E6D3' }}
          >
            <span className="text-2xl mt-0.5">{item.icon}</span>
            <div>
              <p className="font-semibold text-sm mb-0.5" style={{ color: '#3E1F00' }}>
                {item.title}
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#7A5C3A' }}>
                {item.body}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Checkbox */}
      <label className="flex items-start gap-3 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => setChecked(e.target.checked)}
          className="mt-1 h-5 w-5 rounded accent-orange-600"
        />
        <span className="text-sm leading-relaxed" style={{ color: '#3E1F00' }}>
          Haan, maine Gullak ki{' '}
          <a href="/legal/terms" className="underline" style={{ color: '#E8650A' }} target="_blank">
            Terms of Service
          </a>{' '}
          aur{' '}
          <a href="/legal/privacy" className="underline" style={{ color: '#E8650A' }} target="_blank">
            Privacy Policy
          </a>{' '}
          padhi aur samajhi. Main agree karta/karti hoon.
        </span>
      </label>

      {error && (
        <p className="mb-4 text-center text-sm" style={{ color: '#C0392B' }}>{error}</p>
      )}

      <button
        onClick={handleAccept}
        disabled={!checked || loading}
        className="w-full rounded-2xl py-4 font-bold text-white text-lg transition-opacity disabled:opacity-40"
        style={{ background: '#E8650A' }}
      >
        {loading ? 'Ek second...' : 'Haan, aage chalein →'}
      </button>
    </div>
  );
}
