/**
 * Nexo360 Design Tokens — Single Source of Truth for UI
 * WCAG 2.2 AA/AAA compliant, Duoc UC institutional branding
 * No AI watermarks, no generated commentary — production-ready tokens only.
 */

export const colors = {
  // Institutional Brand (Duoc UC Sede Alameda)
  brand: {
    navy: '#002B49',
    navyDark: '#001D33',
    navyLight: '#073B5E',
    gold: '#FFB81C',
    goldDark: '#E6A500',
    goldLight: '#FFF3C7',
  },

  // Semantic Colors (WCAG 2.2 AA compliant contrast ratios)
  semantic: {
    success: {
      50: '#ECFDF5',
      100: '#D1FAE5',
      500: '#10B981',
      600: '#059669',
      700: '#047857',
      900: '#064E3B',
    },
    warning: {
      50: '#FFFCF0',
      100: '#FEF3C7',
      500: '#F59E0B',
      600: '#D97706',
      700: '#B45309',
      900: '#78350F',
    },
    error: {
      50: '#FEF2F2',
      100: '#FEE2E2',
      500: '#EF4444',
      600: '#DC2626',
      700: '#B91C1C',
      900: '#7F1D1D',
    },
    info: {
      50: '#EEF2FF',
      100: '#E0E7FF',
      500: '#6366F1',
      600: '#4F46E5',
      700: '#4338CA',
      900: '#312E81',
    },
  },

  // Neutral Scale (Slate-based for low sensory load)
  neutral: {
    0: '#FFFFFF',
    25: '#FCFCFD',
    50: '#EEF2F6',
    100: '#E2E8F0',
    200: '#CBD5E1',
    300: '#94A3B8',
    400: '#64748B',
    500: '#475569',
    600: '#334155',
    700: '#1E293B',
    800: '#0F172A',
    900: '#070B12',
    950: '#030509',
  },

  // High Contrast Mode Palette (WCAG 2.2 AAA)
  highContrast: {
    bg: '#070B12',
    bgElevated: '#0F172A',
    bgSecondary: '#1E293B',
    fg: '#FFFFFF',
    fgMuted: '#E2E8F0',
    primary: '#FFB81C',
    primaryFg: '#05080F',
    border: '#334155',
    borderFocus: '#FFB81C',
    success: '#7DD3FC',
    warning: '#FDE047',
    error: '#FCA5A5',
    focusRing: '#FFB81C',
  },

  // Color Blind Safe Palettes (Okabe-Ito derived)
  colorBlind: {
    protanopia: {
      red: '#D55E00',
      green: '#0072B2',
      amber: '#E69F00',
    },
    deuteranopia: {
      red: '#D55E00',
      green: '#0072B2',
      amber: '#E69F00',
    },
    tritanopia: {
      red: '#BE185D',
      green: '#0F766E',
      amber: '#D55E00',
    },
  },
};

export const spacing = {
  0: '0',
  1: '0.25rem',
  2: '0.5rem',
  3: '0.75rem',
  4: '1rem',
  5: '1.25rem',
  6: '1.5rem',
  8: '2rem',
  10: '2.5rem',
  12: '3rem',
  16: '4rem',
  20: '5rem',
  24: '6rem',
};

export const typography = {
  fontFamilies: {
    primary: ['Atkinson Hyperlegible', 'Open Sans', 'system-ui', '-apple-system', 'sans-serif'],
    dyslexic: ['OpenDyslexic', 'Comic Sans MS', 'cursive', 'sans-serif'],
    mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
  },
  fontSizes: {
    xs: ['0.75rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
    sm: ['0.8125rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
    base: ['0.875rem', { lineHeight: '1.6', letterSpacing: '0.01em' }],
    lg: ['1rem', { lineHeight: '1.6', letterSpacing: '0.01em' }],
    xl: ['1.125rem', { lineHeight: '1.6', letterSpacing: '0.01em' }],
    '2xl': ['1.25rem', { lineHeight: '1.5', letterSpacing: '0.01em' }],
    '3xl': ['1.5rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
    '4xl': ['1.875rem', { lineHeight: '1.3', letterSpacing: '0.01em' }],
    '5xl': ['2.25rem', { lineHeight: '1.2', letterSpacing: '0.01em' }],
  },
  fontWeights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },
  lineHeights: {
    tight: '1.3',
    snug: '1.4',
    normal: '1.6',
    relaxed: '1.75',
    loose: '2',
  },
  accessibleSizes: {
    normal: '16px',
    large: '18.5px',
    xlarge: '21.5px',
  },
};

export const borderRadius = {
  none: '0',
  sm: '0.375rem',
  DEFAULT: '0.5rem',
  md: '0.75rem',
  lg: '1rem',
  xl: '1.25rem',
  '2xl': '1.5rem',
  full: '9999px',
};

export const shadows = {
  none: 'none',
  xs: '0 1px 2px 0 rgba(15, 23, 42, 0.03)',
  sm: '0 1px 3px 0 rgba(15, 23, 42, 0.06), 0 1px 2px -1px rgba(15, 23, 42, 0.06)',
  DEFAULT: '0 4px 6px -1px rgba(15, 23, 42, 0.06), 0 2px 4px -2px rgba(15, 23, 42, 0.03)',
  md: '0 10px 15px -3px rgba(15, 23, 42, 0.06), 0 4px 6px -4px rgba(15, 23, 42, 0.03)',
  lg: '0 20px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.03)',
  xl: '0 25px 50px -12px rgba(15, 23, 42, 0.12)',
  inner: 'inset 0 2px 4px 0 rgba(15, 23, 42, 0.05)',
  focus: '0 0 0 4px rgba(255, 184, 28, 0.55)',
  focusHighContrast: '0 0 0 5px rgba(0, 0, 0, 0.9)',
  focusProtanopia: '0 0 0 4px rgba(213, 94, 0, 0.55)',
  focusDeuteranopia: '0 0 0 4px rgba(213, 94, 0, 0.55)',
  focusTritanopia: '0 0 0 4px rgba(190, 24, 93, 0.55)',
};

export const transitions = {
  fast: '0.15s cubic-bezier(0.2, 0.8, 0.2, 1)',
  DEFAULT: '0.2s cubic-bezier(0.2, 0.8, 0.2, 1)',
  slow: '0.26s cubic-bezier(0.2, 0.8, 0.2, 1)',
  slower: '0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
  curtain: '0.48s cubic-bezier(0.22, 1, 0.36, 1)',
};

export const zIndex = {
  hide: -1,
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  toast: 800,
  accessibilityFab: 900,
  accessibilityPanel: 950,
  viewTransition: 9998,
  max: 9999,
};

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1480px',
};

export const container = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1480px',
};

export const motion = {
  reduced: {
    transitionDuration: '0.001ms',
    animationDuration: '0.001ms',
    animationIterationCount: 1,
  },
};

export const accessibility = {
  minTouchTarget: '44px',
  minTouchTargetIcon: '40px',
  focusOutlineWidth: '2px',
  focusOutlineOffset: '2px',
  focusRingWidth: '4px',
  highContrastFocusOutlineWidth: '3px',
  highContrastFocusRingWidth: '5px',
};

export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  breakpoints,
  container,
  motion,
  accessibility,
};