'use client';

const CAT_META: Record<string, { emoji: string; label: string }> = {
  emi:          { emoji: '🏦', label: 'Loan EMI'         },
  rent:         { emoji: '🏠', label: 'Kiraya'           },
  sip:          { emoji: '📈', label: 'SIP/Invest'       },
  insurance:    { emoji: '🛡️', label: 'Insurance'        },
  food:         { emoji: '🍱', label: 'Khana-Peena'      },
  grocery:      { emoji: '🛒', label: 'Kirana'           },
  shopping:     { emoji: '🛍️', label: 'Shopping'         },
  fuel:         { emoji: '⛽', label: 'Petrol/Diesel'    },
  subscription: { emoji: '📱', label: 'Subscriptions'    },
  utility:      { emoji: '💡', label: 'Bills'            },
  travel:       { emoji: '🚌', label: 'Travel'           },
  health:       { emoji: '🏥', label: 'Health'           },
  entertainment:{ emoji: '🎬', label: 'Entertainment'    },
  education:    { emoji: '📚', label: 'Padhai'           },
  bnpl:         { emoji: '💳', label: 'Buy Now Pay Later' },
  atm:          { emoji: '💸', label: 'Cash Withdrawal'  },
  tax:          { emoji: '📋', label: 'Tax'              },
  transfer_out: { emoji: '↗️', label: 'Transfer'         },
  other:        { emoji: '📦', label: 'Aur'              },
};

export interface SpendingCategory {
  category: string;
  paise:    string;   // serialized bigint
  pct:      number;
}

function inrCompact(paise: number): string {
  const r = paise / 100;
  if (r >= 100000) return `₹${(r / 100000).toFixed(1)}L`;
  if (r >= 1000)   return `₹${(r / 1000).toFixed(1)}K`;
  return `₹${Math.round(r)}`;
}

export function SpendingBreakdown({ categories }: { categories: SpendingCategory[] }) {
  if (categories.length === 0) return null;

  const FIXED_CATS = new Set(['emi', 'rent', 'sip', 'insurance']);

  return (
    <div className="space-y-2">
      {categories.map((c, i) => {
        const meta    = CAT_META[c.category] ?? { emoji: '📦', label: c.category };
        const amount  = parseInt(c.paise, 10);
        const isFixed = FIXED_CATS.has(c.category);

        return (
          <div key={c.category} className="flex items-center gap-3">
            {/* Rank + emoji */}
            <span className="text-[10px] font-bold w-3 shrink-0" style={{ color: 'var(--muted-light)' }}>
              {i + 1}
            </span>
            <span style={{ fontSize: 16, lineHeight: 1 }}>{meta.emoji}</span>

            {/* Category + bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[12px] font-semibold truncate" style={{ color: 'var(--text)' }}>
                  {meta.label}
                  {isFixed && (
                    <span
                      className="ml-1.5 rounded-pill px-1.5 py-0 text-[8px] font-bold uppercase"
                      style={{ background: 'var(--trust-soft)', color: 'var(--trust)' }}
                    >
                      fixed
                    </span>
                  )}
                </span>
                <span className="num text-[12px] font-bold shrink-0 ml-2" style={{ color: 'var(--text)' }}>
                  {inrCompact(amount)}
                </span>
              </div>
              {/* Bar */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width:      `${Math.max(c.pct, 2)}%`,
                    background: isFixed ? 'var(--trust)' : 'var(--saffron)',
                    opacity:    0.75 + (i === 0 ? 0.25 : 0),
                  }}
                />
              </div>
            </div>

            {/* Pct */}
            <span className="num text-[10px] font-bold w-7 text-right shrink-0" style={{ color: 'var(--muted-light)' }}>
              {c.pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}
