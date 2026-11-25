import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { DUOC_CATEGORIES, INTENT_SHORTCUTS } from '../data/duocModulesData';
import { DEFAULT_CAMPUS, getStudentDisplayName } from '../utils/studentUtils';
import { PURPOSE_GROUPS, analyzeDashboardSearch } from '../utils/dashboardSearchUtils';
import { lazyLoad } from '../utils/lazyLoad';
import { ModuleCard } from '../components/dashboard/ModuleCard';
import { ModuleModal } from '../components/dashboard/ModuleModal';
import { SearchBar } from '../components/dashboard/SearchBar';
import { UnifiedNavbar } from '../components/common/UnifiedNavbar';
import { AccessibilityBar } from '../components/common/AccessibilityBar';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import {
  HelpCircle,
  CheckSquare,
  ChevronDown,
  Laptop,
  Calendar,
  ArrowRight,
  HeartHandshake,
  CreditCard,
  Award,
  BookOpen,
  ShieldAlert,
  Compass,
  ExternalLink,
  FileText,
  Layers,
  Package,
  GraduationCap,
} from 'lucide-react';

// Vistas complementarias con Code-Splitting (React.lazy)
const BibliotecaView = lazyLoad(
  () => import('../components/views/BibliotecaView'),
  'BibliotecaView'
);
const ServiciosDigitalesTicketsView = lazyLoad(
  () => import('../components/views/ServiciosDigitalesTicketsView'),
  'ServiciosDigitalesTicketsView'
);
const PerfilView = lazyLoad(
  () => import('../components/views/PerfilView'),
  'PerfilView'
);
const VivoDuocSummaryView = lazyLoad(
  () => import('../components/views/VivoDuocSummaryView'),
  'VivoDuocSummaryView'
);
const TomaRamosSimulator = lazyLoad(
  () => import('../components/simulation/TomaRamosSimulator'),
  'TomaRamosSimulator'
);
const AdminLayout = lazyLoad(
  () => import('../components/admin/modules/AdminLayout'),
  'AdminLayout'
);

const INTENT_ICON_MAP = {
  CheckSquare,
  HeartHandshake,
  Calendar,
  Laptop,
  CreditCard,
  Award,
  BookOpen,
  ShieldAlert,
  FileText,
};

const OFFICIAL_DUOC_FAQS = [
  {
    q: '¿Qué es el Programa PAEDIS, qué requisitos pide y qué apoyos entrega?',
    a: 'El Programa de Acompañamiento a Estudiantes en situación de Discapacidad (PAEDIS) promueve la inclusión y equidad en tu trayectoria académica. Para ingresar debes ser estudiante matriculado y presentar tu Credencial de Discapacidad (RND/COMPIN) o certificado médico especialista. Entrega una Ficha de Ajustes Razonables para tus docentes, adecuaciones en evaluaciones y acompañamiento psicoeducativo.',
    categoryId: 'beneficios-estudiantiles',
    submoduleId: 'paedis-discapacidad',
    articleUrl:
      'https://centroayuda.duoc.cl/hc/es-419/articles/34877482210189--Qu%C3%A9-es-el-Programa-de-Acompa%C3%B1amiento-Estudiantes-con-Discapacidad-PAEDIS',
  },
  {
    q: '¿Cómo justifico una inasistencia a evaluación y qué hago si estoy en riesgo de RI (70%)?',
    a: 'El mínimo de asistencia en Duoc UC es 70%. Si faltaste a una evaluación por motivos médicos o fuerza mayor, tienes plazo para presentar tu certificado en Experiencia Vivo > Solicitudes. Si una condición de salud o laboral te pone en riesgo de Reprobación por Inasistencia (RI) o crees que tu RI es incorrecto, puedes ingresar una solicitud de apelación documentada.',
    categoryId: 'vida-academica',
    submoduleId: 'asistencias-inasistencias',
    articleUrl:
      'https://centroayuda.duoc.cl/hc/es-419/articles/45628967424525--Qu%C3%A9-puedo-hacer-si-una-situaci%C3%B3n-de-salud-o-laboral-afecta-mi-asistencia-y-me-pone-en-riesgo-de-Reprobaci%C3%B3n-por-Inasistencia-RI',
  },
  {
    q: 'Soy estudiante cuidador/a (Ley N° 21.790): ¿cómo me acredito y qué flexibilidad tengo?',
    a: 'La Ley N° 21.790 garantiza apoyos y flexibilidad académica a estudiantes que cuidan a personas con discapacidad, dependencia severa o niños/as. Acreditando tu condición en Duoc UC - Sede Alameda accedes a justificación de inasistencias por labores de cuidado, reprogramación de evaluaciones e inscripción prioritaria.',
    categoryId: 'beneficios-estudiantiles',
    submoduleId: 'apoyo-estudiantes-cuidadores',
    articleUrl:
      'https://centroayuda.duoc.cl/hc/es-419/articles/44621145254669-Ley-N-21-790-Apoyo-para-estudiantes-cuidadores',
  },
  {
    q: '¿Debo pagar matrícula si tengo Gratuidad o CAE y cómo firmo el Contrato de Continuidad?',
    a: 'Si tienes Gratuidad asignada, estás exento del pago de matrícula y arancel durante la duración formal de la carrera. Si estás en 3° semestre o superior, recuerda firmar tu Contrato de Continuidad en el portal de finanzas para habilitar tu inscripción de asignaturas.',
    categoryId: 'vida-academica',
    submoduleId: 'continuidad-estudios-contrato',
    articleUrl:
      'https://centroayuda.duoc.cl/hc/es-419/articles/30497397424141--D%C3%B3nde-puedo-firmar-mi-Contrato-de-Continuidad',
  },
  {
    q: '¿Cómo activo MFA (Verificación en dos pasos), cambio mi clave o accedo a AVA y WiFi?',
    a: 'Con tu cuenta @duocuc.cl accedes a AVA Blackboard, Correo, WiFi de Sede Alameda y Microsoft 365 gratuito. La verificación en dos pasos (MFA) se configura con Microsoft Authenticator; si cambiaste de teléfono o bloqueaste tu clave, puedes autogestionarla o abrir un ticket en Servicios Digitales.',
    categoryId: 'servicios-digitales',
    submoduleId: 'seguridad-autenticacion-mfa-clave',
    articleUrl:
      'https://centroayuda.duoc.cl/hc/es-419/articles/35999617868813-MFA-Verificaci%C3%B3n-en-dos-pasos',
  },
];

