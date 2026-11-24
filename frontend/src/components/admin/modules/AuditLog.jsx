import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { FileText, Search, Filter, ChevronRight, Download, X, Clock, User, AlertTriangle, RefreshCw } from 'lucide-react';
import { api } from '@services/api';
import { useAccessibility } from '@context/AccessibilityContext';
import { useAuth } from '@context/AuthContext';
import { ADMIN_THEME } from '@components/admin/adminTheme';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';
import { Select } from '@components/ui/Select';
import { Table } from '@components/ui/Table';
import { Modal } from '@components/ui/Modal';

const ACTION_LABELS = {
  student_registered_by_admin: 'Usuario Registrado',
  student_updated_by_admin: 'Usuario / Rol Actualizado',
  status_changed_by_admin: 'Cambio de Estado Académico',
  student_deleted_by_admin: 'Usuario Eliminado',
  career_created: 'Carrera Creada',
  career_deleted: 'Carrera Eliminada',
  sede_created: 'Sede Creada',
  sede_deleted: 'Sede Eliminada',
  IMPORT: 'Cursos Importados',
  SEED: 'Catálogo Oficial Sembrado',
  CLEAR: 'Catálogo Vaciado',
  catalog_import: 'Catálogo Importado',
  catalog_clear: 'Catálogo Vaciado',
  paedis_case_updated: 'Expediente PAEDIS Actualizado',
  paedis_docente_notified: 'Ficha Docente Notificada',
  sat_intervention_updated: 'Intervención SAT Actualizada',
  sat_weekly_cut_simulated: 'Simulación SAT Ejecutada',
  welcome_email_sent: 'Correo Bienvenida Enviado',
  login: 'Inicio de Sesión',
  password_changed: 'Contraseña Cambiada',
  password_reset_requested: 'Recuperación Solicitada',
  password_reset_completed: 'Contraseña Restablecida',
  updated_accessibility: 'Accesibilidad Modificada',
  used_simulator_toma_ramos: 'Uso Simulador',
  saved_toma_ramos: 'Toma de Ramos Guardada',
  viewed_module: 'Módulo Consultado',
  viewed_biblioteca: 'Biblioteca Consultada',
  created_ticket: 'Ticket Creado',
};

const ACTION_CATEGORIES = [
  { id: 'all', label: 'Todas', actions: null },
  {
    id: 'student',
    label: 'Usuarios',
    actions: ['student_registered_by_admin', 'student_updated_by_admin', 'status_changed_by_admin', 'student_deleted_by_admin'],
  },
  {
    id: 'academic',
    label: 'Académico',
    actions: ['career_created', 'career_deleted', 'sede_created', 'sede_deleted', 'IMPORT', 'SEED', 'CLEAR', 'catalog_import', 'catalog_clear'],
  },
  {
    id: 'paedis',
    label: 'PAEDIS',
    actions: ['paedis_case_updated', 'paedis_docente_notified'],
  },
  {
    id: 'sat',
    label: 'SAT',
    actions: ['sat_intervention_updated', 'sat_weekly_cut_simulated'],
  },
  {
    id: 'auth',
    label: 'Autenticación',
    actions: ['login', 'password_changed', 'password_reset_requested', 'password_reset_completed', 'welcome_email_sent'],
  },
  {
    id: 'accessibility',
    label: 'Accesibilidad',
    actions: ['updated_accessibility'],
  },
  {
    id: 'simulator',
    label: 'Simulador',
    actions: ['used_simulator_toma_ramos', 'saved_toma_ramos'],
  },
];

function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const date = new Date(dateString);
    return date.toLocaleString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return dateString; }
}

