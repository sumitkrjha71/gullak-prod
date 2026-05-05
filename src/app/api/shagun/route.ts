// V5 M8 — POST /api/shagun — send a "Shagun" (gift) from sender's Munafa to a
// fellow Family Gullak member's contribution.
//
// LITE scope: only works between members of the same shared Family Gullak.
// Reuses M1's GoalMember infrastructure. Creates an audit-logged Transaction
// with source='shagun' on receiver, decrements sender's growthPaise, increments
// receiver's GoalMember.contributedPaise.

import { NextRequest, NextResponse } from 'next/server';
import { readSession } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { dispatch } from '@/lib/events/bus';
import { buildIdempotencyKey, buildSimulatedRefId } from '@/lib/idempotency/key';

const OCCASIONS = ['diwali', 'rakhi', 'bhai-dooj', 'birthday', 'wedding', 'random'] as const;
type Occasion = typeof OCCASIONS[number];

export async function POST(req: NextRequest) {
  const session = await readSession();
  if (!session) return NextResponse.json({ ok: false, error: 'unauth' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { goalId, recipientUserId, amountPaise, occasion, message } = body;

  if (typeof goalId !== 'string' || typeof recipientUserId !== 'string') {
    return NextResponse.json({ ok: false, error: 'bad_input' }, { status: 400 });
  }
  if (typeof amountPaise !== 'number' || amountPaise < 100 || amountPaise > 10_00_000_00) {
    return NextResponse.json(
      { ok: false, error: 'bad_amount', hint: 'Shagun ₹1 se ₹10 lakh ke beech' },
      { status: 400 },
    );
  }
  if (recipientUserId === session.userId) {
    return NextResponse.json(
      { ok: false, error: 'self_send', hint: 'Apne aap ko shagun nahi bhej sakte 😄' },
      { status: 400 },
    );
  }

  // Both sender and recipient must be members of the same goal.
  const goal = await prisma.goal.findUnique({ where: { id: goalId } });
  if (!goal || !goal.isShared) {
    return NextResponse.json({ ok: false, error: 'not_shared' }, { status: 404 });
  }

  const senderMember = goal.userId === session.userId
    ? { role: 'owner' as const }
    : await prisma.goalMember.findUnique({
        where: { goalId_userId: { goalId, userId: session.userId } },
      });
  if (!senderMember) {
    return NextResponse.json({ ok: false, error: 'sender_not_member' }, { status: 403 });
  }
  const recipientMember = goal.userId === recipientUserId
    ? { role: 'owner' as const }
    : await prisma.goalMember.findUnique({
        where: { goalId_userId: { goalId, userId: recipientUserId } },
      });
  if (!recipientMember) {
    return NextResponse.json({ ok: false, error: 'recipient_not_member' }, { status: 404 });
  }

  // Sender's Munafa available to gift = sum of their growthPaise across goals.
  // V5 lite: just enforce a soft check that sender has SOME savings.
  const sender = await prisma.user.findUnique({
    where: { id: session.userId },
    include: { goals: true },
  });
  if (!sender) return NextResponse.json({ ok: false, error: 'sender_not_found' }, { status: 404 });

  const senderTotalGrowth = sender.goals.reduce((s, g) => s + Number(g.growthPaise), 0);
  if (senderTotalGrowth < amountPaise) {
    return NextResponse.json(
      {
        ok: false,
        error: 'insufficient_munafa',
        hint: `Aapke paas itna munafa nahi hai. Aapka munafa: ₹${Math.round(senderTotalGrowth / 100)}. Pehle aur bachat karein.`,
      },
      { status: 400 },
    );
  }

  // Idempotency
  const idempotencyKey = buildIdempotencyKey({
    userId: session.userId,
    ruleId: null,
    source: `shagun:${goalId}:${recipientUserId}:${Date.now()}`,
    date: new Date(),
    slot: 'shagun',
  });

  // Atomic: deduct sender Munafa (proportionally from largest goal),
  // create receiver Transaction with source='shagun',
  // bump receiver GoalMember.contributedPaise + Goal.savedPaise.
  const refId = buildSimulatedRefId();
  try {
    const tx = await prisma.$transaction(async (db) => {
      // Deduct from sender's biggest-growth goal first.
      const ordered = sender.goals.sort((a, b) => Number(b.growthPaise) - Number(a.growthPaise));
      let remaining = amountPaise;
      for (const g of ordered) {
        if (remaining <= 0) break;
        const available = Number(g.growthPaise);
        const take = Math.min(available, remaining);
        if (take <= 0) continue;
        await db.goal.update({
          where: { id: g.id },
          data: { growthPaise: BigInt(available - take) },
        });
        remaining -= take;
      }

      // Receiver-side: create Transaction + bump goal saved + bump member contribution.
      const receiverTxn = await db.transaction.create({
        data: {
          userId: recipientUserId,
          goalId,
          source: 'shagun',
          amountPaise: BigInt(amountPaise),
          status: 'success',
          simulatedRefId: refId,
          idempotencyKey,
        },
      });
      await db.goal.update({
        where: { id: goalId },
        data: { savedPaise: { increment: BigInt(amountPaise) } },
      });
      // Bump GoalMember row only if recipient isn't owner (owner has no GoalMember row by default for solo).
      const memberRow = await db.goalMember.findUnique({
        where: { goalId_userId: { goalId, userId: recipientUserId } },
      });
      if (memberRow) {
        await db.goalMember.update({
          where: { goalId_userId: { goalId, userId: recipientUserId } },
          data: { contributedPaise: { increment: BigInt(amountPaise) } },
        });
      }

      return receiverTxn;
    });

    await dispatch({
      userId: session.userId,
      type: 'SHAGUN_SENT',
      payload: {
        toUserId: recipientUserId,
        goalId,
        amountPaise,
        occasion: typeof occasion === 'string' && OCCASIONS.includes(occasion as Occasion) ? occasion : 'random',
        message: typeof message === 'string' ? message.slice(0, 200) : null,
        refId,
      },
    });

    return NextResponse.json({ ok: true, refId, transactionId: tx.id });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: 'transfer_failed', hint: 'Kuch dikkat aa gayi. Phir try karein.' },
      { status: 500 },
    );
  }
}
