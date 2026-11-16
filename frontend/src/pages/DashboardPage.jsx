import React, { useState, useEffect, useMemo, Suspense, lazy } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAccessibility } from '../context/AccessibilityContext';
import { DUOC_CATEGORIES, INTENT_SHORTCUTS } from '../data/duocModulesData';
import { VIVO_STUDENT_PROFILE } from '../data/vivoDuocData';
import { getStudentDisplayName } from '../utils/studentUtils';
import { ModuleCard } from '../components/dashboard/ModuleCard';
import { ModuleModal } from '../components/dashboard/ModuleModal';
import { SearchBar } from '../components/dashboard/SearchBar';
import { UnifiedNavbar } from '../components/common/UnifiedNavbar';
import { AccessibilityBar } from '../components/common/AccessibilityBar';

// Vistas complementarias con Code-Splitting (React.lazy)
const BibliotecaView = lazy(() =>
  import('../components/views/BibliotecaView').then((m) => ({ default: m.BibliotecaView }))
);
const ServiciosDigitalesTicketsView = lazy(() =>
  import('../components/views/ServiciosDigitalesTicketsView').then((m) => ({
    default: m.ServiciosDigitalesTicketsView,
  }))
);
const PerfilView = lazy(() =>
  import('../components/views/PerfilView').then((m) => ({ default: m.PerfilView }))
);
const VivoDuocSummaryView = lazy(() =>
  import('../components/views/VivoDuocSummaryView').then((m) => ({
    default: m.VivoDuocSummaryView,
  }))
);
const TomaRamosSimulator = lazy(() =>
  import('../components/simulation/TomaRamosSimulator').then((m) => ({
    default: m.TomaRamosSimulator,
  }))
);
const AdminPanelView = lazy(() =>
  import('../components/views/AdminPanelView').then((m) => ({ default: m.AdminPanelView }))
);

import {
  HelpCircle,
  Clock,
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
  X,
} from 'lucide-react';

const INTENT_ICON_MAP = {
  CheckSquare,
  HeartHandshake,
  Calendar,
  Laptop,
  CreditCard,
  Award,
  BookOpen,
  ShieldAlert,
};

const PURPOSE_GROUPS = [
  { id: 'all', label: 'Todas', ids: null },
  {
    id: 'academico',
    label: 'Vida académica y admisión',
    ids: ['vida-academica', 'admision-matricula', 'orientacion-nuevos', 'titulados'],
  },
  {
    id: 'inclusion',
    label: 'Inclusión y bienestar',
    ids: ['beneficios-estudiantiles', 'convivencia-inclusion'],
  },
  {
    id: 'finanzas-digital',
    label: 'Finanzas y soporte TI',
    ids: ['pagos-deudas', 'servicios-digitales', 'sostenedor'],
  },
];

