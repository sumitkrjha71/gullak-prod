'use client';

import Image from 'next/image';

export function ChiraiyaLoading({ message, subtle }: { message?: string; subtle?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh w-full flex-col items-center justify-center bg-bg px-6 text-center"
    >
      <div className="relative">
        <Image
          src="/assets/chiraiya-v2.png"
          alt="Chiraiya"
          width={120}
          height={100}
          priority
          style={{ width: 120, height: 100, objectFit: 'contain' }}
          className="anim-float"
        />
        {/* Subtle ground shadow */}
        <span
          aria-hidden
          className="absolute left-1/2 -translate-x-1/2 rounded-full"
          style={{
            bottom: -8,
            width: 60,
            height: 6,
            background: 'radial-gradient(ellipse at center, rgba(62, 31, 0, 0.18), transparent 70%)',
            animation: 'pulseSoft 3s ease-in-out infinite',
          }}
        />
      </div>
      {message && (
        <p className="mt-8 text-[15px] font-semibold text-text">{message}</p>
      )}
      {subtle && <p className="mt-1 text-[12px] text-muted">{subtle}</p>}
    </div>
  );
}
