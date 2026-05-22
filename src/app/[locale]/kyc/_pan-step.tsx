'use client';

import { useState } from 'react';

interface Props {
  onVerified: (name: string) => void;
}

const ERROR_MESSAGES: Record<string, string> = {
  invalid_pan:      'Yeh PAN sahi nahi laga — ek baar check karein (e.g. ABCDE1234F).',
  pan_not_found:    'Yeh PAN Income Tax records mein nahi mila — sahi PAN daalo.',
  provider_error:   'Abhi thodi si takleef hai — 2 minute mein dobara try karein.',
  consent_required: 'Pehle hamare niyam maanne honge — page reload karein.',
  server_error:     'Kuch gadbad ho gayi — dobara try karein.',
};

export function PANStep({ onVerified }: Props) {
  const [pan, setPan] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const formatted = pan.toUpperCase().replace(/[^A-Z0-9]/g, '');

  async function handleVerify() {
    if (formatted.length !== 10) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/kyc/pan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pan: formatted }),
      });
      const data = await res.json() as { ok: boolean; name?: string; error?: string };

      if (data.ok && data.name) {
        onVerified(data.name);
      } else {
        setError(ERROR_MESSAGES[data.error ?? ''] ?? ERROR_MESSAGES.server_error);
      }
    } catch {
      setError(ERROR_MESSAGES.server_error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col px-5 py-10" style={{ background: '#FFF8F0' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="text-5xl mb-3">🪪</div>
        <h1 className="font-bold text-2xl mb-1" style={{ color: '#3E1F00' }}>
          Aapka PAN number
        </h1>
        <p className="text-sm leading-relaxed" style={{ color: '#7A5C3A' }}>
          Asli nivesh ke liye RBI ka niyam hai — ek baar PAN daalo, hamesha ke liye safe.
        </p>
      </div>

      {/* Why PAN card */}
      <div className="mb-6 rounded-2xl p-4" style={{ background: '#FFF3E0', border: '1px solid #F5E6D3' }}>
        <p className="text-xs font-semibold mb-1" style={{ color: '#C4602A' }}>Kyun zaroori hai?</p>
        <p className="text-xs leading-relaxed" style={{ color: '#7A5C3A' }}>
          PAN se aapka sona aur mutual fund — dono aapke naam par registered hote hain. Koi aur claim nahi kar sakta.
        </p>
      </div>

      {/* PAN input */}
      <div className="mb-2">
        <label className="block text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: '#C4602A' }}>
          PAN Number
        </label>
        <input
          type="text"
          value={formatted}
          onChange={(e) => setPan(e.target.value.slice(0, 10))}
          placeholder="ABCDE1234F"
          maxLength={10}
          className="w-full rounded-2xl border-2 px-4 py-4 text-center text-xl font-mono tracking-widest outline-none transition-colors"
          style={{
            borderColor: error ? '#C0392B' : formatted.length === 10 ? '#E8650A' : '#E8D5C0',
            color: '#3E1F00',
            background: '#fff',
          }}
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        <p className="mt-1 text-right text-xs" style={{ color: '#C4602A' }}>
          {formatted.length}/10
        </p>
      </div>

      {error && (
        <p className="mb-4 text-sm" style={{ color: '#C0392B' }}>{error}</p>
      )}

      {/* Example hint */}
      <p className="mb-8 text-xs" style={{ color: '#B0906A' }}>
        Format: 5 letters · 4 numbers · 1 letter — jaise ABCDE1234F
      </p>

      <button
        onClick={handleVerify}
        disabled={formatted.length !== 10 || loading}
        className="w-full rounded-2xl py-4 font-bold text-white text-lg transition-opacity disabled:opacity-40"
        style={{ background: '#E8650A' }}
      >
        {loading ? 'Check ho raha hai...' : 'PAN verify karein →'}
      </button>

      <p className="mt-4 text-center text-xs" style={{ color: '#B0906A' }}>
        🔒 Aapka PAN sirf Income Tax records se match kiya jaata hai — hum store nahi karte
      </p>
    </div>
  );
}
