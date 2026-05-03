import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-soft': 'var(--bg-soft)',
        'bg-highlight': 'var(--bg-highlight)',
        surface: 'var(--surface)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        'muted-light': 'var(--muted-light)',
        border: 'var(--border)',
        'border-light': 'var(--border-light)',
        saffron: 'var(--saffron)',
        terracotta: 'var(--terracotta)',
        gold: 'var(--gold)',
        trust: 'var(--trust)',
        'trust-soft': 'var(--trust-soft)',
        growth: 'var(--growth)',
        'growth-soft': 'var(--growth-soft)',
        warn: 'var(--warn)',
      },
      fontFamily: {
        sans: ['Nunito', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        devanagari: ['Hind', 'Mukta', 'system-ui', 'sans-serif'],
        tiro: ['Tiro Devanagari Hindi', 'Hind', 'serif'],
      },
      borderRadius: {
        card: '14px',
        'card-lg': '16px',
        btn: '14px',
        pill: '24px',
      },
      boxShadow: {
        card: '0 1px 4px rgba(62, 31, 0, 0.05)',
        cta: '0 4px 16px rgba(232, 101, 10, 0.3)',
        sheet: '0 -4px 24px rgba(15, 17, 21, 0.06)',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.16, 1, 0.3, 1)',
        bounce: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
