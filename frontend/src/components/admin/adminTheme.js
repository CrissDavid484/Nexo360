/**
 * Sistema tipográfico y de superficies unificado para todos los módulos del Panel Admin Nexo360.
 * Sincronizado con frontend/src/design/tokens.js y compatible con Light + High-Contrast/Dark en index.css.
 */
export const ADMIN_THEME = {
  // Jerarquía tipográfica única across módulos
  moduleTitle: 'text-xl font-bold tracking-tight text-neutral-900',
  moduleSubtitle: 'text-sm text-neutral-600 font-normal leading-relaxed',
  sectionTitle: 'text-base font-bold tracking-tight text-neutral-900',
  cardLabel: 'text-xs font-semibold uppercase tracking-wider text-neutral-500',
  bodyText: 'text-sm text-neutral-800',
  metaText: 'text-xs font-medium text-neutral-500',
  kpiValue: 'text-3xl font-extrabold tracking-tight text-neutral-900 tabular-nums',

  // Superficies y elevación uniformes
  cardSurface: 'bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-xs',
  subSurface: 'bg-neutral-50 rounded-xl border border-neutral-200 p-4',
  tableWrapper: 'overflow-x-auto rounded-2xl border border-neutral-200 bg-white shadow-xs',
  tableHeaderRow: 'bg-neutral-50 border-b border-neutral-200',
  tableHeaderCell: 'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-neutral-500',
  tableCell: 'px-4 py-3 text-sm text-neutral-800',

  // Controles e inputs con altura mínima accesible uniforme (42px)
  controlInput:
    'min-h-[42px] px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold transition-colors',
  filterPillBase:
    'min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer inline-flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold',
  filterPillActive: 'bg-brand-navy text-white shadow-xs border border-brand-navy',
  filterPillIdle: 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-200',
  badgeBase: 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
};

export default ADMIN_THEME;
