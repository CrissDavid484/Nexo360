/**
 * Utilidades de Lectura Clara y Resumida (W3C COGA / TEA) para Nexo360.
 * Simplifica párrafos extensos y extrae pasos clave seguros desde HTML de guías.
 */

const ENTITY_MAP = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&aacute;': 'á',
  '&eacute;': 'é',
  '&iacute;': 'í',
  '&oacute;': 'ó',
  '&uacute;': 'ú',
  '&ntilde;': 'ñ',
  '&Aacute;': 'Á',
  '&Eacute;': 'É',
  '&Iacute;': 'Í',
  '&Oacute;': 'Ó',
  '&Uacute;': 'Ú',
  '&Ntilde;': 'Ñ',
};

const FILLER_PREFIXES = [
  /^descubre toda la informaci[oó]n sobre\s+/i,
  /^aqu[ií] encontrar[aá]s\s+/i,
  /^en esta secci[oó]n podr[aá]s\s+/i,
  /^te invitamos a revisar\s+/i,
  /^ten en cuenta que\s+/i,
  /^recuerda que\s+/i,
  /^no te preocupes[.,]?\s*/i,
];

function decodeHtmlEntities(input) {
  return input
    .replace(/&(nbsp|amp|lt|gt|quot|#39|apos|[a-zA-Z]+tilde|[a-zA-Z]+acute);/g, (match) => {
      return ENTITY_MAP[match] || match;
    })
    .replace(/&#(\d{1,5});/g, (_, dec) => {
      const code = Number(dec);
      return Number.isFinite(code) && code > 0 && code <= 0x10ffff ? String.fromCodePoint(code) : '';
    });
}

function stripHtmlTags(input) {
  let result = '';
  let inTag = false;
  for (let i = 0; i < input.length; i++) {
    const ch = input[i];
    if (ch === '<') {
      inTag = true;
      result += ' ';
    } else if (ch === '>') {
      inTag = false;
    } else if (!inTag) {
      result += ch;
    }
  }
  return result;
}

function stripTagsAndNormalizeSpaces(input) {
  return decodeHtmlEntities(stripHtmlTags(input))
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function removeSpacesBeforePunctuation(str) {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const ch = str[i];
    if (ch === ' ' || ch === '\t') {
      let j = i;
      while (j < str.length && (str[j] === ' ' || str[j] === '\t')) {
        j++;
      }
      if (j < str.length && ',.;:!?'.includes(str[j])) {
        i = j - 1;
        continue;
      }
    }
    result += ch;
  }
  return result;
}

function removeParentheticalClutter(input) {
  const withoutParens = input
    .replace(/\([^()]{1,140}\)/g, ' ')
    .replace(/\[[^[\]]{1,140}\]/g, ' ');
  return removeSpacesBeforePunctuation(withoutParens)
    .replace(/\s+/g, ' ')
    .trim();
}

function stripFillerPrefixes(sentence) {
  let current = sentence.trim();
  for (const pattern of FILLER_PREFIXES) {
    current = current.replace(pattern, '');
  }
  return current.trim();
}

function capitalizeFirst(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function splitIntoCleanSentences(text) {
  const marked = text.replace(/([.!?])\s+/g, '$1\n');
  return marked
    .split('\n')
    .map((part) => stripFillerPrefixes(part))
    .filter((part) => part.length > 2)
    .map(capitalizeFirst);
}

function truncateAtWordBoundary(text, maxChars) {
  if (text.length <= maxChars) return text;
  const limit = Math.max(10, maxChars - 1);
  const sliced = text.slice(0, limit);
  const lastSpace = sliced.lastIndexOf(' ');
  let base = lastSpace > Math.floor(limit * 0.5) ? sliced.slice(0, lastSpace) : sliced;
  while (base.length > 0 && ' ,;:.\t\r\n'.includes(base[base.length - 1])) {
    base = base.slice(0, -1);
  }
  return `${base}…`;
}

/**
 * Escapa caracteres HTML especiales para prevenir inyección o etiquetas rotas.
 */
function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function simplifyPlainText(plainText, { maxSentences = 2, maxChars = 160 } = {}) {
  const cleaned = removeParentheticalClutter(plainText);
  if (!cleaned) return '';

  const sentences = splitIntoCleanSentences(cleaned);
  const selected = sentences.slice(0, Math.max(1, maxSentences)).join(' ').trim();
  const normalized = capitalizeFirst(selected || cleaned);
  return truncateAtWordBoundary(normalized, Math.max(20, maxChars));
}

/**
 * Simplifica un texto extenso eliminando relleno y paréntesis accesorios,
 * conservando frases directas en lenguaje claro.
 */
export function simplifyText(text, options = {}) {
  if (typeof text !== 'string') return '';
  return simplifyPlainText(stripTagsAndNormalizeSpaces(text), options);
}

function sanitizeRawHtmlBlocks(html) {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, ' ')
    .replace(/<img\b[^>]*>/gi, ' ')
    .replace(/<\/?(p|div|li|h[1-6]|tr|section|article|blockquote|ul|ol)\b[^>]*>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(td|th)\b[^>]*>/gi, ' • ');
}

function isMeaningfulPoint(line) {
  if (!line || line.length < 12) return false;
  return /[a-zA-ZáéíóúÁÉÍÓÚñÑ0-9]{3,}/.test(line);
}

/**
 * Extrae puntos clave concisos y sin duplicados desde HTML de artículos de ayuda.
 */
export function extractArticleKeyPoints(html, maxPoints = 6) {
  if (typeof html !== 'string' || !html.trim()) return [];

  const withBreaks = sanitizeRawHtmlBlocks(html);
  const rawLines = withBreaks.split('\n');
  const points = [];
  const seen = new Set();

  for (const rawLine of rawLines) {
    const plain = stripTagsAndNormalizeSpaces(rawLine);
    if (!isMeaningfulPoint(plain)) continue;

    const concise = simplifyPlainText(plain, { maxSentences: 2, maxChars: 175 });
    if (!isMeaningfulPoint(concise)) continue;

    const fingerprint = concise.toLowerCase();
    if (seen.has(fingerprint)) continue;

    seen.add(fingerprint);
    points.push(concise);
    if (points.length >= maxPoints) break;
  }

  return points;
}

/**
 * Convierte el HTML de un artículo en una lista HTML segura y escaneable por viñetas
 * para usuarios con TEA o sobrecarga cognitiva.
 */
export function simplifyArticleHtml(html) {
  const keyPoints = extractArticleKeyPoints(html, 6);
  if (keyPoints.length === 0) return '';

  const listItems = keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
  return `<ul>${listItems}</ul>`;
}
