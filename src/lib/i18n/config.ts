export const locales = ['en', 'hi', 'pa', 'kn', 'mr'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export const localeLabels: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
  kn: 'ಕನ್ನಡ',
  mr: 'मराठी',
};

export const localeGreetings: Record<Locale, string> = {
  en: 'Hello',
  hi: 'नमस्ते',
  pa: 'ਸਤ ਸ੍ਰੀ ਅਕਾਲ',
  kn: 'ನಮಸ್ಕಾರ',
  mr: 'नमस्कार',
};

export const localeNativeNames: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
  kn: 'ಕನ್ನಡ',
  mr: 'मराठी',
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
