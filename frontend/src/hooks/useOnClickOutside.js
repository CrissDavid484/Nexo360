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

      handlerRef.current?.(event);
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
    };
  }, [ref, enabled, ignoreSelector]);
}
