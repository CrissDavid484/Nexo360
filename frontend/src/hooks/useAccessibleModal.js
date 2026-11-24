import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getVisibleFocusables(container) {
  if (!container) return [];
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (node) => node.offsetParent !== null || node.getClientRects().length > 0
  );
}

// Check if element is part of AccessibilityBar (allow focus escape to it)
function isAccessibilityBarElement(element) {
  if (!element) return false;
  // Check if element is the AccessibilityBar FAB or panel
  const a11yPanel = document.getElementById('accessibility-panel');
  if (!a11yPanel) return false;
  return a11yPanel.contains(element) || element.id === 'accessibility-panel';
}

/**
 * Hook WCAG 2.2 para modales accesibles:
 * - Trap cíclico de foco con Tab / Shift+Tab
 * - Cierre con tecla Escape
 * - Foco inicial al abrir y restauración de foco al cerrar
 */
export function useAccessibleModal({
  isOpen,
  onClose,
  containerRef,
  initialFocusRef,
  restoreFocus = true,
}) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    previouslyFocusedRef.current = document.activeElement;

    const frameId = window.requestAnimationFrame(() => {
      const target =
        initialFocusRef?.current || getVisibleFocusables(containerRef?.current)[0] || containerRef?.current;
      target?.focus?.();
    });

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current?.();
        return;
      }

      if (event.key !== 'Tab' || !containerRef?.current) return;

      const focusables = getVisibleFocusables(containerRef.current);
      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      // Allow focus to escape to AccessibilityBar (z-index 9999)
      const a11yPanel = document.getElementById('accessibility-panel');
      const a11yIsOpen = a11yPanel && a11yPanel.querySelector('[aria-expanded="true"]');
      const a11yFAB = a11yPanel?.querySelector('.a11y-fab-btn');

      if (event.shiftKey && (document.activeElement === first || !containerRef.current.contains(document.activeElement))) {
        // Shift+Tab from first element - allow escape to AccessibilityBar FAB if open
        if (a11yFAB && a11yIsOpen) {
          event.preventDefault();
          a11yFAB.focus();
        } else {
          event.preventDefault();
          last.focus();
        }
      } else if (!event.shiftKey && document.activeElement === last) {
        // Tab from last element - allow escape to AccessibilityBar FAB if open
        if (a11yFAB && a11yIsOpen) {
          event.preventDefault();
          a11yFAB.focus();
        } else {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frameId);
      document.removeEventListener('keydown', handleKeyDown);

      if (restoreFocus && previouslyFocusedRef.current?.isConnected) {
        previouslyFocusedRef.current.focus?.();
      }
      previouslyFocusedRef.current = null;
    };
  }, [isOpen, containerRef, initialFocusRef, restoreFocus]);
}
