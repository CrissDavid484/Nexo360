/**
 * Perfiles de discapacidad PAEDIS, modos de daltonismo y adaptación automática
 * de preferencias de accesibilidad WCAG 2.2 / W3C COGA para Nexo360 (Duoc UC).
 */

export const COLOR_BLIND_MODES = [
  {
    id: 'none',
    label: 'Sin filtro de daltonismo',
    description: 'Paleta institucional estándar Duoc UC.',
  },
  {
    id: 'protanopia',
    label: 'Protanopia (déficit rojo)',
    description: 'Paleta segura con contraste azul/ámbar sin ambigüedad rojo-verde.',
  },
  {
    id: 'deuteranopia',
    label: 'Deuteranopia (déficit verde)',
    description: 'Paleta adaptada con diferenciación por tono, forma y borde.',
  },
  {
    id: 'tritanopia',
    label: 'Tritanopia (déficit azul-amarillo)',
    description: 'Paleta segura de alto contraste magenta/cian/oscuro.',
  },
];

export const BASE_ACCESSIBILITY_PREFERENCES = Object.freeze({
  fontSize: 'normal',
  highContrast: false,
  dyslexicFont: false,
  reducedMotion: false,
  readingGuide: false,
  voiceReader: false,
  screenReaderOptimized: true,
  colorBlindMode: 'none',
  clearReadingMode: false,
});

export const DISABILITY_PROFILES = [
  {
    id: 'ninguna',
    label: 'Sin condición declarada / Estándar',
    barrera: 'Sin barrera declarada',
    summary: 'Configuración visual y sonora estándar de Nexo360 sin adaptaciones automáticas.',
    autoAdaptationHint:
      'Mantiene los valores estándar y permite personalizar herramientas manualmente.',
    defaults: {},
  },
  {
    id: 'ceguera_total',
    label: 'Ceguera total / Persona no vidente',
    barrera: 'Visual / Persona No Vidente',
    summary:
      'Optimizado para lectores de pantalla, navegación por teclado y lectura por voz automática.',
    autoAdaptationHint:
      'Activa Lectura por Voz (Alt+V) y lector de pantalla; oculta controles visuales innecesarios.',
    defaults: {
      voiceReader: true,
      screenReaderOptimized: true,
      readingGuide: false,
      highContrast: false,
      fontSize: 'normal',
      clearReadingMode: false,
      colorBlindMode: 'none',
    },
  },
  {
    id: 'baja_vision',
    label: 'Baja visión',
    barrera: 'Visual / Baja Visión',
    summary:
      'Amplía la tipografía al máximo, activa alto contraste nocturno y habilita apoyo auditivo.',
    autoAdaptationHint:
      'Activa Tamaño de letra Extra Grande (130%), Alto Contraste y Lectura por Voz.',
    defaults: {
      fontSize: 'xlarge',
      highContrast: true,
      voiceReader: true,
      readingGuide: false,
      screenReaderOptimized: true,
    },
  },
  {
    id: 'daltonismo',
    label: 'Daltonismo / Discriminación cromática',
    barrera: 'Visual / Daltonismo',
    summary:
      'Reemplaza colores ambiguos en semáforos y estados por paletas seguras Okabe-Ito con bordes.',
    autoAdaptationHint:
      'Aplica automáticamente el filtro de daltonismo seleccionado (Deuteranopia por defecto).',
    defaults: {
      colorBlindMode: 'deuteranopia',
    },
  },
  {
    id: 'tea',
    label: 'TEA / Trastorno del Espectro Autista',
    barrera: 'Neurodivergencia / TEA',
    summary:
      'Reduce la sobrecarga sensorial con lectura clara resumida por pasos, calma visual y guía de lectura.',
    autoAdaptationHint:
      'Activa Lectura clara y resumida, Sin animaciones y Guía de lectura.',
    defaults: {
      clearReadingMode: true,
      reducedMotion: true,
      readingGuide: true,
    },
  },
  {
    id: 'dislexia_tdah',
    label: 'Dislexia / TDAH / Dificultad específica de aprendizaje',
    barrera: 'Neurodivergencia / Dislexia-TDAH',
    summary:
      'Facilita la decodificación lectora con tipografía especializada, regla visual y menos distracciones.',
    autoAdaptationHint:
      'Activa Lectura cómoda (Dislexia), Guía de lectura (Enfoque) y Sin animaciones.',
    defaults: {
      dyslexicFont: true,
      readingGuide: true,
      reducedMotion: true,
    },
  },
  {
    id: 'auditiva',
    label: 'Discapacidad auditiva / Persona Sorda (LSCh)',
    barrera: 'Auditiva / LSCh',
    summary:
      'Prioriza señales visuales claras en pantalla y navegación silenciosa sin dependencia sonora.',
    autoAdaptationHint:
      'Mantiene lectura visual estructurada sin activar locuciones de audio automáticas.',
    defaults: {
      voiceReader: false,
      screenReaderOptimized: true,
    },
  },
  {
    id: 'movilidad_reducida',
    label: 'Movilidad reducida / Motora',
    barrera: 'Motora / Movilidad Reducida',
    summary:
      'Optimiza el desplazamiento integral mediante teclado (Tab, Shift+Tab y flechas) sin transiciones bruscas.',
    autoAdaptationHint:
      'Activa Sin animaciones y mantiene navegación bidireccional completa por teclado.',
    defaults: {
      reducedMotion: true,
      screenReaderOptimized: true,
    },
  },
  {
    id: 'otra',
    label: 'Otra condición o ajuste razonable PAEDIS',
    barrera: 'Otra / Ajuste Razonable PAEDIS',
    summary:
      'Perfil flexible para coordinar ajustes razonables específicos con el equipo PAEDIS Sede Alameda.',
    autoAdaptationHint:
      'Conserva disponibles todas las opciones visuales, cognitivas y de voz para ajuste libre.',
    defaults: {
      screenReaderOptimized: true,
    },
  },
];

