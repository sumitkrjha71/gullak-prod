// Structured logger (Pino). Server-only — never import in client components.
// Every log line includes requestId, userId, and route automatically when
// you use logger.child({ requestId, userId }) in API routes.
//
// In development: pretty-printed coloured output via pino-pretty.
// In production:  JSON lines → Vercel log drain → Axiom/Datadog.

import pino from 'pino';

const isDev = process.env.NODE_ENV === 'development';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  // Redact sensitive fields wherever they appear in log objects.
  redact: {
    paths: ['phone', 'otp', 'code', 'codeHash', 'token', 'password', 'pan', 'aadhaar'],
    censor: '[REDACTED]',
  },
  ...(isDev
    ? {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
      }
    : {}),
});

// Convenience: create a child logger pre-bound to a request context.
export function requestLogger(ctx: { requestId?: string; userId?: string; route?: string }) {
  return logger.child(ctx);
}
