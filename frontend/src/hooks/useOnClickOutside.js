import { useEffect, useRef } from 'react';

/**
 * Ejecuta `handler` cuando el usuario hace click fuera de `ref`.
 * Permite ignorar selectores concretos (ej. botón trigger del menú).
 */
export function useOnClickOutside(ref, handler, options = {}) {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  const config = typeof options === 'boolean' ? { enabled: options } : options;
  const { enabled = true, ignoreSelector = '' } = config;

  useEffect(() => {
    if (!enabled) return undefined;

    const handlePointerDown = (event) => {
      const container = ref?.current;
      const target = event.target;

      if (!container || !target) return;
      if (container.contains(target)) return;
      if (ignoreSelector && typeof target.closest === 'function' && target.closest(ignoreSelector)) {
        return;
      }
      // Si el elemento fue re-renderizado o mutado en el DOM durante el evento,
      // verificar si la ruta compuesta del click se originó dentro del contenedor o selector ignorado.
      if (typeof event.composedPath === 'function') {
        const path = event.composedPath();
        if (path.includes(container)) return;
        if (ignoreSelector) {
          for (const el of path) {
            if (el && typeof el.matches === 'function' && el.matches(ignoreSelector)) {
              return;
            }
          }
        }
      }

      handlerRef.current?.(event);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown, { passive: true });
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [ref, enabled, ignoreSelector]);
}