export const AuditLog = ({ isAdmin, getVoiceProps, announce }) => {
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(25);
  const [filters, setFilters] = useState({ action: 'all', actor: '', dateFrom: '', dateTo: '', search: '' });
  const [statusFeedback, setStatusFeedback] = useState(null);

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const qTerm = (filters.search || filters.actor || '').trim();
      const queryParams = {
        page,
        limit: pageSize,
      };
      if (qTerm) queryParams.q = qTerm;

      const res = await api.getAdminActivityLogs(queryParams);
      if (res?.success) {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
      } else {
        setStatusFeedback({ type: 'error', text: res?.message || 'No fue posible cargar la bitácora.' });
      }
    } catch (err) {
      console.error('[AuditLog] Error cargando logs:', err);
      setStatusFeedback({ type: 'error', text: 'No fue posible cargar la bitácora de auditoría.' });
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, filters.search, filters.actor]);

  useEffect(() => { loadLogs(); }, [loadLogs]);

  const filteredLogs = useMemo(() => {
    const selectedCategory = ACTION_CATEGORIES.find((c) => c.id === filters.action);
    const allowedActions = selectedCategory?.actions || null;
    const actorFilter = filters.actor.trim().toLowerCase();
    const fromTime = filters.dateFrom ? new Date(`${filters.dateFrom}T00:00:00`).getTime() : null;
    const toTime = filters.dateTo ? new Date(`${filters.dateTo}T23:59:59`).getTime() : null;

    return logs.filter((entry) => {
      if (allowedActions && !allowedActions.includes(entry.action)) {
        return false;
      }
      if (actorFilter) {
        const actorStr = `${entry.userEmail || ''} ${entry.userName || ''}`.toLowerCase();
        if (!actorStr.includes(actorFilter)) return false;
      }
      if (fromTime || toTime) {
        const t = entry.createdAt ? new Date(entry.createdAt).getTime() : NaN;
        if (Number.isFinite(t)) {
          if (fromTime && t < fromTime) return false;
          if (toTime && t > toTime) return false;
        }
      }
      return true;
    });
  }, [logs, filters.action, filters.actor, filters.dateFrom, filters.dateTo]);

  const columns = [
    { field: 'createdAt', header: 'Fecha y Hora', render: (v) => formatDate(v) },
    { field: 'action', header: 'Acción', render: (v) => <Badge variant="default" size="sm">{ACTION_LABELS[v] || v}</Badge> },
    { field: 'userName', header: 'Actor', render: (v) => v || 'Sistema' },
    { field: 'userEmail', header: 'Correo Actor' },
    { field: 'details', header: 'Detalles' },
  ];

  const handleExport = () => {
    try {
      const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;
      const header = ['Fecha y Hora', 'Acción', 'Actor', 'Correo Actor', 'Detalles'];
      const rows = filteredLogs.map((l) => [
        formatDate(l.createdAt),
        ACTION_LABELS[l.action] || l.action || '',
        l.userName || '',
        l.userEmail || '',
        l.details || '',
      ]);
      const csvContent = '\uFEFF' + [header, ...rows].map((r) => r.map(escapeCsv).join(',')).join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `auditoria_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setStatusFeedback({ type: 'success', text: `Bitácora exportada (${filteredLogs.length} registros).` });
      announce('Bitácora de auditoría exportada en CSV.', 'polite');
    } catch (err) {
      console.error('[AuditLog] Error exportando:', err);
      setStatusFeedback({ type: 'error', text: 'Error al exportar la bitácora.' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <section aria-labelledby="audit-log-title" className="space-y-6 animate-fade-in-up w-full">
      <div className={`${ADMIN_THEME.cardSurface} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <h2 id="audit-log-title" className={ADMIN_THEME.moduleTitle}>Bitácora de Auditoría</h2>
          <p className={ADMIN_THEME.moduleSubtitle}>Trazabilidad completa de acciones administrativas (Ley N° 21.719)</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={handleExport} disabled={filteredLogs.length === 0} {...getVoiceProps('Exportar bitácora a CSV')} className="min-h-[42px] px-4 py-2">
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Exportar CSV</span>
          </Button>
          <Button variant="outline" size="sm" onClick={() => { loadLogs(); announce('Bitácora actualizada.', 'polite'); }} disabled={loading} {...getVoiceProps('Actualizar bitácora')} className="min-h-[42px] px-4 py-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Actualizar</span>
          </Button>
        </div>
      </div>

      {statusFeedback && <div role="status" aria-live="polite" {...getVoiceProps(statusFeedback.text)} className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-medium shadow-xs transition-all ${statusFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}><div className="flex items-center gap-2.5">{statusFeedback.type === 'success' ? <span className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true">✓</span> : <span className="w-5 h-5 text-rose-700 shrink-0" aria-hidden="true">⚠</span>}<span>{statusFeedback.text}</span></div><button type="button" onClick={() => setStatusFeedback(null)} {...getVoiceProps('Cerrar notificación')} className="text-neutral-500 hover:text-neutral-900 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold" aria-label="Cerrar notificación"><X className="w-4 h-4" /></button></div>}

      <div className={`${ADMIN_THEME.cardSurface} overflow-hidden`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-2 lg:col-span-4 min-w-0 space-y-1.5">
            <label htmlFor="audit-search" className={`block ${ADMIN_THEME.cardLabel}`}>
              Búsqueda general
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
              <Input
                id="audit-search"
                value={filters.search}
                onChange={(e) => { setFilters((prev) => ({ ...prev, search: e.target.value })); setPage(1); }}
                placeholder="Buscar por actor, acción, detalles..."
                aria-label="Buscar en bitácora"
                {...getVoiceProps('Buscar en bitácora')}
                className="w-full min-h-[42px] pl-10 pr-4"
              />
            </div>
          </div>
          <div className="lg:col-span-2 min-w-0">
            <Select
              id="audit-action-filter"
              label="Categoría"
              value={filters.action}
              onChange={(e) => { setFilters((prev) => ({ ...prev, action: e.target.value })); setPage(1); }}
              placeholder="Filtrar por acción"
              options={ACTION_CATEGORIES.map((c) => ({ value: c.id, label: c.label }))}
              {...getVoiceProps('Filtrar por tipo de acción')}
              className="w-full min-h-[42px]"
            />
          </div>
          <div className="lg:col-span-2 min-w-0">
            <Input
              id="audit-actor"
              label="Actor"
              value={filters.actor}
              onChange={(e) => { setFilters((prev) => ({ ...prev, actor: e.target.value })); setPage(1); }}
              placeholder="Correo o nombre"
              aria-label="Filtrar por actor"
              {...getVoiceProps('Filtrar por actor')}
              className="w-full min-h-[42px]"
            />
          </div>
          <div className="lg:col-span-2 min-w-0">
            <Input
              id="audit-date-from"
              label="Desde"
              type="date"
              value={filters.dateFrom}
              onChange={(e) => { setFilters((prev) => ({ ...prev, dateFrom: e.target.value })); setPage(1); }}
              aria-label="Fecha desde"
              {...getVoiceProps('Filtrar desde fecha')}
              className="w-full min-h-[42px]"
            />
          </div>
          <div className="lg:col-span-2 min-w-0">
            <Input
              id="audit-date-to"
              label="Hasta"
              type="date"
              value={filters.dateTo}
              onChange={(e) => { setFilters((prev) => ({ ...prev, dateTo: e.target.value })); setPage(1); }}
              aria-label="Fecha hasta"
              {...getVoiceProps('Filtrar hasta fecha')}
              className="w-full min-h-[42px]"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-neutral-400 font-bold space-y-2"><span className="animate-spin inline-block w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full" aria-hidden="true" /><span>Cargando bitácora de auditoría...</span></div>
      ) : filteredLogs.length === 0 ? (
        <Card variant="filled" padding="lg" className="text-center">No se encontraron registros de auditoría con los filtros seleccionados.</Card>
      ) : (
        <div className="space-y-4">
          <Table columns={columns} data={filteredLogs} striped hoverable compact emptyMessage="Sin registros" />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-neutral-500">Mostrando {filteredLogs.length} de {total} registros</span>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} {...getVoiceProps('Página anterior')}>Anterior</Button>
              <span className="text-xs font-bold text-neutral-700">Página {page} de {totalPages}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} {...getVoiceProps('Página siguiente')}>Siguiente</Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
export default AuditLog;