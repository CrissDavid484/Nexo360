import { useEffect, useRef } from 'react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { speak, stopSpeech, resolveReadableText } from '../../utils/speechService';

const SPEAKABLE_SELECTOR = [
  '[data-speak]',
  '[data-voice-text]',
  '[data-speakable="true"]',
  'button',
  'a[href]',
  'input',
  'select',
  'textarea',
  '[role="button"]',
  '[role="tab"]',
  '[role="link"]',
  '[role="menuitem"]',
  '[role="switch"]',
  'h1',
  'h2',
  'h3',
  'article',
].join(', ');

function findSpeakableTarget(rawTarget) {
  if (!rawTarget || rawTarget.nodeType !== 1 || typeof rawTarget.closest !== 'function') {
    return null;
  }

  const candidate = rawTarget.closest(SPEAKABLE_SELECTOR);
  if (!candidate || candidate.getAttribute('aria-hidden') === 'true') {
    return null;
  }

  return candidate;
}

function speakElementIfUnmanaged(element) {
  if (!element || element.dataset?.voiceManaged === 'true') {
    return;
  }

  const text = resolveReadableText(element);
  if (text) {
    speak(text, { element });
  }
}

/**
 * Observador global WCAG para lectura por voz en elementos interactivos,
 * encabezados y tarjetas cuando `voiceReader` está activo, además del atajo Alt + V.
 * Respeta elementos con `data-voice-managed="true"` para evitar doble lectura.
 */
export const VoiceReaderObserver = () => {
  const { voiceReader, toggleVoiceReader } = useAccessibility();
  const lastHoveredRef = useRef(null);

  // Atajo global accesible (Alt + V) para activar o desactivar Lectura por Voz desde cualquier pantalla
  useEffect(() => {
    const handleShortcutKeyDown = (event) => {
      const isAltV =
        event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        (event.key?.toLowerCase() === 'v' || event.code === 'KeyV');

      if (isAltV) {
        event.preventDefault();
        toggleVoiceReader();
      }
    };

    document.addEventListener('keydown', handleShortcutKeyDown);
    return () => {
      document.removeEventListener('keydown', handleShortcutKeyDown);
    };
  }, [toggleVoiceReader]);

  useEffect(() => {
    if (!voiceReader) {
      lastHoveredRef.current = null;
      return undefined;
    }

    const handleMouseOver = (event) => {
      const speakable = findSpeakableTarget(event.target);
      if (speakable === lastHoveredRef.current) return;

      lastHoveredRef.current = speakable;
      speakElementIfUnmanaged(speakable);
    };

    const handleFocusIn = (event) => {
      const speakable = findSpeakableTarget(event.target);
      speakElementIfUnmanaged(speakable);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        stopSpeech();
      }
    };

    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      lastHoveredRef.current = null;
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [voiceReader]);

  return null;
};
