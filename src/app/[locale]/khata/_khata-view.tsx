'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { HealthScoreCard }     from '@/components/khata/HealthScoreCard';
import { InsightCard }         from '@/components/khata/InsightCard';
import { RecommendationNudge } from '@/components/khata/RecommendationNudge';
import { CashflowBars }        from '@/components/khata/CashflowBars';
import { SpendingBreakdown }   from '@/components/khata/SpendingBreakdown';
import { MonthSnapshot }       from '@/components/khata/MonthSnapshot';
import { BankConnectPrompt }   from '@/components/khata/BankConnectPrompt';
import type { SpendingCategory } from '@/components/khata/SpendingBreakdown';
import type { CashflowMonth }    from '@/components/khata/CashflowBars';

// ─── Serialized prop types (BigInts come as strings from server) ─────────────

export interface KhataProfile {
  financialHealthScore:   number;
  financialHealthLabel:   string;
  detectedIncomeType:     string;
  avgMonthlyCreditPaise:  string;
  avgMonthlyDebitPaise:   string;
  avgMonthlySurplusPaise: string;
  fixedExpensesPaise:     string;
  variableExpensesPaise:  string;
  emiTotalPaise:          string;
  emiCount:               number;
  subscriptionCount:      number;
  subscriptionTotalPaise: string;
  debtIncomeRatioPct:     number;
  savingConsistencyPct:   number;
  salaryDay:              number | null;
  txnMonthsCovered:       number;
  dataAsOf:               string | null;
  recommendedSavePaise:   string | null;
}

export interface KhataInsight {
  id:             string;
  insightType:    string;
  severity:       string;
  title:          string;
  body:           string;
  supportingData: string;
  actionType:     string | null;
  isRead:         boolean;
}

export interface KhataRec {
  id:                  string;
  recType:             string;
  currentValuePaise:   string | null;
  suggestedValuePaise: string | null;
  reasoning:           string;
  confidenceScore:     number;
}

export interface KhataSnapshot {
  monthKey:      string;
  creditPaise:   string;
  debitPaise:    string;
  surplusPaise:  string;
  topCategories: string;   // JSON [{category,paise,pct}]
  savingsPaise:  string;
}

export interface KhataBankAccount {
  id:            string;
  fipId:         string;
  accountMasked: string;
  accountType:   string;
  fetchedAt:     string | null;
}

