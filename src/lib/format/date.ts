// All date math here uses IST (UTC+5:30) for product semantics.

const IST_OFFSET_MIN = 330;

export function nowIST(): Date {
  const d = new Date();
  return new Date(d.getTime() + (IST_OFFSET_MIN - d.getTimezoneOffset()) * -60000 + IST_OFFSET_MIN * 60000);
  // simpler: use ICU formatting where needed; we mostly just need a date-only key.
}

export function istDateKey(date: Date = new Date()): string {
  // YYYY-MM-DD in IST.
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const istMs = utcMs + IST_OFFSET_MIN * 60000;
  const ist = new Date(istMs);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
  const d = String(ist.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function istWeekKey(date: Date = new Date()): string {
  // ISO week number, IST anchor.
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + IST_OFFSET_MIN * 60000);
  const tmp = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate()));
  const dayNum = (tmp.getUTCDay() + 6) % 7;
  tmp.setUTCDate(tmp.getUTCDate() - dayNum + 3);
  const firstThursday = tmp.getTime();
  tmp.setUTCMonth(0, 1);
  if (tmp.getUTCDay() !== 4) tmp.setUTCMonth(0, 1 + ((4 - tmp.getUTCDay() + 7) % 7));
  const week = 1 + Math.ceil((firstThursday - tmp.getTime()) / 604800000);
  return `${ist.getUTCFullYear()}-${String(week).padStart(2, '0')}`;
}

export function istDayOfMonth(date: Date = new Date()): number {
  const utcMs = date.getTime() + date.getTimezoneOffset() * 60000;
  const ist = new Date(utcMs + IST_OFFSET_MIN * 60000);
  return ist.getUTCDate();
}

export function daysBetween(a: Date, b: Date): number {
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

export function daysBetweenIST(a: Date, b: Date): number {
  const ka = istDateKey(a);
  const kb = istDateKey(b);
  const da = new Date(ka + 'T00:00:00Z');
  const db = new Date(kb + 'T00:00:00Z');
  return Math.round((db.getTime() - da.getTime()) / 86400000);
}
