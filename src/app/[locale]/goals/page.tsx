import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Plus } from 'lucide-react';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { progressPct, remainingPaise } from '@/lib/goals/math';
import { templateFor, type GoalType } from '@/lib/goals/defaults';
import { BottomNav } from '@/components/nav/BottomNav';

export default async function GoalsListPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const goals = await prisma.goal.findMany({
    where: { userId: session.userId, status: 'active' },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });

  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(n);

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter pb-20"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header
        className="safe-top flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--trust-soft)' }}
      >
        <div>
          <h1
            className="font-tiro"
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}
          >
            Aapke Sapne
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--trust)' }}>
            {goals.length} active {goals.length === 1 ? 'goal' : 'goals'}
          </p>
        </div>
        <Link
          href={`/${locale}/goals/new`}
          className="haptic-press flex items-center gap-1 rounded-pill px-3 py-2 text-[12px] font-bold"
          style={{ background: 'var(--saffron)', color: '#FFF8F0' }}
        >
          <Plus size={14} aria-hidden /> Naya
        </Link>
      </header>

      {goals.length === 0 ? (
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={120}
            height={100}
            priority
            className="anim-float"
            style={{
              width: 120,
              height: 100,
              objectFit: 'contain',
              filter: 'drop-shadow(0 6px 14px rgba(196, 96, 42, 0.18))',
            }}
          />
          <h2 className="mt-4" style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>
            Pehla sapna chunein
          </h2>
          <p className="mt-1 text-[14px]" style={{ color: 'var(--muted)' }}>
            Roz thoda — kal bada
          </p>
          <Link
            href={`/${locale}/goals/new`}
            className="haptic-press cta-primary mt-5 inline-flex h-12 items-center justify-center rounded-btn px-6 text-[15px] font-bold"
          >
            Goal chunein →
          </Link>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-md flex-1 px-4 pt-4">
          <div className="flex flex-col gap-3">
            {goals.map((g) => {
              const tpl = templateFor(g.type as GoalType);
              const saved = Math.round(Number(g.savedPaise) / 100);
              const target = Math.round(Number(g.targetPaise) / 100);
              const pct = progressPct(g.savedPaise, g.targetPaise);
              const remaining = Math.round(remainingPaise(g.savedPaise, g.targetPaise) / 100);

              return (
                <Link
                  key={g.id}
                  href={`/${locale}/goals/${g.id}`}
                  className="haptic-press flex items-stretch gap-3 px-4 py-4 transition-all"
                  style={{
                    background: g.isPrimary
                      ? 'linear-gradient(145deg, #FFF5EC, #FFE9D2)'
                      : 'var(--surface)',
                    border: `2px solid ${g.isPrimary ? 'var(--saffron)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-card-lg)',
                    boxShadow: g.isPrimary ? '0 6px 18px rgba(232,101,10,0.12)' : 'var(--shadow-card)',
                  }}
                >
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-card"
                    style={{ background: 'var(--bg)' }}
                  >
                    <span style={{ fontSize: 32 }} aria-hidden>
                      {tpl.emoji}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className="truncate"
                        style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}
                      >
                        {g.title}
                      </span>
                      {g.isPrimary && (
                        <span
                          className="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                          style={{ background: 'var(--saffron)', color: '#FFF8F0' }}
                        >
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <div className="num mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>
                      ₹{fmt(saved)} / ₹{fmt(target)}
                    </div>
                    <div
                      className="mt-2 h-[6px] overflow-hidden rounded-full"
                      style={{ background: 'var(--border)' }}
                    >
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(pct, 100)}%`,
                          background: 'linear-gradient(90deg, #E8650A, #D4A017)',
                        }}
                      />
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[10.5px]">
                      <span style={{ color: 'var(--saffron)', fontWeight: 700 }}>{pct}%</span>
                      <span className="num" style={{ color: 'var(--muted)' }}>
                        ₹{fmt(remaining)} aur
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} aria-hidden style={{ color: 'var(--muted-light)', alignSelf: 'center' }} />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <BottomNav locale={locale} active="goals" labels={{
        home: t('dash.navHome'),
        goals: t('dash.navGoals'),
        portfolio: t('dash.navPortfolio'),
        profile: t('dash.navProfile'),
      }} />
    </main>
  );
}
