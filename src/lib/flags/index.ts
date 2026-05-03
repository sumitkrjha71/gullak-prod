// Feature flag registry. DB-backed, env-overridable.
// Env override: FLAGS_<KEY_UPPER_SNAKE>="true"|"false".

import { prisma } from '@/lib/db/client';

export type FlagKey =
  | 'enable_roundup'
  | 'enable_salary_sweep'
  | 'enable_notifications'
  | 'enable_undo_window'
  | 'enable_force_fail_dev_toggle';

const defaults: Record<FlagKey, boolean> = {
  enable_roundup: true,
  enable_salary_sweep: true,
  enable_notifications: true,
  enable_undo_window: true,
  enable_force_fail_dev_toggle: process.env.NODE_ENV !== 'production',
};

function envFor(key: FlagKey): boolean | null {
  const envName = `FLAGS_${key.toUpperCase()}`;
  const v = process.env[envName];
  if (v === 'true') return true;
  if (v === 'false') return false;
  return null;
}

export async function isEnabled(key: FlagKey): Promise<boolean> {
  const env = envFor(key);
  if (env !== null) return env;
  try {
    const row = await prisma.featureFlag.findUnique({ where: { key } });
    if (row) return row.enabled;
  } catch {
    // DB not ready; fall through to defaults.
  }
  return defaults[key];
}

export function isEnabledSync(key: FlagKey): boolean {
  const env = envFor(key);
  if (env !== null) return env;
  return defaults[key];
}
