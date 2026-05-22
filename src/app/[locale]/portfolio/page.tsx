import { setRequestLocale, getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TrendingUp, Shield, Coins, FileText, Info } from 'lucide-react';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { getGoldPrice } from '@/lib/gold/price-cache';
import { BottomNav } from '@/components/nav/BottomNav';
import { MunafaChart } from '@/components/money/MunafaChart';
import { buildChartSeries } from '@/lib/money/series';
import { InstrumentPie } from '@/components/money/InstrumentPie';

const INSTRUMENTS = [
  {
    pct: 55,
    name: 'Government Bonds',
    sub: 'Sarkari bond — sabse safe',
    body: 'Government of India ke bonds. Risk almost zero. Returns predictable. Backbone of safe investing.',
    color: '#0E8C7A',
    icon: '🏛️',
  },
  {
    pct: 25,
    name: 'Gold Bonds (SGB)',
    sub: 'Digital sona — government issued',
    body: 'Sovereign Gold Bonds. Real gold ki value, but storage tension nahi. Tax benefits bhi.',
    color: '#D4A017',
    icon: '🪙',
  },
  {
    pct: 20,
    name: 'AAA-Rated Corporate Paper',
    sub: 'Top-rated companies — CRISIL ne pass kiya',
    body: 'Top-rated companies ke debt instruments. CRISIL/ICRA ne sabse achi rating di hai. Default risk near-zero.',
    color: '#1A7A4A',
    icon: '📜',
  },
];

