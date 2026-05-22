import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Globe, Shield, Bell, PauseCircle, HelpCircle, LogOut, Trophy, ChevronRight, Gift } from 'lucide-react';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { BottomNav } from '@/components/nav/BottomNav';
import { localeLabels, locales } from '@/lib/i18n/config';
import { PushSubscribeButton } from '@/components/push/PushSubscribeButton';

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  // Stale session or DB unreachable → bounce to phone entry (NOT to splash,
  // which would re-redirect here and loop). The session cookie stays; OTP
  // re-login will issue a fresh one.
  const user = await prisma.user
    .findUnique({
      where: { id: session.userId },
      include: {
        streak: true,
        goals: { where: { status: 'active' } },
        transactions: { where: { status: 'success' } },
      },
    })
    .catch(() => null);
  if (!user) redirect(`/${locale}/onboarding/phone`);

  const totalGrowth = user.goals.reduce((s, g) => s + Number(g.growthPaise), 0);
  const phoneMasked = user.phone.replace(/(\d{2})\d{6}(\d{2})/, '$1******$2');
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n / 100));

  return (
    <main
      className="flex min-h-dvh w-full flex-col anim-screen-enter pb-20"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      <header
        className="safe-top px-4 py-3"
        style={{ background: 'var(--trust-soft)' }}
      >
        <h1
          className="font-tiro"
          style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}
        >
          Profile
        </h1>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pt-4">
        {/* Profile card */}
        <div
          className="flex items-center gap-4 px-4 py-4"
          style={{
            background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
            border: '2px solid var(--saffron)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: '0 6px 18px rgba(232,101,10,0.12)',
          }}
        >
          <Image
            src="/assets/chiraiya-v2.png"
            alt=""
            width={64}
            height={54}
            priority
            className="anim-float"
            style={{
              width: 64,
              height: 54,
              objectFit: 'contain',
              filter: 'drop-shadow(0 4px 10px rgba(196, 96, 42, 0.18))',
            }}
          />
          <div className="flex-1">
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)' }}>
              {user.name ?? 'Dost'}
            </div>
            <div className="num mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>
              +91 {phoneMasked}
            </div>
            {user.kycCompleted ? (
              <span
                className="mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'var(--growth-soft)', color: 'var(--growth)' }}
              >
                ✓ KYC Done
              </span>
            ) : (
              <span
                className="mt-1 inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[10px] font-bold"
                style={{ background: 'var(--bg-highlight)', color: 'var(--saffron)' }}
              >
                KYC pending
              </span>
            )}
          </div>
        </div>

        {/* Savestment journey stats */}
        <h2
          className="mt-5 text-[12px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--terracotta)' }}
        >
          Aapki Savestment journey
        </h2>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <Stat icon="🔥" label="Streak" value={`${user.streak?.currentDays ?? 0} din`} />
          <Stat icon="🏆" label="Longest" value={`${user.streak?.longestDays ?? 0} din`} />
          <Stat icon="💰" label="Munafa" value={`₹${fmt(totalGrowth)}`} />
        </div>

        {/* V5 M9 — Refer & Earn entry */}
        <Link
          href={`/${locale}/refer`}
          className="haptic-press mt-5 flex items-center gap-3 px-4 py-3.5"
          style={{
            background: 'linear-gradient(145deg, #f0f7e6, #e6f7f4)',
            border: '1.5px solid var(--growth)',
            borderRadius: 'var(--radius-card-lg)',
          }}
        >
          <div
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--growth)', color: '#fff' }}
            aria-hidden
          >
            <Gift size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>
              Refer & Earn ₹100
            </div>
            <div className="mt-0.5 text-[12px]" style={{ color: 'var(--muted)' }}>
              Yaar ko Gullak dilao, dono ko ₹100
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--growth)' }} aria-hidden />
        </Link>

        {/* V5 M11 — Push notifications */}
        <div className="mt-4">
          <h3
            className="mb-2 px-1 text-[11.5px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--muted-light)' }}
          >
            Push Notifications
          </h3>
          <PushSubscribeButton />
        </div>

        {/* V5 M7 — Investor pitch link */}
        <Link
          href={`/${locale}/pitch`}
          className="haptic-press mt-4 flex items-center gap-3 px-4 py-3"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-card-lg)',
          }}
        >
          <div
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
            style={{ background: 'var(--bg-soft)', color: 'var(--saffron)' }}
            aria-hidden
          >
            <Trophy size={16} />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-bold" style={{ color: 'var(--text)' }}>
              Gullak ka safar
            </div>
            <div className="text-[11px]" style={{ color: 'var(--muted)' }}>
              Bharat ka pehla Savestment platform — kahaani
            </div>
          </div>
          <ChevronRight size={16} style={{ color: 'var(--muted)' }} aria-hidden />
        </Link>

        {/* Sections */}
        <Section title="Settings">
          <Row
            href={`/${locale}/settings`}
            icon={<Globe size={18} aria-hidden />}
            label="Language"
            sub={localeLabels[locale as (typeof locales)[number]] ?? 'English'}
          />
          <Row
            href={`/${locale}/settings`}
            icon={<Bell size={18} aria-hidden />}
            label="Notifications"
            sub="Salary, round-up, weekly"
          />
          <Row
            href={`/${locale}/settings`}
            icon={<PauseCircle size={18} aria-hidden />}
            label="Saving rules"
            sub="Pause / resume / stop"
          />
        </Section>

        <Section title="Trust & Security">
          <Row
            href={`/${locale}/transparency`}
            icon={<Shield size={18} aria-hidden />}
            label="Where is my money?"
            sub="Full transparency"
          />
          <Row
            href={`/${locale}/aa/connect`}
            icon={<Trophy size={18} aria-hidden />}
            label="Bank connection (AA)"
            sub={user.aaConsentLinkedAt ? 'Connected' : 'Not connected'}
          />
        </Section>

        <Section title="Help">
          <Row
            href={`/${locale}/settings`}
            icon={<HelpCircle size={18} aria-hidden />}
            label="Help & Support"
            sub="Hum yahan hain"
          />
          <Row
            href={`/${locale}`}
            icon={<LogOut size={18} aria-hidden />}
            label="Sign out"
            sub=""
            danger
          />
        </Section>

        <p
          className="mt-6 text-center text-[10.5px]"
          style={{ color: 'var(--muted-light)', letterSpacing: 0.3 }}
        >
          GULLAK V4 · Made in Bharat 🇮🇳
        </p>
      </div>

      <BottomNav locale={locale} active="profile" labels={{
        home: t('dash.navHome'),
        goals: t('dash.navGoals'),
        khata: 'Khata',
        portfolio: t('dash.navPortfolio'),
        profile: t('dash.navProfile'),
      }} />
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <h3
        className="px-1 text-[11.5px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--muted-light)' }}
      >
        {title}
      </h3>
      <div
        className="mt-2 overflow-hidden"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card-lg)',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function Row({
  href,
  icon,
  label,
  sub,
  danger,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  sub?: string;
  danger?: boolean;
}) {
  return (
    <Link
      href={href}
      className="haptic-press flex items-center gap-3 border-b px-4 py-3 last:border-b-0"
      style={{ borderColor: 'var(--border-light)' }}
    >
      <span
        className="flex h-9 w-9 items-center justify-center rounded-card"
        style={{
          background: danger ? '#fce8e6' : 'var(--bg-soft)',
          color: danger ? 'var(--warn)' : 'var(--terracotta)',
        }}
      >
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: danger ? 'var(--warn)' : 'var(--text)',
          }}
        >
          {label}
        </div>
        {sub && (
          <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
            {sub}
          </div>
        )}
      </div>
      <ChevronRight size={16} aria-hidden style={{ color: 'var(--muted-light)' }} />
    </Link>
  );
}

function Stat({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div
      className="px-2 py-3 text-center"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <div style={{ fontSize: 22 }} aria-hidden>{icon}</div>
      <div className="num mt-0.5 text-[13px] font-extrabold" style={{ color: 'var(--text)' }}>
        {value}
      </div>
      <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
    </div>
  );
}
