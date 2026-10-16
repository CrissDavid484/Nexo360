import React, { useEffect, useRef } from 'react';
import { X, ExternalLink, ShieldCheck, Info } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const ModuleModal = ({ category, onClose }) => {
  const { announce } = useAccessibility();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useEffect(() => {
    if (category) {
      announce(`Abriendo opciones del módulo ${category.title}. Presiona Escape para cerrar.`, 'polite');
      // Enfocar botón de cerrar al abrir
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
        announce('Ventana cerrada');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [category]);

  if (!category) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Cabecera del Modal */}
        <div className="bg-duoc-navy text-white px-6 sm:px-8 py-6 flex items-start justify-between border-b-4 border-amber-400">
          <div>
            <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block mb-1">
              Portal Duoc UC • Nexo360 PAEDIS
            </span>
            <h2 id="modal-title" className="text-2xl sm:text-3xl font-black tracking-tight">
              {category.title}
            </h2>
            <p id="modal-description" className="text-slate-300 text-sm mt-1">
              {category.description}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de trámites (tecla Escape)"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl focus:ring-4 focus:ring-amber-400 transition-colors ml-4 flex-shrink-0"
          >
            <X className="w-7 h-7" aria-hidden="true" />
          </button>
        </div>

        {/* Contenido / Lista de Submenús */}
        <div className="overflow-y-auto p-6 sm:p-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-black text-slate-900">
              Trámites y Submenús Disponibles ({category.submodules.length})
            </h3>
            <span className="text-xs text-slate-500 font-medium">
              Enlaces directos y consideraciones de accesibilidad
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {category.submodules.map((sub, index) => (
              <div
                key={sub.id || index}
                className="bg-slate-50 border-2 border-slate-200 hover:border-amber-400 rounded-2xl p-5 flex flex-col justify-between transition-all hover:bg-white hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-extrabold text-base text-slate-900">
                      {sub.title}
                    </h4>
                    <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-bold">
                      #{index + 1}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 leading-relaxed font-medium">
                    {sub.description}
                  </p>

                  {/* Nota o apoyo PAEDIS si existe */}
                  {sub.paedisSupport && (
                    <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg mb-4 text-xs text-amber-950 font-medium flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                      <div>
                        <strong className="block text-amber-900 font-bold">Apoyo PAEDIS:</strong>
                        {sub.paedisSupport}
                      </div>
                    </div>
                  )}
                </div>

                {/* Enlace de Trámite */}
                <div className="pt-3 border-t border-slate-200 mt-2">
                  <a
                    href={sub.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold text-duoc-navy hover:text-amber-600 transition-colors focus:ring-2 focus:ring-amber-500 rounded p-1"
                    aria-label={`Acceder a ${sub.title} en el portal oficial (abre en una nueva ventana)`}
                  >
                    <span>Ingresar al trámite</span>
                    <ExternalLink className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pie del Modal */}
        <div className="bg-slate-100 px-6 sm:px-8 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>¿Requieres asistencia personalizada? Consulta a tu tutor PAR asignado.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm rounded-xl focus:ring-4 focus:ring-amber-400"
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
};
