import React, { useState, useEffect, useCallback } from 'react';
import { ScrollText, Search, X, Loader2, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

const PAGE_SIZE = 25;
const SEARCH_DEBOUNCE_MS = 300;

const ACTION_LABELS = {
  login: 'Inicio de sesión',
  password_changed: 'Cambio de contraseña',
  password_reset_requested: 'Recuperación de contraseña solicitada',
  password_reset_completed: 'Recuperación de contraseña completada',
  used_simulator_toma_ramos: 'Uso del simulador de Toma de Ramos',
  saved_toma_ramos: 'Toma de Ramos guardada',
  student_registered_by_admin: 'Usuario registrado por administrador',
  student_updated_by_admin: 'Usuario actualizado por administrador',
  student_deleted_by_admin: 'Usuario eliminado por administrador',
  career_created: 'Carrera creada',
  career_deleted: 'Carrera eliminada',
  sede_created: 'Sede creada',
  sede_deleted: 'Sede eliminada',
  welcome_email_sent: 'Correo de bienvenida enviado',
  status_changed_by_admin: 'Estado académico modificado',
  sat_weekly_cut_simulated: 'Corte semanal SAT simulado',
  sat_intervention_updated: 'Intervención SAT actualizada',
  paedis_case_updated: 'Expediente PAEDIS actualizado',
  paedis_docente_notified: 'Ficha Docente PAEDIS emitida',
  IMPORT: 'Importación de catálogo',
  SEED: 'Restauración de catálogo',
  CLEAR: 'Vaciado de catálogo',
};

// Solo claves escalares no sensibles se muestran del metadata (Ley 21.719).
const SAFE_METADATA_KEYS = [
  'count',
  'total',
  'inserted',
  'imported',
  'seccionesImportadas',
  'seccionesDiurnas',
  'seccionesVespertinas',
  'seccionesAmbiguas',
  'removedCount',
  'replace',
  'dryRun',
  'sede',
  'jornada',
  'newStatus',
  'status',
];

const humanizeAction = (code) =>
  ACTION_LABELS[code] || String(code || 'Acción desconocida').replace(/_/g, ' ');

const formatDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? 'Fecha no disponible'
    : d.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'medium' });
};

const summarizeMetadata = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return '';
  return SAFE_METADATA_KEYS.filter((k) => ['string', 'number', 'boolean'].includes(typeof metadata[k]))
    .map((k) => `${k}: ${String(metadata[k]).slice(0, 40)}`)
    .join(' · ');
};

const ActionCell = ({ log }) => (
  <>
    <span className="block font-bold text-slate-900">{humanizeAction(log.action)}</span>
    <code className="text-[11px] text-slate-600 break-all">{log.action || '—'}</code>
  </>
);

const ActorCell = ({ log }) => (
  <>
    <span className="block font-semibold text-slate-900">{log.userName || 'Sistema'}</span>
    <span className="block text-xs text-slate-700 break-all">{log.userEmail || 'Sin correo'}</span>
    {log.userRole && (
      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
        {log.userRole}
      </span>
    )}
  </>
);

const DetailsCell = ({ log }) => {
  const summary = summarizeMetadata(log.metadata);
  return (
    <>
      <span className="block break-words">{log.details || 'Sin detalles'}</span>
      {summary && <span className="block mt-1 text-[11px] text-slate-600 break-words">{summary}</span>}
    </>
  );
};

const FIELD_FOCUS =
  'min-h-[44px] px-3 rounded-xl border border-slate-300 bg-white text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]';
const BTN_FOCUS =
  'min-h-[44px] px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 border border-slate-300 bg-white text-slate-800 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]';

