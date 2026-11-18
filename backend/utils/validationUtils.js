/**
 * Utilidades centralizadas de validación, sanitización, RUT chileno
 * y preferencias por defecto de accesibilidad WCAG 2.2 (Nexo360).
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]{1,64}@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/i;
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_FONT_SIZES = Object.freeze(['normal', 'large', 'xlarge']);
const DEFAULT_SEDE = 'Sede Alameda';

const DEFAULT_ACCESSIBILITY_PREFERENCES = Object.freeze({
  fontSize: 'normal',
  highContrast: false,
  dyslexicFont: false,
  reducedMotion: false,
  readingGuide: false,
  voiceReader: false,
  screenReaderOptimized: true,
});

/**
 * Sanitiza un valor de texto recortando espacios y limitando longitud.
 */
function sanitizeString(val, maxLen = 120) {
  return typeof val === 'string' ? val.trim().slice(0, maxLen) : undefined;
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
  };
}

module.exports = {
  EMAIL_REGEX,
  UUID_V4_REGEX,
  VALID_FONT_SIZES,
  DEFAULT_SEDE,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  sanitizeString,
  escapeRegex,
  normalizeInstitutionalEmail,
  normalizeRutSearch,
  computeModulo11Dv,
  createDeterministicRut,
  sanitizeAccessibilityPreferences,
};
