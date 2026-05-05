'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Target,
  Shield,
  Sparkles,
  Globe,
  Banknote,
  ArrowRight,
  ChevronDown,
} from 'lucide-react';

export function PitchView({ locale }: { locale: string }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <main
      className="anim-screen-enter min-h-dvh w-full pb-12"
      style={{ background: 'var(--bg)', fontFamily: "'Nunito', sans-serif" }}
    >
      {/* Hero */}
      <section
        className="px-6 pt-12 pb-10 text-center"
        style={{
          background: 'linear-gradient(180deg, #FFF8F0 0%, #FFF2E5 70%, #FFF8F0 100%)',
        }}
      >
        <div className="mx-auto max-w-3xl">
          <Image
            src="/assets/gullak-pot.png"
            alt="Gullak"
            width={120}
            height={100}
            priority
            style={{
              width: 120,
              height: 100,
              objectFit: 'contain',
              margin: '0 auto',
              filter: 'drop-shadow(0 0 24px rgba(212,160,23,0.5))',
            }}
            className="anim-float"
          />
          <div
            className="mx-auto mt-4 inline-flex items-center gap-1.5 rounded-pill px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest"
            style={{ background: 'var(--saffron)', color: '#fff' }}
          >
            <Sparkles size={12} aria-hidden /> Investor View
          </div>
          <h1
            className="font-tiro mt-3 text-balance"
            style={{ fontSize: 'clamp(28px, 6vw, 44px)', fontWeight: 900, color: 'var(--text)', letterSpacing: -0.5, lineHeight: 1.1 }}
          >
            Bharat ka pehla<br />
            <span
              style={{
                background: 'linear-gradient(135deg, #E8650A, #D4A017)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Savestment
            </span>{' '}
            platform
          </h1>
          <p
            className="mx-auto mt-3 max-w-xl text-balance"
            style={{ fontSize: 'clamp(14px, 3.5vw, 17px)', color: 'var(--muted)', lineHeight: 1.55 }}
          >
            Har Indian ke liye — gig worker se salaried tak, T2 se metro tak.
            Auto-savings + safe investments + family + cultural rhythm — sab ek jagah.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <Stat label="TAM" value="200M+" sub="Bharat earners" />
            <Stat label="SAM" value="50M" sub="UPI-active, salaried + gig" />
            <Stat label="SOM" value="3M" sub="Reachable in Y1-Y2" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-6 pt-8">
        {/* The Problem */}
        <Section title="The Problem" intent="warm">
          <p className="text-[14.5px]" style={{ color: 'var(--text)', lineHeight: 1.65 }}>
            <span className="font-bold">Most Indians don't invest.</span> Of 200M+ earning Indians,
            only ~12M have an active mutual-fund SIP. The other 188M park money in savings
            accounts (~3% return) or hoard physical gold (10K+ tonnes in Indian homes).
          </p>
          <ul className="mt-3 flex flex-col gap-2 text-[13px]" style={{ color: 'var(--muted)' }}>
            <ProblemBullet emoji="🤷" text="Don't know how — no advisor access in T2/T3" />
            <ProblemBullet emoji="💔" text="Don't trust — burned by chit-funds, ULIPs, mis-selling" />
            <ProblemBullet emoji="💸" text="Don't have ₹500 — mental model says investing = lakhs" />
            <ProblemBullet emoji="😴" text="Don't have time — cognitive load of choosing & monitoring" />
          </ul>
        </Section>

        {/* The Solution */}
        <Section title="Our Wedge: 4 Bharat-First Moats" intent="solution">
          <div className="grid gap-3">
            <Moat
              icon={<Users size={18} />}
              title="Family / Group Gullak"
              body="Multi-member shared goals — chit-fund tradition mapped to digital. Most emotional goals (wedding, home, parent's care) are inherently group decisions. Zero competitors do this well."
              color="#0E8C7A"
            />
            <Moat
              icon={<TrendingUp size={18} />}
              title="Variable Income Support"
              body="Inflow-percentage rules (Roz ka 5%) + Burst-mode locks. Unlocks the 80% TAM — gig workers, daily wagers, agri, small shop owners — who can't commit to fixed daily ₹20."
              color="#E8650A"
            />
            <Moat
              icon={<Globe size={18} />}
              title="Cultural Rhythm"
              body="Hyper-local festival calendar across 12 festivals × multiple states (Diwali, Onam, Pongal, Bihu, Chhath, Vishu, Baisakhi, Ugadi, Gudi Padwa…). Auto-calculates daily-save to hit festival fund target."
              color="#D4A017"
            />
            <Moat
              icon={<Shield size={18} />}
              title="Trust Through Transparency"
              body="Every rupee, every instrument, every day visible. Animated pie shows Govt 55% / Gold 25% / AAA 20%. RRTTLLU disclosure. Real-time audit log. Daily 'Aaj Gullak ne ₹X ka digital sona khareeda'."
              color="#1A7A4A"
            />
          </div>
        </Section>

        {/* Why now */}
        <Section title="Why Now?" intent="warm">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FactCard num="600M" label="UPI users · 10× since 2020" />
            <FactCard num="850M" label="Smartphone users in India by 2026" />
            <FactCard num="80%" label="Bharat earners are non-salaried" />
            <FactCard num="4 langs" label="V5 ships: en/hi/pa/kn/mr (6+ planned)" />
          </div>
          <p className="mt-3 text-[13px]" style={{ color: 'var(--muted)', lineHeight: 1.6 }}>
            UPI rails + Account Aggregator (Sahamati) framework + OCEN credit infra are now
            stable. The plumbing exists. What's missing is the consumer experience that
            actually understands Bharat — that's our wedge.
          </p>
        </Section>

        {/* Business Model */}
        <Section title="Business Model" intent="solution">
          <div className="grid gap-3 sm:grid-cols-3">
            <RevenueCard
              icon="💰"
              title="Trail commission on AUM"
              sub="0.5-1.0% trail on assets under management with regulated AMC partners"
              tag="Primary"
            />
            <RevenueCard
              icon="🔑"
              title="NBFC distribution"
              sub="Origination commission on credit (two-wheeler, gold, consumer-durable, emergency lines)"
              tag="Embedded"
            />
            <RevenueCard
              icon="✨"
              title="Premium tier"
              sub="Aatmanirbhar+: family Gullak unlimited, advisor-on-call, advanced analytics"
              tag="Y2+"
            />
          </div>
          <div
            className="mt-3 rounded-card-lg px-4 py-3 text-[12.5px]"
            style={{ background: 'var(--trust-soft)', color: 'var(--text)', border: '1px solid #b8e6dc' }}
          >
            <span className="font-bold" style={{ color: 'var(--trust)' }}>No balance-sheet risk.</span>
            {' '}We're a distributor — never a lender, never an asset holder. Clean unit economics.
            Regulatory-clean (SEBI distributor + AA license + NBFC partners).
          </div>
        </Section>

        {/* Traction */}
        <Section title="Traction (V5 Snapshot)" intent="warm">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <TractionTile num="11" label="Bharat-first features shipped (V5)" />
            <TractionTile num="5" label="Languages live (en/hi/pa/kn/mr)" />
            <TractionTile num="12" label="Festivals across 8 states" />
            <TractionTile num="5" label="Tiers (Bachat Shuruati → Aatmanirbhar)" />
          </div>
          <p className="mt-3 text-[12.5px]" style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
            Live on Vercel + Android APK (Trusted Web Activity via PWABuilder).
            <br />Demo creds: phone <span className="num font-bold">9999900000</span> · OTP <span className="num font-bold">123456</span>.
          </p>
        </Section>

        {/* Roadmap */}
        <Section title="Roadmap" intent="solution">
          <RoadmapRow phase="V5 (now)" items={['Family Gullak', 'Inflow %', 'Tiers', 'Munafa chart', 'Pie + gold', 'Festival nudges', 'Pitch route']} />
          <RoadmapRow phase="V6" items={['Sangam Shagun (gift Munafa)', 'Real referral + leaderboard', 'Push notifications', 'AI Agent (Hinglish chat)']} />
          <RoadmapRow phase="V7" items={['Real AA + OCEN integration', 'KYC capture (DigiLocker + Aadhaar)', 'Real PSP (Razorpay/Setu)', 'Voice-first onboarding']} />
          <RoadmapRow phase="Y2" items={['SBI / HDFC partnership', 'Tamil + Telugu + Bengali + Gujarati', 'iOS APK (Apple Dev Program)', 'Premium tier launch']} />
        </Section>

        {/* CTA back */}
        <Section title="" intent="solution">
          <div className="text-center">
            <p
              className="font-tiro text-balance"
              style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', lineHeight: 1.3 }}
            >
              Aapka paisa, aapke naam, aapke control mein.
              <br />
              <span style={{ color: 'var(--saffron)' }}>Bharat ke har dil mein.</span>
            </p>
            <Link
              href={`/${locale}/home`}
              className="cta-primary haptic-press mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-btn px-6 text-[14.5px] font-bold"
            >
              Try the live app <ArrowRight size={14} />
            </Link>
          </div>
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  intent,
  children,
}: {
  title: string;
  intent: 'warm' | 'solution';
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      {title && (
        <h2
          className="mb-3 inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest"
          style={{ color: intent === 'solution' ? 'var(--saffron)' : 'var(--terracotta)' }}
        >
          <span
            style={{
              display: 'inline-block',
              width: 18,
              height: 1.5,
              background: intent === 'solution' ? 'var(--saffron)' : 'var(--terracotta)',
            }}
          />
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div
      className="px-4 py-3 text-center"
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-card)',
        boxShadow: 'var(--shadow-card)',
        minWidth: 120,
      }}
    >
      <div className="text-[10.5px] font-bold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
      <div className="num mt-0.5 text-[20px] font-extrabold" style={{ color: 'var(--text)' }}>
        {value}
      </div>
      <div className="text-[10px]" style={{ color: 'var(--muted-light)' }}>
        {sub}
      </div>
    </div>
  );
}

