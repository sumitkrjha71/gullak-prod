'use client';

import Link from 'next/link';
import { Home, Target, BookOpen, LineChart, User } from 'lucide-react';
import { track } from '@/lib/analytics/track';

// Bottom nav — fintech-grade icon set replacing the emoji bottom row.
//
// Charter alignment:
//   - Lucide icons at stroke 1.75 / size 22 (default stroke 2 looks like
//     a wireframe at small sizes)
//   - Active = var(--ink-900), inactive = var(--ink-500). No saffron.
//   - Bharat-voice labels preserved via the labels prop.
//   - track('nav_tap', { to }) on every tap for funnel analytics.

type Active = 'home' | 'goals' | 'khata' | 'portfolio' | 'profile';

const ICON_MAP: Record<Active, typeof Home> = {
  home:      Home,
  goals:     Target,
  khata:     BookOpen,
  portfolio: LineChart,
  profile:   User,
};

export function BottomNav({
  locale,
  active,
  labels,
}: {
  locale: string;
  active: Active;
  labels: { home: string; goals: string; portfolio: string; profile: string; khata: string };
}) {
  const items: { key: Active; label: string; href: string }[] = [
    { key: 'home',      label: labels.home,      href: `/${locale}/home`      },
    { key: 'goals',     label: labels.goals,     href: `/${locale}/goals`     },
    { key: 'khata',     label: labels.khata,     href: `/${locale}/khata`     },
    { key: 'portfolio', label: labels.portfolio, href: `/${locale}/portfolio` },
    { key: 'profile',   label: labels.profile,   href: `/${locale}/profile`   },
  ];

  return (
    <nav
      className="safe-bottom fixed bottom-0 left-0 right-0 mx-auto flex max-w-md items-center justify-around py-2"
      style={{
        background: 'var(--surface-elev)',
        borderTop: '1px solid var(--ink-100)',
      }}
      aria-label="Primary"
    >
      {items.map((n) => {
        const isActive = active === n.key;
        const Icon = ICON_MAP[n.key];
        return (
          <Link
            key={n.key}
            href={n.href}
            onClick={() => track('nav_tap', { to: n.key, from: active })}
            aria-current={isActive ? 'page' : undefined}
            className="haptic-press flex flex-col items-center gap-1 px-3 py-1"
            style={{
              minHeight: 44,
              minWidth:  44,
              color: isActive ? 'var(--ink-900)' : 'var(--ink-500)',
            }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2 : 1.75}
              aria-hidden
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: isActive ? 700 : 600,
                letterSpacing: 0.01,
              }}
            >
              {n.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
