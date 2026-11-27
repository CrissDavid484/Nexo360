import React, { useState } from 'react';
import {
  GraduationCap,
  Calendar,
  CheckSquare,
  FileSpreadsheet,
  Compass,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAcademicDashboard, ACADEMIC_STATUS } from '../../../hooks/useAcademicDashboard';
import { AcademicOverview } from './AcademicOverview';
import { AcademicAttendance } from './AcademicAttendance';
import { AcademicGrades } from './AcademicGrades';
import { AcademicSchedule } from './AcademicSchedule';
import { AcademicProgress } from './AcademicProgress';

const SUB_TABS = [
  { id: 'overview', label: 'Resumen', icon: GraduationCap },
  { id: 'attendance', label: 'Asistencias', icon: CheckSquare },
  { id: 'grades', label: 'Calificaciones', icon: FileSpreadsheet },
  { id: 'schedule', label: 'Horario', icon: Calendar },
  { id: 'progress', label: 'Progreso Malla', icon: Compass },
];

/**
 * AcademicDashboardSection (Bloque B)
 * Contenedor principal de la información académica oficial proveniente de Experiencia Vivo Duoc UC.
 *
 * Cumplimiento WCAG 2.2 AA:
 * - Sistema de pestañas con role="tablist", role="tab", aria-selected, aria-controls
 * - Alertas y estados con role="status" / role="alert" y aria-live
 * - Tamaños táctiles mínimos de 44x44px
 * - Banners informativos para todos los estados (completo, parcial, no configurado, no autorizado, no disponible, simulado)
 */
