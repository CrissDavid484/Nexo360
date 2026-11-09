import React, { useEffect, useRef, useState, Suspense, lazy } from 'react';
import {
  X,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  CheckCircle,
  Package,
  HeartHandshake,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

const TomaRamosSimulator = lazy(() =>
  import('../simulation/TomaRamosSimulator').then((m) => ({ default: m.TomaRamosSimulator }))
);

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const ModuleModal = ({ category, initialSubmodule = null, onClose }) => {
  const { announce } = useAccessibility();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  const [activeTramite, setActiveTramite] = useState(initialSubmodule);
  const [showSimulator, setShowSimulator] = useState(false);

  useEffect(() => {
    setActiveTramite(initialSubmodule || null);
  }, [initialSubmodule, category]);

  useEffect(() => {
    previousFocusRef.current = document.activeElement;
    if (category) {
      announce(
        `Abriendo información de ${initialSubmodule ? initialSubmodule.title : category.title}. Presiona Escape para cerrar.`,
        'polite'
      );
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => {
        clearTimeout(timer);
        if (previousFocusRef.current && typeof previousFocusRef.current.focus === 'function') {
          previousFocusRef.current.focus();
        }
      };
    }
  }, [category, initialSubmodule, announce]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (showSimulator) {
          setShowSimulator(false);
          announce('Cerrando simulador y regresando al trámite', 'polite');
        } else if (activeTramite && !initialSubmodule) {
          setActiveTramite(null);
          announce('Regresando a la lista de trámites', 'polite');
        } else {
          onClose();
          announce('Ventana cerrada', 'polite');
        }
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusableElements = Array.from(modalRef.current.querySelectorAll(FOCUSABLE_SELECTOR));
        if (focusableElements.length === 0) return;

        const firstEl = focusableElements[0];
        const lastEl = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTramite, initialSubmodule, showSimulator, onClose, announce]);

  if (!category) return null;

  const handleSelectTramite = (sub) => {
    setActiveTramite(sub);
    announce(`Mostrando pasos para ${sub.title}`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fade-in"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[90vh] my-auto animate-scale-in"
      >
        {/* Cabecera limpia y calmada */}
        <header className="bg-white text-slate-900 px-6 sm:px-8 py-5 flex items-start justify-between border-b border-slate-200/80">
          <div>
            <span className="text-xs font-semibold text-[#002B49] block mb-1">
              {activeTramite ? category.title : 'Categoría de ayuda'}
            </span>
            <h2 id="modal-title" className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              {activeTramite ? activeTramite.title : category.title}
            </h2>
            <p id="modal-description" className="text-slate-600 text-xs sm:text-sm mt-1">
              {activeTramite ? activeTramite.description : category.description}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            className="min-h-[40px] min-w-[40px] p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors ml-4 shrink-0 flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        {/* Cuerpo del Modal */}
        {showSimulator ? (
          <div className="overflow-y-auto max-h-[82vh] animate-fade-in">
            <Suspense
              fallback={
                <div className="p-12 text-center font-semibold text-slate-600">
                  Cargando simulador de Toma de Ramos...
                </div>
              }
            >
              <TomaRamosSimulator onExit={() => setShowSimulator(false)} />
            </Suspense>
          </div>
        ) : activeTramite ? (
          /* VISTA DE DETALLE DEL TRÁMITE */
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto animate-fade-in">
            <button
              type="button"
              onClick={() => setActiveTramite(null)}
              className="min-h-[38px] inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#002B49] rounded-lg px-2 -ml-2 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Ver todos los temas de {category.title}</span>
            </button>

            <article className="space-y-6">
              {/* Simulador de Toma de Ramos si corresponde */}
              {activeTramite.id === 'inscripcion-asignaturas' && (
                <div className="p-5 bg-amber-50/70 border border-amber-200/90 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-amber-900 block">
                      Práctica interactiva guiada
                    </span>
                    <p className="text-xs sm:text-sm text-slate-700 mt-1 leading-relaxed">
                      Practica cómo inscribir asignaturas, revisar horarios y confirmar secciones sin afectar tu carga real.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSimulator(true);
                      announce('Abriendo simulador de Toma de Ramos', 'polite');
                    }}
                    className="min-h-[42px] px-4 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-semibold text-xs sm:text-sm rounded-xl shrink-0 flex items-center gap-2 shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Package className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                    <span>Practicar en el simulador</span>
                  </button>
                </div>
              )}

              {/* Pasos a seguir */}
              <div className="bg-slate-50/80 p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-9 h-9 rounded-xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center shrink-0"
                    aria-hidden="true"
                  >
                    <BookOpen className="w-4 h-4" aria-hidden="true" />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900">
                    Cómo realizar este trámite
                  </h3>
                </div>

                <p className="whitespace-pre-line text-slate-700 leading-relaxed text-sm sm:text-base">
                  {activeTramite.instructions ||
                    'Ingresa con tu correo institucional al portal de Duoc UC y sigue los pasos indicados en la sección correspondiente.'}
                </p>

                <div className="pt-2 border-t border-slate-200/70 flex items-start gap-2.5 text-xs text-slate-600">
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Recuerda tener tu sesión iniciada con tu cuenta institucional (@duocuc.cl).
                  </span>
                </div>
              </div>

              {/* Apoyo PAEDIS limpio y amable */}
              {activeTramite.paedisTip && (
                <div
                  role="note"
                  aria-label="Apoyo e inclusión PAEDIS"
                  className="p-4 sm:p-5 bg-sky-50/70 border border-sky-200/80 rounded-2xl flex items-start gap-3 text-slate-800"
                >
                  <HeartHandshake className="w-5 h-5 text-[#002B49] shrink-0 mt-0.5" aria-hidden="true" />
                  <div className="text-xs sm:text-sm leading-relaxed">
                    <span className="font-semibold text-[#002B49] block mb-0.5">
                      Orientación de inclusión y apoyo PAEDIS
                    </span>
                    <p className="text-slate-700">{activeTramite.paedisTip}</p>
                  </div>
                </div>
              )}

              {/* Artículos relacionados */}
              {Array.isArray(activeTramite.articles) && activeTramite.articles.length > 0 && (
                <div className="space-y-3 pt-1">
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    <span>Artículos de ayuda relacionados ({activeTramite.articles.length})</span>
                  </h4>
                  <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl bg-white overflow-hidden">
                    {activeTramite.articles.map((art) => (
                      <div
                        key={art.id || art.title}
                        className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <h5 className="font-semibold text-slate-900 text-xs sm:text-sm">
                            {art.title}
                          </h5>
                          {art.summary && (
                            <p className="text-xs text-slate-600 line-clamp-2">{art.summary}</p>
                          )}
                        </div>
                        {art.url && (
                          <a
                            href={art.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Leer guía: ${art.title} (nueva pestaña)`}
                            className="min-h-[38px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-800 font-semibold text-xs rounded-xl shrink-0 inline-flex items-center gap-1.5 transition-colors self-start sm:self-center"
                          >
                            <span>Leer guía</span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Acción principal */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <a
                  href={activeTramite.link || activeTramite.directUrl || 'https://www.duoc.cl'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[46px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>{activeTramite.actionLabel || 'Ir al portal oficial para este trámite'}</span>
                  <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={() => setActiveTramite(null)}
                  className="min-h-[46px] px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Ver otros trámites
                </button>
              </div>
            </article>
          </div>
        ) : (
          /* LISTA DE TRÁMITES DE LA CATEGORÍA */
          <div className="overflow-y-auto p-6 sm:p-8 space-y-4 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {category.submodules.map((sub, index) => (
                <article
                  key={sub.id || index}
                  className="bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md group"
                >
                  <div>
                    <h3 className="font-bold text-base text-slate-900 group-hover:text-[#002B49] transition-colors mb-1.5">
                      {sub.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
                      {sub.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/60 mt-2 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleSelectTramite(sub)}
                      className="w-full min-h-[40px] py-2 px-4 bg-white group-hover:bg-[#002B49] text-slate-800 group-hover:text-white border border-slate-200/90 group-hover:border-[#002B49] rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-between gap-2 transition-all duration-200 active:scale-[0.98]"
                    >
                      <span>Ver pasos y enlaces</span>
                      <ArrowRight
                        className="w-4 h-4 text-slate-400 group-hover:text-[#FFB81C] group-hover:translate-x-0.5 transition-all"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* Pie del Modal */}
        <footer className="bg-slate-50 px-6 sm:px-8 py-3.5 border-t border-slate-200/80 flex items-center justify-between gap-4 text-xs text-slate-500">
          <span>Centro de Ayuda • Duoc UC</span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[38px] px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/90 transition-colors"
          >
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  );
};