export const AuditLogSection = () => {
  const { announce, getVoiceProps } = useAccessibility();
  const [action, setAction] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ logs: [], total: 0, actions: [] });
  const [status, setStatus] = useState('loading');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setQuery(searchInput.trim());
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    api
      .getAdminActivityLogs({ action, q: query, page, limit: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        const logs = Array.isArray(res?.logs) ? res.logs : [];
        const total = Number.isFinite(res?.total) ? res.total : logs.length;
        setData({ logs, total, actions: Array.isArray(res?.actions) ? res.actions : [] });
        setStatus('ready');
        announce(`${total} registros de auditoría encontrados.`, 'polite');
      })
      .catch(() => {
        if (cancelled) return;
        setStatus('error');
        announce('No se pudo cargar la bitácora de auditoría.', 'assertive');
      });
    return () => {
      cancelled = true;
    };
  }, [action, query, page, reloadKey, announce]);

  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const hasFilters = Boolean(action || searchInput);

  const clearFilters = useCallback(() => {
    setAction('');
    setSearchInput('');
    setQuery('');
    setPage(1);
  }, []);

  return (
    <section aria-labelledby="audit-title" className="space-y-4">
      <header className="flex items-center gap-2">
        <ScrollText className="w-5 h-5 text-[#002B49]" aria-hidden="true" />
        <h2 id="audit-title" className="text-lg font-black text-[#002B49]">
          Auditoría de actividad
        </h2>
      </header>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1fr_2fr_auto] items-end p-4 rounded-2xl border border-slate-200 bg-white"
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="audit-action" className="text-xs font-bold text-slate-800">
            Tipo de acción
          </label>
          <select
            id="audit-action"
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setPage(1);
            }}
            {...getVoiceProps('Filtrar por tipo de acción')}
            className={FIELD_FOCUS}
          >
            <option value="">Todas</option>
            {data.actions.map((a) => (
              <option key={a} value={a}>
                {humanizeAction(a)} ({a})
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="audit-search" className="text-xs font-bold text-slate-800">
            Buscar por usuario, correo o detalle
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              id="audit-search"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              {...getVoiceProps('Buscar en la bitácora de auditoría')}
              className={`${FIELD_FOCUS} w-full pl-9`}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={clearFilters}
          disabled={!hasFilters}
          {...getVoiceProps('Limpiar filtros de auditoría')}
          className={BTN_FOCUS}
        >
          <X className="w-4 h-4" aria-hidden="true" />
          Limpiar filtros
        </button>
      </form>

      {status === 'loading' && (
        <p role="status" className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
          Cargando registros de auditoría…
        </p>
      )}

      {status === 'error' && (
        <div role="alert" className="p-4 rounded-2xl border border-red-300 bg-red-50 text-red-950 text-sm font-bold flex flex-wrap items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
          <span>No se pudo cargar la bitácora. Intenta nuevamente.</span>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            {...getVoiceProps('Reintentar carga de bitácora de auditoría')}
            className={BTN_FOCUS}
          >
            Reintentar
          </button>
        </div>
      )}

      {status === 'ready' && data.logs.length === 0 && (
        <p role="status" className="p-4 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-800">
          No hay registros que coincidan con los filtros.
        </p>
      )}

      {status === 'ready' && data.logs.length > 0 && (
        <>
          <p className="text-xs font-semibold text-slate-700">
            {data.total} registros en total
          </p>

          <table className="hidden md:table w-full table-fixed text-left text-sm border border-slate-200 rounded-2xl bg-white">
            <caption className="sr-only">Registros de auditoría de actividad</caption>
            <thead className="bg-slate-100 text-xs text-slate-800">
              <tr>
                <th scope="col" className="p-3 w-[14%]">Fecha y hora</th>
                <th scope="col" className="p-3 w-[24%]">Acción</th>
                <th scope="col" className="p-3 w-[26%]">Usuario</th>
                <th scope="col" className="p-3">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {data.logs.map((log, i) => (
                <tr key={log.id ?? `${log.createdAt}-${i}`} className="border-t border-slate-200 align-top">
                  <td className="p-3 text-xs text-slate-800">{formatDate(log.createdAt)}</td>
                  <td className="p-3"><ActionCell log={log} /></td>
                  <td className="p-3"><ActorCell log={log} /></td>
                  <td className="p-3 text-slate-800"><DetailsCell log={log} /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="md:hidden space-y-3" aria-label="Registros de auditoría de actividad">
            {data.logs.map((log, i) => (
              <li key={log.id ?? `${log.createdAt}-${i}`} className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2 text-sm">
                <time dateTime={log.createdAt} className="block text-xs font-semibold text-slate-700">
                  {formatDate(log.createdAt)}
                </time>
                <div><ActionCell log={log} /></div>
                <div><ActorCell log={log} /></div>
                <div className="text-slate-800"><DetailsCell log={log} /></div>
              </li>
            ))}
          </ul>

          <nav aria-label="Paginación de auditoría" className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              {...getVoiceProps('Página anterior de auditoría')}
              className={BTN_FOCUS}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              Anterior
            </button>
            <span className="text-sm font-bold text-slate-800">
              Página {page} de {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              {...getVoiceProps('Página siguiente de auditoría')}
              className={BTN_FOCUS}
            >
              Siguiente
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </nav>
        </>
      )}
    </section>
  );
};
