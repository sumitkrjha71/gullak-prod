'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { ConsentStep } from './_consent-step';
import { PANStep } from './_pan-step';

type Step = 'consent' | 'pan' | 'done';

export function KYCFlow() {
  const [step, setStep] = useState<Step>('consent');
  const [verifiedName, setVerifiedName] = useState('');
  const router = useRouter();
  const locale = useLocale();

  if (step === 'consent') {
    return <ConsentStep onAccepted={() => setStep('pan')} />;
  }

  if (step === 'pan') {
    return (
      <PANStep
        onVerified={(name) => {
          setVerifiedName(name);
          setStep('done');
        }}
      />
    );
  }

  // Done state — redirect to mandate
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center"
         style={{ background: '#FFF8F0' }}>
      <div className="text-6xl">🎉</div>
      <h1 className="font-bold text-2xl" style={{ color: '#3E1F00' }}>
        Mubarak ho, {verifiedName.split(' ')[0]}!
      </h1>
      <p className="text-base" style={{ color: '#C4602A' }}>
        Aapki pehchaan ho gayi — ab Gullak aapka pakka saathi hai.
      </p>
      <button
        onClick={() => router.push(`/${locale}/mandate`)}
        className="mt-4 w-full max-w-xs rounded-2xl py-4 font-bold text-white text-lg"
        style={{ background: '#E8650A' }}
      >
        Aage badhein →
      </button>
    </div>
  );
}
