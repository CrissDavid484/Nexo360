import React, { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ArrowLeft,
  ExternalLink,
  BookOpen,
  CheckCircle,
  Package,
  FileText,
  ArrowRight,
  Info,
  ChevronRight,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { lazyLoad } from '../../utils/lazyLoad';
import { simplifyText, simplifyArticleHtml } from '../../utils/clearReadingUtils';
import { sanitizeArticleHtml, escapeHtml } from '../../utils/sanitizeHtml';

const TomaRamosSimulator = lazyLoad(
  () => import('../simulation/TomaRamosSimulator'),
  'TomaRamosSimulator'
);

function normalizeEmbeddedYouTubeHtml(html) {
  return sanitizeArticleHtml(html);
}

function resolveModalHeader(category, activeTramite, activeArticle, clearReadingMode) {
  let headerData;
  if (activeArticle) {
    headerData = {
      eyebrow: `${category.title} • ${activeTramite?.title || 'Guía'}`,
      title: activeArticle.title,
      description: 'Guía oficial del Centro de Ayuda Duoc UC - Sede Alameda para consulta inmediata.',
    };
  } else if (activeTramite) {
    headerData = {
      eyebrow: category.title,
      title: activeTramite.title,
      description: activeTramite.description,
    };
  } else {
    headerData = {
      eyebrow: 'Categoría de ayuda • Sede Alameda',
      title: category.title,
      description: category.description,
    };
  }

  if (!clearReadingMode) {
    return headerData;
  }

  return {
    ...headerData,
    description: simplifyText(headerData.description, { maxSentences: 1, maxChars: 135 }),
  };
}

export const ModuleModal = ({
  category,
  initialSubmodule = null,
  initialArticle = null,
  onClose,
}) => {
  const { announce, getVoiceProps, clearReadingMode } = useAccessibility();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  const [activeTramite, setActiveTramite] = useState(initialSubmodule);
  const [activeArticle, setActiveArticle] = useState(initialArticle);
  const [showSimulator, setShowSimulator] = useState(false);
  const [showFullArticleText, setShowFullArticleText] = useState(false);

  useEffect(() => {
    setActiveTramite(initialSubmodule || null);
    setActiveArticle(initialArticle || null);
    setShowFullArticleText(false);
  }, [initialSubmodule, initialArticle, category]);

  useEffect(() => {
    if (!category) return;
    const targetTitle =
      initialArticle?.title || initialSubmodule?.title || category.title;
    announce(
      `Abriendo información de ${targetTitle}. Presiona Escape para regresar o cerrar.`,
      'polite'
    );
  }, [category, initialSubmodule, initialArticle, announce]);

  const handleModalEscape = useCallback(() => {
    if (showSimulator) {
      setShowSimulator(false);
      announce('Cerrando simulador y regresando al trámite', 'polite');
    } else if (activeArticle) {
      setActiveArticle(null);
      announce('Regresando a los artículos del tema', 'polite');
    } else if (activeTramite) {
      setActiveTramite(null);
      announce('Regresando a la lista de temas', 'polite');
    } else {
      onClose();
      announce('Ventana cerrada', 'polite');
    }
  }, [showSimulator, activeArticle, activeTramite, onClose, announce]);

  useAccessibleModal({
    isOpen: Boolean(category),
    onClose: handleModalEscape,
    containerRef: modalRef,
    initialFocusRef: closeButtonRef,
  });

  useOnClickOutside(modalRef, onClose, {
    enabled: Boolean(category),
    ignoreSelector: '#accessibility-panel',
  });

  if (!category) return null;

  const { eyebrow, title, description } = resolveModalHeader(
    category,
    activeTramite,
    activeArticle,
    clearReadingMode
  );

  const handleSelectTramite = (sub) => {
    setActiveTramite(sub);
    setActiveArticle(null);
    setShowFullArticleText(false);
    announce(`Mostrando pasos para ${sub.title}`);
  };

  const handleOpenArticle = (art) => {
    setActiveArticle(art);
    setShowFullArticleText(false);
    announce(`Abriendo guía completa: ${art.title}`, 'polite');
  };

  const rawArticleHtml =
    activeArticle?.body || `<p>${escapeHtml(activeArticle?.summary || '')}</p>`;
  const simplifiedArticleHtml = activeArticle ? simplifyArticleHtml(rawArticleHtml) : '';
  const isClearReadingArticle = Boolean(
    clearReadingMode && !showFullArticleText && simplifiedArticleHtml
  );
  const renderedArticleHtml = normalizeEmbeddedYouTubeHtml(
    isClearReadingArticle ? simplifiedArticleHtml : rawArticleHtml
  );
  const articleToggleLabel = isClearReadingArticle ? 'Ver texto completo' : 'Ver resumen claro';

  const rawInstructions =
    activeTramite?.instructions ||
    'Ingresa con tu correo institucional al portal de Duoc UC y sigue los pasos indicados en la sección correspondiente.';
  const displayedInstructions = clearReadingMode
    ? simplifyText(rawInstructions, { maxSentences: 3, maxChars: 240 })
    : rawInstructions;

  const renderModalBody = () => {
    if (showSimulator) {
      return (
        <div className="flex-1 min-h-0 overflow-y-auto max-h-[82vh] animate-fade-in">
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
      );
    }

    if (activeArticle) {
      return (
        /* =========================================================
           VISTA 1: GUÍA COMPLETA (LEER GUÍA SIN SALIR DE NEXO360)
           ========================================================= */
        <div className="flex-1 min-h-0 p-4 sm:p-8 space-y-6 overflow-y-auto animate-fade-in">
          {/* Barra superior de navegación interna */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-100">
            <button
              type="button"
              onClick={() => setActiveArticle(null)}
              {...getVoiceProps(`Volver a ${activeTramite ? activeTramite.title : 'artículos'}`)}
              className="min-h-[38px] inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#002B49] hover:text-[#001D33] rounded-lg px-2 -ml-2 hover:bg-slate-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Volver a {activeTramite ? activeTramite.title : 'artículos'}</span>
            </button>

            {activeTramite?.link && (
              <a
                href={activeTramite.link}
                target="_blank"
                rel="noopener noreferrer"
                {...getVoiceProps(activeTramite.actionLabel || 'Ir al portal del trámite')}
                className="min-h-[36px] px-3.5 py-1.5 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <span>{activeTramite.actionLabel || 'Ir al portal del trámite'}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
              </a>
            )}
          </div>

          {/* Contenido principal de la guía */}
          <article className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-7 shadow-sm space-y-5">
              <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100">
                <div
                  className="w-10 h-10 rounded-xl bg-amber-50 text-[#002B49] border border-amber-200 flex items-center justify-center shrink-0"
                  aria-hidden="true"
                >
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 inline-block mb-0.5">
                    Guía Oficial • Centro de Ayuda Duoc UC - Sede Alameda
                  </span>
                  <h3
                    {...getVoiceProps(activeArticle.title)}
                    className="text-base sm:text-lg font-bold text-slate-900 leading-snug"
                  >
                    {activeArticle.title}
                  </h3>
                </div>
              </div>

              {clearReadingMode && simplifiedArticleHtml && (
                <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl bg-sky-50/80 border border-sky-200/80">
                  <span className="text-xs font-semibold text-[#002B49]">
                    {isClearReadingArticle
                      ? 'Lectura clara activa: pasos clave resumidos'
                      : 'Mostrando texto completo de la guía'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextFull = !showFullArticleText;
                      setShowFullArticleText(nextFull);
                      announce(
                        nextFull
                          ? 'Mostrando texto completo de la guía'
                          : 'Mostrando resumen en lectura clara'
                      );
                    }}
                    aria-pressed={showFullArticleText}
                    {...getVoiceProps(articleToggleLabel)}
                    className="min-h-[34px] px-3 py-1 bg-white hover:bg-slate-100 text-[#002B49] font-semibold text-xs rounded-lg border border-slate-300 transition-colors cursor-pointer"
                  >
                    {articleToggleLabel}
                  </button>
                </div>
              )}

              {/* Cuerpo del artículo renderizado con formato enriquecido y accesible */}
              <div
                className="nexo-article-prose prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed font-normal
                  [&_p]:mb-3.5 [&_p]:leading-relaxed
                  [&_strong]:text-slate-950 [&_strong]:font-bold
                  [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-3
                  [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1.5 [&_ol]:my-3
                  [&_li]:leading-relaxed
                  [&_a]:text-[#002B49] [&_a]:underline [&_a]:font-semibold hover:[&_a]:text-[#FFB81C]
                  [&_table]:w-full [&_table]:my-3 [&_table]:border [&_table]:border-slate-200 [&_table]:rounded-lg
                  [&_th]:bg-slate-100 [&_th]:p-2.5 [&_th]:text-left [&_th]:font-bold [&_th]:border-b [&_th]:border-slate-200
                  [&_td]:p-2.5 [&_td]:border-b [&_td]:border-slate-100
                  [&_h2]:text-base [&_h2]:font-bold [&_h2]:text-slate-900 [&_h2]:mt-4 [&_h2]:mb-2
                  [&_h3]:text-sm [&_h3]:font-bold [&_h3]:text-slate-900 [&_h3]:mt-3 [&_h3]:mb-1.5"
                dangerouslySetInnerHTML={{
                  __html: renderedArticleHtml,
                }}
              />

              {/* DISCLAIMER OBLIGATORIO REQUERIDO POR EL USUARIO */}
              <div
                role="note"
                aria-label="Enlace a la fuente oficial"
                className="mt-8 pt-5 border-t border-slate-200/90 p-4 sm:p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
              >
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                  <span className="font-bold text-slate-900">Puedes revisar la misma información en:</span>{' '}
                  <a
                    href={activeArticle.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...getVoiceProps('Abrir guía original en centroayuda.duoc.cl')}
                    className="font-semibold text-[#002B49] hover:text-[#001D33] underline inline-flex items-center gap-1.5 break-all"
                  >
                    <span>{activeArticle.url}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 text-slate-500" aria-hidden="true" />
                  </a>
                </p>
                <p className="text-[11px] text-slate-500">
                  Centro de Ayuda Oficial de Duoc UC (centroayuda.duoc.cl) • Sede Alameda.
                </p>
              </div>
            </div>

            {/* Otras guías relacionadas de este apartado si existen */}
            {activeTramite?.articles && activeTramite.articles.length > 1 && (
              <div className="space-y-3 pt-2">
                <h4
                  {...getVoiceProps(`Otras guías de ${activeTramite.title}`)}
                  className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                  <span>Otras guías de {activeTramite.title}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeTramite.articles
                    .filter((art) => art.id !== activeArticle.id)
                    .slice(0, 4)
                    .map((art) => (
                      <button
                        key={art.id || art.title}
                        type="button"
                        onClick={() => handleOpenArticle(art)}
                        {...getVoiceProps(`Leer guía relacionada: ${art.title}`)}
                        className="p-3 text-left bg-white hover:bg-slate-50 border border-slate-200/90 rounded-xl transition-colors flex items-center justify-between gap-2 group cursor-pointer"
                      >
                        <span className="text-xs font-semibold text-slate-800 group-hover:text-[#002B49] line-clamp-1">
                          {art.title}
                        </span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#002B49] shrink-0" aria-hidden="true" />
                      </button>
                    ))}
                </div>
              </div>
            )}
          </article>
        </div>
      );
    }

    if (activeTramite) {
      return (
        /* =========================================================
           VISTA 2: DETALLE DEL TRÁMITE / APARTADO (LISTA DE GUÍAS)
           ========================================================= */
        <div className="flex-1 min-h-0 p-4 sm:p-8 space-y-6 overflow-y-auto animate-fade-in">
          <button
            type="button"
            onClick={() => setActiveTramite(null)}
            {...getVoiceProps(`Ver todos los temas de ${category.title}`)}
            className="min-h-[38px] inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-[#002B49] rounded-lg px-2 -ml-2 hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Ver todos los temas de {category.title}</span>
          </button>

          <article className="space-y-6">
            {/* Simulador de Toma de Ramos & Acceso Oficial al Portal Real */}
            {activeTramite.id === 'inscripcion-asignaturas' && (
              <div className="p-5 bg-slate-50/80 border border-slate-200 rounded-2xl flex flex-col gap-4 shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs font-semibold text-[#002B49] uppercase tracking-wider block">
                      Portal Oficial • Toma de Ramos y Modificación de Asignaturas
                    </span>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed font-normal">
                      Accede directamente al portal oficial SICOL WebDynpro de Duoc UC para realizar tu inscripción o modificación real de asignaturas en Sede Alameda.
                    </p>
                  </div>
                  <a
                    href="https://portalinsc.duoc.cl/webdynpro/dispatcher/duoc.com.student/sicol/StudentSicol?inportal=xi#"
                    target="_blank"
                    rel="noopener noreferrer"
                    {...getVoiceProps('Ir a Toma de Ramos Oficial en SICOL')}
                    className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-medium text-xs sm:text-sm rounded-xl shrink-0 flex items-center gap-2 shadow-xs transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  >
                    <span>Ir a Toma de Ramos Oficial</span>
                    <ExternalLink className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                  </a>
                </div>

                <div className="pt-3 border-t border-slate-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-semibold text-slate-800 block">
                      ¿Deseas practicar antes? Simulador de Toma de Ramos y Modificación
                    </span>
                    <p className="text-xs text-slate-500 font-normal">
                      Entrena la Toma de Ramos desde cero o la Modificación de Asignaturas (eliminar/cambiar secciones) con la interfaz fiel de SICOL y tu Boletín de Carga Académica.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSimulator(true);
                      announce('Abriendo simulador de Toma de Ramos y Modificación de Asignaturas', 'polite');
                    }}
                    {...getVoiceProps('Practicar en el simulador de Toma de Ramos')}
                    className="min-h-[40px] px-4 py-2 bg-[#FFB81C] hover:bg-amber-400 text-slate-950 font-medium text-xs sm:text-sm rounded-xl shrink-0 flex items-center gap-2 shadow-xs transition-all active:scale-[0.98]"
                  >
                    <Package className="w-4 h-4 text-slate-950" aria-hidden="true" />
                    <span>Practicar en el simulador</span>
                  </button>
                </div>
              </div>
            )}

            {/* Pasos a seguir - Con badges numerados y espaciado generoso */}
            <div
              {...getVoiceProps(`Cómo realizar este trámite. ${displayedInstructions}`)}
              className="bg-slate-50/80 p-5 sm:p-6 rounded-2xl border border-slate-200/80 space-y-5"
            >
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

              {(() => {
                // Separar las instrucciones en pasos numerados
                const steps = displayedInstructions
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line.length > 0)
                  .map(line => {
                    // Detectar si la línea ya empieza con número
                    const match = line.match(/^(\d+)[\.\:\)]\s*(.*)/);
                    if (match) {
                      return { number: Number.parseInt(match[1], 10), text: match[2] };
                    }
                    // Si no tiene número, asignar secuencialmente
                    return { text: line };
                  });

                let stepCounter = 0;
                return steps.map((step, idx) => {
                  const stepNum = step.number || ++stepCounter;
                  const stepText = step.text || step;
                  return (
                    <div
                      key={`${idx}-${stepNum}`}
                      className="flex gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs"
                    >
                      <span
                        className="flex-shrink-0 w-7 h-7 rounded-full bg-[#002B49] text-[#FFB81C] font-bold text-xs flex items-center justify-center"
                        aria-label={`Paso ${stepNum}`}
                      >
                        {stepNum}
                      </span>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                          {stepText}
                        </p>
                      </div>
                    </div>
                  );
                });
              })()}

              {/* Acción principal hacia el portal oficial inmediatamente después de los pasos */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <a
                  href={activeTramite.link || activeTramite.directUrl || 'https://www.duoc.cl'}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...getVoiceProps(activeTramite.actionLabel || 'Ir al portal oficial para este trámite')}
                  className="min-h-[46px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl text-xs sm:text-sm font-semibold shadow-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                >
                  <span>{activeTramite.actionLabel || 'Ir al portal oficial para este trámite'}</span>
                  <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                </a>

                <button
                  type="button"
                  onClick={() => setActiveTramite(null)}
                  {...getVoiceProps('Ver otros trámites')}
                  className="min-h-[46px] px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Ver otros trámites
                </button>
              </div>

              <div className="pt-2 border-t border-slate-200/70 flex items-start gap-2.5 text-xs text-slate-600">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  Recuerda tener tu sesión iniciada con tu cuenta institucional (@duocuc.cl) de Sede Alameda.
                </span>
              </div>
            </div>

            {/* ARTÍCULOS DE AYUDA RELACIONADOS CON BOTÓN "LEER GUÍA" INTERNO */}
            {Array.isArray(activeTramite.articles) && activeTramite.articles.length > 0 && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <h4
                    {...getVoiceProps(`Artículos de ayuda relacionados: ${activeTramite.articles.length}`)}
                    className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                    <span>Artículos de ayuda relacionados ({activeTramite.articles.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Haz clic en Leer guía para abrir la información
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
                  {activeTramite.articles.map((art) => {
                    const artSummary = clearReadingMode
                      ? simplifyText(art.summary, { maxSentences: 1, maxChars: 130 })
                      : art.summary;
                    return (
                      <div
                        key={art.id || art.title}
                        className="p-4 hover:bg-slate-50/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1 pr-2">
                          <button
                            type="button"
                            onClick={() => handleOpenArticle(art)}
                            {...getVoiceProps(`Leer guía: ${art.title}`)}
                            className="text-left font-semibold text-slate-900 text-xs sm:text-sm hover:text-[#002B49] hover:underline cursor-pointer"
                          >
                            {art.title}
                          </button>
                          {artSummary && (
                            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                              {artSummary}
                            </p>
                          )}
                        </div>

                        {/* Botón "Leer guía" que abre la guía directamente en Nexo360 */}
                        <button
                          type="button"
                          onClick={() => handleOpenArticle(art)}
                          aria-label={`Leer guía: ${art.title}`}
                          {...getVoiceProps(`Leer guía: ${art.title}`)}
                          className="min-h-[38px] px-3.5 py-1.5 bg-slate-100 hover:bg-[#002B49] text-slate-800 hover:text-white font-semibold text-xs rounded-xl shrink-0 inline-flex items-center gap-1.5 transition-colors self-start sm:self-center cursor-pointer shadow-2xs"
                        >
                          <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                          <span>Leer guía</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </article>
        </div>
      );
    }

    return (
      /* =========================================================
         VISTA 3: LISTA DE TRÁMITES DE LA CATEGORÍA
         ========================================================= */
      <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-8 space-y-4 animate-fade-in">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {category.submodules.map((sub) => {
            const subDescription = clearReadingMode
              ? simplifyText(sub.description, { maxSentences: 1, maxChars: 130 })
              : sub.description;
            const subVoiceProps = getVoiceProps(`${sub.title}. ${subDescription}`);
            return (
              <article
                key={sub.id}
                {...subVoiceProps}
                onFocus={(event) => {
                  if (event.target === event.currentTarget) {
                    subVoiceProps.onFocus(event);
                  }
                }}
                className="bg-slate-50/70 hover:bg-white border border-slate-200/80 hover:border-slate-300 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md group"
              >
                <div>
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-[#002B49] transition-colors mb-1.5">
                    {sub.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-slate-600 mb-3 leading-relaxed">
                    {subDescription}
                  </p>

                  {sub.articles && sub.articles.length > 0 && (
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full inline-block mb-2">
                      {sub.articles.length} {sub.articles.length === 1 ? 'guía oficial' : 'guías oficiales'}
                    </span>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-200/60 mt-2 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectTramite(sub)}
                    {...getVoiceProps(`Ver guías e instrucciones de ${sub.title}`)}
                    className="w-full min-h-[40px] py-2 px-4 bg-white group-hover:bg-[#002B49] text-slate-800 group-hover:text-white border border-slate-200/90 group-hover:border-[#002B49] rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-between gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  >
                    <span>Ver guías e instrucciones</span>
                    <ArrowRight
                      className="w-4 h-4 text-slate-400 group-hover:text-[#FFB81C] group-hover:translate-x-0.5 transition-all"
                      aria-hidden="true"
                    />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    );
  };

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby="modal-description"
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-start sm:items-center justify-center p-3 pb-20 sm:p-6 sm:pb-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-slate-300 overflow-hidden flex flex-col max-h-[calc(100dvh-7.5rem)] sm:max-h-[92vh] my-0 sm:my-auto animate-scale-in"
      >
        {/* Cabecera institucional limpia y calmada */}
        <header className="bg-white text-slate-900 px-4 py-3 sm:px-8 sm:py-5 flex items-start justify-between border-b border-slate-200 shrink-0">
          <div className="pr-2 min-w-0 flex-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#002B49] block mb-1 truncate sm:whitespace-normal">
              {eyebrow}
            </span>
            <h2
              id="modal-title"
              {...getVoiceProps(`${title}. ${description}`)}
              className="text-base sm:text-2xl font-bold tracking-tight text-slate-900 leading-snug"
            >
              {title}
            </h2>
            <p
              id="modal-description"
              className="text-slate-600 text-xs sm:text-sm mt-1 leading-relaxed line-clamp-2 sm:line-clamp-none"
            >
              {description}
            </p>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Cerrar ventana"
            {...getVoiceProps('Cerrar ventana')}
            className="min-h-[40px] min-w-[40px] p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors ml-3 sm:ml-4 shrink-0 flex items-center justify-center"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </header>

        {/* CUERPO DEL MODAL */}
        {renderModalBody()}

        {/* Pie del Modal */}
        <footer className="bg-slate-50 px-4 py-2.5 sm:px-8 sm:py-3.5 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 sm:gap-4 text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Info className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
            <span className="truncate sm:whitespace-normal">Centro de Ayuda • Duoc UC - Sede Alameda</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {activeArticle && (
              <button
                type="button"
                onClick={() => setActiveArticle(null)}
                {...getVoiceProps('Volver a guías')}
                className="min-h-[38px] px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/90 transition-colors cursor-pointer"
              >
                Volver a guías
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              {...getVoiceProps('Cerrar')}
              className="min-h-[38px] px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200/90 transition-colors cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        </footer>
      </div>
    </div>
  );

  // Portal en document.body para preservar position: fixed frente a filters en #nexo-cb-canvas
  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
