'use client';

import Image from 'next/image';

export type ChiraiyaState =
  | 'idle'              // gentle float — onboarding moments
  | 'thinking'          // input screens — soft tilt
  | 'save-success'      // post-save — coin-carrying pose
  | 'streak'            // streak-hop
  | 'milestone'         // celebFly
  | 'processing'        // wing-flap
  | 'error-shield'      // protective tilt
  | 'withdrawal'        // calendar-in-claw — looking down at Gullak
  | 'gullak-break'      // approach pose, beak-tap
  | 'inactive'          // facing away
  | 'support'           // wing toward chat
  | 'kyc'               // ID-card pose
  | 'new-feature'       // lantern pose
  | 'credit-key';       // golden key

// ─────────────────────────────────────────────────────────────────────────────
// Mascot policy — LIVELY but TASTEFUL.
//
// Direction (user, 2026-06-24): "I wanted a Lively CHIRAIYA as the mascot."
//
// Chiraiya stays present and expressive across the journey — she is part of
// Gullak's identity (the dost). What changes from the legacy implementation:
//   1. Motion is expressive but BOUNDED — one-shot animations that complete
//      and rest, not infinite pulse/float loops that signal "toy app".
//   2. On idle/thinking states, Chiraiya is alive (subtle finite float that
//      stops after 2 cycles, then static — appears poised, not jittery).
//   3. Asset upgrade pending — current PNG can be swapped for a Lottie/GIF
//      asset (see CHIRAIYA_ASSET below) without changing call sites.
//   4. NEXT_PUBLIC_MASCOT_LEVEL still gates presence:
//        hero      — V0 default. Chiraiya appears across the journey.
//        standard  — onboarding + KYC + milestones only.
//        minimal   — celebrations + errors only.
//        off       — never render.
//      Default is 'hero' (lively) for v0/v1. v2 introduces vernacular layer.
//
// Asset swap path:
//   1. Drop a higher-fidelity asset at /public/assets/chiraiya-v3.gif (animated
//      GIF) or /public/assets/chiraiya-v3.json (Lottie). Set CHIRAIYA_ASSET
//      below to point at it. v3 reigns. Old PNG stays as fallback.
//   2. For Lottie, replace the <Image> below with a lazy-loaded LottiePlayer
//      (lottie-react) — see the comment marker further down.
// ─────────────────────────────────────────────────────────────────────────────

type MascotLevel = 'off' | 'minimal' | 'standard' | 'hero';

const LEVEL: MascotLevel =
  (process.env.NEXT_PUBLIC_MASCOT_LEVEL as MascotLevel | undefined) ?? 'hero';

const CHIRAIYA_ASSET = '/assets/chiraiya-v2.png';
// Phase-2 asset upgrade target (when designer ships higher fidelity):
//   const CHIRAIYA_ASSET = '/assets/chiraiya-v3.gif';
// Lottie wiring lives below the <Image> tag — gated on the .json extension.

const STATE_MIN_LEVEL: Record<ChiraiyaState, MascotLevel> = {
  milestone:      'minimal',
  'error-shield': 'minimal',
  'save-success': 'minimal',
  support:        'minimal',
  'gullak-break': 'minimal',
  idle:           'standard',
  thinking:       'standard',
  kyc:            'standard',
  'new-feature':  'standard',
  withdrawal:     'standard',
  streak:         'standard',
  processing:     'hero',
  inactive:       'hero',
  'credit-key':   'hero',
};

const LEVEL_RANK: Record<MascotLevel, number> = { off: 0, minimal: 1, standard: 2, hero: 3 };

function isStateAllowed(state: ChiraiyaState): boolean {
  if (LEVEL === 'off') return false;
  return LEVEL_RANK[LEVEL] >= LEVEL_RANK[STATE_MIN_LEVEL[state]];
}

// v2 motion budget — expressive but bounded.
//   - idle/thinking/processing: still uses gentleFloat but with iteration-count: 2
//     so it pulses twice and stops (lively, not jittery). Resumes on re-mount.
//   - celebratory states (save-success, milestone, gullak-break) keep their
//     character but as one-shot animations (1 iteration) — earned moments.
//   - error-shield / withdrawal stay static (poise > motion under stress).
const STATE_STYLE: Record<ChiraiyaState, React.CSSProperties> = {
  idle:           { animation: 'gentleFloat 2.4s ease-in-out 2' },                       // 2 cycles then rest
  thinking:       { animation: 'gentleFloat 2.4s ease-in-out 2', transform: 'rotate(-6deg)' },
  'save-success': { animation: 'birdCarry 1.8s ease-in-out 1', transform: 'scaleX(-1)' },
  streak:         { animation: 'streakHop 1.6s ease-in-out 2' },
  milestone:      { animation: 'celebFly 2s ease-in-out 1' },
  processing:     { animation: 'pulseSoft 1.4s ease-in-out 2' },
  'error-shield': { transform: 'rotate(-2deg)', filter: 'drop-shadow(0 0 8px rgba(178, 94, 9, 0.35))' },
  withdrawal:     { transform: 'scaleY(0.95)' },
  'gullak-break': { animation: 'celebFly 1.4s ease-in-out 1', transform: 'scaleX(-1) rotate(-4deg)' },
  inactive:       { transform: 'scaleX(-1)', opacity: 0.55 },
  support:        { animation: 'gentleFloat 2.4s ease-in-out 2' },
  kyc:            { animation: 'gentleFloat 2.4s ease-in-out 2' },
  'new-feature':  { animation: 'gentleFloat 2.4s ease-in-out 2', filter: 'drop-shadow(0 0 12px rgba(212, 160, 23, 0.5))' },
  'credit-key':   { animation: 'gentleFloat 2.4s ease-in-out 2', filter: 'drop-shadow(0 0 14px rgba(212, 160, 23, 0.55))' },
};

export function Chiraiya({
  state = 'idle',
  size = 64,
  className,
  flipX = false,
  priority = false,
}: {
  state?: ChiraiyaState;
  size?: number;
  className?: string;
  flipX?: boolean;
  priority?: boolean;
}) {
  if (!isStateAllowed(state)) return null;

  const baseStyle = STATE_STYLE[state];
  const finalTransform = flipX
    ? `${baseStyle.transform ?? ''} scaleX(-1)`.trim()
    : baseStyle.transform;

  // When CHIRAIYA_ASSET points at a Lottie JSON, wire LottiePlayer here.
  // For now we render the PNG/GIF via next/image — animated GIFs work natively.
  return (
    <Image
      src={CHIRAIYA_ASSET}
      alt=""
      width={size}
      height={Math.round(size * 0.83)}
      priority={priority}
      unoptimized={CHIRAIYA_ASSET.endsWith('.gif')}   // next/image static-optimises GIFs to PNG by default — opt out
      className={className}
      style={{
        width: size,
        height: Math.round(size * 0.83),
        objectFit: 'contain',
        filter: baseStyle.filter ?? 'drop-shadow(0 4px 10px rgba(196, 96, 42, 0.18))',
        animation: baseStyle.animation,
        transform: finalTransform,
      }}
    />
  );
}
