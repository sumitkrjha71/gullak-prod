// Reserved for future PSP integration (Razorpay UPI AutoPay / Setu).
// In V1 this file is a stub — all real calls should throw NotImplemented.

import type { ExecuteArgs, SimResult } from './simulate';

export async function executeReal(_args: ExecuteArgs): Promise<SimResult> {
  throw new Error('Real payment rails not implemented in V1. Use simulate.ts.');
}
