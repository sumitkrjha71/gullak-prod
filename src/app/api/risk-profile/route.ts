// GET  /api/risk-profile — fetch current risk profile for logged-in user.
// POST /api/risk-profile — submit / retake risk questionnaire.
// SEBI requires suitability assessment before recommending equity/hybrid products.

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { writeAudit } from '@/lib/audit/log';
import { logger } from '@/lib/logger';
import {
  RISK_QUESTIONS,
  computeScore,
  scoreToProfile,
  type RiskAnswer,
} from '@/lib/kyc/risk-profile';

const answerSchema = z.object({
  questionId: z.string(),
  answer:     z.string().min(1),
  points:     z.number().int().min(1).max(4),
});

const schema = z.object({
  answers: z.array(answerSchema).length(5),
});

export async function GET() {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const profile = await prisma.riskProfile.findUnique({ where: { userId: session.userId } });
  if (!profile) {
    return NextResponse.json({
      ok:          false,
      error:       'not_found',
      questions:   RISK_QUESTIONS,
    }, { status: 404 });
  }

  return NextResponse.json({
    ok:       true,
    profile:  profile.profile,
    score:    profile.score,
    takenAt:  profile.takenAt,
  });
}

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) {
    return NextResponse.json({ ok: false, error: 'invalid_input', details: body.error.flatten() }, { status: 400 });
  }

  const { answers } = body.data as { answers: RiskAnswer[] };

  // Validate all question IDs are present and points match option
  const questionIds = new Set(RISK_QUESTIONS.map(q => q.id));
  for (const a of answers) {
    if (!questionIds.has(a.questionId)) {
      return NextResponse.json({ ok: false, error: 'invalid_question_id', questionId: a.questionId }, { status: 400 });
    }
    const question = RISK_QUESTIONS.find(q => q.id === a.questionId);
    const validOption = question?.options.find(o => o.label === a.answer && o.points === a.points);
    if (!validOption) {
      return NextResponse.json({ ok: false, error: 'invalid_answer', questionId: a.questionId }, { status: 400 });
    }
  }

  const score   = computeScore(answers);
  const profile = scoreToProfile(score);

  try {
    await prisma.riskProfile.upsert({
      where:  { userId: session.userId },
      create: {
        userId:  session.userId,
        score,
        profile,
        answers: JSON.stringify(answers),
      },
      update: {
        score,
        profile,
        answers:  JSON.stringify(answers),
        takenAt:  new Date(),
      },
    });

    await writeAudit({
      userId:    session.userId,
      eventType: 'RISK_PROFILE_SUBMITTED',
      payload:   { score, profile },
      source:    'user',
    });

    logger.info({ userId: session.userId, score, profile }, 'risk_profile_submitted');

    return NextResponse.json({ ok: true, score, profile });

  } catch (err) {
    logger.error({ route: 'risk-profile', err: (err as Error)?.message }, 'uncaught_error');
    return NextResponse.json({ ok: false, error: 'server_error' }, { status: 500 });
  }
}
