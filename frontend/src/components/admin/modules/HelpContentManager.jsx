import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  History,
  CheckCircle2,
  AlertCircle,
  Archive,
  Edit,
  RotateCcw,
  ExternalLink,
  Loader2,
  RefreshCw,
  X,
  FileText,
  Clock,
  Sparkles,
} from 'lucide-react';
import { api } from '@services/api';
import { Card } from '@components/ui/Card';
import { Badge } from '@components/ui/Badge';
import { Button } from '@components/ui/Button';
import { Modal } from '@components/ui/Modal';

const STATUS_LABELS = {
  published: { label: 'Publicado', variant: 'success', border: 'border-emerald-300 text-emerald-900 bg-emerald-50' },
  draft: { label: 'Borrador', variant: 'warning', border: 'border-amber-300 text-amber-900 bg-amber-50' },
  archived: { label: 'Archivado', variant: 'secondary', border: 'border-neutral-300 text-neutral-700 bg-neutral-100' },
};

const DEFAULT_CATEGORIES = [
  'Académico',
  'Financiamiento',
  'Salud y Bienestar',
  'Inclusión y PAEDIS',
  'Vida Estudiantil',
  'Titulaciones y Graduación',
  'Soporte Tecnológico',
];

function formatStepsToText(steps) {
  if (!Array.isArray(steps)) return '';
  return steps
    .map((s, idx) => {
      if (typeof s === 'string') return s;
      if (typeof s === 'object' && s !== null) {
        if (s.title && s.instruction && s.title !== s.instruction) {
          return `${s.title}: ${s.instruction}`;
        }
        return s.instruction || s.title || `Paso ${idx + 1}`;
      }
      return String(s);
    })
    .join('\n');
}

function parseStepsFromText(text) {
  if (!text || typeof text !== 'string') return [];
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, idx) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx > 0 && colonIdx < line.length - 1) {
        return {
          stepNumber: idx + 1,
          title: line.slice(0, colonIdx).trim(),
          instruction: line.slice(colonIdx + 1).trim(),
        };
      }
      return {
        stepNumber: idx + 1,
        title: `Paso ${idx + 1}`,
        instruction: line,
      };
    });
}

