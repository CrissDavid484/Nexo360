import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  Info,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  CheckCircle,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

export const ModuleModal = ({ category, onClose }) => {
  const { announce } = useAccessibility();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Estado del Trámite seleccionado para ver sus instrucciones oficiales y enlace
  const [activeTramite, setActiveTramite] = useState(null);

  useEffect(() => {
    if (category) {
      announce(`Abriendo ventana de opciones para ${category.title}. Presiona Escape para cerrar.`, 'polite');
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeTramite) {
          setActiveTramite(null);
          announce('Regresando a la lista de trámites', 'polite');
        } else {
          onClose();
          announce('Ventana cerrada', 'polite');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [category, activeTramite]);

  if (!category) return null;

  const handleSelectTramite = (sub) => {
    setActiveTramite(sub);
    announce(`Abriendo instrucciones para ${sub.title}`);
  };

  return (
    // A11y: Diálogo modal accesible con role="dialog", aria-modal="true" y referencias de accesibilidad
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Cabecera del Modal */}
        <header className="bg-[#002B49] text-white px-6 sm:px-8 py-6 flex items-start justify-between border-b-4 border-[#FFB81C]">
          <div>
            <h2 id="modal-title" className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {activeTramite ? activeTramite.title : category.title}
            </h2>
            <p id="modal-description" className="text-slate-200 text-sm mt-1 font-medium">
              {activeTramite ? activeTramite.description : category.description}
            </p>
          </div>

          {/* A11y: Botón de Cerrar con target size mínimo 44x44px y foco ultra-visible */}
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana de trámites (tecla Escape)"
            className="min-h-[44px] min-w-[44px] p-2 text-slate-200 hover:text-white hover:bg-white/10 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-colors ml-4 shrink-0 flex items-center justify-center"
          >
            <X className="w-7 h-7" aria-hidden="true" />
          </button>
        </header>

        {/* MODO A: PANTALLA DE INSTRUCCIONES DEL TRÁMITE SELECCIONADO */}
        {activeTramite ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            {/* A11y: Botón volver con target size accesible */}
            <button
              type="button"
              onClick={() => setActiveTramite(null)}
              className="min-h-[44px] inline-flex items-center gap-2 text-xs sm:text-sm font-black text-[#002B49] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded-lg px-2"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Volver a la lista de trámites de {category.title}</span>
            </button>

            {/* Tarjeta de Instrucciones Oficiales */}
            <article className="p-6 sm:p-8 bg-slate-50 border-2 border-slate-300 rounded-3xl space-y-6">
              <div className="flex items-center gap-3 border-b-2 border-slate-200 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center shrink-0 shadow" aria-hidden="true">
                  <BookOpen className="w-6 h-6" aria-hidden="true" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900">
                    Instrucciones y Pasos a Seguir
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-bold">
                    Procedimiento institucional oficial en Duoc UC
                  </p>
                </div>
              </div>

              {/* Texto de instrucciones */}
              <div className="bg-white p-5 rounded-2xl border-2 border-slate-200 text-slate-900 leading-relaxed font-medium text-sm sm:text-base space-y-3">
                <p>
                  {activeTramite.instructions || 'Para realizar este trámite, ingresa con tu cuenta de correo institucional al portal oficial de Duoc UC y sigue los pasos requeridos.'}
                </p>
                <div className="pt-2 flex items-start gap-3 text-xs sm:text-sm text-slate-700">
                  <CheckCircle className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Asegúrate de contar con tu sesión iniciada en el navegador o tus credenciales institucionales (@duocuc.cl) a mano.
                  </span>
                </div>
              </div>

              {/* Botón de Enlace Directo Oficial */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <a
                  href={activeTramite.link || 'https://www.duoc.cl'}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Ir al sitio oficial para tramitar ${activeTramite.title} (se abre en una nueva pestaña)`}
                  className="min-h-[48px] px-8 py-3 bg-[#002B49] hover:bg-[#001f35] text-white rounded-xl text-sm font-black shadow-md flex items-center justify-center gap-2.5 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                >
                  <span>Ir a la página oficial de Duoc UC para este trámite</span>
                  <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={() => setActiveTramite(null)}
                  className="min-h-[48px] px-6 py-2.5 border-2 border-slate-300 text-slate-800 rounded-xl text-xs sm:text-sm font-bold hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-colors"
                >
                  Volver a opciones
                </button>
              </div>
            </article>
          </div>
        ) : (
          /* MODO B: LISTA DE SUBMENÚS CON BOTONES "HACER TRÁMITE AQUÍ" */
          <div className="overflow-y-auto p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-black text-slate-900">
                Opciones Disponibles ({category.submodules.length})
              </h3>
              <span className="text-xs text-slate-700 font-bold">
                Instrucciones y enlaces directos oficiales
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.submodules.map((sub, index) => (
                <article
                  key={sub.id || index}
                  className="bg-slate-50 border-2 border-slate-200 hover:border-[#002B49] rounded-2xl p-5 flex flex-col justify-between transition-all hover:bg-white hover:shadow-md"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-black text-base text-slate-900">
                        {sub.title}
                      </h4>
                      <span className="text-xs bg-slate-200 text-slate-800 px-2.5 py-0.5 rounded-full font-bold">
                        #{index + 1}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 mb-4 leading-relaxed font-medium">
                      {sub.description}
                    </p>
                  </div>

                  {/* A11y: Botón con tamaño táctil accesible mínimo 44px */}
                  <div className="pt-3 border-t border-slate-200 mt-2">
                    <button
                      type="button"
                      onClick={() => handleSelectTramite(sub)}
                      className="w-full min-h-[44px] py-2.5 px-4 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                    >
                      <span>Hacer trámite aquí</span>
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Pie del Modal */}
        <footer className="bg-slate-100 px-6 sm:px-8 py-4 border-t-2 border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-700">
          <div className="flex items-center gap-2 font-bold">
            <Info className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
            <span>Servicios y Trámites Oficiales • Duoc UC Sede Alameda.</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-colors"
          >
            Cerrar Ventana
          </button>
        </footer>
      </div>
    </div>
  );
};
