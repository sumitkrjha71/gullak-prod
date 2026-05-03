// Onboarding entry — language pick (or fall through if already locale-prefixed).
import { redirect } from 'next/navigation';

export default async function OnboardingEntry({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/onboarding/phone`);
}
