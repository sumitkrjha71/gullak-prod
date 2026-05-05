'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff, Check } from 'lucide-react';

type State = 'unsupported' | 'denied' | 'unsubscribed' | 'subscribing' | 'subscribed' | 'sending-test';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const arr = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    arr[i] = rawData.charCodeAt(i);
  }
  return arr;
}

export function PushSubscribeButton() {
  const [state, setState] = useState<State>('unsubscribed');
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setState('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setState('denied');
      return;
    }
    fetch('/api/push/subscribe')
      .then((r) => r.json())
      .then((j) => {
        if (j.ok && j.publicKey) setPublicKey(j.publicKey);
      })
      .catch(() => {});
    // Check if we already have a subscription
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        if (sub) setState('subscribed');
      });
    });
  }, []);

  const subscribe = async () => {
    if (!publicKey) {
      setError('Push abhi enabled nahi hai. Demo mode ke baad available hoga.');
      return;
    }
    setState('subscribing');
    setError(null);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'unsubscribed');
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      const json = sub.toJSON();
      const r = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });
      if (!r.ok) throw new Error('save_failed');
      setState('subscribed');
    } catch (e) {
      setError('Kuch dikkat aa gayi. Phir try karein.');
      setState('unsubscribed');
    }
  };

  const unsubscribe = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await sub.unsubscribe();
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      }
      setState('unsubscribed');
    } catch {
      setError('Unsubscribe nahi ho paya.');
    }
  };

  const sendTest = async () => {
    setState('sending-test');
    try {
      const r = await fetch('/api/push/send-test', { method: 'POST' });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        setError(j.hint || 'Test bheja nahi gaya. Refresh karke phir try karein.');
      }
    } finally {
      setTimeout(() => setState('subscribed'), 800);
    }
  };

  if (state === 'unsupported') {
    return (
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 text-[12.5px]"
        style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}
      >
        <BellOff size={14} style={{ color: 'var(--muted)' }} aria-hidden />
        <span style={{ color: 'var(--muted)' }}>Yeh browser push notifications support nahi karta.</span>
      </div>
    );
  }

  if (state === 'denied') {
    return (
      <div
        className="flex items-center gap-2.5 px-3.5 py-3 text-[12.5px]"
        style={{ background: '#FFF1E5', border: '1px solid var(--saffron)', borderRadius: 'var(--radius-card)' }}
      >
        <BellOff size={14} style={{ color: 'var(--saffron)' }} aria-hidden />
        <span style={{ color: 'var(--text)' }}>
          Notifications block ho rakhi hain. Browser settings mein jaakar enable karein.
        </span>
      </div>
    );
  }

  if (state === 'subscribed' || state === 'sending-test') {
    return (
      <div className="flex flex-col gap-2">
        <div
          className="flex items-center gap-2.5 px-3.5 py-3"
          style={{
            background: 'linear-gradient(145deg, #f0f7e6, #e6f7f4)',
            border: '1px solid var(--growth)',
            borderRadius: 'var(--radius-card)',
          }}
        >
          <Check size={14} style={{ color: 'var(--growth)' }} aria-hidden />
          <span className="text-[12.5px] font-bold" style={{ color: 'var(--growth)' }}>
            Push notifications ON
          </span>
          <span className="ml-auto text-[11px]" style={{ color: 'var(--muted)' }}>
            Salary day · Tier unlock · Festival reminders
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={sendTest}
            disabled={state === 'sending-test'}
            className="haptic-press flex-1 rounded-btn px-3 py-2 text-[12px] font-bold disabled:opacity-50"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
          >
            {state === 'sending-test' ? 'Bhej rahe…' : '🔔 Test bhejein'}
          </button>
          <button
            onClick={unsubscribe}
            className="haptic-press rounded-btn px-3 py-2 text-[12px] font-bold"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            Bandh karein
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={subscribe}
        disabled={state === 'subscribing'}
        className="haptic-press flex items-center gap-2.5 px-3.5 py-3 text-left transition-all"
        style={{
          background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
          border: '1.5px solid var(--saffron)',
          borderRadius: 'var(--radius-card)',
        }}
      >
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: 'var(--saffron)', color: '#fff' }}
          aria-hidden
        >
          <Bell size={15} />
        </div>
        <div className="flex-1">
          <div className="text-[13.5px] font-bold" style={{ color: 'var(--text)' }}>
            {state === 'subscribing' ? 'Permission le rahe hain…' : 'Push notifications enable karein'}
          </div>
          <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
            Salary-day reminder · tier unlock · festival nudge
          </div>
        </div>
      </button>
      {error && (
        <div className="text-[11.5px]" style={{ color: 'var(--warn)' }}>
          ⚠ {error}
        </div>
      )}
    </div>
  );
}
