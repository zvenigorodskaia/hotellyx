import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}'
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-2': 'var(--surface-2)',
        border: 'var(--border)',
        text: 'var(--text)',
        muted: 'var(--muted)',
        brand: 'var(--brand)',
        'brand-2': 'var(--brand-2)',
        link: 'var(--link)',
        focus: 'var(--focus)',
      },
      borderRadius: {
        none: '0px',
        sm: '2px',
      },
      boxShadow: {
        soft: 'none',
      },
    }
  },
  plugins: []
};

export default config;
