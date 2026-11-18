const DEDUP_WINDOW_MS = 120;
const MAX_SPEECH_CHARS = 500;
const ARTICLE_SUMMARY_THRESHOLD = 350;
const SPANISH_LOCALE_PRIORITY = ['es-cl', 'es-419', 'es'];

let cachedVoice = null;
let voicesListenerBound = false;
let lastSpokenKey = '';
let lastSpokenAt = 0;
let activeUtterance = null;
let nextNodeId = 1;
const nodeIds = new WeakMap();

function getElementDedupId(element) {
  if (!element || typeof element !== 'object') return '';
  let id = nodeIds.get(element);
  if (!id) {
    id = nextNodeId++;
    nodeIds.set(element, id);
  }
  return String(id);
}

function normalizeWhitespace(value) {
  if (typeof value !== 'string') return '';
  return value.replace(/\s+/g, ' ').trim();
}

function findBestSpanishVoice(voices) {
  if (!Array.isArray(voices) || voices.length === 0) return null;

  for (const locale of SPANISH_LOCALE_PRIORITY) {
    const exactMatch = voices.find((voice) => voice.lang?.toLowerCase() === locale);
    if (exactMatch) return exactMatch;

    const prefixMatch = voices.find((voice) =>
      voice.lang?.toLowerCase().startsWith(locale)
    );
    if (prefixMatch) return prefixMatch;
  }

  return voices.find((voice) => voice.lang?.toLowerCase().startsWith('es')) || null;
}

function bindVoicesChangedListener() {
  if (voicesListenerBound || !isSpeechSupported()) return;
  voicesListenerBound = true;

  try {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      cachedVoice = null;
    });
  } catch {
    // Algunos navegadores antiguos no exponen addEventListener en speechSynthesis
  }
}

/**
 * Verifica soporte seguro para Web Speech API (TTS).
 */
export function isSpeechSupported() {
  return (
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof window.SpeechSynthesisUtterance !== 'undefined'
  );
}

/**
 * Obtiene y cachea la voz en español prioritaria (es-CL > es-419 > es).
 */
export function getPreferredSpanishVoice() {
  if (!isSpeechSupported()) return null;

  bindVoicesChangedListener();
  if (cachedVoice) return cachedVoice;

  try {
    const voices = window.speechSynthesis.getVoices();
    cachedVoice = findBestSpanishVoice(voices);
    return cachedVoice;
  } catch (err) {
    console.warn('[speechService] No se pudieron obtener las voces disponibles:', err);
    return null;
  }
}

/**
 * Detiene cualquier locución activa de Web Speech API.
 */
export function stopSpeech() {
  if (!isSpeechSupported()) return;

  try {
    window.speechSynthesis.cancel();
  } catch (err) {
    console.warn('[speechService] Error al detener locución:', err);
  } finally {
    activeUtterance = null;
  }
}

/**
 * Lee en voz alta un texto usando Web Speech API, cancelando locuciones previas
 * y deduplicando eventos consecutivos dentro de ~120 ms (ej. hover + focus).
 */
export function speak(text, options = {}) {
  if (!isSpeechSupported()) return false;

  const cleanText = normalizeWhitespace(String(text || '')).slice(0, MAX_SPEECH_CHARS);
  if (!cleanText) return false;

  const now = Date.now();
  const nodeTag = getElementDedupId(options.element) || options.dedupKey || '';
  const dedupKey = nodeTag ? `${nodeTag}::${cleanText}` : cleanText;
  if (!options.force && dedupKey === lastSpokenKey && now - lastSpokenAt < DEDUP_WINDOW_MS) {
    return false;
  }

  lastSpokenKey = dedupKey;
  lastSpokenAt = now;

  try {
    window.speechSynthesis.cancel();

    const utterance = new window.SpeechSynthesisUtterance(cleanText);
    const voice = getPreferredSpanishVoice();

    utterance.lang = options.lang || voice?.lang || 'es-CL';
    utterance.rate = typeof options.rate === 'number' ? options.rate : 1;
    utterance.pitch = typeof options.pitch === 'number' ? options.pitch : 1;
    utterance.volume = typeof options.volume === 'number' ? options.volume : 1;
    if (voice) {
      utterance.voice = voice;
    }

    const clearActive = () => {
      if (activeUtterance === utterance) {
        activeUtterance = null;
      }
    };
    utterance.onend = clearActive;
    utterance.onerror = clearActive;

    activeUtterance = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.warn('[speechService] No se pudo reproducir la locución:', err);
    activeUtterance = null;
    return false;
  }
}

function resolveAriaLabelledByText(el) {
  const ids = normalizeWhitespace(el.getAttribute('aria-labelledby'));
  if (!ids || typeof document === 'undefined') return '';

  return normalizeWhitespace(
    ids
      .split(' ')
      .map((id) => document.getElementById(id)?.textContent || '')
      .join(' ')
  );
}

