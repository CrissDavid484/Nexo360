/**
 * Utilidades centralizadas de validación, sanitización, RUT chileno
 * y preferencias por defecto de accesibilidad WCAG 2.2 (Nexo360).
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]{1,64}@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/i;
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_FONT_SIZES = Object.freeze(['normal', 'large', 'xlarge']);
const INSTITUTIONAL_DOMAINS = Object.freeze(['duocuc.cl', 'profesor.duoc.cl', 'duoc.cl']);
const STUDENT_DOMAINS = Object.freeze(['duocuc.cl']);
const STAFF_DOMAINS = Object.freeze(['profesor.duoc.cl', 'duoc.cl']);
const VALID_DISABILITY_PROFILES = Object.freeze([
  'ninguna',
  'ceguera_total',
  'baja_vision',
  'daltonismo',
  'tea',
  'dislexia_tdah',
  'auditiva',
  'movilidad_reducida',
  'otra',
]);
const VALID_COLOR_BLIND_MODES = Object.freeze([
  'none',
  'protanopia',
  'deuteranopia',
  'tritanopia',
]);
const DEFAULT_SEDE = 'Sede Alameda';

const DEFAULT_ACCESSIBILITY_PREFERENCES = Object.freeze({
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

const DISABILITY_BARRIER_MAP = Object.freeze({
  ninguna: '',
  ceguera_total: 'Visual / Persona No Vidente',
  baja_vision: 'Visual / Baja Visión',
  daltonismo: 'Visual / Daltonismo',
  tea: 'Neurodivergencia / TEA',
  dislexia_tdah: 'Neurodivergencia / Dislexia-TDAH',
  auditiva: 'Auditiva / LSCh',
  movilidad_reducida: 'Motora / Movilidad Reducida',
  otra: 'Otra / Ajuste Razonable',
});

const DISABILITY_ACCESSIBILITY_OVERRIDES = Object.freeze({
  ninguna: () => ({}),
  ceguera_total: () => ({
    voiceReader: true,
    screenReaderOptimized: true,
    readingGuide: false,
    highContrast: false,
    fontSize: 'normal',
    clearReadingMode: false,
    colorBlindMode: 'none',
  }),
  baja_vision: () => ({
    fontSize: 'xlarge',
    highContrast: true,
    voiceReader: true,
    readingGuide: false,
    screenReaderOptimized: true,
  }),
  daltonismo: (colorBlindSubtype) => ({
    colorBlindMode:
      VALID_COLOR_BLIND_MODES.includes(colorBlindSubtype) && colorBlindSubtype !== 'none'
        ? colorBlindSubtype
        : 'deuteranopia',
  }),
  tea: () => ({
    clearReadingMode: true,
    reducedMotion: true,
    readingGuide: true,
  }),
  dislexia_tdah: () => ({
    dyslexicFont: true,
    readingGuide: true,
    reducedMotion: true,
  }),
  auditiva: () => ({
    screenReaderOptimized: true,
  }),
  movilidad_reducida: () => ({
    reducedMotion: true,
    screenReaderOptimized: true,
  }),
  otra: () => ({}),
});

/**
 * Sanitiza un valor de texto recortando espacios y limitando longitud.
 */
function sanitizeString(val, maxLen = 120) {
  return typeof val === 'string'
    ? val.replace(/[\r\n\t]+/g, ' ').trim().slice(0, maxLen)
    : undefined;
}

/**
 * Escapa metacaracteres de expresiones regulares para prevenir ReDoS / inyección.
 */
function escapeRegex(str, maxLen = 100) {
  if (typeof str !== 'string') return '';
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, maxLen);
}

/**
 * Valida si un correo pertenece a dominios institucionales Duoc UC.
 */
function normalizeInstitutionalEmail(email) {
  if (typeof email !== 'string') return '';
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || trimmed.length > 120 || !EMAIL_REGEX.test(trimmed)) {
    return '';
  }
  return trimmed;
}

/**
 * Normaliza una cadena de búsqueda o RUT dejando únicamente dígitos y 'k' en minúscula.
 */
function normalizeRutSearch(rawRut = '') {
  return String(rawRut || '').replace(/[^0-9kK]/g, '').toLowerCase();
}

/**
 * Algoritmo compacto Módulo 11 para cálculo de dígito verificador chileno.
 */
function computeModulo11Dv(rutDigits) {
  const digits = String(rutDigits).replace(/\D/g, '').split('').reverse();
  const total = digits.reduce((sum, char, idx) => sum + Number(char) * ((idx % 6) + 2), 0);
  const rem = 11 - (total % 11);
  if (rem === 11) return '0';
  if (rem === 10) return 'K';
  return String(rem);
}

