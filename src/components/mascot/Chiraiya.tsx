'use client';

import Image from 'next/image';

export type ChiraiyaState =
  | 'idle'              // gentle float
  | 'thinking'          // input screens — soft tilt
  | 'save-success'      // post-save — coin-carrying pose
  | 'streak'            // streak-hop animation
  | 'milestone'         // celebFly
  | 'processing'        // wing-flap (uses pulseSoft)
  | 'error-shield'      // protective tilt
  | 'withdrawal'        // calendar-in-claw — looking down at Gullak
  | 'gullak-break'      // approach pose, beak-tap
  | 'inactive'          // facing away
  | 'support'           // wing toward chat
  | 'kyc'               // ID-card pose
  | 'new-feature'       // lantern pose
  | 'credit-key';       // golden key

const STATE_STYLE: Record<ChiraiyaState, React.CSSProperties> = {
  idle:           { animation: 'gentleFloat 3s ease-in-out infinite' },
  thinking:       { animation: 'gentleFloat 2.5s ease-in-out infinite', transform: 'rotate(-6deg)' },
  'save-success': { animation: 'birdCarry 1.8s ease-in-out infinite', transform: 'scaleX(-1)' },
  streak:         { animation: 'streakHop 1.6s ease-in-out infinite' },
  milestone:      { animation: 'celebFly 2s ease-in-out infinite' },
  processing:     { animation: 'pulseSoft 1.4s ease-in-out infinite' },
  'error-shield': { animation: 'gentleFloat 4s ease-in-out infinite', transform: 'rotate(-2deg)', filter: 'drop-shadow(0 0 8px rgba(178, 94, 9, 0.35))' },
  withdrawal:     { animation: 'gentleFloat 3s ease-in-out infinite', transform: 'scaleY(0.95)' },
  'gullak-break': { animation: 'celebFly 1.4s ease-in-out infinite', transform: 'scaleX(-1) rotate(-4deg)' },
  inactive:       { transform: 'scaleX(-1)', opacity: 0.55 },
  support:        { animation: 'gentleFloat 3.5s ease-in-out infinite' },
  kyc:            { animation: 'gentleFloat 3s ease-in-out infinite' },
  'new-feature':  { animation: 'gentleFloat 2.5s ease-in-out infinite', filter: 'drop-shadow(0 0 12px rgba(212, 160, 23, 0.5))' },
  'credit-key':   { animation: 'gentleFloat 2.5s ease-in-out infinite', filter: 'drop-shadow(0 0 14px rgba(212, 160, 23, 0.55))' },
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
  const baseStyle = STATE_STYLE[state];
  const finalTransform = flipX
    ? `${baseStyle.transform ?? ''} scaleX(-1)`.trim()
    : baseStyle.transform;
  return (
    <Image
      src="/assets/chiraiya-v2.png"
      alt=""
      width={size}
      height={Math.round(size * 0.83)}
      priority={priority}
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