function findAssociatedLabelText(el) {
  if (typeof document === 'undefined') return '';

  if (el.id) {
    const safeId = typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(el.id) : el.id;
    const explicitLabel = document.querySelector(`label[for="${safeId}"]`);
    const labelText = normalizeWhitespace(explicitLabel?.textContent);
    if (labelText) return labelText;
  }

  const wrappingLabel = el.closest('label');
  return normalizeWhitespace(wrappingLabel?.textContent);
}

function resolveControlValueDetail(el) {
  const tag = el.tagName;
  if (tag === 'SELECT') {
    const selected = el.options?.[el.selectedIndex];
    return normalizeWhitespace(selected?.text || '');
  }

  const inputType = (el.type || '').toLowerCase();
  if (inputType === 'password') {
    return normalizeWhitespace(el.getAttribute('placeholder')) || 'campo de contraseña';
  }
  if (inputType === 'checkbox' || inputType === 'radio') {
    return el.checked ? 'activado' : 'desactivado';
  }

  const currentValue = normalizeWhitespace(el.value);
  if (currentValue) return currentValue;

  return normalizeWhitespace(el.getAttribute('placeholder'));
}

function resolveFormControlText(el) {
  const tag = el.tagName;
  if (tag !== 'INPUT' && tag !== 'TEXTAREA' && tag !== 'SELECT') return '';

  const labelText = findAssociatedLabelText(el);
  const detailText = resolveControlValueDetail(el);
  return [labelText, detailText].filter(Boolean).join(', ');
}

function resolveFallbackText(el) {
  const rawText = normalizeWhitespace(el.innerText || el.textContent);
  if (!rawText) return '';

  if (
    el.tagName === 'ARTICLE' &&
    !el.hasAttribute('data-speakable') &&
    rawText.length > ARTICLE_SUMMARY_THRESHOLD
  ) {
    const heading = el.querySelector('h1, h2, h3, h4');
    const headingText = normalizeWhitespace(heading?.textContent);
    if (headingText) return headingText;
  }

  return rawText;
}

const ARIA_STATE_MAPPINGS = [
  { attr: 'aria-expanded', values: { true: 'expandido', false: 'contraído' } },
  { attr: 'aria-pressed', values: { true: 'activado', false: 'desactivado' } },
  { attr: 'aria-selected', values: { true: 'seleccionado', false: 'no seleccionado' } },
];

function resolveControlStateTokens(el, baseText) {
  if (!el || el.nodeType !== 1 || typeof el.getAttribute !== 'function') return [];

  const tokens = [];
  for (const { attr, values } of ARIA_STATE_MAPPINGS) {
    const rawVal = el.getAttribute(attr);
    if (rawVal && values[rawVal]) {
      tokens.push(values[rawVal]);
    }
  }

  if (Boolean(el.disabled) || el.getAttribute('aria-disabled') === 'true') {
    tokens.push('deshabilitado');
  }

  const existingWords = new Set(
    normalizeWhitespace(baseText)
      .toLowerCase()
      .split(/[\s,.;:!?()[\]{}"']+/)
      .filter(Boolean)
  );

  return tokens.filter((token) => !existingWords.has(token.toLowerCase()));
}

function resolveBaseText(el, customBaseText) {
  const custom = normalizeWhitespace(customBaseText);
  if (custom) return custom;

  const directSpeak = normalizeWhitespace(
    el.getAttribute('data-speak') || el.getAttribute('data-voice-text')
  );
  if (directSpeak) return directSpeak;

  const ariaLabel = normalizeWhitespace(el.getAttribute('aria-label'));
  if (ariaLabel) return ariaLabel;

  const labelledByText = resolveAriaLabelledByText(el);
  if (labelledByText) return labelledByText;

  const controlText = resolveFormControlText(el);
  if (controlText) return controlText;

  return resolveFallbackText(el);
}

/**
 * Resuelve el texto legible de un elemento DOM siguiendo la prioridad WCAG:
 * customBaseText / data-speak / data-voice-text > aria-label > aria-labelledby > <label>+valor/placeholder > texto limpio,
 * añadiendo el estado semántico (expandido/contraído, activado/desactivado, deshabilitado) al final.
 */
export function resolveReadableText(el, customBaseText = '') {
  if (!el || el.nodeType !== 1) {
    return normalizeWhitespace(customBaseText);
  }

  const baseText = resolveBaseText(el, customBaseText);
  if (!baseText) return '';

  const stateTokens = resolveControlStateTokens(el, baseText);
  return [baseText, ...stateTokens].join(', ');
}