/**
 * Generador determinista de RUT estudiantil mediante hashing de correo.
 */
function createDeterministicRut(email = '') {
  const clean = String(email || '').trim().toLowerCase();
  let seed = 0;
  for (let i = 0; i < clean.length; i++) {
    seed = Math.trunc(((seed << 5) - seed) + clean.charCodeAt(i));
  }
  const baseNum = 20000000 + (Math.abs(seed) % 2500000);
  const dv = computeModulo11Dv(baseNum);
  const s = String(baseNum);
  return `${s.slice(0, 2)}.${s.slice(2, 5)}.${s.slice(5, 8)}-${dv}`;
}

/**
 * Extrae la primera letra ASCII minúscula (sin tildes) de una cadena de texto.
 */
function extractFirstAsciiLetter(text = '') {
  const normalized = String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const match = /[a-z]/.exec(normalized);
  return match ? match[0] : '';
}

/**
 * Genera la contraseña inicial institucional a partir del RUT normalizado
 * y la inicial minúscula del apellido paterno (con fallback anual si no hay RUT).
 */
function generateInitialPassword(rut, paternalLastName, fallbackName = '') {
  const cleanRut = normalizeRutSearch(rut);
  if (!cleanRut || !/\d/.test(cleanRut)) {
    return `Duoc${new Date().getFullYear()}!`;
  }
  const sourceText = String(paternalLastName || '').trim() || String(fallbackName || '').trim();
  const firstChar = extractFirstAsciiLetter(sourceText);
  return `${cleanRut}${firstChar}`;
}

/**
 * Obtiene la barrera PAEDIS asociada a un perfil de discapacidad institucional.
 */
function getBarrierForDisability(disabilityProfile = 'ninguna') {
  return DISABILITY_BARRIER_MAP[disabilityProfile] ?? '';
}

/**
 * Construye las preferencias de accesibilidad por defecto para un perfil de discapacidad.
 */
function getDefaultAccessibilityForDisability(
  disabilityProfile = 'ninguna',
  colorBlindSubtype = 'deuteranopia'
) {
  const builder = DISABILITY_ACCESSIBILITY_OVERRIDES[disabilityProfile];
  const overrides = builder ? builder(colorBlindSubtype) : {};
  return sanitizeAccessibilityPreferences({
    ...DEFAULT_ACCESSIBILITY_PREFERENCES,
    ...overrides,
  });
}

/**
 * Valida fortaleza mínima de contraseña (>= 8 caracteres, al menos 1 letra y 1 dígito).
 */
function validatePasswordStrength(password) {
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    password.length <= 256 &&
    /\p{L}/u.test(password) &&
    /\d/.test(password)
  );
}

/**
 * Normaliza y valida el objeto de preferencias de accesibilidad WCAG 2.2.
 */
function sanitizeAccessibilityPreferences(rawPrefs = {}) {
  const source =
    rawPrefs && typeof rawPrefs === 'object' && !Array.isArray(rawPrefs) ? rawPrefs : {};
  return {
    fontSize: VALID_FONT_SIZES.includes(source.fontSize)
      ? source.fontSize
      : DEFAULT_ACCESSIBILITY_PREFERENCES.fontSize,
    highContrast: Boolean(source.highContrast),
    dyslexicFont: Boolean(source.dyslexicFont),
    reducedMotion: Boolean(source.reducedMotion),
    readingGuide: Boolean(source.readingGuide),
    voiceReader: Boolean(source.voiceReader),
    screenReaderOptimized:
      typeof source.screenReaderOptimized === 'boolean'
        ? source.screenReaderOptimized
        : DEFAULT_ACCESSIBILITY_PREFERENCES.screenReaderOptimized,
    colorBlindMode: VALID_COLOR_BLIND_MODES.includes(source.colorBlindMode)
      ? source.colorBlindMode
      : DEFAULT_ACCESSIBILITY_PREFERENCES.colorBlindMode,
    clearReadingMode: Boolean(source.clearReadingMode),
  };
}

module.exports = {
  EMAIL_REGEX,
  UUID_V4_REGEX,
  VALID_FONT_SIZES,
  INSTITUTIONAL_DOMAINS,
  STUDENT_DOMAINS,
  STAFF_DOMAINS,
  VALID_DISABILITY_PROFILES,
  VALID_COLOR_BLIND_MODES,
  DEFAULT_SEDE,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  sanitizeString,
  escapeRegex,
  normalizeInstitutionalEmail,
  normalizeRutSearch,
  computeModulo11Dv,
  createDeterministicRut,
  generateInitialPassword,
  getBarrierForDisability,
  getDefaultAccessibilityForDisability,
  validatePasswordStrength,
  sanitizeAccessibilityPreferences,
};
