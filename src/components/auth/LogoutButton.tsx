'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export function LogoutButton({ locale }: { locale: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const signOut = async () => {
    if (busy) return;
    if (!confirm('Logout karna chahte hain?')) return;
    setBusy(true);
    try {
      await fetch('/api/auth/signout', { method: 'POST' });
    } catch {
      // ignore — destroying session is best-effort
    }
    router.push(`/${locale}/onboarding/phone`);
    router.refresh();
  };

  return (
    <button
      type="button"
      onClick={signOut}
      disabled={busy}
      aria-label="Logout"
      className="haptic-press flex h-8 w-8 items-center justify-center rounded-full text-trust disabled:opacity-50"
    >
      <LogOut size={16} />
    </button>
  );
}