export const DashboardPage = () => {
  const { user, updateUser } = useAuth();
  const { announce } = useAccessibility();
  const [activeTab, setActiveTab] = useState('centro-ayuda');

  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubmodule, setSelectedSubmodule] = useState(null);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [purposeFilter, setPurposeFilter] = useState('all');
  const [faqExpanded, setFaqExpanded] = useState(null);

  // Registrar uso del simulador para las métricas del panel de administración
  useEffect(() => {
    if (activeTab === 'toma-ramos') {
      api.logSimulatorUsage().catch(() => {});
    }
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

  const officialDuocFaqs = [
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
      a: 'La Ley N° 21.790 garantiza apoyos y flexibilidad académica a estudiantes que cuidan a personas con discapacidad, dependencia severa o niños/as. Acreditando tu condición en Duoc UC accedes a justificación de inasistencias por labores de cuidado, reprogramación de evaluaciones e inscripción prioritaria.',
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
      a: 'Con tu cuenta @duocuc.cl accedes a AVA Blackboard, Correo, WiFi de sede y Microsoft 365 gratuito. La verificación en dos pasos (MFA) se configura con Microsoft Authenticator; si cambiaste de teléfono o bloqueaste tu clave, puedes autogestionarla o abrir un ticket en Servicios Digitales.',
      categoryId: 'servicios-digitales',
      submoduleId: 'seguridad-autenticacion-mfa-clave',
      articleUrl:
        'https://centroayuda.duoc.cl/hc/es-419/articles/35999617868813-MFA-Verificaci%C3%B3n-en-dos-pasos',
    },
  ];

  // Funciones para búsqueda semántica e intencional (tolerante a tildes, plurales, typos y sinónimos)
  const normalizeSearchText = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();
  };

  const stemSpanishWord = (word) => {
    if (!word || word.length <= 3) return word;
    let w = word;
    if (w.endsWith('ces')) return w.slice(0, -3) + 'z';
    if (w.endsWith('es') && w.length > 4) return w.slice(0, -2);
    if (w.endsWith('s') && !w.endsWith('is') && !w.endsWith('us') && w.length > 3) return w.slice(0, -1);
    return w;
  };

  const levenshteinDist = (a, b) => {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;
    const row = [];
    for (let i = 0; i <= b.length; i++) row[i] = i;
    for (let i = 1; i <= a.length; i++) {
      let prev = i;
      for (let j = 1; j <= b.length; j++) {
        let val;
        if (a.charAt(i - 1) === b.charAt(j - 1)) {
          val = row[j - 1];
        } else {
          val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
        }
        row[j - 1] = prev;
        prev = val;
      }
      row[b.length] = prev;
    }
    return row[b.length];
  };

  const SPANISH_STOPWORDS = new Set([
    'de', 'la', 'el', 'en', 'un', 'una', 'los', 'las', 'y', 'o', 'a', 'al', 'del',
    'por', 'para', 'con', 'que', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'se', 'lo',
    'como', 'mas', 'pero', 'este', 'esta', 'estos', 'estas', 'es', 'son', 'fue', 'era'
  ]);

  const isFuzzyWordMatch = (targetWord, queryWord) => {
    if (!targetWord || !queryWord) return false;
    if (targetWord === queryWord) return true;
    if (queryWord.length >= 3 && targetWord.startsWith(queryWord)) return true;
    if (Math.abs(targetWord.length - queryWord.length) > 2) return false;
    const dist = levenshteinDist(targetWord, queryWord);
    if (queryWord.length <= 4) return dist === 0;
    if (queryWord.length <= 7) return dist <= 1;
    return dist <= 2;
  };

  const SEARCH_SYNONYMS = {
    certificado: ['certificado', 'certificados', 'constancia', 'constancias', 'concentracion', 'acreditacion', 'documento', 'documentos', 'papel'],
    nota: ['nota', 'notas', 'calificacion', 'calificaciones', 'promedio', 'promedios', 'rendimiento', 'evaluacion', 'evaluaciones', 'examen', 'examenes'],
    inasistencia: ['inasistencia', 'inasistencias', 'asistencia', 'asistencias', 'falta', 'faltas', 'justificar', 'justificacion', 'licencia', 'medica', 'medico', 'ri', 'reprobacion', 'reprobado', '70%'],
    ramo: ['ramo', 'ramos', 'asignatura', 'asignaturas', 'materia', 'materias', 'inscripcion', 'inscribir', 'toma', 'horario', 'horarios', 'seccion', 'secciones', 'simulador', 'sap', 'sicol', 'webdynpro'],
    inscribir: ['inscribir', 'inscripcion', 'toma', 'ramo', 'ramos', 'asignatura', 'asignaturas', 'sicol', 'seccion'],
    gratuidad: ['gratuidad', 'cae', 'beca', 'becas', 'beneficio', 'beneficios', 'arancel', 'aranceles', 'matricula', 'pago', 'pagos', 'cuota', 'cuotas', 'deuda', 'deudas', 'repactar'],
    mfa: ['mfa', 'clave', 'contrasena', 'authenticator', 'microsoft', 'correo', 'ava', 'blackboard', 'wifi', 'bloqueo'],
    tne: ['tne', 'pase', 'escolar', 'totem', 'bip', 'tarjeta', 'transporte', 'metro'],
    paedis: ['paedis', 'discapacidad', 'ajuste', 'ajustes', 'razonable', 'razonables', 'cuidador', 'cuidadora', 'cuidadores', 'ley 21790', 'inclusion', 'salud', 'mental', 'psicologo'],
  };

  const searchAnalysis = useMemo(() => {
    const normTerm = normalizeSearchText(searchTerm);
    const activeGroup = PURPOSE_GROUPS.find((g) => g.id === purposeFilter);

    const baseCategories = activeGroup?.ids
      ? DUOC_CATEGORIES.filter((c) => activeGroup.ids.includes(c.id))
      : DUOC_CATEGORIES;

    if (!normTerm) {
      return {
        categories: baseCategories,
        matchedSubmodules: [],
        matchedArticles: [],
        isCertificadoNotasIntent: false,
        isTomaRamosIntent: false,
      };
    }

    const queryTokens = normTerm.split(/\s+/).filter(Boolean);
    const queryStems = queryTokens.map(stemSpanishWord);

    // Detección semántica de 'certificado de notas'
    const isCertificadoNotasIntent =
      normTerm.includes('certificado de notas') ||
      normTerm.includes('certificados de notas') ||
      normTerm.includes('certificado de nota') ||
      normTerm.includes('certificados de nota') ||
      normTerm.includes('certificado notas') ||
      normTerm.includes('certificados notas') ||
      normTerm.includes('concentracion de notas') ||
      (queryStems.some((q) => q === 'certificado' || (SEARCH_SYNONYMS.certificado && SEARCH_SYNONYMS.certificado.includes(q))) &&
        queryStems.some((q) => q === 'nota' || (SEARCH_SYNONYMS.nota && SEARCH_SYNONYMS.nota.includes(q))));

    // Detección semántica de 'inscribir ramo' / 'toma de ramos'
    const isTomaRamosIntent =
      normTerm.includes('inscribir') ||
      normTerm.includes('toma de ramo') ||
      normTerm.includes('toma de ramos') ||
      normTerm.includes('inscripcion de asignatura') ||
      normTerm.includes('inscripcion de asignaturas') ||
      normTerm.includes('inscribir mi ramo') ||
      normTerm.includes('inscribir ramo') ||
      normTerm.includes('inscribir ramos') ||
      normTerm.includes('sicol') ||
      (queryTokens.some((q) => q === 'ramo' || q === 'ramos' || q === 'asignatura' || q === 'asignaturas') &&
        queryTokens.some((q) => q === 'inscribir' || q === 'toma' || q === 'tomar' || q === 'elegir'));

    const matchText = (rawText) => {
      if (!rawText) return 0;
      const normTarget = normalizeSearchText(rawText);
      if (normTarget.includes(normTerm)) return 10;
      const targetTokens = normTarget.split(/\s+/).filter(Boolean);
      const targetStems = targetTokens.map(stemSpanishWord);

      const activeQueryTokens = queryTokens.filter((t) => !SPANISH_STOPWORDS.has(t));
      const tokensToTest = activeQueryTokens.length > 0 ? activeQueryTokens : queryTokens;

      let matchedCount = 0;
      for (let i = 0; i < tokensToTest.length; i++) {
        const qTok = tokensToTest[i];
        const qStem = stemSpanishWord(qTok);

        if (targetStems.includes(qStem)) {
          matchedCount++;
          continue;
        }

        if (targetTokens.some((tTok) => !SPANISH_STOPWORDS.has(tTok) && isFuzzyWordMatch(tTok, qTok))) {
          matchedCount++;
          continue;
        }

        const synonymMatch = Object.entries(SEARCH_SYNONYMS).some(([root, syns]) => {
          const qMatchesRoot = qTok === root || qStem === root || syns.includes(qTok) || syns.includes(qStem);
          if (!qMatchesRoot) return false;
          return targetTokens.some((t) => syns.includes(t)) || targetStems.some((t) => syns.includes(t));
        });

        if (synonymMatch) {
          matchedCount++;
        }
      }

      const minRequired = tokensToTest.length === 1 ? 1 : Math.ceil(tokensToTest.length * 0.4);
      return matchedCount >= minRequired ? (matchedCount / tokensToTest.length) * 5 : 0;
    };

    const matchedSubmodules = [];
    const matchedArticles = [];
    const matchedCategoryIds = new Set();

    DUOC_CATEGORIES.forEach((category) => {
      const catScore =
        matchText(category.title) +
        matchText(category.description) +
        matchText(category.shortIntent);

      if (catScore > 0) {
        matchedCategoryIds.add(category.id);
      }

      category.submodules.forEach((sub) => {
        let subScore =
          matchText(sub.title) * 2 +
          matchText(sub.description) +
          matchText(sub.intentGoal) * 2 +
          matchText(sub.instructions) +
          matchText(sub.paedisTip) +
          (sub.intentTags || []).reduce((acc, t) => acc + matchText(t) * 2, 0);

        if (isCertificadoNotasIntent) {
          if (sub.id === 'certificados-alumnos-notas') subScore += 50;
          if (sub.id === 'notas-examenes') subScore += 30;
        }

        if (isTomaRamosIntent) {
          if (sub.id === 'inscripcion-asignaturas') subScore += 60;
        }

        let articleMatchedInSub = false;

        (sub.articles || []).forEach((art) => {
          let artScore = matchText(art.title) * 2 + matchText(art.summary);
          if (isCertificadoNotasIntent && (art.url || '').includes('certificados')) {
            artScore += 30;
          }
          if (isTomaRamosIntent && (art.title || '').toLowerCase().includes('inscripci')) {
            artScore += 30;
          }

          if (artScore > 0) {
            articleMatchedInSub = true;
            matchedArticles.push({
              ...art,
              category,
              submodule: sub,
              score: artScore,
            });
          }
        });

        if (subScore > 0 || articleMatchedInSub) {
          matchedCategoryIds.add(category.id);
          matchedSubmodules.push({
            category,
            submodule: sub,
            score: subScore,
          });
        }
      });
    });

    matchedSubmodules.sort((a, b) => b.score - a.score);
    matchedArticles.sort((a, b) => b.score - a.score);

    // Filtrar ruido: si hay coincidencias de alta intencionalidad o score alto, priorizar sólo trámites y artículos relevantes
    const topSubScore = matchedSubmodules[0]?.score || 0;
    const meaningfulSubmodules =
      topSubScore >= 25
        ? matchedSubmodules.filter((m) => m.score >= Math.max(15, topSubScore * 0.35))
        : matchedSubmodules;

    const topArtScore = matchedArticles[0]?.score || 0;
    const meaningfulArticles =
      topArtScore >= 20
        ? matchedArticles.filter((a) => a.score >= Math.max(10, topArtScore * 0.35))
        : matchedArticles;

    const meaningfulCategoryIds = new Set([
      ...meaningfulSubmodules.map((m) => m.category.id),
      ...meaningfulArticles.map((a) => a.category.id),
    ]);

    const filteredCategories = DUOC_CATEGORIES.filter((c) => meaningfulCategoryIds.has(c.id));

    return {
      categories: filteredCategories,
      matchedSubmodules: meaningfulSubmodules,
      matchedArticles: meaningfulArticles,
      isCertificadoNotasIntent,
      isTomaRamosIntent,
    };
  }, [searchTerm, purposeFilter]);

  const isCristian = (user?.email || '').toLowerCase().includes('guzman');
  const userName = user?.fullName || user?.nombre || getStudentDisplayName(user);
  const userCareer = user?.career || user?.carrera || (isCristian ? VIVO_STUDENT_PROFILE.carrera : 'Ingeniería en Informática');
  const userCampus = user?.campus || user?.sede || (isCristian ? VIVO_STUDENT_PROFILE.sede : 'Sede Alameda');

  return (
    <div className="min-h-screen flex flex-col bg-[#EEF2F6] text-slate-900 transition-colors">
      {/* 1. Barra de Preferencias de Lectura y Visualización (Limpia y Amigable) */}
      <AccessibilityBar />

      {/* 2. Navegación Principal Luminosa */}
      <UnifiedNavbar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 3. Contenido Principal */}
      <main
        id="main-content"
        className="flex-1 mx-auto py-6 sm:py-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8"
      >
        {activeTab === 'centro-ayuda' && (
          <div className="space-y-8 animate-fade-in-up">
            {/* BIENVENIDA + BUSCADOR INTEGRADO (Baja sobrecarga sensorial, diseño limpio y humano) */}
            <section
              aria-labelledby="main-summary-heading"
              className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200 shadow-sm sm:shadow-md ring-1 ring-slate-900/[0.03]"
            >
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500 mb-2">
                  <span className="font-semibold text-slate-700">{userCareer}</span>
                  <span aria-hidden="true">•</span>
                  <span className="font-semibold text-slate-700">{userCampus}</span>
                </div>

                <h1
                  id="main-summary-heading"
                  className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900"
                >
                  Hola, {userName}
                </h1>

                <p className="mt-2 text-slate-600 text-sm sm:text-base leading-relaxed">
                  ¿En qué te podemos ayudar hoy? Encuentra guías paso a paso, requisitos y enlaces directos a tus trámites estudiantiles.
                </p>
              </div>

              <div className="mt-6 pt-5 border-t border-slate-100">
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
                className="bg-white rounded-2xl p-6 sm:p-7 border border-slate-200/80 shadow-sm space-y-6 animate-fade-in-up"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                  <div>
                    <h2
                      id="direct-search-results-heading"
                      className="text-lg sm:text-xl font-bold text-slate-900"
                    >
                      Resultados para &ldquo;{searchTerm}&rdquo;
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Selecciona un trámite para ver sus instrucciones o ir al portal oficial.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="min-h-[38px] px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors self-start sm:self-center"
                  >
                    Cerrar búsqueda
                  </button>
                </div>

                {/* Banner de Intencionalidad Específica: Certificados de Notas Vivo Duoc */}
                {searchAnalysis.isCertificadoNotasIntent && (
                  <div className="p-5 sm:p-6 bg-slate-50/80 border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#002B49] text-white">
                        Acceso Oficial Directo • Vivo Duoc
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Portal de Certificados y Concentración de Notas
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-normal">
                        Descarga de forma inmediata tu Certificado de Notas, Concentración de Calificaciones y Alumno Regular con firma electrónica avanzada y código QR oficial.
                      </p>
                    </div>
                    <a
                      href="https://experienciavivo.duoc.cl/alumnos/certificados"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-medium text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs transition-transform active:scale-95 shrink-0"
                    >
                      <span>Ir a Certificados Vivo Duoc</span>
                      <ExternalLink className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                    </a>
                  </div>
                )}

                {/* Banner de Intencionalidad Específica: Toma de Ramos Oficial Duoc UC */}
                {searchAnalysis.isTomaRamosIntent && (
                  <div className="p-5 sm:p-6 bg-slate-50/80 border border-slate-200 rounded-2xl shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#002B49] text-white">
                        Portal Oficial Directo • SICOL WebDynpro
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900">
                        Inscripción de Asignaturas (Toma de Ramos)
                      </h3>
                      <p className="text-xs sm:text-sm text-slate-600 max-w-xl font-normal">
                        Accede directamente a la plataforma oficial de Duoc UC para inscribir tus asignaturas, revisar secciones y confirmar tu carga horaria del semestre.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                      <a
                        href="https://portalinsc.duoc.cl/webdynpro/dispatcher/duoc.com.student/sicol/StudentSicol?inportal=xi#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-medium text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs transition-transform active:scale-95"
                      >
                        <span>Ir a Toma de Ramos Oficial</span>
                        <ExternalLink className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
                      </a>
                      <button
                        type="button"
                        onClick={() => setActiveTab('toma-ramos')}
                        className="min-h-[44px] px-4 py-2.5 bg-[#FFB81C] hover:bg-amber-400 text-slate-950 font-medium text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs transition-transform active:scale-95"
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
                      className="w-10 h-10 text-slate-400 mx-auto mb-2.5"
                      aria-hidden="true"
                    />
                    <h3 className="text-base font-bold text-slate-900">
                      No encontramos resultados para &ldquo;{searchTerm}&rdquo;
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                      Prueba con términos como &ldquo;inasistencia&rdquo;, &ldquo;gratuidad&rdquo;, &ldquo;TNE&rdquo;, &ldquo;congelar&rdquo; o &ldquo;MFA&rdquo;.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna 1: Trámites Directos */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
                        <span>
                          Trámites y apartados ({searchAnalysis.matchedSubmodules.length})
                        </span>
                      </h3>
                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {searchAnalysis.matchedSubmodules.slice(0, 8).map(({ category, submodule }) => (
                          <div
                            key={`${category.id}-${submodule.id}`}
                            className="p-4 rounded-xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 transition-all flex flex-col justify-between gap-3"
                          >
                            <div>
                              <span className="text-[11px] font-medium text-slate-500">
                                {category.title}
                              </span>
                              <h4 className="text-sm sm:text-base font-bold text-slate-900 mt-0.5">
                                {submodule.title}
                              </h4>
                              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                                {submodule.intentGoal || submodule.description}
                              </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                              <button
                                type="button"
                                onClick={() => handleOpenSubmodule(category, submodule)}
                                className="min-h-[36px] px-3.5 py-1.5 bg-[#002B49] hover:bg-[#001D33] text-white font-semibold text-xs rounded-lg flex items-center gap-1.5 transition-colors"
                              >
                                <span>Ver pasos</span>
                                <ArrowRight className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
                              </button>
                              <a
                                href={submodule.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="min-h-[36px] px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200/90 inline-flex items-center gap-1.5 transition-colors"
                              >
                                <span>{submodule.actionLabel}</span>
                                <ExternalLink className="w-3 h-3 text-slate-400" aria-hidden="true" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Columna 2: Artículos Oficiales */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
                        <span>
                          Artículos de ayuda ({searchAnalysis.matchedArticles.length})
                        </span>
                      </h3>
                      <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                        {searchAnalysis.matchedArticles.slice(0, 8).map((art) => (
                          <div
                            key={art.id}
                            className="p-4 rounded-xl bg-slate-50/80 hover:bg-white border border-slate-200/80 hover:border-slate-300 transition-all space-y-2"
                          >
                            <span className="text-[11px] font-medium text-slate-500 block">
                              {art.submodule.title}
                            </span>
                            <h4 className="text-sm font-bold text-slate-900">
                              {art.title}
                            </h4>
                            <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                              {art.summary}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenArticleDirectly(art.category, art.submodule, art)}
                                className="min-h-[34px] px-3.5 py-1 bg-[#002B49] hover:bg-[#001D33] text-white font-semibold text-xs rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <BookOpen className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
                                <span>Leer guía</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenSubmodule(art.category, art.submodule)}
                                className="min-h-[34px] px-3 py-1 bg-white hover:bg-slate-100 text-[#002B49] font-semibold text-xs rounded-lg border border-slate-200/90 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>Ver trámite</span>
                                <ArrowRight className="w-3 h-3" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}



            {/* CONSULTAS FRECUENTES (8 accesos directos limpios) */}
            <section aria-labelledby="intent-shortcuts-heading" className="space-y-4">
              <div>
                <h2
                  id="intent-shortcuts-heading"
                  className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
                >
                  Consultas rápidas
                </h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  Elige una situación para ver directamente los requisitos y pasos a seguir.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {INTENT_SHORTCUTS.map((shortcut) => {
                  const IconComp = INTENT_ICON_MAP[shortcut.iconName] || Compass;
                  return (
                    <button
                      key={shortcut.id}
                      type="button"
                      onClick={() => handleSelectIntentShortcut(shortcut)}
                      aria-haspopup="dialog"
                      className="p-4 sm:p-5 rounded-2xl bg-white hover:bg-slate-50/50 border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-md text-left flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 group active:scale-[0.99]"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div
                            className="w-9 h-9 rounded-xl bg-slate-100 text-[#002B49] group-hover:bg-[#002B49] group-hover:text-[#FFB81C] flex items-center justify-center transition-colors duration-200 shrink-0"
                            aria-hidden="true"
                          >
                            <IconComp className="w-4 h-4" aria-hidden="true" />
                          </div>
                          <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full border border-slate-200/60">
                            {shortcut.badge}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 group-hover:text-[#002B49] transition-colors leading-snug">
                          {shortcut.question}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          {shortcut.subtitle}
                        </p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-[#002B49]">
                        <span>Ver pasos</span>
                        <ArrowRight
                          className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#002B49] transition-transform duration-200 group-hover:translate-x-0.5"
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
                    className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight"
                  >
                    Categorías de ayuda
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
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
                        className={`min-h-[36px] px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                            : 'bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200'
                        }`}
                      >
                        {group.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {searchAnalysis.categories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-8 shadow-xs">
                  <HelpCircle
                    className="w-10 h-10 text-slate-400 mx-auto mb-2.5"
                    aria-hidden="true"
                  />
                  <h3 className="text-base font-bold text-slate-900">
                    No encontramos categorías con ese filtro
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchTerm('');
                      setPurposeFilter('all');
                    }}
                    className="mt-4 min-h-[40px] px-5 py-2 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-semibold rounded-xl transition-all"
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
              className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 id="faqs-heading" className="text-lg sm:text-xl font-bold text-slate-900">
                    Preguntas frecuentes
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Respuestas rápidas a las dudas más habituales del semestre.
                  </p>
                </div>
                <a
                  href="https://centroayuda.duoc.cl/hc/es-419"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[38px] px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/80 inline-flex items-center gap-1.5 self-start sm:self-center transition-colors"
                >
                  <span>Ir a centroayuda.duoc.cl</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                </a>
              </div>

              <div className="divide-y divide-slate-100">
                {officialDuocFaqs.map((faq, idx) => {
                  const isOpen = faqExpanded === idx;
                  const buttonId = `faq-btn-${idx}`;
                  const panelId = `faq-panel-${idx}`;

                  return (
                    <div key={idx} className="py-3.5">
                      <button
                        id={buttonId}
                        type="button"
                        onClick={() => setFaqExpanded(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="w-full min-h-[42px] flex items-center justify-between text-left gap-4 font-semibold text-slate-800 hover:text-[#002B49] text-sm sm:text-base rounded-lg py-1.5 transition-colors"
                      >
                        <span>{faq.q}</span>
                        <ChevronDown
                          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                            isOpen ? 'rotate-180 text-[#002B49]' : ''
                          }`}
                          aria-hidden="true"
                        />
                      </button>

                      {isOpen && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className="mt-2.5 pl-4 border-l-2 border-[#FFB81C] space-y-3 animate-fade-in"
                        >
                          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-[75ch]">
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
                              className="min-h-[36px] px-3.5 py-1.5 bg-[#002B49] hover:bg-[#001D33] text-white text-xs font-semibold rounded-lg inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <BookOpen className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
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
                              className="min-h-[36px] px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200/80 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <span>Ver pasos del trámite</span>
                              <ArrowRight className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
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
              className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 font-medium text-slate-600"
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
                className="max-w-2xl mx-auto my-12 p-8 bg-white border-2 border-amber-300 rounded-3xl shadow-lg text-center space-y-5 animate-fade-in-up"
              >
                <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                  <ShieldAlert className="w-8 h-8" aria-hidden="true" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                    Acceso Restringido al Simulador
                  </h2>
                  <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
                    Para acceder al Simulador de Toma de Ramos debes acercarte a coordinación o administración para registrar tu cuenta oficial en Nexo360.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('centro-ayuda')}
                    className="min-h-[44px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white font-bold text-sm rounded-xl transition-all shadow-xs cursor-pointer"
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
              <AdminPanelView />
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

      {/* Pie de Página Limpio */}
      <footer className="bg-white text-slate-500 py-6 px-4 border-t border-slate-200/80 mt-12 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800">
              Nexo360 • Centro de Ayuda y Servicios Duoc UC
            </p>
            <p className="text-slate-500 mt-0.5">
              Información oficial sincronizada con centroayuda.duoc.cl • Sede Alameda
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p>
              Contacto sede:{' '}
              <a
                href="mailto:ayuda.alameda@duoc.cl"
                className="font-semibold text-[#002B49] hover:underline rounded px-1"
              >
                ayuda.alameda@duoc.cl
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