export const AcademicDashboardSection = ({
  onNavigateToSat = null,
  onNavigateToManual = null,
  onNavigateToHelpCenter = null,
  dashboardOverride = null,
  initialTab = 'overview',
}) => {
  const [activeSubTab, setActiveSubTab] = useState(initialTab);

  // Si se provee un override (para testing o inyección directa), usarlo; de lo contrario invocar hook
  const hookResult = useAcademicDashboard({
    autoFetch: !dashboardOverride,
    initialData: dashboardOverride,
  });

  const {
    loading,
    status,
    source,
    isSimulated,
    data,
    sections,
    sat,
    predictiveRisk,
    meta,
    error,
    reload,
  } = dashboardOverride ? { ...hookResult, ...dashboardOverride, loading: false } : hookResult;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Reciente';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-CL', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <section
      role="region"
      aria-label="Panel de Información Académica Oficial Vivo Duoc"
      className="space-y-6"
    >
      {/* 1. Encabezado principal y metadata institucional */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-brand-navy text-white">
                <GraduationCap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>Vivo Duoc UC</span>
              </span>

              {isSimulated ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-900 border border-amber-300">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-700" aria-hidden="true" />
                  Modo Simulación / Demo
                </span>
              ) : !isSimulated && (status === 'complete' || status === 'partial') && source === 'vivo_duoc' ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" aria-hidden="true" />
                  Conexión Institucional Oficial
                </span>
              ) : status === 'not_configured' ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800 border border-slate-300">
                  <AlertCircle className="w-3 h-3 mr-1 text-slate-600" aria-hidden="true" />
                  Integración No Habilitada
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-800 border border-rose-200">
                  <AlertCircle className="w-3 h-3 mr-1 text-rose-600" aria-hidden="true" />
                  Sin Conexión Académica
                </span>
              )}

              {meta?.cached && (
                <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  Caché optimizada
                </span>
              )}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-[#002B49] mt-2">
              Panel Académico Integrado
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
              Consulta en tiempo real tu matrícula, asistencias oficiales, calificaciones parciales y horario semanal directamente desde los sistemas de Duoc UC.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="text-left md:text-right text-xs text-slate-500 hidden sm:block">
              <span className="block font-medium text-slate-700">
                Origen: {source === 'vivo_duoc' ? 'API Oficial Duoc' : source === 'mock_demo' ? 'Simulador Institucional' : 'Sin conexión'}
              </span>
              <span>Sincronizado: {formatDate(meta?.generatedAt)}</span>
            </div>

            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="inline-flex items-center justify-center p-2.5 min-h-[44px] min-w-[44px] rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
              aria-label="Actualizar información académica"
              title="Actualizar información"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-brand-navy' : ''}`} aria-hidden="true" />
            </button>

            {typeof onNavigateToHelpCenter === 'function' && (
              <button
                type="button"
                onClick={onNavigateToHelpCenter}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                aria-label="Ir al Centro de Ayuda institucional"
                title="Centro de Ayuda"
              >
                <HelpCircle className="w-4 h-4 text-brand-navy" aria-hidden="true" />
                <span className="hidden sm:inline">Centro de Ayuda</span>
              </button>
            )}

            {typeof onNavigateToManual === 'function' && (
              <button
                type="button"
                onClick={onNavigateToManual}
                className="inline-flex items-center gap-1.5 px-3 py-2 min-h-[44px] rounded-xl text-xs font-semibold text-brand-navy hover:bg-slate-100 transition-colors cursor-pointer border border-slate-200"
                aria-label="Ver manual y guía de servicios de Experiencia Vivo Duoc"
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Guía de Servicios</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Banner de estado contextual según respuesta del backend */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          {!loading && isSimulated && (
            <div
              role="alert"
              className="p-3.5 mb-3 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-amber-900"
            >
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="font-bold">Modo de Demostración / Simulación Activo:</strong> Los datos visualizados en este panel corresponden a un entorno de pruebas y no representan registros oficiales de Vivo Duoc UC.
              </div>
            </div>
          )}

          {loading && (
            <div
              role="status"
              aria-live="polite"
              className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center gap-3 text-xs sm:text-sm text-blue-900"
            >
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600 shrink-0" aria-hidden="true" />
              <span>Sincronizando información académica con Experiencia Vivo Duoc...</span>
            </div>
          )}

          {!loading && status === ACADEMIC_STATUS.PARTIAL && (
            <div
              role="alert"
              className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-amber-900"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="font-bold">Información parcial disponible:</strong> Algunas secciones presentaron intermitencia temporal en el servidor institucional. Las secciones disponibles se muestran a continuación.
              </div>
            </div>
          )}

          {!loading && status === ACADEMIC_STATUS.NOT_CONFIGURED && (
            <div
              role="status"
              className="p-4 bg-slate-100/90 border border-slate-200 rounded-xl flex items-start gap-3 text-xs sm:text-sm text-slate-700"
            >
              <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" aria-hidden="true" />
              <div>
                <strong className="font-bold text-slate-900">Integración en preparación:</strong> La conexión en vivo con Experiencia Vivo Duoc no está habilitada para este entorno o sede. Puedes consultar el catálogo oficial o los simuladores disponibles.
              </div>
            </div>
          )}

          {!loading && status === ACADEMIC_STATUS.UNAUTHORIZED && (
            <div
              role="alert"
              className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs sm:text-sm text-rose-900"
            >
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="font-bold block text-sm">Sesión de Vivo Duoc expirada</strong>
                  <span>Tu token institucional ha caducado. Vuelve a iniciar sesión para renovar tus credenciales seguras.</span>
                </div>
              </div>

              <button
                type="button"
                onClick={reload}
                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors"
              >
                Reconectar
              </button>
            </div>
          )}

          {!loading && status === ACADEMIC_STATUS.UNAVAILABLE && (
            <div
              role="alert"
              className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl flex items-start justify-between gap-3 text-xs sm:text-sm text-rose-900"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <strong className="font-bold block text-sm">Servicio no disponible temporalmente</strong>
                  <span>{error || 'No se pudo contactar al servidor de Experiencia Vivo Duoc. Por favor intenta más tarde.'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={reload}
                className="px-3 py-1.5 bg-white border border-rose-300 hover:bg-rose-100 text-rose-800 rounded-lg text-xs font-semibold shrink-0 cursor-pointer transition-colors"
              >
                Reintentar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Barra de Navegación por Pestañas (WCAG 2.2 AA Tablist) */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-2 shadow-sm">
        <div
          role="tablist"
          aria-label="Pestañas de información académica"
          className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0"
        >
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeSubTab === tab.id;

            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-selected={isSelected}
                aria-controls={`panel-${tab.id}`}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => setActiveSubTab(tab.id)}
                className={`min-h-[44px] min-w-[44px] px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                  isSelected
                    ? 'bg-brand-navy text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-amber-400' : 'text-slate-500'}`} aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Paneles de Contenido (WCAG 2.2 AA Tabpanels) */}
      <div className="space-y-6">
        {/* Panel Resumen */}
        <div
          role="tabpanel"
          id="panel-overview"
          aria-labelledby="tab-overview"
          hidden={activeSubTab !== 'overview'}
          className={activeSubTab === 'overview' ? 'animate-fade-in' : 'hidden'}
        >
          <AcademicOverview
            matricula={data?.matricula}
            perfilAcademico={data?.perfilAcademico}
            infoPersona={data?.infoPersona}
            isSimulated={isSimulated}
            source={source}
          />
        </div>

        {/* Panel Asistencias */}
        <div
          role="tabpanel"
          id="panel-attendance"
          aria-labelledby="tab-attendance"
          hidden={activeSubTab !== 'attendance'}
          className={activeSubTab === 'attendance' ? 'animate-fade-in' : 'hidden'}
        >
          <AcademicAttendance
            asistencias={data?.asistencias || []}
            onNavigateToSat={onNavigateToSat}
            onNavigateToHelpCenter={onNavigateToHelpCenter}
          />
        </div>

        {/* Panel Calificaciones */}
        <div
          role="tabpanel"
          id="panel-grades"
          aria-labelledby="tab-grades"
          hidden={activeSubTab !== 'grades'}
          className={activeSubTab === 'grades' ? 'animate-fade-in' : 'hidden'}
        >
          <AcademicGrades notas={data?.notas || []} />
        </div>

        {/* Panel Horario */}
        <div
          role="tabpanel"
          id="panel-schedule"
          aria-labelledby="tab-schedule"
          hidden={activeSubTab !== 'schedule'}
          className={activeSubTab === 'schedule' ? 'animate-fade-in' : 'hidden'}
        >
          <AcademicSchedule horario={data?.horario || []} />
        </div>

        {/* Panel Progreso */}
        <div
          role="tabpanel"
          id="panel-progress"
          aria-labelledby="tab-progress"
          hidden={activeSubTab !== 'progress'}
          className={activeSubTab === 'progress' ? 'animate-fade-in' : 'hidden'}
        >
          <AcademicProgress perfilAcademico={data?.perfilAcademico} />
        </div>
      </div>
    </section>
  );
};
export default AcademicDashboardSection;
