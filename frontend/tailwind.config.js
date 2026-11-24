/** @type {import('tailwindcss').Config} */
import tokens from './src/design/tokens.js';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: tokens.colors.brand,
        semantic: tokens.colors.semantic,
        neutral: tokens.colors.neutral,
        hc: tokens.colors.highContrast,
        colorBlind: tokens.colors.colorBlind,
        duoc: {
          navy: tokens.colors.brand.navy,
          navyDark: tokens.colors.brand.navyDark,
          gold: tokens.colors.brand.gold,
          amber: '#B45309',
          light: tokens.colors.neutral[50],
          dark: tokens.colors.neutral[900],
        },
      },
      fontFamily: {
        sans: tokens.typography.fontFamilies.primary,
        dyslexic: tokens.typography.fontFamilies.dyslexic,
        mono: tokens.typography.fontFamilies.mono,
      },
      fontSize: Object.fromEntries(
        Object.entries(tokens.typography.fontSizes).map(([key, [size, props]]) => [
          key,
          [size, props],
        ])
      ),
      fontWeight: tokens.typography.fontWeights,
      lineHeight: tokens.typography.lineHeights,
      spacing: tokens.spacing,
      borderRadius: tokens.borderRadius,
      boxShadow: tokens.shadows,
      transitionDuration: {
        fast: '150ms',
        DEFAULT: '200ms',
        slow: '260ms',
        slower: '300ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        curtain: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      zIndex: tokens.zIndex,
      minHeight: {
        touch: tokens.accessibility.minTouchTarget,
        'touch-lg': '48px',
      },
      minWidth: {
        touch: tokens.accessibility.minTouchTarget,
        'touch-lg': '48px',
      },
      maxWidth: {
        'prose-aaa': '75ch',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        curtainWipeReveal: {
          '0%': { clipPath: 'inset(0 0 100% 0)' },
          '100%': { clipPath: 'inset(0 0 0 0)' },
        },
        curtainFadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0.92' },
        },
        curtainBeamSweep: {
          '0%': { top: '0%', opacity: '0.9' },
          '80%': { opacity: '0.9' },
          '100%': { top: '100%', opacity: '0' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in-up': 'fadeInUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.28s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'curtain-wipe': 'curtainWipeReveal 0.48s cubic-bezier(0.22, 1, 0.36, 1) both',
        'curtain-fade': 'curtainFadeOut 0.48s cubic-bezier(0.22, 1, 0.36, 1) both',
        'curtain-beam': 'curtainBeamSweep 0.48s cubic-bezier(0.22, 1, 0.36, 1) forwards',
      },
    },
  },
  plugins: [],
};