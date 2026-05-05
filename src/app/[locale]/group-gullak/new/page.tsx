import { setRequestLocale } from 'next-intl/server';
import { GroupPicker } from './_group-picker';
import { GROUP_THEMES } from '@/lib/goals/group-templates';

export default async function GroupGullakNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <GroupPicker
      locale={locale}
      themes={GROUP_THEMES.map((t) => ({
        type: t.type,
        emoji: t.emoji,
        label: t.label,
        sub: t.sub,
        suggestedTargetPaise: t.suggestedTargetPaise,
        typicalMembers: t.typicalMembers,
      }))}
    />
  );
}
