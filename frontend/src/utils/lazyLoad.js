import { lazy } from 'react';

/**
 * Carga diferida (Code-Splitting) reutilizable con trazabilidad de errores.
 */
export function lazyLoad(importer, exportName) {
  return lazy(() =>
    importer()
      .then((module) => ({ default: module[exportName] }))
      .catch((error) => {
        console.error(`[lazyLoad] Error cargando módulo "${exportName}":`, error);
        throw error;
      })
  );
}
