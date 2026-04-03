/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0ea5e9',
          hover: '#0284c7',
          subtle: '#e0f2fe',
          light: '#bae6fd',
          dark: '#0369a1',
        },
        accent: {
          DEFAULT: '#8b5cf6',
          light: '#c4b5fd',
          subtle: '#ede9fe',
        },
        dark: {
          DEFAULT: '#0f172a',
          muted: '#1e293b',
          soft: '#334155',
        },
        surface: {
          DEFAULT: '#ffffff',
          muted: '#f8fafc',
          calm: '#f0f9ff',
        },
        content: {
          DEFAULT: '#0f172a',
          muted: '#475569',
          subtle: '#94a3b8',
        },
        border: {
          DEFAULT: '#e2e8f0',
          muted: '#f1f5f9',
        },
        success: {
          DEFAULT: '#059669',
          light: '#34d399',
          subtle: '#d1fae5',
        },
        warning: {
          DEFAULT: '#d97706',
          light: '#fbbf24',
          subtle: '#fef3c7',
        },
        error: {
          DEFAULT: '#dc2626',
          light: '#f87171',
          subtle: '#fee2e2',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display': ['4.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em' }],
        'display-sm': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'heading': ['2.25rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5' }],
        'body': ['0.9375rem', { lineHeight: '1.6' }],
        'lead': ['1.125rem', { lineHeight: '1.6' }],
        'caption': ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
    },
  },
  plugins: [],
};
