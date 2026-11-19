import { useEffect } from 'react';

const FOCUSABLE_INTERACTIVE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[role="tab"]:not([aria-disabled="true"])',
  '[role="menuitem"]:not([aria-disabled="true"])',
  '[role="switch"]:not([aria-disabled="true"])',
].join(', ');

const HORIZONTAL_NATIVE_INPUT_TYPES = new Set([
  'text',
  'email',
  'password',
  'search',
  'tel',
  'url',
  'number',
  'range',
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
]);

const VERTICAL_NATIVE_INPUT_TYPES = new Set([
  'range',
  'number',
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
]);

const ARROW_KEYS = new Set(['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft']);

function isElementVisible(node) {
  if (!node || node.nodeType !== 1) return false;
  if (node.closest?.('[aria-hidden="true"], [inert]')) return false;
  if (node.offsetParent === null && node.getClientRects().length === 0) return false;

  const styles = window.getComputedStyle(node);
  return styles.visibility !== 'hidden' && styles.display !== 'none';
}

function isEditableOrContentEditable(el) {
  if (!el) return false;
  if (el.tagName === 'TEXTAREA') return true;
  if (el.isContentEditable) return true;
  return Boolean(el.closest?.('[contenteditable="true"]'));
}

function shouldIgnoreHorizontalArrow(el) {
  if (isEditableOrContentEditable(el)) return true;
  if (el?.tagName === 'INPUT') {
    const inputType = (el.type || 'text').toLowerCase();
    return HORIZONTAL_NATIVE_INPUT_TYPES.has(inputType);
  }
  return el?.getAttribute?.('role') === 'slider';
}

function shouldIgnoreVerticalArrow(el) {
  if (isEditableOrContentEditable(el)) return true;
  if (el?.tagName === 'SELECT') return true;
  if (el?.getAttribute?.('role') === 'listbox' || el?.closest?.('[role="listbox"]')) return true;
  if (el?.tagName === 'INPUT') {
    const inputType = (el.type || 'text').toLowerCase();
    return VERTICAL_NATIVE_INPUT_TYPES.has(inputType);
  }
  return el?.getAttribute?.('role') === 'slider';
}

function shouldIgnoreArrowEvent(event, activeEl) {
  if (event.defaultPrevented) return true;
  if (!ARROW_KEYS.has(event.key)) return true;
  if (event.ctrlKey || event.altKey || event.metaKey || event.shiftKey) return true;

  const isHorizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
  if (isHorizontal) {
    return shouldIgnoreHorizontalArrow(activeEl);
  }
  return shouldIgnoreVerticalArrow(activeEl);
}

function resolveNavigationScope() {
  const activeDialogs = Array.from(
    document.querySelectorAll('[role="dialog"][aria-modal="true"]')
  ).filter(isElementVisible);

  if (activeDialogs.length > 0) {
    return activeDialogs[activeDialogs.length - 1];
  }
  return document;
}

function getVisibleInteractiveElements(scope) {
  if (!scope) return [];
  return Array.from(scope.querySelectorAll(FOCUSABLE_INTERACTIVE_SELECTOR)).filter(isElementVisible);
}

/**
 * Observador global WCAG 2.2 para navegación bidireccional mediante flechas
 * direccionales junto a Tab / Shift+Tab, respetando controles nativos de texto,
 * selects, rangos y listas, y acotándose al modal activo si existe.
 */
export const KeyboardNavigationObserver = () => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      const activeEl = document.activeElement;
      if (shouldIgnoreArrowEvent(event, activeEl)) {
        return;
      }

      const scope = resolveNavigationScope();
      const focusables = getVisibleInteractiveElements(scope);
      if (focusables.length === 0) {
        return;
      }

      const isForward = event.key === 'ArrowDown' || event.key === 'ArrowRight';
      const currentIndex = focusables.indexOf(activeEl);
      // Si el foco no está en un control interactivo (p. ej. leyendo texto o párrafos con NVDA), no interceptar
      if (currentIndex === -1) {
        return;
      }

      const step = isForward ? 1 : -1;
      const targetIndex = (currentIndex + step + focusables.length) % focusables.length;

      const nextTarget = focusables[targetIndex];
      if (nextTarget) {
        event.preventDefault();
        nextTarget.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return null;
};
