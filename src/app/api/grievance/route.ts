// POST /api/grievance — raise a grievance ticket.
// GET  /api/grievance — list user's tickets.
// SEBI mandates acknowledgement within 3 days and resolution within 30 days.
// Investor Charter: https://www.sebi.gov.in/legal/regulations/jan-2022/securities-and-exchange-board-of-india-investor-charter-and-complaints.html

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';

const createSchema = z.object({
  category:    z.enum(['payment', 'investment', 'kyc', 'account', 'other']),
  subject:     z.string().min(5).max(200),
  description: z.string().min(10).max(2000),
  refId:       z.string().optional(), // linked txnId / orderId
});

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const body = createSchema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, error: 'invalid_input', details: body.error.flatten() }, { status: 400 });
  }

  const { category, subject, description, refId } = body.data;

  try {
    const ticket = await prisma.grievanceTicket.create({
      data: {
        userId:      session.userId,
        category,
        subject,
        description,
        refId:       refId ?? null,
        status:      'open',
      },
    });

    await writeAudit({
      userId:    session.userId,
      eventType: 'GRIEVANCE_CREATED',
      payload:   { ticketId: ticket.id, category, subject },
      source:    'user',
    });

    logger.info({ userId: session.userId, ticketId: ticket.id, category }, 'grievance_created');

    return NextResponse.json({
      ok:       true,
      ticketId: ticket.id,
      status:   ticket.status,
      // SEBI-required disclosure
      charter: {
        acknowledgementSla: 'Your grievance will be acknowledged within 3 business days.',
        resolutionSla:      'We aim to resolve your grievance within 30 business days.',
        escalationNote:     'If unresolved, you may escalate to SEBI SCORES portal at scores.gov.in.',
        sebiScoresUrl:      'https://scores.gov.in',
      },
    }, { status: 201 });

  } catch (err) {
    logger.error({ route: 'grievance', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  try {
    const tickets = await prisma.grievanceTicket.findMany({
      where:   { userId: session.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id:               true,
        category:         true,
        subject:          true,
        status:           true,
        refId:            true,
        acknowledgedAt:   true,
        resolvedAt:       true,
        createdAt:        true,
      },
    });

    return NextResponse.json({ ok: true, tickets });

  } catch (err) {
    logger.error({ route: 'grievance', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