export default async function PortfolioPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale });

  const session = await readSession();
  if (!session) redirect(`/${locale}`);

  const goldProvider = process.env.GOLD_REAL === 'true' ? 'safegold' : 'mock';

  const [goals, goldHolding, goldPrice, mfHoldings] = await Promise.all([
    prisma.goal.findMany({ where: { userId: session.userId, status: 'active' } }),
    prisma.investmentHolding.findUnique({
      where: { userId_assetType_provider: { userId: session.userId, assetType: 'gold', provider: goldProvider } },
    }),
    getGoldPrice(),
    prisma.mFHolding.findMany({
      where:   { userId: session.userId, totalMicroUnits: { gt: 0n } },
      include: { fund: { select: { schemeName: true, category: true, navPaise: true, navDate: true } } },
    }),
  ]);

  // Pull last 365d of successful transactions for the chart.
  const since = new Date(Date.now() - 365 * 86400000);
  const txns = await prisma.transaction.findMany({
    where: { userId: session.userId, status: 'success', createdAt: { gte: since } },
    orderBy: { createdAt: 'asc' },
  });

  // Gold P&L
  const goldGrams       = goldHolding ? Number(goldHolding.totalMicrograms) / 1_000_000 : 0;
  const goldInvested    = goldHolding ? Number(goldHolding.investedPaise) : 0;
  const goldCurrentPaise = goldHolding
    ? Number((goldHolding.totalMicrograms * goldPrice.sellPaisePerGram) / 1_000_000n)
    : 0;
  const goldPnl         = goldCurrentPaise - goldInvested;

  // MF totals
  const mfTotalInvested = mfHoldings.reduce((s, h) => s + Number(h.investedPaise), 0);
  const mfTotalValue    = mfHoldings.reduce((h, holding) => {
    const val = holding.fund.navPaise > 0n
      ? Number((holding.totalMicroUnits * holding.fund.navPaise) / 1_000_000n)
      : Number(holding.investedPaise);
    return h + val;
  }, 0);
  const mfPnl           = mfTotalValue - mfTotalInvested;

  const totalSaved = goals.reduce((s, g) => s + Number(g.savedPaise), 0);
  const totalGrowth = goals.reduce((s, g) => s + Number(g.growthPaise), 0);
  const totalInvested = goals.reduce((s, g) => s + Number(g.investedPaise), 0);
  const fmt = (n: number) => new Intl.NumberFormat('en-IN').format(Math.round(n / 100));

  const totalDisplay = totalSaved + totalGrowth;
  const growthPct = totalSaved > 0 ? ((totalGrowth / totalSaved) * 100).toFixed(2) : '0.00';

  const chartSeries = buildChartSeries({
    userId: session.userId,
    transactions: txns.map((t) => ({
      amountPaise: Number(t.amountPaise),
      status: t.status,
      createdAt: t.createdAt,
    })),
    totalSavedRupees: Math.round(totalSaved / 100),
    totalMunafaRupees: Math.round(totalGrowth / 100),
  });

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
          Aapka Portfolio
        </h1>
        <p className="text-[12px]" style={{ color: 'var(--trust)' }}>
          Aapka paisa kahan, kab, kyun
        </p>
      </header>

      <div className="mx-auto w-full max-w-md flex-1 px-4 pt-4">
        {/* Top stat — total */}
        <div
          className="px-5 py-5 text-center"
          style={{
            background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
            border: '2px solid var(--saffron)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: '0 6px 18px rgba(232,101,10,0.12)',
          }}
        >
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--terracotta)' }}>
            Total Portfolio Value
          </div>
          <div
            className="num mt-1"
            style={{ fontSize: 44, fontWeight: 900, color: 'var(--text)', lineHeight: 1 }}
          >
            ₹{fmt(totalDisplay)}
          </div>
          <div className="mt-2 inline-flex items-center gap-1 rounded-pill px-2.5 py-1 text-[11px] font-bold"
            style={{ background: 'var(--growth-soft)', color: 'var(--growth)' }}>
            <TrendingUp size={11} aria-hidden /> +₹{fmt(totalGrowth)} ({growthPct}%)
          </div>
        </div>

        {/* 3-stat split */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Bachaya', value: fmt(totalSaved), color: 'var(--text)' },
            { label: 'Invested', value: fmt(totalInvested), color: 'var(--trust)' },
            { label: 'Munafa', value: fmt(totalGrowth), color: 'var(--growth)' },
          ].map((s) => (
            <div
              key={s.label}
              className="px-2 py-3 text-center"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-card)',
              }}
            >
              <div className="text-[10px] font-semibold" style={{ color: 'var(--muted)' }}>
                {s.label}
              </div>
              <div className="num mt-0.5 text-[14px] font-extrabold leading-tight" style={{ color: s.color }}>
                ₹{s.value}
              </div>
            </div>
          ))}
        </div>

        {/* V5 M4 — Munafa line chart (30/90/365 toggle) */}
        <div className="mt-4">
          <MunafaChart series={chartSeries} variant="full" height={150} />
        </div>

        {/* V5 M5 — Instrument allocation pie chart (replaces static breakdown) */}
        <div className="mt-4">
          <InstrumentPie size={220} totalRupees={Math.round(totalDisplay / 100)} />
        </div>

        {/* Phase 4 — Digital Gold holding card */}
        <div
          className="mt-4 px-4 py-4"
          style={{
            background:   'linear-gradient(135deg, #FFF8E1, #FFF3CD)',
            border:       '1.5px solid #D4A017',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow:    '0 4px 14px rgba(212,160,23,0.14)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span style={{ fontSize: 20 }}>🪙</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#7B5800' }}>Digital Sona</div>
                <div style={{ fontSize: 10, color: '#A07010', fontWeight: 600 }}>
                  {goldGrams > 0 ? `${goldGrams.toFixed(4)}g held` : 'Abhi kuch nahi — pehli kharid karein'}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="num" style={{ fontSize: 18, fontWeight: 900, color: '#5C3D00', lineHeight: 1 }}>
                ₹{fmt(goldCurrentPaise)}
              </div>
              {goldInvested > 0 && (
                <div
                  className="mt-0.5 text-[10px] font-bold"
                  style={{ color: goldPnl >= 0 ? 'var(--growth)' : '#C0392B' }}
                >
                  {goldPnl >= 0 ? '+' : ''}₹{fmt(goldPnl)} ({goldInvested > 0 ? ((goldPnl / goldInvested) * 100).toFixed(1) : '0'}%)
                </div>
              )}
            </div>
          </div>
          <div className="mt-2 flex gap-3">
            <div className="flex-1 text-center py-1.5 rounded-pill text-[10px] font-bold" style={{ background: '#D4A01720', color: '#7B5800' }}>
              Buy ₹{(Number(goldPrice.buyPaisePerGram) / 100).toFixed(0)}/g
            </div>
            <div className="flex-1 text-center py-1.5 rounded-pill text-[10px] font-bold" style={{ background: '#D4A01720', color: '#7B5800' }}>
              Sell ₹{(Number(goldPrice.sellPaisePerGram) / 100).toFixed(0)}/g
            </div>
          </div>
        </div>

        {/* Phase 5 — Mutual Fund holdings */}
        {mfHoldings.length > 0 ? (
          <div className="mt-4 flex flex-col gap-2">
            <h2 className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--trust)' }}>
              Mutual Funds
            </h2>
            {mfHoldings.map((h) => {
              const val     = h.fund.navPaise > 0n ? Number((h.totalMicroUnits * h.fund.navPaise) / 1_000_000n) : Number(h.investedPaise);
              const inv     = Number(h.investedPaise);
              const pnl     = val - inv;
              const units   = (Number(h.totalMicroUnits) / 1_000_000).toFixed(4);
              return (
                <div
                  key={h.schemeCode}
                  className="flex items-center justify-between px-4 py-3"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card)' }}
                >
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                      {h.fund.schemeName.split('—')[0].trim()}
                    </div>
                    <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                      {units} units · NAV ₹{(Number(h.fund.navPaise) / 100).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="num text-[14px] font-extrabold" style={{ color: 'var(--text)' }}>
                      ₹{fmt(val)}
                    </div>
                    <div className="text-[10px] font-bold" style={{ color: pnl >= 0 ? 'var(--growth)' : '#C0392B' }}>
                      {pnl >= 0 ? '+' : ''}₹{fmt(pnl)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div
              className="flex items-center justify-between px-4 py-2"
              style={{ background: 'var(--trust-soft)', borderRadius: 'var(--radius-card)', border: '1px solid #b8e6dc' }}
            >
              <span className="text-[11px] font-bold" style={{ color: 'var(--trust)' }}>MF Total</span>
              <span className="num text-[13px] font-extrabold" style={{ color: mfPnl >= 0 ? 'var(--growth)' : '#C0392B' }}>
                ₹{fmt(mfTotalValue)} ({mfPnl >= 0 ? '+' : ''}{mfTotalInvested > 0 ? ((mfPnl / mfTotalInvested) * 100).toFixed(1) : '0'}%)
              </span>
            </div>
          </div>
        ) : (
          <div
            className="mt-4 px-4 py-4 text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-card-lg)' }}
          >
            <div style={{ fontSize: 20 }}>📋</div>
            <div className="mt-1 text-[12px] font-bold" style={{ color: 'var(--text)' }}>Mutual Funds mein invest karo</div>
            <div className="mt-0.5 text-[11px]" style={{ color: 'var(--muted)' }}>
              Index se ELSS tak — 5 curated funds, sab direct plan
            </div>
          </div>
        )}

        {/* Why these instruments */}
        <div
          className="mt-5 flex items-start gap-2.5 rounded-card-lg p-4"
          style={{ background: 'var(--trust-soft)', border: '1px solid #b8e6dc' }}
        >
          <Shield size={18} aria-hidden style={{ color: 'var(--trust)', flexShrink: 0, marginTop: 2 }} />
          <div className="flex-1">
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>
              Yeh sab kyun?
            </div>
            <p className="mt-1 text-[12px] leading-relaxed" style={{ color: 'var(--muted)' }}>
              Sirf RBI-regulated, AAA-rated instruments. SEBI-approved partners. Aapka paisa aapke naam, har waqt traceable.
            </p>
          </div>
        </div>

        {/* Detailed RRTTLLU link */}
        <Link
          href={`/${locale}/transparency`}
          className="haptic-press mt-3 flex items-center gap-2 rounded-card-lg px-4 py-3 transition-all"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <Info size={16} aria-hidden style={{ color: 'var(--saffron)' }} />
          <span className="flex-1 text-[13px]" style={{ color: 'var(--text)', fontWeight: 700 }}>
            Risk · Returns · Lock-in detail
          </span>
          <span className="text-[12px] font-bold" style={{ color: 'var(--saffron)' }}>
            View →
          </span>
        </Link>

        {/* Goal snapshot */}
        {goals.length > 0 && (
          <>
            <h2 className="mt-6 text-[13px] font-bold uppercase tracking-widest" style={{ color: 'var(--terracotta)' }}>
              Goal-wise breakdown
            </h2>
            <div className="mt-2 flex flex-col gap-2">
              {goals.map((g) => (
                <div
                  key={g.id}
                  className="flex items-center justify-between px-4 py-3"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-card)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{g.title}</div>
                    <div className="num mt-0.5 text-[10.5px]" style={{ color: 'var(--muted)' }}>
                      ₹{fmt(Number(g.savedPaise))} saved · ₹{fmt(Number(g.growthPaise))} munafa
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <BottomNav locale={locale} active="portfolio" labels={{
        home: t('dash.navHome'),
        goals: t('dash.navGoals'),
        khata: 'Khata',
        portfolio: t('dash.navPortfolio'),
        profile: t('dash.navProfile'),
      }} />
    </main>
  );
}
