// Lightweight synchronous event bus for the Khata pipeline.
// Handlers run in-process on Vercel serverless — no external queue needed at this scale.
// Interface matches Inngest/QStash so migration is a drop-in replace.

export type KhataEvent =
  | { type: 'CONSENT_GRANTED';         userId: string; consentId: string }
  | { type: 'TRANSACTIONS_FETCHED';    userId: string; accountId: string; count: number }
  | { type: 'CLASSIFICATION_COMPLETE'; userId: string; monthKey: string }
  | { type: 'PROFILE_UPDATED';         userId: string }
  | { type: 'INSIGHT_CREATED';         userId: string; insightId: string }
  | { type: 'RECOMMENDATION_CREATED';  userId: string; recId: string }
  | { type: 'CONSENT_EXPIRING';        userId: string; daysLeft: number }
  | { type: 'CONSENT_REVOKED';         userId: string; consentId: string };

type AnyHandler = (event: KhataEvent) => Promise<void>;

const registry = new Map<string, AnyHandler[]>();

export function register<K extends KhataEvent['type']>(
  eventType: K,
  handler: (event: Extract<KhataEvent, { type: K }>) => Promise<void>,
): void {
  const existing = registry.get(eventType) ?? [];
  existing.push(handler as AnyHandler);
  registry.set(eventType, existing);
}

export async function emit(event: KhataEvent): Promise<void> {
  const handlers = registry.get(event.type) ?? [];
  for (const handler of handlers) {
    try {
      await handler(event);
    } catch (err) {
      console.error(`[khata-event] handler error for ${event.type}:`, err);
    }
  }
}

/** Legacy compat: pre-Phase-6 code used dispatch({ userId, type, payload }). */
export async function dispatch(event: { userId: string; type: string; payload?: unknown }): Promise<void> {
  const handlers = registry.get(event.type) ?? [];
  for (const handler of handlers) {
    try {
      await handler(event as unknown as KhataEvent);
    } catch (err) {
      console.error(`[khata-event] handler error for ${event.type}:`, err);
    }
  }
}