function ProblemBullet({ emoji, text }: { emoji: string; text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="flex-shrink-0 text-[16px]" aria-hidden>
        {emoji}
      </span>
      <span style={{ lineHeight: 1.5 }}>{text}</span>
    </li>
  );
}

function Moat({
  icon,
  title,
  body,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  color: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="px-4 py-3.5"
      style={{
        background: 'var(--surface)',
        border: `1.5px solid ${color}33`,
        borderRadius: 'var(--radius-card-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-center gap-2.5">
        <div
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
          style={{ background: color, color: '#fff' }}
        >
          {icon}
        </div>
        <span className="text-[15px] font-extrabold" style={{ color: 'var(--text)' }}>
          {title}
        </span>
      </div>
      <p className="mt-2 text-[13px]" style={{ color: 'var(--muted)', lineHeight: 1.55 }}>
        {body}
      </p>
    </motion.div>
  );
}

function FactCard({ num, label }: { num: string; label: string }) {
  return (
    <div
      className="px-4 py-3.5"
      style={{
        background: 'linear-gradient(145deg, #FFF5EC, #FFE9D2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-card-lg)',
      }}
    >
      <div className="num text-[24px] font-extrabold leading-none" style={{ color: 'var(--saffron)' }}>
        {num}
      </div>
      <div className="mt-1 text-[12px]" style={{ color: 'var(--muted)' }}>
        {label}
      </div>
    </div>
  );
}

function RevenueCard({
  icon,
  title,
  sub,
  tag,
}: {
  icon: string;
  title: string;
  sub: string;
  tag: string;
}) {
  return (
    <div
      className="px-4 py-3.5"
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-card-lg)',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div className="flex items-start gap-2">
        <span style={{ fontSize: 22 }} aria-hidden>
          {icon}
        </span>
        <span
          className="ml-auto rounded-pill px-2 py-0.5 text-[10px] font-bold"
          style={{ background: 'var(--bg-highlight)', color: 'var(--saffron)' }}
        >
          {tag}
        </span>
      </div>
      <div className="mt-2 text-[13px] font-extrabold" style={{ color: 'var(--text)' }}>
        {title}
      </div>
      <div className="mt-1 text-[11.5px]" style={{ color: 'var(--muted)', lineHeight: 1.5 }}>
        {sub}
      </div>
    </div>
  );
}

function TractionTile({ num, label }: { num: string; label: string }) {
  return (
    <div
      className="px-3 py-3 text-center"
      style={{
        background: 'linear-gradient(145deg, #e6f7f4, #f0fdf9)',
        border: '1px solid #b8e6dc',
        borderRadius: 'var(--radius-card)',
      }}
    >
      <div className="num text-[24px] font-extrabold leading-none" style={{ color: 'var(--trust)' }}>
        {num}
      </div>
      <div className="mt-1 text-[10.5px]" style={{ color: 'var(--text)', lineHeight: 1.3 }}>
        {label}
      </div>
    </div>
  );
}

function RoadmapRow({ phase, items }: { phase: string; items: string[] }) {
  return (
    <div className="mt-2 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <span
        className="rounded-pill px-3 py-1 text-[11px] font-bold"
        style={{ background: 'var(--bg-highlight)', color: 'var(--saffron)', flexShrink: 0 }}
      >
        {phase}
      </span>
      <span className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <span
            key={it}
            className="inline-flex rounded-pill px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: 'var(--surface)', color: 'var(--muted)', border: '1px solid var(--border)' }}
          >
            {it}
          </span>
        ))}
      </span>
    </div>
  );
}
