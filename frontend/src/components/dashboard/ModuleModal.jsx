import React, { useEffect, useRef, useState } from 'react';
import {
  X,
  ShieldCheck,
  Info,
  CheckCircle2,
  Loader2,
  ArrowLeft,
  FileText,
  Send,
  Zap,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { VIVO_STUDENT_PROFILE } from '../../data/vivoDuocData';

export const ModuleModal = ({ category, onClose }) => {
  const { announce } = useAccessibility();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Estado del Trámite en curso seleccionado para hacer Scraping interno
  const [activeTramite, setActiveTramite] = useState(null);
  const [scrapingStatus, setScrapingStatus] = useState('idle'); // 'idle' | 'processing' | 'completed'
  const [tramiteComment, setTramiteComment] = useState('');
  const [receiptCode, setReceiptCode] = useState(null);

  useEffect(() => {
    if (category) {
      announce(`Abriendo opciones del módulo ${category.title}. Presiona Escape para cerrar.`, 'polite');
      setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (activeTramite) {
          setActiveTramite(null);
          setScrapingStatus('idle');
        } else {
          onClose();
        }
        announce('Ventana cerrada');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [category, activeTramite]);

  if (!category) return null;

  const handleStartTramite = (sub) => {
    setActiveTramite(sub);
    setScrapingStatus('idle');
    setTramiteComment('');
    setReceiptCode(null);
    announce(`Iniciando formulario de ${sub.title}`);
  };

  const handleExecuteScraping = (e) => {
    e.preventDefault();
    setScrapingStatus('processing');
    announce('Procesando trámite institucional mediante proxy scraper...', 'polite');

    // Simulación del flujo de scraping con Puppeteer en el portal de Duoc UC
    setTimeout(() => {
      const generatedFolio = `TRM-ALM-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setReceiptCode(generatedFolio);
      setScrapingStatus('completed');
      announce(`Trámite procesado exitosamente. Folio ${generatedFolio}`, 'assertive');
    }, 2200);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border-2 border-slate-300 overflow-hidden flex flex-col max-h-[90vh] my-auto"
      >
        {/* Cabecera del Modal */}
        <div className="bg-[#002B49] text-white px-6 sm:px-8 py-6 flex items-start justify-between border-b-4 border-amber-400">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-amber-400 font-bold text-xs uppercase tracking-wider block">
                Nexo360 • PAEDIS Sede Alameda
              </span>
              <span className="bg-amber-400/20 text-amber-300 text-[10px] font-black px-2 py-0.5 rounded border border-amber-400/40">
                Tramitación 100% Integrada por Scraping
              </span>
            </div>
            <h2 id="modal-title" className="text-2xl sm:text-3xl font-black tracking-tight">
              {activeTramite ? activeTramite.title : category.title}
            </h2>
            <p id="modal-description" className="text-slate-300 text-sm mt-1">
              {activeTramite ? activeTramite.description : category.description}
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

        {/* MODO A: FORMULARIO INTERNO DEL TRÁMITE CON PURO SCRAPING */}
        {activeTramite ? (
          <div className="p-6 sm:p-8 space-y-6 overflow-y-auto">
            <button
              type="button"
              onClick={() => {
                setActiveTramite(null);
                setScrapingStatus('idle');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#002B49] hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a la lista de trámites de {category.title}</span>
            </button>

            {scrapingStatus === 'completed' ? (
              <div className="p-6 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-emerald-950 space-y-4 text-center">
                <div className="w-14 h-14 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-emerald-900">
                    ¡Trámite Procesado Exitosamente por Scraper!
                  </h3>
                  <p className="text-sm text-emerald-800 mt-1">
                    Tu solicitud para <strong>"{activeTramite.title}"</strong> fue enviada directamente al portal institucional de Duoc UC sin salir de Nexo360.
                  </p>
                </div>
                <div className="p-3 bg-white rounded-xl border border-emerald-300 inline-block font-mono text-sm font-black text-slate-900">
                  Comprobante Oficial: {receiptCode}
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTramite(null);
                      setScrapingStatus('idle');
                    }}
                    className="px-6 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white rounded-xl text-xs font-black"
                  >
                    Finalizar y Ver Otros Trámites
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleExecuteScraping} className="space-y-5">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-300 text-amber-950 text-xs sm:text-sm flex items-start gap-3">
                  <Zap className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <span className="font-bold block">Tramitación Directa en Sede Alameda:</span>
                    <span>
                      Este formulario automatiza la solicitud conectándose en segundo plano con el portal oficial de Duoc UC. No necesitas ingresar a páginas externas ni recordar múltiples contraseñas.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Estudiante Acreditado:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${VIVO_STUDENT_PROFILE.nombre} (${VIVO_STUDENT_PROFILE.rut})`}
                      className="w-full text-xs p-2.5 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Sede y Carrera:
                    </label>
                    <input
                      type="text"
                      disabled
                      value={`${VIVO_STUDENT_PROFILE.sede} • ${VIVO_STUDENT_PROFILE.carrera}`}
                      className="w-full text-xs p-2.5 bg-slate-100 border border-slate-300 rounded-lg font-bold text-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="tramite-comment" className="block text-xs font-bold text-slate-700 mb-1">
                    Motivo o Detalle de la Solicitud *
                  </label>
                  <textarea
                    id="tramite-comment"
                    rows={4}
                    required
                    value={tramiteComment}
                    onChange={(e) => setTramiteComment(e.target.value)}
                    placeholder="Escribe los antecedentes o especificaciones para este trámite..."
                    className="w-full text-xs sm:text-sm p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#002B49] focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setActiveTramite(null)}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={scrapingStatus === 'processing'}
                    className="px-6 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white font-black text-xs sm:text-sm rounded-xl shadow-md flex items-center gap-2 focus:ring-4 focus:ring-amber-400 disabled:opacity-75"
                  >
                    {scrapingStatus === 'processing' ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Ejecutando Scraper en Duoc UC...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-4 h-4 text-amber-400" />
                        <span>Enviar y Tramitar con Scraper</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          /* MODO B: LISTA DE SUBMENÚS CON BOTONES PARA HACER EL TRÁMITE DENTRO */
          <div className="overflow-y-auto p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-black text-slate-900">
                Trámites Disponibles ({category.submodules.length})
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Tramitación autónoma sin salir de la plataforma
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

                    {/* Consideración de accesibilidad */}
                    {sub.paedisSupport && (
                      <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-r-lg mb-4 text-xs text-amber-950 font-medium flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                          <strong className="block text-amber-900 font-bold">Ajuste Accesible:</strong>
                          {sub.paedisSupport}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Botón de Tramitación Directa Interna por Scraping */}
                  <div className="pt-3 border-t border-slate-200 mt-2">
                    <button
                      type="button"
                      onClick={() => handleStartTramite(sub)}
                      className="w-full py-2.5 px-3 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs flex items-center justify-center gap-2 shadow-xs transition-transform active:scale-95 focus:ring-4 focus:ring-amber-500"
                    >
                      <Zap className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
                      <span>Hacer trámite aquí (Scraping Automático)</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pie del Modal */}
        <div className="bg-slate-100 px-6 sm:px-8 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 font-medium">
            <Info className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span>Coordinación PAEDIS • Duoc UC Sede Alameda.</span>
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
