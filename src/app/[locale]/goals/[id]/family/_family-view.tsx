'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, Copy, Check, Share2, Users, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buildWhatsAppShareText, buildWhatsAppDeepLink } from '@/lib/family/invite';

type Member = {
  userId: string;
  role: string;
  displayName: string;
  contributedPaise: number;
  joinedAt: string;
};

type Props = {
  locale: string;
  goalId: string;
  goalTitle: string;
  goalType: string;
  goalTargetPaise: number;
  goalSavedPaise: number;
  isShared: boolean;
  inviteCode: string | null;
  isOwner: boolean;
  labels: {
    headline: string;
    sub: string;
    soloHeadline: string;
    soloSub: string;
    inviteCta: string;
    generating: string;
    codeLabel: string;
    copyCode: string;
    codeCopied: string;
    whatsappShare: string;
    membersTitle: string;
    roleOwner: string;
    roleMember: string;
    contributed: string;
    combined: string;
    targetLabel: string;
    progressShabaash: string;
    backToGoal: string;
    howItWorks: string;
    howStep1: string;
    howStep2: string;
    howStep3: string;
  };
};

export function FamilyView(props: Props) {
  const [members, setMembers] = useState<Member[] | null>(null);
  const [code, setCode] = useState<string | null>(props.inviteCode);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [hostOrigin, setHostOrigin] = useState('');

  useEffect(() => {
    setHostOrigin(window.location.origin);
    fetch(`/api/goals/${props.goalId}/members`)
      .then((r) => r.json())
      .then((j) => {
        if (j.ok) setMembers(j.members);
      })
      .catch(() => setMembers([]));
  }, [props.goalId]);

  const fmt = (paise: number) =>
    '₹' + new Intl.NumberFormat('en-IN').format(Math.round(paise / 100));

  const targetRupees = props.goalTargetPaise / 100;
  const savedRupees = props.goalSavedPaise / 100;
  const progressPct = Math.min(100, Math.round((savedRupees / targetRupees) * 100));

  const generateInvite = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/goals/invite', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ goalId: props.goalId }),
      });
      const j = await res.json();
      if (j.ok && j.code) setCode(j.code);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = () => {
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const inviteUrl = code && hostOrigin ? `${hostOrigin}/${props.locale}/join/${code}` : '';
  const ownerName =
    members?.find((m) => m.role === 'owner' && m.userId === members.find((mm) => mm.displayName === 'You')?.userId)
      ?.displayName === 'You'
      ? 'Aapka dost'
      : '';

  const shareViaWhatsApp = () => {
    if (!inviteUrl) return;
    const text = buildWhatsAppShareText({
      inviterName: ownerName || 'Aapka dost',
      goalTitle: props.goalTitle,
      inviteUrl,
    });
    const link = buildWhatsAppDeepLink(text);
    window.open(link, '_blank', 'noopener,noreferrer');
  };

  const shareViaWebShare = async () => {
    if (!inviteUrl) return;
    const text = buildWhatsAppShareText({
      inviterName: ownerName || 'Aapka dost',
      goalTitle: props.goalTitle,
      inviteUrl,
    });
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Gullak — Family Saving', text, url: inviteUrl });
      } catch {
        // user cancelled
      }
    } else {
      shareViaWhatsApp();
    }
  };

  return (
    <main
      className="anim-screen-enter flex min-h-dvh w-full flex-col"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Header */}
      <header className="safe-top mx-auto flex w-full max-w-md items-center justify-between px-5 pt-3">
        <Link
          href={`/${props.locale}/goals/${props.goalId}`}
          aria-label={props.labels.backToGoal}
          className="haptic-press flex h-9 w-9 items-center justify-center rounded-full hover:bg-border/40"
          style={{ color: 'var(--muted)' }}
        >
          <ChevronLeft size={20} />
        </Link>
        <span className="text-[11px] font-bold" style={{ color: 'var(--trust)' }}>
          {props.isShared ? props.labels.membersTitle : '·'}
        </span>
        <span className="h-9 w-9" />
      </header>

      <div className="mx-auto w-full max-w-md flex-1 overflow-y-auto px-5 pt-2 pb-4">
        {/* Hero */}
        <div className="text-center">
          <div className="relative mx-auto inline-block">
            <Image
              src="/assets/gullak-pot.png"
              alt=""
              width={120}
              height={100}
              priority
              style={{
                width: 120,
                height: 100,
                objectFit: 'contain',
                filter: 'drop-shadow(0 0 22px rgba(212,160,23,0.5))',
              }}
              className="anim-float"
            />
            <Image
              src="/assets/chiraiya-v2.png"
              alt=""
              width={42}
              height={36}
              className="absolute"
              style={{
                top: -6,
                right: -22,
                width: 42,
                height: 36,
                objectFit: 'contain',
                animation: 'gentleFloat 2.6s ease-in-out infinite',
                transform: 'scaleX(-1)',
              }}
            />
          </div>
          <h1
            className="mt-2 text-balance"
            style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: -0.3 }}
          >
            {props.isShared ? props.labels.headline : props.labels.soloHeadline}
          </h1>
          <p className="mt-1.5 text-[13.5px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
            {props.isShared ? props.labels.sub : props.labels.soloSub}
          </p>
        </div>

        {/* Combined progress card */}
        <div
          className="mt-5 px-5 py-4"
          style={{
            background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
            border: '2px solid var(--saffron)',
            borderRadius: 'var(--radius-card-lg)',
            boxShadow: '0 6px 18px rgba(232,101,10,0.15)',
          }}
        >
          <div className="flex items-baseline justify-between">
            <span className="text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--terracotta)' }}>
              {props.labels.combined}
            </span>
            <span className="num text-[12px]" style={{ color: 'var(--muted)' }}>
              {props.labels.targetLabel} {fmt(props.goalTargetPaise)}
            </span>
          </div>
          <div
            className="num mt-1 leading-none"
            style={{ fontSize: 36, fontWeight: 900, color: 'var(--text)' }}
          >
            {fmt(props.goalSavedPaise)}
          </div>
          {/* Progress bar with stacked segments per member */}
          <div
            className="mt-3 h-3 w-full overflow-hidden rounded-full"
            style={{ background: 'rgba(196, 96, 42, 0.12)' }}
          >
            {members && members.length > 0 ? (
              <StackedProgressBar
                members={members}
                totalSavedPaise={props.goalSavedPaise}
                targetPaise={props.goalTargetPaise}
              />
            ) : (
              <div
                className="h-full transition-all"
                style={{
                  width: `${progressPct}%`,
                  background: 'linear-gradient(90deg, #E8650A, #D4A017)',
                }}
              />
            )}
          </div>
          <div className="mt-2 flex items-center justify-between text-[11.5px]">
            <span className="num font-semibold" style={{ color: 'var(--saffron)' }}>
              {progressPct}%
            </span>
            {progressPct >= 50 && (
              <span style={{ color: 'var(--growth)' }} className="font-bold">
                {props.labels.progressShabaash} 🎉
              </span>
            )}
          </div>
        </div>

        {/* Invite block — owner only, when not yet shared */}
        {props.isOwner && !code && (
          <div
            className="mt-5 px-4 py-4 text-center"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card-lg)',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <Users size={28} className="mx-auto" style={{ color: 'var(--terracotta)' }} aria-hidden />
            <h2 className="mt-2 text-[16px] font-extrabold" style={{ color: 'var(--text)' }}>
              {props.labels.howItWorks}
            </h2>
            <ol className="mx-auto mt-3 flex max-w-[300px] flex-col gap-2 text-left text-[13px]" style={{ color: 'var(--muted)' }}>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: 'var(--saffron)', color: '#fff' }}>1</span>
                <span>{props.labels.howStep1}</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: 'var(--saffron)', color: '#fff' }}>2</span>
                <span>{props.labels.howStep2}</span>
              </li>
              <li className="flex gap-2">
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: 'var(--saffron)', color: '#fff' }}>3</span>
                <span>{props.labels.howStep3}</span>
              </li>
            </ol>
            <button
              onClick={generateInvite}
              disabled={generating}
              className="haptic-press cta-primary mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-btn text-[15px] font-bold disabled:opacity-50"
            >
              {generating ? props.labels.generating : props.labels.inviteCta}
              <Sparkles size={14} />
            </button>
          </div>
        )}

        {/* Invite code display + share buttons */}
        {code && (
          <div
            className="mt-5 px-4 py-4"
            style={{
              background: 'linear-gradient(145deg, #f0fdf9, #e6f7f4)',
              border: '1.5px solid var(--trust)',
              borderRadius: 'var(--radius-card-lg)',
            }}
          >
            <div className="text-center">
              <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--trust)' }}>
                {props.labels.codeLabel}
              </div>
              <div
                className="num mt-1.5 select-all"
                style={{
                  fontSize: 30,
                  fontWeight: 900,
                  color: 'var(--text)',
                  letterSpacing: 4,
                  fontFamily: "'Courier New', monospace",
                }}
              >
                {code}
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                onClick={copyCode}
                className="haptic-press flex h-11 items-center justify-center gap-1.5 rounded-btn font-bold"
                style={{
                  background: copied ? 'var(--growth)' : 'var(--surface)',
                  border: `1px solid ${copied ? 'var(--growth)' : 'var(--border)'}`,
                  color: copied ? '#fff' : 'var(--text)',
                  fontSize: 13,
                  transition: 'all 0.2s ease',
                }}
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? props.labels.codeCopied : props.labels.copyCode}
              </button>
              <button
                onClick={shareViaWebShare}
                className="haptic-press flex h-11 items-center justify-center gap-1.5 rounded-btn font-bold"
                style={{ background: '#25D366', color: '#fff', fontSize: 13 }}
              >
                <Share2 size={14} />
                {props.labels.whatsappShare}
              </button>
            </div>
          </div>
        )}

        {/* Members list */}
        {members && members.length > 0 && (
          <div className="mt-5">
            <h3 className="mb-2 px-1 text-[12px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              {props.labels.membersTitle} · {members.length}
            </h3>
            <div className="flex flex-col gap-2">
              {members.map((m) => (
                <MemberRow
                  key={m.userId}
                  member={m}
                  goalSavedPaise={props.goalSavedPaise}
                  labels={{
                    roleOwner: props.labels.roleOwner,
                    roleMember: props.labels.roleMember,
                    contributed: props.labels.contributed,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function StackedProgressBar({
  members,
  totalSavedPaise,
  targetPaise,
}: {
  members: Member[];
  totalSavedPaise: number;
  targetPaise: number;
}) {
  // Each member gets a colored segment proportional to their contribution.
  const colors = ['#E8650A', '#1A7A4A', '#0E8C7A', '#D4A017', '#C4602A', '#9333EA'];
  return (
    <div className="flex h-full">
      {members.map((m, i) => {
        const pct = Math.min(100, (m.contributedPaise / targetPaise) * 100);
        if (pct < 0.1) return null;
        return (
          <div
            key={m.userId}
            className="h-full transition-all"
            style={{
              width: `${pct}%`,
              background: colors[i % colors.length],
            }}
            title={`${m.displayName}: ${pct.toFixed(1)}%`}
          />
        );
      })}
    </div>
  );
}

function MemberRow({
  member,
  goalSavedPaise,
  labels,
}: {
  member: Member;
  goalSavedPaise: number;
  labels: { roleOwner: string; roleMember: string; contributed: string };
}) {
  const fmt = (paise: number) =>
    '₹' + new Intl.NumberFormat('en-IN').format(Math.round(paise / 100));
  const sharePct =
    goalSavedPaise > 0 ? Math.round((member.contributedPaise / goalSavedPaise) * 100) : 0;

  const initial = member.displayName.charAt(0).toUpperCase();

  return (
    <div
      className="flex items-center gap-3 px-3 py-3"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <div
        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full font-bold text-white"
        style={{
          background:
            member.role === 'owner'
              ? 'linear-gradient(135deg, #E8650A, #C4602A)'
              : 'linear-gradient(135deg, #0E8C7A, #1A7A4A)',
          fontSize: 16,
        }}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-bold" style={{ color: 'var(--text)' }}>
            {member.displayName}
          </span>
          <span
            className="rounded-pill px-1.5 py-0.5 text-[9.5px] font-bold uppercase"
            style={{
              background: member.role === 'owner' ? 'var(--bg-highlight)' : 'var(--trust-soft)',
              color: member.role === 'owner' ? 'var(--saffron)' : 'var(--trust)',
            }}
          >
            {member.role === 'owner' ? labels.roleOwner : labels.roleMember}
          </span>
        </div>
        <div className="mt-0.5 text-[11.5px]" style={{ color: 'var(--muted)' }}>
          {labels.contributed}{' '}
          <span className="num font-bold" style={{ color: 'var(--text)' }}>
            {fmt(member.contributedPaise)}
          </span>
          {sharePct > 0 && <span className="num"> · {sharePct}%</span>}
        </div>
      </div>
    </div>
  );
}