export const DashboardPage = () => {
  const { user } = useAuth();
  const { announce, getVoiceProps } = useAccessibility();
  const [activeTab, setActiveTab] = useState('centro-ayuda');

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubmodule, setSelectedSubmodule] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [faqExpanded, setFaqExpanded] = useState(null);

  // Registrar uso del simulador para las métricas del panel de administración y restablecer scroll
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    }
    if (activeTab === 'toma-ramos') {
      api.logSimulatorUsage().catch((err) => {
        console.warn('[DashboardPage] No se pudo registrar el uso del simulador:', err);
      });
    }
  }, [activeTab]);

  // Sincronización de título de página y avisos accesibles para lectores de pantalla como NVDA (WCAG 2.4.2)
  useEffect(() => {
    const TAB_TITLES = {
      'centro-ayuda': 'Centro de Ayuda y Preguntas Frecuentes | Nexo360 - Duoc UC Alameda',
      'toma-ramos': 'Simulador de Toma de Ramos | Nexo360 - Duoc UC Alameda',
      'biblioteca': 'Biblioteca Alameda | Nexo360 - Duoc UC Alameda',
      'vivo-duoc': 'Experiencia Vivo Duoc | Nexo360 - Duoc UC Alameda',
      'tickets': 'Soporte TI y Servicios Digitales | Nexo360 - Duoc UC Alameda',
      'perfil': 'Mi Perfil Institucional PAEDIS | Nexo360 - Duoc UC Alameda',
      'admin-panel':
        (user?.role || '').toLowerCase() === 'coordinador_paedis'
          ? 'Panel PAEDIS | Nexo360 - Duoc UC Alameda'
          : 'Panel Admin | Nexo360 - Duoc UC Alameda',
    };
    const title = TAB_TITLES[activeTab] || 'Nexo360 | Duoc UC - Sede Alameda';
    document.title = title;
  }, [activeTab]);

  const handleOpenCategory = (category) => {
    setSelectedCategory(category);
    setSelectedSubmodule(null);
    setSelectedArticle(null);
  };

  const handleOpenSubmodule = (category, submodule) => {
    setSelectedCategory(category);
    setSelectedSubmodule(submodule);
    setSelectedArticle(null);
  };

  const handleOpenArticleDirectly = (category, submodule, article) => {
    setSelectedCategory(category);
    setSelectedSubmodule(submodule);
    setSelectedArticle(article);
  };

  const handleSelectIntentShortcut = (shortcut) => {
    const cat = DUOC_CATEGORIES.find((c) => c.id === shortcut.categoryId);
    if (!cat) return;
    const sub = cat.submodules.find((s) => s.id === shortcut.submoduleId) || null;
    setSelectedCategory(cat);
    setSelectedSubmodule(sub);
    setSelectedArticle(null);
  };

  const searchAnalysis = useMemo(
    () =>
      analyzeDashboardSearch({
        categories: DUOC_CATEGORIES,
        searchTerm,
        purposeFilter,
        purposeGroups: PURPOSE_GROUPS,
        getSubmoduleBoost: (sub, { isCertificadoNotasIntent, isTomaRamosIntent }) => {
          let boost = 0;
          if (isCertificadoNotasIntent) {
            if (sub.id === 'certificados-alumnos-notas') boost += 50;
            if (sub.id === 'notas-examenes') boost += 30;
          }
          if (isTomaRamosIntent && sub.id === 'inscripcion-asignaturas') {
            boost += 60;
          }
          return boost;
        },
      }),
    [searchTerm, purposeFilter]
  );

  const userName = user?.fullName || user?.nombre || getStudentDisplayName(user);
  const userCareer = user?.career || user?.carrera || 'Ingeniería en Informática';
  const userCampus = `Duoc UC - ${DEFAULT_CAMPUS}`;

  return (
    <div className="min-h-screen flex flex-col bg-neutral-50 text-neutral-900 transition-colors w-full max-w-full overflow-x-clip">
      {/* 1. Barra de Preferencias de Lectura y Visualización (Limpia y Amigable) */}
      <AccessibilityBar />

      {/* 2. Navegación Principal Luminosa */}
      <UnifiedNavbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Contenido Principal */}
      <main
        id="main-content"
        tabIndex="-1"
        aria-label="Contenido principal de Nexo360"
        className="flex-1 w-full max-w-none pt-4 sm:pt-6 lg:pt-8 pb-20 sm:pb-24 px-4 sm:px-6 lg:px-10 focus:outline-none"
      >
        {activeTab === 'centro-ayuda' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* BIENVENIDA + BUSCADOR INTEGRADO (Baja sobrecarga sensorial, diseño limpio institucional Duoc UC) */}
            <section
              aria-labelledby="main-summary-heading"
              className="bg-white rounded-3xl p-6 sm:p-9 border border-neutral-200/90 border-t-4 border-t-brand-navy shadow-sm relative overflow-hidden transition-all"
            >
              <div className="max-w-4xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-neutral-600 mb-3">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-brand-navy border border-neutral-200/80 font-bold">
                    <GraduationCap className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                    <span>{userCareer}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200/80">
                    <span>{userCampus}</span>
                  </span>
                </div>

                <h1
                  id="main-summary-heading"
                  {...getVoiceProps(`Bienvenido a Nexo360, ${userName}. ${userCareer}, ${userCampus}`)}
                  className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-900 leading-tight"
                >
                  Bienvenido a Nexo360, {userName}
                </h1>

                <p
                  {...getVoiceProps(
                    'Nexo360 es la plataforma oficial de orientación, trámites estudiantiles, accesibilidad PAEDIS y simulación académica de Duoc UC - Sede Alameda. Encuentra guías paso a paso, requisitos, simuladores prácticos y enlaces directos a tus servicios estudiantiles.'
                  )}
                  className="mt-2.5 text-neutral-600 text-sm sm:text-base leading-relaxed max-w-3xl font-normal"
                >
                  Nexo360 es la plataforma oficial de orientación, trámites estudiantiles, accesibilidad PAEDIS y simulación académica de Duoc UC - Sede Alameda. Encuentra guías paso a paso, requisitos, simuladores prácticos y enlaces directos a tus servicios estudiantiles.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-neutral-100">
                <SearchBar
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  resultsCount={searchAnalysis.categories.length}
                  matchedSectionsCount={searchAnalysis.matchedSubmodules.length}
                  matchedArticlesCount={searchAnalysis.matchedArticles.length}
                />
              </div>
            </section>

            {/* RESULTADOS DIRECTOS DE BÚSQUEDA */}
            {searchTerm.trim() !== '' && (
              <section
                aria-labelledby="direct-search-results-heading"
                className="bg-white rounded-2xl p-6 sm:p-7 border border-neutral-200/80 shadow-sm space-y-6 animate-fade-in-up"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
                  <div>
                    <h2
                      id="direct-search-results-heading"
                      {...getVoiceProps(`Resultados para ${searchTerm}`)}
                      className="text-lg sm:text-xl font-bold text-neutral-900"
                    >
                      Resultados para &ldquo;{searchTerm}&rdquo;
                    </h2>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Selecciona un trámite para ver sus instrucciones o ir al portal oficial.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    {...getVoiceProps('Cerrar búsqueda')}
                    className="min-h-[44px] px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-medium text-xs rounded-xl transition-colors self-start sm:self-center cursor-pointer"
                  >
                    Cerrar búsqueda
                  </button>
                </div>

                {/* Banner de Intencionalidad Específica: Certificados de Notas Vivo Duoc */}
                {searchAnalysis.isCertificadoNotasIntent && (
                  <div className="p-5 sm:p-6 bg-neutral-50/80 border border-neutral-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-navy text-white">
                        Acceso Oficial Directo • Vivo Duoc
                      </span>
                      <h3
                        {...getVoiceProps('Portal de Certificados y Concentración de Notas')}
                        className="text-base sm:text-lg font-bold text-neutral-900"
                      >
                        Portal de Certificados y Concentración de Notas
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-600 max-w-xl font-normal">
                        Descarga de forma inmediata tu Certificado de Notas, Concentración de Calificaciones y Alumno Regular con firma electrónica avanzada y código QR oficial.
                      </p>
                    </div>
                    <a
                      href="https://experienciavivo.duoc.cl/alumnos/certificados"
                      target="_blank"
                      rel="noopener noreferrer"
                      {...getVoiceProps('Ir a Certificados Vivo Duoc')}
                      className="min-h-[44px] px-5 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white font-medium text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs transition-transform active:scale-95 shrink-0"
                    >
                      <span>Ir a Certificados Vivo Duoc</span>
                      <ExternalLink className="w-4 h-4 text-brand-gold" aria-hidden="true" />
                    </a>
                  </div>
                )}

                {/* Banner de Intencionalidad Específica: Toma de Ramos Oficial Duoc UC */}
                {searchAnalysis.isTomaRamosIntent && (
                  <div className="p-5 sm:p-6 bg-neutral-50/80 border border-neutral-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-navy text-white">
                        Portal Oficial Directo • SICOL WebDynpro
                      </span>
                      <h3
                        {...getVoiceProps('Inscripción de Asignaturas, Toma de Ramos Sede Alameda')}
                        className="text-base sm:text-lg font-bold text-neutral-900"
                      >
                        Inscripción de Asignaturas (Toma de Ramos)
                      </h3>
                      <p className="text-xs sm:text-sm text-neutral-600 max-w-xl font-normal">
                        Accede directamente a la plataforma oficial de Duoc UC - Sede Alameda para inscribir tus asignaturas, revisar secciones y confirmar tu carga horaria del semestre.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <a
                        href="https://portalinsc.duoc.cl/webdynpro/dispatcher/duoc.com.student/sicol/StudentSicol?inportal=xi#"
                        target="_blank"
                        rel="noopener noreferrer"
                        {...getVoiceProps('Ir a Toma de Ramos Oficial')}
                        className="min-h-[44px] px-5 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white font-medium text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                      >
                        <span>Ir a Toma de Ramos Oficial</span>
                        <ExternalLink className="w-4 h-4 text-brand-gold" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveTab('toma-ramos')}
                        {...getVoiceProps('Practicar en Simulador de Toma de Ramos')}
                        className="min-h-[44px] px-4 py-2.5 bg-brand-gold hover:bg-amber-400 text-slate-950 font-medium text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                      >
                        <Package className="w-4 h-4 text-slate-950" aria-hidden="true" />
                        <span>Practicar en Simulador</span>
                      </button>
                    </div>
                  </div>
                )}

                {searchAnalysis.matchedSubmodules.length === 0 &&
                searchAnalysis.matchedArticles.length === 0 ? (
                  <div className="text-center py-8">
                    <HelpCircle
                      className="w-10 h-10 text-neutral-400 mx-auto mb-2.5"
                      aria-hidden="true"
                    />
                    <h3
                      {...getVoiceProps(`No encontramos resultados para ${searchTerm}`)}
                      className="text-base font-bold text-neutral-900"
                    >
                      No encontramos resultados para &ldquo;{searchTerm}&rdquo;
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                      Prueba con términos como &ldquo;inasistencia&rdquo;, &ldquo;gratuidad&rdquo;, &ldquo;TNE&rdquo;, &ldquo;congelar&rdquo; o &ldquo;MFA&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna 1: Trámites Directos */}
                    <div className="space-y-3">
                      <h3
                        {...getVoiceProps(`Trámites y apartados encontrados: ${searchAnalysis.matchedSubmodules.length}`)}
                        className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <Layers className="w-3.5 h-3.5 text-brand-navy" aria-hidden="true" />
                        <span>
                          Trámites y apartados ({searchAnalysis.matchedSubmodules.length})
                        </span>
                      </h3>
                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {searchAnalysis.matchedSubmodules.slice(0, 8).map(({ category, submodule }) => {
                          const subCardVoiceProps = getVoiceProps(
                            `${submodule.title}. ${submodule.intentGoal || submodule.description}`
                          );
                          return (
                            <div
                              key={`${category.id}-${submodule.id}`}
                              {...subCardVoiceProps}
                              onFocus={(event) => {
                                if (event.target === event.currentTarget) {
                                  subCardVoiceProps.onFocus(event);
                                }
                              }}
                              className="p-4 rounded-xl bg-neutral-50/80 hover:bg-white border border-neutral-200/80 hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
                            >
                              <div>
                                <span className="text-[11px] font-medium text-neutral-500">
                                  {category.title}
                                </span>
                                <h4 className="text-sm sm:text-base font-bold text-neutral-900 mt-0.5">
                                  {submodule.title}
                                </h4>
                                <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                                  {submodule.intentGoal || submodule.description}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-neutral-200/60">
                                <button
                                  type="button"
                                  onClick={() => handleOpenSubmodule(category, submodule)}
                                  {...getVoiceProps(`Ver pasos de ${submodule.title}`)}
                                  className="min-h-[44px] px-4 py-2 bg-brand-navy hover:bg-brand-navyDark text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <span>Ver pasos</span>
                                  <ArrowRight className="w-3.5 h-3.5 text-brand-gold" aria-hidden="true" />
                                </button>
                                <a
                                  href={submodule.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  {...getVoiceProps(`${submodule.actionLabel} para ${submodule.title}`)}
                                  className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-neutral-100 text-neutral-700 font-semibold text-xs rounded-xl border border-neutral-200/90 inline-flex items-center gap-1.5 transition-colors"
                                >
                                  <span>{submodule.actionLabel}</span>
                                  <ExternalLink className="w-3 h-3 text-neutral-400" aria-hidden="true" />
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Columna 2: Artículos Oficiales */}
                    <div className="space-y-3">
                      <h3
                        {...getVoiceProps(`Artículos de ayuda encontrados: ${searchAnalysis.matchedArticles.length}`)}
                        className="text-xs font-semibold text-neutral-500 uppercase tracking-wider flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-brand-navy" aria-hidden="true" />
                        <span>
                          Artículos de ayuda ({searchAnalysis.matchedArticles.length})
                        </span>
                      </h3>
                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {searchAnalysis.matchedArticles.slice(0, 8).map((art) => {
                          const artCardVoiceProps = getVoiceProps(
                            `${art.title}. ${art.summary || ''}`
                          );
                          return (
                            <div
                              key={art.id}
                              {...artCardVoiceProps}
                              onFocus={(event) => {
                                if (event.target === event.currentTarget) {
                                  artCardVoiceProps.onFocus(event);
                                }
                              }}
                              className="p-4 rounded-xl bg-neutral-50/80 hover:bg-white border border-neutral-200/80 hover:border-slate-300 transition-all space-y-2"
                            >
                              <span className="text-[11px] font-medium text-neutral-500 block">
                                {art.submodule.title}
                              </span>
                              <h4 className="text-sm font-bold text-neutral-900">
                                {art.title}
                              </h4>
                              <p className="text-xs text-neutral-600 leading-relaxed line-clamp-2">
                                {art.summary}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 pt-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenArticleDirectly(art.category, art.submodule, art)}
                                  {...getVoiceProps(`Leer guía: ${art.title}`)}
                                  className="min-h-[44px] px-4 py-2 bg-brand-navy hover:bg-brand-navyDark text-white font-semibold text-xs rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <BookOpen className="w-3.5 h-3.5 text-brand-gold" aria-hidden="true" />
                                  <span>Leer guía</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleOpenSubmodule(art.category, art.submodule)}
                                  {...getVoiceProps(`Ver trámite: ${art.submodule.title}`)}
                                  className="min-h-[44px] px-3.5 py-2 bg-white hover:bg-neutral-100 text-brand-navy font-semibold text-xs rounded-xl border border-neutral-200/90 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <span>Ver trámite</span>
                                  <ArrowRight className="w-3 h-3" aria-hidden="true" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}



            {/* CONSULTAS FRECUENTES (accesos directos limpios) */}
            <section aria-labelledby="intent-shortcuts-heading" className="space-y-4">
              <div>
                <h2
                  id="intent-shortcuts-heading"
                  {...getVoiceProps('Consultas rápidas. Elige una situación para ver directamente los requisitos y pasos a seguir.')}
                  className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight"
                >
                  Consultas rápidas
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  Elige una situación para ver directamente los requisitos y pasos a seguir.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {INTENT_SHORTCUTS.map((shortcut) => {
                  const IconComp = INTENT_ICON_MAP[shortcut.iconName] || Compass;
                  return (
                    <button
                      key={shortcut.id}
                      type="button"
                      onClick={() => handleSelectIntentShortcut(shortcut)}
                      aria-haspopup="dialog"
                      {...getVoiceProps(`${shortcut.question}. ${shortcut.subtitle}`)}
                      className="p-5 sm:p-6 rounded-3xl bg-white hover:bg-neutral-50/70 border border-neutral-200/90 hover:border-slate-300 shadow-xs hover:shadow-md text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 group active:scale-[0.99] cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3.5">
                          <div
                            className="w-10 h-10 rounded-2xl bg-neutral-100 text-brand-navy group-hover:bg-brand-navy group-hover:text-brand-gold flex items-center justify-center transition-colors duration-200 shrink-0"
                            aria-hidden="true"
                          >
                            <IconComp className="w-5 h-5" aria-hidden="true" />
                          </div>
                          <span className="text-[11px] font-semibold text-neutral-600 bg-neutral-100 px-2.5 py-0.5 rounded-full border border-neutral-200/80">
                            {shortcut.badge}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-neutral-900 group-hover:text-brand-navy transition-colors leading-snug">
                          {shortcut.question}
                        </h3>
                        <p className="text-xs text-neutral-600 mt-1.5 leading-relaxed font-normal">
                          {shortcut.subtitle}
                        </p>
                      </div>

                      <div className="pt-3.5 mt-3.5 border-t border-neutral-100 flex items-center justify-between text-xs font-semibold text-brand-navy">
                        <span>Ver pasos</span>
                        <ArrowRight
                          className="w-3.5 h-3.5 text-neutral-400 group-hover:text-brand-navy transition-transform duration-200 group-hover:translate-x-0.5"
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* CATEGORÍAS DEL CENTRO DE AYUDA */}
            <section aria-labelledby="modules-grid-heading" className="space-y-5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <h2
                    id="modules-grid-heading"
                    {...getVoiceProps('Categorías de ayuda. Explora por área o selecciona directamente uno de los trámites de cada tarjeta.')}
                    className="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight"
                  >
                    Categorías de ayuda
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    Explora por área o selecciona directamente uno de los trámites de cada tarjeta.
                  </p>
                </div>

                {/* Filtro limpio tipo píldora */}
                <div
                  role="group"
                  aria-label="Filtrar categorías por área"
                  className="flex flex-wrap gap-1.5"
                >
                  {PURPOSE_GROUPS.map((group) => {
                    const isSelected = purposeFilter === group.id;
                    return (
                      <button
                        key={group.id}
                        type="button"
                        onClick={() => {
                          setPurposeFilter(group.id);
                          announce(`Mostrando: ${group.label}`);
                        }}
                        aria-pressed={isSelected}
                        {...getVoiceProps(
                          `Filtrar categorías: ${group.label}${isSelected ? ', seleccionado' : ''}`
                        )}
                        className={`min-h-[44px] px-4 py-2 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? 'bg-brand-navy text-white border-brand-navy shadow-xs'
                            : 'bg-white hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 border-neutral-200'
                        }`}
                      >
                        {group.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {searchAnalysis.categories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-neutral-200 p-8 shadow-xs">
                  <HelpCircle
                    className="w-10 h-10 text-neutral-400 mx-auto mb-2.5"
                    aria-hidden="true"
                  />
                  <h3
                    {...getVoiceProps('No encontramos categorías con ese filtro')}
                    className="text-base font-bold text-neutral-900"
                  >
                    No encontramos categorías con ese filtro
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setPurposeFilter('all');
                    }}
                    {...getVoiceProps('Mostrar todas las categorías')}
                    className="mt-4 min-h-[40px] px-5 py-2 bg-brand-navy hover:bg-brand-navyDark text-white text-xs font-semibold rounded-xl transition-all"
                  >
                    Mostrar todas las categorías
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {searchAnalysis.categories.map((category) => (
                    <ModuleCard
                      key={category.id}
                      category={category}
                      onSelect={handleOpenCategory}
                      onSelectSubmodule={handleOpenSubmodule}
                    />
                  ))}
                </div>
              )}
            </section>

            {/* PREGUNTAS FRECUENTES */}
            <section
              aria-labelledby="faqs-heading"
              className="bg-white rounded-2xl p-6 sm:p-8 border border-neutral-200/80 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 pb-4">
                <div>
                  <h2
                    id="faqs-heading"
                    {...getVoiceProps('Preguntas frecuentes. Respuestas rápidas a las dudas más habituales del semestre.')}
                    className="text-lg sm:text-xl font-bold text-neutral-900"
                  >
                    Preguntas frecuentes
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                    Respuestas rápidas a las dudas más habituales del semestre en Sede Alameda.
                  </p>
                </div>
                <a
                  href="https://centroayuda.duoc.cl/hc/es-419"
                  target="_blank"
                  rel="noopener noreferrer"
                  {...getVoiceProps('Ir a centroayuda.duoc.cl')}
                  className="min-h-[44px] px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-xl border border-neutral-200/80 inline-flex items-center gap-1.5 self-start sm:self-center transition-colors"
                >
                  <span>Ir a centroayuda.duoc.cl</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-400" aria-hidden="true" />
                </a>
              </div>

              <div className="divide-y divide-slate-100">
                {OFFICIAL_DUOC_FAQS.map((faq, idx) => {
                  const isOpen = faqExpanded === idx;
                  const buttonId = `faq-btn-${idx}`;
                  const panelId = `faq-panel-${idx}`;

                  return (
                    <div key={faq.submoduleId} className="py-3.5">
                      <button
                        id={buttonId}
                        type="button"
                        onClick={() => setFaqExpanded(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        {...getVoiceProps(faq.q)}
                        className="w-full min-h-[44px] flex items-center justify-between text-left gap-4 font-semibold text-neutral-800 hover:text-brand-navy text-sm sm:text-base rounded-lg py-2 transition-colors cursor-pointer"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-brand-navy' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {isOpen && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className="mt-2.5 pl-4 border-l-2 border-brand-gold space-y-3 animate-fade-in"
                        >
                          <p
                            {...getVoiceProps(faq.a)}
                            className="text-xs sm:text-sm text-neutral-600 leading-relaxed max-w-[75ch]"
                          >
                            {faq.a}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const cat = DUOC_CATEGORIES.find((c) => c.id === faq.categoryId);
                                const sub = cat?.submodules.find((s) => s.id === faq.submoduleId);
                                const art = sub?.articles.find((a) => a.url === faq.articleUrl);
                                if (cat && sub && art) {
                                  handleOpenArticleDirectly(cat, sub, art);
                                } else if (cat && sub) {
                                  handleOpenSubmodule(cat, sub);
                                }
                              }}
                              {...getVoiceProps(`Leer guía en Nexo360: ${faq.q}`)}
                              className="min-h-[44px] px-4 py-2 bg-brand-navy hover:bg-brand-navyDark text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-brand-gold" aria-hidden="true" />
                              <span>Leer guía en Nexo360</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectIntentShortcut({
                                  categoryId: faq.categoryId,
                                  submoduleId: faq.submoduleId,
                                })
                              }
                              {...getVoiceProps('Ver pasos del trámite')}
                              className="min-h-[44px] px-4 py-2 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-semibold rounded-xl border border-neutral-200/80 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Ver pasos del trámite</span>
                              <ArrowRight className="w-3.5 h-3.5 text-brand-navy" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* Vistas secundarias con animación de entrada suave */}
        <Suspense
          fallback={
            <div
              role="status"
              aria-live="polite"
              className="p-12 text-center bg-white rounded-2xl border border-neutral-200/80 font-medium text-neutral-600"
            >
              Cargando sección...
            </div>
          }
        >
          {activeTab === 'toma-ramos' && (
            user && user.isRegisteredInDb === false ? (
              <div
                role="alert"
                aria-live="assertive"
                className="max-w-2xl mx-auto my-12 p-8 bg-white border border-slate-300 border-t-4 border-t-[#FFB81C] rounded-2xl shadow-sm text-center space-y-5 animate-fade-in-up"
              >
                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <ShieldAlert className="w-8 h-8" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h2
                    {...getVoiceProps('Acceso Restringido al Simulador')}
                    className="text-xl sm:text-2xl font-bold text-neutral-900"
                  >
                    Acceso Restringido al Simulador
                  </h2>
                  <p className="text-sm sm:text-base text-neutral-700 leading-relaxed font-medium">
                    Para acceder al Simulador de Toma de Ramos debes acercarte a coordinación o administración para registrar tu cuenta oficial en Nexo360.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('centro-ayuda')}
                    {...getVoiceProps('Volver al Centro de Ayuda')}
                    className="min-h-[44px] px-6 py-2.5 bg-brand-navy hover:bg-brand-navyDark text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
                  >
                    Volver al Centro de Ayuda
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-fade-in-up">
                <TomaRamosSimulator onExit={() => setActiveTab('centro-ayuda')} />
              </div>
            )
          )}

          {activeTab === 'biblioteca' && (
            <div className="animate-fade-in-up">
              <BibliotecaView />
            </div>
          )}

          {activeTab === 'vivo-duoc' && (
            <div className="animate-fade-in-up">
              <VivoDuocSummaryView />
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="animate-fade-in-up">
              <ServiciosDigitalesTicketsView />
            </div>
          )}

          {activeTab === 'perfil' && (
            <div className="animate-fade-in-up">
              <PerfilView />
            </div>
          )}

          {activeTab === 'admin-panel' && (
            <div className="w-full animate-fade-in">
              <AdminLayout onExit={() => setActiveTab('centro-ayuda')} />
            </div>
          )}
        </Suspense>
      </main>

      {/* Modal de Categorías y Trámites */}
      {selectedCategory && (
        <ModuleModal
          category={selectedCategory}
          initialSubmodule={selectedSubmodule}
          initialArticle={selectedArticle}
          onClose={() => {
            setSelectedCategory(null);
            setSelectedSubmodule(null);
            setSelectedArticle(null);
          }}
        />
      )}

      {/* Pie de Página Institucional Duoc UC - Sede Alameda */}
      <footer className="bg-white text-neutral-500 pt-8 pb-20 sm:pb-16 px-4 sm:px-6 lg:px-10 border-t border-neutral-200/90 mt-12 text-xs">
        <div className="w-full max-w-none flex flex-col md:flex-row items-start md:items-center justify-between gap-6 lg:pr-12">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="font-bold text-neutral-900 text-sm">
                Nexo360 • Centro de Ayuda y Servicios Duoc UC - Sede Alameda
              </span>
            </div>
            <p className="text-neutral-600 leading-relaxed font-normal">
              Plataforma de inducción y orientación accesible para la comunidad estudiantil de Sede Alameda.
              Gestión institucional conforme a la normativa de protección de datos (Ley N° 21.719).
            </p>
          </div>
          <div className="text-left md:text-right shrink-0 space-y-1">
            <p className="font-medium text-neutral-700">
              Contacto Sede Alameda:{' '}
              <a
                href="mailto:ayuda.alameda@duoc.cl"
                {...getVoiceProps('Enviar correo a ayuda.alameda@duoc.cl')}
                className="font-bold text-brand-navy hover:underline rounded px-1"
              >
                ayuda.alameda@duoc.cl
              </a>
            </p>
            <p className="text-[11px] text-neutral-500">
              Teléfonos Mesa de Servicios: <a href="tel:+56233844555" className="font-bold text-brand-navy hover:underline">+56 2 3384 4555</a> | WhatsApp: <a href="https://wa.me/56232394230" target="_blank" rel="noopener noreferrer" className="font-bold text-brand-navy hover:underline">+56 2 3239 4230</a> | Llamadas salientes: <span className="font-bold text-brand-navy">+56 600 088 2100</span>
            </p>
            <p className="text-[11px] text-neutral-500">
              Información oficial sincronizada con{' '}
              <a
                href="https://www.duoc.cl"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline text-brand-navy font-semibold"
              >
                www.duoc.cl
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
