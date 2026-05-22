'use client';

import { useState } from 'react';

type Severity = 'info' | 'warn' | 'celebrate';

const SEVERITY_META: Record<Severity, { border: string; bg: string; icon: string; label: string }> = {
  info:      { border: 'var(--trust)',   bg: 'var(--trust-soft)',  icon: '💡', label: 'Jaankaari' },
  warn:      { border: 'var(--warn)',    bg: '#fef2f1',            icon: '⚠️', label: 'Dhyan do'   },
  celebrate: { border: 'var(--growth)', bg: 'var(--growth-soft)', icon: '🎉', label: 'Badhai!'    },
};

// Map action types to Bharat-voice CTA labels
const ACTION_LABELS: Record<string, string> = {
  save_now:        '💰 Abhi save karo',
  build_emergency: '🛡️ Emergency fund banao',
  view_spending:   '📊 Spending dekho',
  increase_sip:    '📈 SIP badhao',
  reduce_sip:      '📉 SIP kam karo',
};

export function InsightCard({
  title,
  body,
  severity,
  supportingData,
  actionType,
  onAction,
}: {
  title: string;
  body: string;
  severity: string;
  supportingData: string;
  actionType?: string | null;
  onAction?: (actionType: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const sev  = (severity as Severity) in SEVERITY_META ? (severity as Severity) : 'info';
  const meta = SEVERITY_META[sev];

  let parsedData: Record<string, unknown> = {};
  try { parsedData = JSON.parse(supportingData); } catch { /* ok */ }

  const dataEntries = Object.entries(parsedData).filter(([k]) =>
    !k.toLowerCase().includes('paise') || k === 'targetPaise',
  );

  return (
    <div
      className="card overflow-hidden"
      style={{ borderLeftWidth: 3, borderLeftColor: meta.border }}
    >
      {/* Header */}
      <div className="flex items-start gap-3 p-3.5">
        <span style={{ fontSize: 20, lineHeight: 1.2 }}>{meta.icon}</span>
        <div className="flex-1 min-w-0">
          <span
            className="text-[9px] font-extrabold uppercase tracking-widest"
            style={{ color: meta.border }}
          >
            {meta.label}
          </span>
          <p className="text-[13px] font-bold leading-snug mt-0.5" style={{ color: 'var(--text)' }}>
            {title}
          </p>
          <p className="text-[12px] leading-relaxed mt-1" style={{ color: 'var(--muted)' }}>
            {body}
          </p>
        </div>
      </div>

      {/* Action row */}
      {(actionType || dataEntries.length > 0) && (
        <div
          className="hairline flex items-center gap-2 px-3.5 py-2"
          style={{ background: meta.bg }}
        >
          {actionType && ACTION_LABELS[actionType] && onAction && (
            <button
              onClick={() => onAction(actionType)}
              className="haptic-press rounded-pill px-3 py-1 text-[11px] font-bold"
              style={{ background: meta.border, color: '#fff' }}
            >
              {ACTION_LABELS[actionType]}
            </button>
          )}
          {dataEntries.length > 0 && (
            <button
              onClick={() => setExpanded(v => !v)}
              className="haptic-press ml-auto text-[11px] font-semibold"
              style={{ color: meta.border }}
            >
              {expanded ? 'Chhupa do ↑' : 'Kyun? →'}
            </button>
          )}
        </div>
      )}

      {/* Expandable "Kyun?" data */}
      {expanded && dataEntries.length > 0 && (
        <div className="px-3.5 py-3 space-y-1.5" style={{ background: meta.bg }}>
          {dataEntries.map(([key, value]) => (
            <div key={key} className="flex justify-between items-center">
              <span className="text-[11px]" style={{ color: 'var(--muted)' }}>
                {formatDataKey(key)}
              </span>
              <span className="num text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                {formatDataValue(key, value)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatDataKey(key: string): string {
  const MAP: Record<string, string> = {
    avgMonthlySurplusPaise:  'Avg monthly surplus',
    recommendedSavePaise:    'Recommended save',
    cashflowStabilityScore:  'Stability score',
    endOfMonthStressScore:   'Month-end stress',
    debtIncomeRatioPct:      'EMI load (FOIR)',
    emiTotalPaise:           'Total EMI/month',
    emiCount:                'EMI count',
    safeLimit:               'RBI safe limit',
    lifestyleInflationPct:   'Spending growth',
    variableExpensesPaise:   'Variable expenses',
    savingConsistencyPct:    'Saving consistency',
    subscriptionCount:       'Subscriptions',
    subscriptionTotalPaise:  'Subscription cost',
    emergencyFundStatusPct:  'Emergency fund ready',
    targetPaise:             'Target amount',
    avgMonthlyDebitPaise:    'Monthly expenses',
    impulsiveSpendingScore:  'Impulsive spending',
    financialHealthScore:    'Health score',
    detectedIncomeType:      'Income type',
    salaryConsistencyPct:    'Salary consistency',
  };
  return MAP[key] ?? key.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
}

function formatDataValue(key: string, value: unknown): string {
  if (typeof value === 'number') {
    if (key.toLowerCase().includes('pct') || key.toLowerCase().includes('score') || key === 'safeLimit') {
      return `${value}%`;
    }
    if (key === 'emiCount' || key === 'subscriptionCount' || key === 'financialHealthScore') {
      return String(value);
    }
    return String(value);
  }
  if (typeof value === 'string') {
    // paise strings — convert to INR
    if (key.toLowerCase().includes('paise') && /^\d+$/.test(value)) {
      const r = parseInt(value, 10) / 100;
      if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
      if (r >= 1000)   return `₹${(r / 1000).toFixed(1)}K`;
      return `₹${Math.round(r)}`;
    }
    return value;
  }
  return String(value);
}
