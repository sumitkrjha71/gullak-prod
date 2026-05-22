'use client';

function inr(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000)   return `₹${(r / 1000).toFixed(0)}K`;
  return `₹${Math.round(r)}`;
}

export function MonthSnapshot({
  monthKey,
  creditPaise,
  debitPaise,
  surplusPaise,
  savingsPaise,
}: {
  monthKey:     string;
  creditPaise:  string;
  debitPaise:   string;
  surplusPaise: string;
  savingsPaise: string;
}) {
  const credit  = parseInt(creditPaise,  10);
  const debit   = parseInt(debitPaise,   10);
  const surplus = parseInt(surplusPaise, 10);
  const savings = parseInt(savingsPaise, 10);

  const maxVal  = Math.max(credit, debit, 1);
  const [yr, mo] = monthKey.split('-').map(Number);
  const monthName = new Date(yr, (mo ?? 1) - 1, 1).toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  const rows: { label: string; value: number; color: string; barColor: string; prefix?: string }[] = [
    { label: 'Aaya',    value: credit,  color: 'var(--trust)',  barColor: 'var(--trust)'  },
    { label: 'Gaya',    value: debit,   color: 'var(--saffron)', barColor: 'var(--saffron)' },
    { label: 'Bacha',   value: Math.abs(surplus), color: surplus >= 0 ? 'var(--growth)' : 'var(--warn)', barColor: surplus >= 0 ? 'var(--growth)' : 'var(--warn)', prefix: surplus < 0 ? '-' : '' },
    ...(savings > 0
      ? [{ label: 'Gullak mein', value: savings, color: 'var(--gold)', barColor: 'var(--gold)' }]
      : []),
  ];

  return (
    <div>
      <p className="text-[11px] font-bold mb-3" style={{ color: 'var(--muted-light)' }}>
        {monthName}
      </p>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center gap-3">
            <span className="w-20 shrink-0 text-[12px] font-semibold" style={{ color: 'var(--muted)' }}>
              {r.label}
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${(r.value / maxVal) * 100}%`,
                  background: r.barColor,
                  opacity: 0.85,
                }}
              />
            </div>
            <span className="num text-[12px] font-extrabold w-14 text-right shrink-0" style={{ color: r.color }}>
              {r.prefix}{inr(r.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Savings rate chip */}
      {credit > 0 && savings > 0 && (
        <div className="mt-3 flex justify-end">
          <span
            className="rounded-pill px-2.5 py-1 text-[10px] font-bold"
            style={{ background: 'var(--growth-soft)', color: 'var(--growth)' }}
          >
            {Math.round((savings / credit) * 100)}% saving rate 🌱
          </span>
        </div>
      )}
    </div>
  );
}
