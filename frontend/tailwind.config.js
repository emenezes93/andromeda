/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      /* Typography tokens */
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'heading-sm': ['1.25rem', { lineHeight: '1.4' }],
        'heading': ['1.5rem', { lineHeight: '1.3' }],
        'heading-lg': ['1.875rem', { lineHeight: '1.25' }],
        'display': ['2.25rem', { lineHeight: '1.2' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      /* Color tokens – semantic */
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          hover: 'var(--color-primary-hover)',
          subtle: 'var(--color-primary-subtle)',
          light: 'var(--color-primary-light)',
        },
        surface: {
          DEFAULT: 'var(--color-surface)',
          muted: 'var(--color-surface-muted)',
          calm: 'var(--color-surface-calm)',
        },
        border: {
          DEFAULT: 'var(--color-border)',
          muted: 'var(--color-border-muted)',
          soft: 'var(--color-border-soft)',
        },
        content: {
          DEFAULT: 'var(--color-content)',
          muted: 'var(--color-content-muted)',
          subtle: 'var(--color-content-subtle)',
        },
        /* Semantic feedback */
        success: {
          DEFAULT: 'var(--color-success)',
          light: 'var(--color-success-light)',
        },
        error: {
          DEFAULT: 'var(--color-error)',
          light: 'var(--color-error-light)',
        },
        warning: {
          DEFAULT: 'var(--color-warning)',
          light: 'var(--color-warning-light)',
        },
        info: {
          DEFAULT: 'var(--color-info)',
          light: 'var(--color-info-light)',
        },
      },

      /* Spacing tokens (alias) */
      spacing: {
        'touch': '44px',
        'sidebar': '14rem',
      },

      /* Border radius tokens */
      borderRadius: {
        'button': 'var(--radius-button)',
        'card': 'var(--radius-card)',
        'input': 'var(--radius-input)',
      },

      /* Shadow tokens */
      boxShadow: {
        'card': 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        'soft': 'var(--shadow-soft)',
        'focus': 'var(--shadow-focus)',
      },

      /* Motion tokens */
      transitionDuration: {
        fast: '150ms',
        normal: '200ms',
        slow: '300ms',
      },
      transitionTimingFunction: {
        calm: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      minHeight: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