interface Props {
  locale:       string;
  profile:      KhataProfile | null;
  insights:     KhataInsight[];
  topRec:       KhataRec | null;
  snapshots:    KhataSnapshot[];
  bankAccounts: KhataBankAccount[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function inrCompact(paise: string | null): string {
  if (!paise) return '₹0';
  const r = parseInt(paise, 10) / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000)   return `₹${(r / 1000).toFixed(0)}K`;
  return `₹${Math.round(r)}`;
}

function SectionHeader({ label, sub }: { label: string; sub?: string }) {
  return (
    <div className="flex items-baseline justify-between mb-3">
      <span className="text-[11px] font-extrabold uppercase tracking-widest" style={{ color: 'var(--muted-light)' }}>
        {label}
      </span>
      {sub && <span className="text-[10px] font-semibold" style={{ color: 'var(--muted-light)' }}>{sub}</span>}
    </div>
  );
}

function QuickStatChip({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex-1 card p-2.5 flex flex-col items-center gap-0.5">
      <span className="num text-[14px] font-extrabold" style={{ color: color ?? 'var(--text)' }}>
        {value}
      </span>
      <span className="text-[9px] font-bold text-center leading-tight" style={{ color: 'var(--muted-light)' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

export function KhataView({ locale, profile, insights, topRec, snapshots, bankAccounts }: Props) {
  const [syncing, setSyncing] = useState(false);
  const router = useRouter();
  const isLinked = bankAccounts.length > 0 && profile !== null;

  // Parse top spending categories from the most recent snapshot
  const latestSnapshot = snapshots.length > 0
    ? [...snapshots].sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0]
    : null;

  let topCategories: SpendingCategory[] = [];
  if (latestSnapshot) {
    try {
      topCategories = JSON.parse(latestSnapshot.topCategories) as SpendingCategory[];
    } catch { /* ok */ }
  }

  // Cashflow bar data (last 6 months, chronological)
  const cashflowMonths: CashflowMonth[] = snapshots
    .slice()
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .slice(-6)
    .map(s => ({
      monthKey:     s.monthKey,
      creditPaise:  s.creditPaise,
      debitPaise:   s.debitPaise,
      surplusPaise: s.surplusPaise,
    }));

  // Last bank sync timestamp
  const lastSync = bankAccounts
    .flatMap(a => a.fetchedAt ? [new Date(a.fetchedAt)] : [])
    .sort((a, b) => b.getTime() - a.getTime())[0];

  async function triggerSync() {
    setSyncing(true);
    await fetch('/api/aa/fetch', { method: 'POST' });
    router.refresh();
    setSyncing(false);
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--bg)' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-4 py-3"
        style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20 }}>📒</span>
          <span className="text-[16px] font-extrabold" style={{ color: 'var(--text)' }}>Khata</span>
        </div>
        {isLinked && (
          <button
            disabled={syncing}
            onClick={triggerSync}
            className="haptic-press flex items-center gap-1.5 rounded-pill px-3 py-1.5 text-[11px] font-bold"
            style={{
              background: 'var(--trust-soft)',
              color: 'var(--trust)',
              opacity: syncing ? 0.6 : 1,
            }}
          >
            <span style={{ fontSize: 12 }}>{syncing ? '⏳' : '↻'}</span>
            {syncing ? 'Sync ho raha...' : 'Sync'}
          </button>
        )}
      </div>

      <div className="px-4 pt-4 space-y-5 max-w-md mx-auto">

        {/* ── NOT LINKED STATE ──────────────────────────────────────────────── */}
        {!isLinked && (
          <BankConnectPrompt locale={locale} />
        )}

        {/* ── LINKED + PROFILE STATE ────────────────────────────────────────── */}
        {isLinked && profile && (
          <>
            {/* Health score hero */}
            <HealthScoreCard
              score={profile.financialHealthScore}
              label={profile.financialHealthLabel as 'fragile' | 'building' | 'stable' | 'growing' | 'thriving'}
              monthsCovered={profile.txnMonthsCovered}
              dataAsOf={profile.dataAsOf}
            />

            {/* Quick stats row */}
            <div className="flex gap-2">
              <QuickStatChip
                label="Monthly surplus"
                value={inrCompact(profile.avgMonthlySurplusPaise)}
                color={parseInt(profile.avgMonthlySurplusPaise, 10) >= 0 ? 'var(--growth)' : 'var(--warn)'}
              />
              <QuickStatChip
                label="EMI load"
                value={`${profile.debtIncomeRatioPct}%`}
                color={profile.debtIncomeRatioPct > 40 ? 'var(--warn)' : 'var(--trust)'}
              />
              <QuickStatChip
                label="Saving months"
                value={`${profile.savingConsistencyPct}%`}
                color="var(--saffron)"
              />
            </div>

            {/* Income type badge */}
            <div className="flex items-center gap-2">
              <span
                className="rounded-pill px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide"
                style={{
                  background: profile.detectedIncomeType === 'salaried' ? 'var(--trust-soft)' : 'var(--bg-soft)',
                  color: profile.detectedIncomeType === 'salaried' ? 'var(--trust)' : 'var(--muted)',
                }}
              >
                {profile.detectedIncomeType === 'salaried' ? '💼 Salaried' :
                 profile.detectedIncomeType === 'freelance' ? '💻 Freelancer' : '❓ Income unclear'}
              </span>
              {profile.salaryDay && (
                <span className="text-[10px] font-semibold" style={{ color: 'var(--muted-light)' }}>
                  · Salary {profile.salaryDay} tarikh ko
                </span>
              )}
              <span className="text-[10px] font-semibold ml-auto" style={{ color: 'var(--muted-light)' }}>
                Avg income {inrCompact(profile.avgMonthlyCreditPaise)}/mo
              </span>
            </div>

            {/* Recommendation nudge */}
            {topRec && (
              <div>
                <RecommendationNudge
                  id={topRec.id}
                  recType={topRec.recType}
                  currentValuePaise={topRec.currentValuePaise}
                  suggestedValuePaise={topRec.suggestedValuePaise}
                  reasoning={topRec.reasoning}
                  confidenceScore={topRec.confidenceScore}
                />
              </div>
            )}

            {/* Insights feed */}
            {insights.length > 0 && (
              <div>
                <SectionHeader label="Insights" sub={`${insights.length} nayi`} />
                <div className="space-y-2.5">
                  {insights.slice(0, 4).map(ins => (
                    <InsightCard
                      key={ins.id}
                      title={ins.title}
                      body={ins.body}
                      severity={ins.severity}
                      supportingData={ins.supportingData}
                      actionType={ins.actionType}
                      onAction={(type) => {
                        if (type === 'save_now') router.push(`/${locale}/home`);
                        if (type === 'view_spending') {
                          document.getElementById('spending-section')?.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* This month snapshot */}
            {latestSnapshot && (
              <div className="card p-4">
                <SectionHeader label="Is Mahine" sub={latestSnapshot.monthKey} />
                <MonthSnapshot
                  monthKey={latestSnapshot.monthKey}
                  creditPaise={latestSnapshot.creditPaise}
                  debitPaise={latestSnapshot.debitPaise}
                  surplusPaise={latestSnapshot.surplusPaise}
                  savingsPaise={latestSnapshot.savingsPaise}
                />
              </div>
            )}

            {/* Spending breakdown */}
            {topCategories.length > 0 && (
              <div id="spending-section" className="card p-4">
                <SectionHeader label="Kahan Gaya" sub="Top categories" />
                <SpendingBreakdown categories={topCategories} />
              </div>
            )}

            {/* Cashflow history */}
            {cashflowMonths.length > 0 && (
              <div className="card p-4">
                <SectionHeader label="6 Mahine Ki Picture" />
                <CashflowBars months={cashflowMonths} />
              </div>
            )}

            {/* Bank accounts footer */}
            <div
              className="rounded-card p-3 flex items-center gap-3"
              style={{ background: 'var(--bg-soft)', border: '1px solid var(--border)' }}
            >
              <span style={{ fontSize: 20 }}>🏦</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold" style={{ color: 'var(--text)' }}>
                  {bankAccounts.map(a => `${a.fipId.replace('MOCK_', '')} ····${a.accountMasked.slice(-4)}`).join(', ')}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--muted-light)' }}>
                  {lastSync
                    ? `Last sync: ${lastSync.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`
                    : 'Sync pending'}
                </p>
              </div>
              <button
                onClick={triggerSync}
                disabled={syncing}
                className="haptic-press text-[11px] font-bold rounded-pill px-2.5 py-1"
                style={{ background: 'var(--trust-soft)', color: 'var(--trust)' }}
              >
                {syncing ? '...' : 'Sync'}
              </button>
            </div>

            {/* DPDP trust note */}
            <p className="text-center text-[10px] pb-2" style={{ color: 'var(--muted-light)' }}>
              🔒 Tera data sirf tere liye hai · RBI AA framework · DPDP Act 2023 compliant
            </p>
          </>
        )}
      </div>
    </div>
  );
}
