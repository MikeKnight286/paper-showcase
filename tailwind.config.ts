import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        crimson: {
          50:  '#fff5f5',
          100: '#ffe0e0',
          200: '#ffb3b3',
          400: '#f05252',
          600: '#c81e1e',
          700: '#a31515',
          800: '#7c0e0e',
          900: '#560808',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'serif'],
        body:    ['var(--font-body)',    'sans-serif'],
        mono:    ['var(--font-mono)',    'monospace'],
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease both',
        'slide-up':   'slideUp 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'spin-slow':  'spin 8s linear infinite',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' },                     to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(12px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};

export default config;
