'use client';

import Link from 'next/link';

type Active = 'home' | 'goals' | 'khata' | 'portfolio' | 'profile';

export function BottomNav({
  locale,
  active,
  labels,
}: {
  locale: string;
  active: Active;
  labels: { home: string; goals: string; portfolio: string; profile: string; khata: string };
}) {
  const items: { key: Active; icon: string; label: string; href: string }[] = [
    { key: 'home',      icon: '🏠', label: labels.home,      href: `/${locale}/home`      },
    { key: 'goals',     icon: '🎯', label: labels.goals,     href: `/${locale}/goals`     },
    { key: 'khata',     icon: '📒', label: labels.khata,     href: `/${locale}/khata`     },
    { key: 'portfolio', icon: '📊', label: labels.portfolio, href: `/${locale}/portfolio` },
    { key: 'profile',   icon: '👤', label: labels.profile,   href: `/${locale}/profile`   },
  ];

  return (
    <nav
      className="safe-bottom fixed bottom-0 left-0 right-0 mx-auto flex max-w-md items-center justify-around border-t bg-surface py-2"
      style={{ borderColor: 'var(--border)' }}
    >
      {items.map((n) => {
        const isActive = active === n.key;
        return (
          <Link
            key={n.key}
            href={n.href}
            className="haptic-press flex flex-col items-center gap-0.5 text-[10px] font-semibold"
            style={{ color: isActive ? 'var(--saffron)' : 'var(--muted-light)' }}
          >
            <span style={{ fontSize: 18 }} aria-hidden>
              {n.icon}
            </span>
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}
