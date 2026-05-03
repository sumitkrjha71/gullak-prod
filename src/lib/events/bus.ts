// Single ingress for events. Calls processor synchronously (in the same DB transaction
// when invoked inside one). Keeps side-effects centralised.

import { prisma } from '@/lib/db/client';
import { handleEvent } from './processor';
import type { SavingsEvent, SavingsEventType } from './types';

function bigintReplacer(_k: string, v: unknown) {
  return typeof v === 'bigint' ? v.toString() : v;
}

export async function dispatch<T extends SavingsEventType>(event: SavingsEvent<T>): Promise<void> {
  await prisma.savingsEvent.create({
    data: {
      userId: event.userId,
      type: event.type,
      payload: JSON.stringify(event.payload, bigintReplacer),
    },
  });
  await handleEvent(event);
}