const DISABILITY_PROFILE_MAP = new Map(DISABILITY_PROFILES.map((profile) => [profile.id, profile]));
const COLOR_BLIND_MODE_MAP = new Map(COLOR_BLIND_MODES.map((mode) => [mode.id, mode]));

/**
 * Normaliza un identificador de modo de daltonismo contra la lista oficial.
 */
export function normalizeColorBlindMode(modeId) {
  if (typeof modeId !== 'string') return 'none';
  const clean = modeId.trim().toLowerCase();
  return COLOR_BLIND_MODE_MAP.has(clean) ? clean : 'none';
}

/**
 * Retorna los metadatos completos de un perfil de discapacidad PAEDIS.
 */
export function getDisabilityProfileMeta(id) {
  if (typeof id !== 'string') {
    return DISABILITY_PROFILE_MAP.get('ninguna');
  }
  return DISABILITY_PROFILE_MAP.get(id.trim()) || DISABILITY_PROFILE_MAP.get('ninguna');
}

/**
 * Retorna los metadatos de un modo de daltonismo.
 */
export function getColorBlindModeMeta(id) {
  const normalized = normalizeColorBlindMode(id);
  return COLOR_BLIND_MODE_MAP.get(normalized) || COLOR_BLIND_MODE_MAP.get('none');
}

/**
 * Indica si el perfil corresponde a ceguera total (persona no vidente).
 */
export function isBlindDisabilityProfile(id) {
  return typeof id === 'string' && id.trim() === 'ceguera_total';
}

/**
 * Construye el conjunto completo de preferencias predeterminadas para una condición PAEDIS.
 */
export function getDefaultPreferencesForDisability(id, colorBlindSubtype = 'deuteranopia') {
  const meta = getDisabilityProfileMeta(id);
  if (meta.id === 'daltonismo') {
    const normalizedSubtype = normalizeColorBlindMode(colorBlindSubtype);
    const activeSubtype = normalizedSubtype === 'none' ? 'deuteranopia' : normalizedSubtype;
    return {
      ...BASE_ACCESSIBILITY_PREFERENCES,
      colorBlindMode: activeSubtype,
    };
  }

  return {
    ...BASE_ACCESSIBILITY_PREFERENCES,
    ...meta.defaults,
  };
}