export const HelpContentManager = ({ isAdmin, isCoordinator, getVoiceProps = () => ({}), announce = () => {} }) => {
  const [procedures, setProcedures] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedback, setFeedback] = useState(null);

  // Modal Crear / Editar
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingProcedure, setEditingProcedure] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    procedureId: '',
    title: '',
    category: DEFAULT_CATEGORIES[0],
    description: '',
    stepsText: '',
    requirementsText: '',
    officialUrl: '',
    estimatedDays: 3,
    isPaedisPriority: false,
    changeReason: '',
  });

  // Modal Historial / Rollback
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyTarget, setHistoryTarget] = useState(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const fetchProcedures = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const res = await api.getAdminProcedures(statusFilter === 'all' ? '' : statusFilter);
      if (res && res.success && Array.isArray(res.data)) {
        setProcedures(res.data);
        setLoadError(null);
      } else {
        setProcedures([]);
        setLoadError(res?.message || 'No fue posible cargar el catálogo editorial.');
      }
    } catch (err) {
      console.error('[HelpContentManager] Error cargando trámites:', err);
      setProcedures([]);
      setLoadError('Error de conexión al cargar trámites.');
      setFeedback({ type: 'error', text: 'No fue posible conectar con el catálogo editorial.' });
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchProcedures();
  }, [fetchProcedures]);

  const filteredProcedures = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return procedures.filter((p) => {
      const matchesSearch =
        !term ||
        p.title?.toLowerCase().includes(term) ||
        p.procedureId?.toLowerCase().includes(term) ||
        p.categoryTitle?.toLowerCase().includes(term) ||
        p.categoryKey?.toLowerCase().includes(term) ||
        p.category?.toLowerCase().includes(term);
      return matchesSearch;
    });
  }, [procedures, searchTerm]);

  const handleOpenCreate = () => {
    setEditingProcedure(null);
    setFormData({
      procedureId: '',
      title: '',
      category: DEFAULT_CATEGORIES[0],
      description: '',
      stepsText: '',
      requirementsText: '',
      officialUrl: '',
      estimatedDays: 3,
      isPaedisPriority: false,
      changeReason: 'Creación inicial de trámite institucional',
    });
    setIsEditorOpen(true);
    announce('Formulario para crear nuevo trámite abierto', 'polite');
  };

  const handleOpenEdit = (proc) => {
    setEditingProcedure(proc);
    setFormData({
      procedureId: proc.procedureId,
      title: proc.title || '',
      category: proc.categoryTitle || proc.category || DEFAULT_CATEGORIES[0],
      description: proc.description || '',
      stepsText: formatStepsToText(proc.steps),
      requirementsText: Array.isArray(proc.requirements) ? proc.requirements.join('\n') : '',
      officialUrl: proc.officialUrl || '',
      estimatedDays: proc.estimatedDays !== undefined && proc.estimatedDays !== null ? proc.estimatedDays : 3,
      isPaedisPriority: Boolean(proc.isPaedisPriority),
      changeReason: '',
    });
    setIsEditorOpen(true);
    announce(`Editando trámite: ${proc.title}`, 'polite');
  };

  const handleSaveProcedure = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFeedback({ type: 'error', text: 'El título del trámite es obligatorio.' });
      return;
    }
    if (!editingProcedure && !formData.procedureId.trim()) {
      setFeedback({ type: 'error', text: 'El identificador único (ID) es obligatorio.' });
      return;
    }

    setIsSaving(true);
    try {
      const steps = parseStepsFromText(formData.stepsText);
      const requirements = formData.requirementsText
        .split('\n')
        .map((r) => r.trim())
        .filter(Boolean);

      const categorySlug = formData.category.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const payload = {
        title: formData.title.trim(),
        category: formData.category,
        categoryTitle: formData.category,
        categoryKey: categorySlug || 'orientacion-general',
        description: formData.description.trim(),
        steps,
        requirements,
        officialUrl: formData.officialUrl.trim(),
        estimatedDays: Number(formData.estimatedDays) >= 0 ? Number(formData.estimatedDays) : 3,
        isPaedisPriority: formData.isPaedisPriority,
        changeReason: formData.changeReason.trim() || (editingProcedure ? 'Actualización editorial de contenido' : 'Creación de trámite'),
      };

      let res;
      if (!editingProcedure) {
        payload.procedureId = formData.procedureId.trim();
        res = await api.createAdminProcedure(payload);
      } else {
        res = await api.updateAdminProcedure(editingProcedure.procedureId, payload);
      }

      if (!res || !res.success) {
        setFeedback({
          type: 'error',
          text: res?.message || 'Error al guardar los cambios editoriales.',
        });
        return;
      }

      setFeedback({
        type: 'success',
        text: !editingProcedure
          ? `Trámite '${payload.title}' creado exitosamente en borrador.`
          : `Trámite '${payload.title}' actualizado a versión incrementada v${res.data?.version || ''}.`,
      });
      setIsEditorOpen(false);
      fetchProcedures();
    } catch (err) {
      console.error('[HelpContentManager] Error guardando trámite:', err);
      setFeedback({ type: 'error', text: err.message || 'Error al guardar cambios editoriales.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (proc, newStatus) => {
    try {
      const res = await api.updateAdminProcedureStatus(proc.procedureId, newStatus);
      if (!res || !res.success) {
        setFeedback({
          type: 'error',
          text: res?.message || `Error al cambiar estado editorial a ${newStatus}.`,
        });
        return;
      }
      const actionName = newStatus === 'published' ? 'publicado' : newStatus === 'archived' ? 'archivado' : 'pasado a borrador';
      setFeedback({ type: 'success', text: `Trámite '${proc.title}' ${actionName} correctamente.` });
      fetchProcedures();
    } catch (err) {
      console.error('[HelpContentManager] Error cambiando estado:', err);
      setFeedback({ type: 'error', text: err.message || 'Error al cambiar estado editorial.' });
    }
  };

  const handleOpenHistory = (proc) => {
    setHistoryTarget(proc);
    setIsHistoryOpen(true);
    announce(`Historial de versiones para ${proc.title}`, 'polite');
  };

  const handleRollback = async (proc, versionNum) => {
    if (!window.confirm(`¿Seguro que deseas revertir el trámite '${proc.title}' a la versión v${versionNum}?`)) {
      return;
    }
    setIsRollingBack(true);
    try {
      const res = await api.rollbackAdminProcedure(proc.procedureId, versionNum);
      if (!res || !res.success) {
        setFeedback({
          type: 'error',
          text: res?.message || `Error al restaurar a la versión v${versionNum}.`,
        });
        return;
      }
      setFeedback({ type: 'success', text: `Trámite restaurado exitosamente a la versión v${versionNum}.` });
      setIsHistoryOpen(false);
      fetchProcedures();
    } catch (err) {
      console.error('[HelpContentManager] Error en rollback:', err);
      setFeedback({ type: 'error', text: err.message || 'Error al revertir versión.' });
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" {...getVoiceProps('Gestión de Trámites y Contenidos')}>
      {/* Feedback banner */}
      {feedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border flex items-center justify-between text-xs sm:text-sm font-bold shadow-xs ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="p-1 text-neutral-500 hover:text-neutral-900 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Panel */}
      <Card className="p-6 bg-white border border-neutral-200 rounded-2xl shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-brand-navy" aria-hidden="true" />
              <h2 className="text-xl sm:text-2xl font-black text-brand-navy tracking-tight">
                Gestión Editorial de Trámites y Contenidos (CMS)
              </h2>
            </div>
            <p className="mt-1 text-xs sm:text-sm text-neutral-600 font-medium">
              Control del ciclo de vida editorial (Borrador, Publicado, Archivado), versionamiento y trazabilidad para el Centro de Ayuda institucional.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchProcedures}
              disabled={isLoading}
              className="gap-1.5 text-xs font-bold"
              aria-label="Actualizar catálogo de trámites"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refrescar
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleOpenCreate}
              className="gap-1.5 text-xs font-bold bg-brand-navy hover:bg-blue-900 text-white"
            >
              <Plus className="w-4 h-4" />
              Nuevo Trámite
            </Button>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="mt-6 pt-4 border-t border-neutral-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por título, ID o categoría..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
              aria-label="Filtrar trámites por texto"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500" aria-hidden="true" />
            <span className="text-xs font-bold text-neutral-600">Estado:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-bold text-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 cursor-pointer"
              aria-label="Filtrar por estado editorial"
            >
              <option value="all">Todos los estados</option>
              <option value="published">Publicados únicamente</option>
              <option value="draft">Borradores</option>
              <option value="archived">Archivados</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Procedures Table */}
      <Card className="bg-white border border-neutral-200 rounded-2xl overflow-hidden shadow-xs">
        {isLoading ? (
          <div className="p-12 flex flex-col items-center justify-center gap-3 text-neutral-500">
            <Loader2 className="w-8 h-8 animate-spin text-brand-navy" />
            <p className="text-sm font-bold">Cargando catálogo editorial...</p>
          </div>
        ) : loadError ? (
          <div className="p-12 text-center text-rose-700 bg-rose-50/50">
            <AlertCircle className="w-12 h-12 mx-auto text-rose-500 mb-2" />
            <p className="text-sm font-bold text-rose-950 mb-1">Error al consultar el catálogo editorial</p>
            <p className="text-xs text-rose-800 max-w-md mx-auto mb-4">{loadError}</p>
            <Button variant="secondary" size="sm" onClick={fetchProcedures} className="mx-auto">
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </div>
        ) : filteredProcedures.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <BookOpen className="w-12 h-12 mx-auto text-neutral-300 mb-2" />
            <p className="text-sm font-bold">
              {searchTerm || statusFilter !== 'all'
                ? 'No se encontraron trámites con los filtros seleccionados.'
                : 'No hay trámites registrados en el catálogo editorial.'}
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              {searchTerm || statusFilter !== 'all'
                ? 'Intenta con otro término de búsqueda o cambia el filtro de estado.'
                : 'Puedes crear un nuevo trámite institucional usando el botón "Nuevo Trámite".'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200 text-neutral-700 font-black">
                  <th scope="col" className="px-4 py-3">Trámite / Identificador</th>
                  <th scope="col" className="px-4 py-3">Categoría</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                  <th scope="col" className="px-4 py-3">Versión</th>
                  <th scope="col" className="px-4 py-3">Plazo</th>
                  <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProcedures.map((proc) => {
                  const statusInfo = STATUS_LABELS[proc.status] || STATUS_LABELS.draft;
                  return (
                    <tr key={proc.procedureId || proc._id} className="hover:bg-neutral-50/70 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="font-bold text-brand-navy flex items-center gap-2">
                          <span>{proc.title}</span>
                          {proc.isPaedisPriority && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-900 border border-purple-200">
                              PAEDIS
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] font-mono text-neutral-400 mt-0.5">
                          ID: {proc.procedureId}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-neutral-100 text-neutral-800 border border-neutral-200">
                          {proc.categoryTitle || proc.category || 'Orientación General'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${statusInfo.border}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-xs font-black text-neutral-700">
                        v{proc.version || 1}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-neutral-600 font-medium">
                        {proc.estimatedDays ? `${proc.estimatedDays} días hábiles` : 'Inmediato'}
                      </td>
                      <td className="px-4 py-3.5 text-right space-x-1 whitespace-nowrap">
                        {/* Editar */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(proc)}
                          className="h-8 w-8 p-0 text-neutral-600 hover:text-brand-navy"
                          title="Editar trámite"
                          aria-label={`Editar ${proc.title}`}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>

                        {/* Historial / Rollback */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenHistory(proc)}
                          className="h-8 w-8 p-0 text-neutral-600 hover:text-purple-700"
                          title="Historial de versiones"
                          aria-label={`Historial de ${proc.title}`}
                        >
                          <History className="w-4 h-4" />
                        </Button>

                        {/* Cambiar a Publicado */}
                        {proc.status !== 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(proc, 'published')}
                            className="h-8 px-2 text-xs font-bold text-emerald-700 hover:bg-emerald-50"
                            title="Publicar trámite"
                          >
                            Publicar
                          </Button>
                        )}

                        {/* Archivar */}
                        {proc.status === 'published' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(proc, 'archived')}
                            className="h-8 px-2 text-xs font-bold text-neutral-600 hover:bg-neutral-100"
                            title="Archivar trámite"
                          >
                            Archivar
                          </Button>
                        )}

                        {/* Regresar a Borrador si está archivado */}
                        {proc.status === 'archived' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(proc, 'draft')}
                            className="h-8 px-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
                            title="Desarchivar a borrador"
                          >
                            A Borrador
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Editor Modal */}
      {isEditorOpen && (
        <Modal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          title={editingProcedure ? `Editar Trámite: ${editingProcedure.title} (v${editingProcedure.version})` : 'Crear Nuevo Trámite Editorial'}
          maxWidth="max-w-2xl"
        >
          <form onSubmit={handleSaveProcedure} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="procedureIdInput" className="block text-xs font-bold text-neutral-700 mb-1">
                  Identificador Único (procedureId) *
                </label>
                <input
                  id="procedureIdInput"
                  type="text"
                  value={formData.procedureId}
                  onChange={(e) => setFormData({ ...formData, procedureId: e.target.value })}
                  disabled={Boolean(editingProcedure)}
                  placeholder="ej. certificado-alumno-regular"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 disabled:bg-neutral-100 font-mono focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
                  required
                />
              </div>

              <div>
                <label htmlFor="procedureCategorySelect" className="block text-xs font-bold text-neutral-700 mb-1">
                  Categoría Institucional *
                </label>
                <select
                  id="procedureCategorySelect"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 bg-white font-bold text-neutral-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
                >
                  {DEFAULT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="procedureTitleInput" className="block text-xs font-bold text-neutral-700 mb-1">
                Título del Trámite *
              </label>
              <input
                id="procedureTitleInput"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="ej. Solicitud de Certificado de Alumno Regular"
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-300 font-bold text-brand-navy focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
                required
              />
            </div>

            <div>
              <label htmlFor="procedureDescriptionTextarea" className="block text-xs font-bold text-neutral-700 mb-1">
                Descripción Institucional
              </label>
              <textarea
                id="procedureDescriptionTextarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="Breve explicación de la finalidad del trámite y a quién va dirigido..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="procedureStepsTextarea" className="block text-xs font-bold text-neutral-700 mb-1">
                  Pasos a Seguir (uno por línea)
                </label>
                <textarea
                  id="procedureStepsTextarea"
                  value={formData.stepsText}
                  onChange={(e) => setFormData({ ...formData, stepsText: e.target.value })}
                  rows={4}
                  placeholder="1. Ingresar a Vivo Duoc&#10;2. Seleccionar Certificados&#10;3. Descargar PDF con firma digital"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
                />
              </div>

              <div>
                <label htmlFor="procedureRequirementsTextarea" className="block text-xs font-bold text-neutral-700 mb-1">
                  Requisitos Previos (uno por línea)
                </label>
                <textarea
                  id="procedureRequirementsTextarea"
                  value={formData.requirementsText}
                  onChange={(e) => setFormData({ ...formData, requirementsText: e.target.value })}
                  rows={4}
                  placeholder="Matrícula vigente en semestre activo&#10;Cédula de identidad al día"
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="procedureOfficialUrlInput" className="block text-xs font-bold text-neutral-700 mb-1">
                  Enlace Oficial Externo (Portal Duoc UC)
                </label>
                <input
                  id="procedureOfficialUrlInput"
                  type="url"
                  value={formData.officialUrl}
                  onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                  placeholder="https://experienciavivo.duoc.cl/tramites/..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 font-mono focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
                />
              </div>

              <div>
                <label htmlFor="procedureEstimatedDaysInput" className="block text-xs font-bold text-neutral-700 mb-1">
                  Plazo Estimado (días hábiles)
                </label>
                <input
                  id="procedureEstimatedDaysInput"
                  type="number"
                  min="0"
                  max="60"
                  value={formData.estimatedDays}
                  onChange={(e) => setFormData({ ...formData, estimatedDays: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="paedisCheckbox"
                checked={formData.isPaedisPriority}
                onChange={(e) => setFormData({ ...formData, isPaedisPriority: e.target.checked })}
                className="w-4 h-4 rounded text-brand-navy focus-visible:ring-amber-400 cursor-pointer"
              />
              <label htmlFor="paedisCheckbox" className="text-xs font-bold text-neutral-800 cursor-pointer">
                Marcar como prioridad o trámite con adaptaciones PAEDIS
              </label>
            </div>

            {editingProcedure && (
              <div>
                <label htmlFor="procedureChangeReasonInput" className="block text-xs font-bold text-purple-900 mb-1">
                  Motivo de la Modificación Editorial (Trazabilidad E-005) *
                </label>
                <input
                  id="procedureChangeReasonInput"
                  type="text"
                  value={formData.changeReason}
                  onChange={(e) => setFormData({ ...formData, changeReason: e.target.value })}
                  placeholder="ej. Actualización de requisitos según Circular Académica 2026-1"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-purple-300 bg-purple-50/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400"
                  required
                />
              </div>
            )}

            <div className="pt-4 border-t border-neutral-200 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditorOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSaving}
                className="bg-brand-navy text-white hover:bg-blue-900"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Trámite'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* History Modal */}
      {isHistoryOpen && historyTarget && (
        <Modal
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          title={`Historial de Versiones: ${historyTarget.title}`}
          maxWidth="max-w-xl"
        >
          <div className="space-y-4">
            <p className="text-xs text-neutral-600">
              Versión actual: <strong className="font-mono text-brand-navy">v{historyTarget.version || 1}</strong> ({STATUS_LABELS[historyTarget.status]?.label}).
              Puedes revertir a cualquier versión anterior preservando la trazabilidad.
            </p>

            {(!historyTarget.versionHistory || historyTarget.versionHistory.length === 0) ? (
              <div className="p-6 text-center text-xs text-neutral-500 bg-neutral-50 rounded-xl">
                No existen versiones previas archivadas para este trámite.
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {historyTarget.versionHistory
                  .slice()
                  .reverse()
                  .map((item) => (
                    <div
                      key={item.version}
                      className="p-3 border border-neutral-200 rounded-xl bg-neutral-50 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-black text-brand-navy">
                          Versión v{item.version} — {item.data?.title || historyTarget.title}
                        </div>
                        <div className="text-[11px] text-neutral-500 mt-0.5">
                          Fecha: {item.changedAt ? new Date(item.changedAt).toLocaleString('es-CL') : 'N/D'} por {item.changedBy || 'Editorial'}
                        </div>
                        {item.reason && (
                          <div className="text-[11px] text-purple-900 font-medium mt-1">
                            Motivo: {item.reason}
                          </div>
                        )}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isRollingBack}
                        onClick={() => handleRollback(historyTarget, item.version)}
                        className="gap-1 text-xs font-bold hover:bg-purple-100 hover:text-purple-900 hover:border-purple-300"
                        title={`Restaurar a versión v${item.version}`}
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-purple-700" />
                        Restaurar v{item.version}
                      </Button>
                    </div>
                  ))}
              </div>
            )}

            <div className="pt-3 border-t border-neutral-200 flex justify-end">
              <Button variant="outline" size="sm" onClick={() => setIsHistoryOpen(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default HelpContentManager;
