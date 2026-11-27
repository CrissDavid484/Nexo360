import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Building2, Plus, Trash2, Search, X, Pencil, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@services/api';
import {
  CHILE_REGIONS,
  getCitiesForRegion,
  DUOC_SCHOOLS,
  SEDES_DUOC_ITEMS,
  getSchoolForCareer,
} from '@utils/studentUtils';
import { ADMIN_THEME } from '@components/admin/adminTheme';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const INITIAL_CAREERS_CATALOG = [
  { id: 'career-0', name: 'Ingeniería en Informática', school: 'Escuela de Informática y Telecomunicaciones' },
  { id: 'career-1', name: 'Técnico en Programación', school: 'Escuela de Informática y Telecomunicaciones' },
  { id: 'career-2', name: 'Analista Programador', school: 'Escuela de Informática y Telecomunicaciones' },
];

const INITIAL_SEDES_CATALOG = SEDES_DUOC_ITEMS.map((s, idx) => ({
  id: `sede-${idx}`,
  name: s.name,
  region: s.region,
  city: s.city,
}));

const CATALOG_CONFIG = {
  careers: {
    title: 'Carreras Duoc UC',
    addPlaceholder: 'Nombre de la nueva carrera...',
    searchPlaceholder: 'Filtrar carreras...',
    emptyText: 'No se encontraron carreras.',
    deleteLabelPrefix: 'Eliminar carrera',
    editLabelPrefix: 'Editar carrera',
    confirmDelete: (item) => `¿Eliminar la carrera "${item.name}"?`,
    addFeedback: (name) => `Carrera "${name}" agregada y guardada en la base de datos.`,
    addAnnounce: (name) => `Carrera ${name} agregada.`,
    editFeedback: (name) => `Carrera "${name}" actualizada correctamente.`,
    editAnnounce: (name) => `Carrera ${name} actualizada.`,
    deleteFeedback: (name) => `Carrera "${name}" eliminada de la base de datos.`,
    deleteAnnounce: (name) => `Carrera ${name} eliminada.`,
    createApi: (name, extra = {}) =>
      api.createAdminCareer({
        name,
        school: extra.school || getSchoolForCareer(name),
      }),
    updateApi: (key, payload) => api.updateAdminCareer(key, payload),
    deleteApi: (key) => api.deleteAdminCareer(key),
  },
  sedes: {
    title: 'Sedes Duoc UC',
    addPlaceholder: 'Nombre de sede institucional (ej. Campus Villarrica)...',
    searchPlaceholder: 'Filtrar sedes...',
    emptyText: 'No se encontraron sedes.',
    deleteLabelPrefix: 'Eliminar sede',
    editLabelPrefix: 'Editar sede',
    confirmDelete: (item) => `¿Eliminar la sede "${item.name}"?`,
    addFeedback: (name) => `Sede "${name}" agregada y guardada en la base de datos.`,
    addAnnounce: (name) => `Sede ${name} agregada.`,
    editFeedback: (name) => `Sede "${name}" actualizada correctamente.`,
    editAnnounce: (name) => `Sede ${name} actualizada.`,
    deleteFeedback: (name) => `Sede "${name}" eliminada de la base de datos.`,
    deleteAnnounce: (name) => `Sede ${name} eliminada.`,
    createApi: (name, extra = {}) =>
      api.createAdminSede({
        name,
        region: extra.region || 'Región Metropolitana',
        city: extra.city || 'Santiago',
      }),
    updateApi: (key, payload) => api.updateAdminSede(key, payload),
    deleteApi: (key) => api.deleteAdminSede(key),
  },
};

function CatalogCrudCard({
  kind,
  items,
  totalCount,
  newInput,
  searchValue,
  extraState,
  canEdit = true,
  isMutating = false,
  onNewInputChange,
  onExtraStateChange,
  onSearchChange,
  onAddSubmit,
  onEditItem,
  onDeleteItem,
  getVoiceProps,
}) {
  const cfg = CATALOG_CONFIG[kind];
  const [editingKey, setEditingKey] = useState(null);
  const [editDraft, setEditDraft] = useState({ name: '', school: '', region: '', city: '' });

  const startEdit = (item) => {
    const key = item._id || item.id || item.name;
    setEditingKey(key);
    setEditDraft({
      name: item.name || '',
      school: item.school || getSchoolForCareer(item.name) || DUOC_SCHOOLS[0],
      region: item.region || 'Región Metropolitana',
      city: item.city || 'Santiago',
    });
  };

  const cancelEdit = () => {
    setEditingKey(null);
  };

  const submitEdit = async (e, item) => {
    e.preventDefault();
    const payload =
      kind === 'careers'
        ? { name: editDraft.name.trim(), school: editDraft.school }
        : { name: editDraft.name.trim(), region: editDraft.region, city: editDraft.city };
    const ok = await onEditItem(item, payload);
    if (ok) {
      setEditingKey(null);
    }
  };

  const getItemSubtitle = (item) => {
    if (kind === 'careers') {
      return item.school || getSchoolForCareer(item.name);
    }
    const region = item.region || 'Región Metropolitana';
    const city = item.city || 'Santiago';
    return `${region} · ${city}`;
  };

  return (
    <div className={`${ADMIN_THEME.cardSurface} space-y-4`}>
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-brand-navy" aria-hidden="true" />
          <h3 className={ADMIN_THEME.sectionTitle}>{cfg.title} ({totalCount})</h3>
        </div>
        <span className={`${ADMIN_THEME.metaText} bg-neutral-100 px-2.5 py-1 rounded-full border border-neutral-200`}>Orden Alfabético</span>
      </div>

      {canEdit ? (
        <form onSubmit={onAddSubmit} className="space-y-2.5 bg-neutral-50/80 p-3 rounded-2xl border border-neutral-200">
          {kind === 'careers' ? (
            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  required
                  disabled={isMutating}
                  value={newInput}
                  onChange={(e) => onNewInputChange(e.target.value)}
                  placeholder={cfg.addPlaceholder}
                  aria-label={cfg.addPlaceholder}
                  {...getVoiceProps(cfg.addPlaceholder)}
                  className={`flex-1 ${ADMIN_THEME.controlInput}`}
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isMutating}
                  disabled={isMutating}
                  {...getVoiceProps('Agregar carrera oficial')}
                  className="min-h-[42px] px-4 py-2 inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                >
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  <span>Agregar</span>
                </Button>
              </div>
              <div>
                <label htmlFor="academic-career-school-select" className="sr-only">
                  Escuela oficial Duoc UC
                </label>
                <select
                  id="academic-career-school-select"
                  disabled={isMutating}
                  value={extraState?.school || DUOC_SCHOOLS[0]}
                  onChange={(e) => onExtraStateChange({ school: e.target.value })}
                  {...getVoiceProps('Seleccionar escuela oficial para la carrera')}
                  aria-label="Escuela oficial Duoc UC"
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm text-neutral-800 bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                >
                  {DUOC_SCHOOLS.map((sch) => (
                    <option key={sch} value={sch}>
                      {sch}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                type="text"
                required
                disabled={isMutating}
                value={newInput}
                onChange={(e) => onNewInputChange(e.target.value)}
                placeholder={cfg.addPlaceholder}
                aria-label={cfg.addPlaceholder}
                {...getVoiceProps(cfg.addPlaceholder)}
                className={`w-full ${ADMIN_THEME.controlInput}`}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="academic-sede-region-select" className="sr-only">
                    Región de Chile (16 regiones)
                  </label>
                  <select
                    id="academic-sede-region-select"
                    required
                    disabled={isMutating}
                    value={extraState?.region || ''}
                    onChange={(e) => {
                      const newRegion = e.target.value;
                      onExtraStateChange({ region: newRegion, city: '' });
                    }}
                    {...getVoiceProps('Seleccionar región de Chile')}
                    aria-label="Región de Chile (16 regiones)"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm text-neutral-800 bg-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                  >
                    <option value="">Selecciona una región...</option>
                    {CHILE_REGIONS.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="academic-sede-city-select" className="sr-only">
                    Ciudad / Comuna de la sede
                  </label>
                  <select
                    id="academic-sede-city-select"
                    required
                    disabled={isMutating || !extraState?.region}
                    value={extraState?.city || ''}
                    onChange={(e) => onExtraStateChange({ city: e.target.value })}
                    aria-label="Ciudad o comuna de la sede"
                    {...getVoiceProps('Seleccionar ciudad o comuna de la sede')}
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-neutral-300 text-xs sm:text-sm text-neutral-800 bg-white disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                  >
                    <option value="">
                      {extraState?.region ? 'Selecciona una ciudad / comuna...' : 'Primero selecciona una región...'}
                    </option>
                    {getCitiesForRegion(extraState?.region).map((cit) => (
                      <option key={cit} value={cit}>
                        {cit}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={isMutating}
                disabled={isMutating}
                {...getVoiceProps('Agregar sede oficial')}
                className="w-full sm:w-auto min-h-[42px] px-4 py-2 inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-xs focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Agregar Sede</span>
              </Button>
            </div>
          )}
        </form>
      ) : (
        <div className="p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-600 font-medium">
          Modo solo lectura: la creación, edición y eliminación de carreras y sedes es exclusiva de Administradores.
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
        <Input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={cfg.searchPlaceholder}
          aria-label={cfg.searchPlaceholder}
          {...getVoiceProps(cfg.searchPlaceholder)}
          className={`w-full pl-10 pr-3 ${ADMIN_THEME.controlInput}`}
        />
      </div>

      <div className="max-h-96 overflow-y-auto space-y-1.5 pr-1 divide-y divide-neutral-100">
        {items.length === 0 ? (
          <p className={`${ADMIN_THEME.metaText} text-center py-4`}>{cfg.emptyText}</p>
        ) : (
          items.map((item) => {
            const itemKey = item._id || item.id || item.name;
            const isEditing = editingKey === itemKey;

            return (
              <div key={itemKey} className="pt-2 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                {isEditing ? (
                  <form onSubmit={(e) => submitEdit(e, item)} className="space-y-2 bg-white p-2.5 rounded-xl border border-neutral-200">
                    <Input
                      type="text"
                      required
                      disabled={isMutating}
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((prev) => ({ ...prev, name: e.target.value }))}
                      aria-label={`Editar nombre de ${item.name}`}
                      className={`w-full ${ADMIN_THEME.controlInput}`}
                    />
                    {kind === 'careers' ? (
                      <select
                        disabled={isMutating}
                        value={editDraft.school}
                        onChange={(e) => setEditDraft((prev) => ({ ...prev, school: e.target.value }))}
                        aria-label="Editar escuela oficial"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-neutral-300 text-xs text-neutral-800 bg-white"
                      >
                        {DUOC_SCHOOLS.map((sch) => (
                          <option key={sch} value={sch}>{sch}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <select
                          disabled={isMutating}
                          value={editDraft.region}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, region: e.target.value, city: '' }))}
                          aria-label="Editar región"
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-neutral-300 text-xs text-neutral-800 bg-white"
                        >
                          {CHILE_REGIONS.map((reg) => (
                            <option key={reg} value={reg}>{reg}</option>
                          ))}
                        </select>
                        <select
                          disabled={isMutating || !editDraft.region}
                          value={editDraft.city}
                          onChange={(e) => setEditDraft((prev) => ({ ...prev, city: e.target.value }))}
                          aria-label="Editar ciudad"
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-neutral-300 text-xs text-neutral-800 bg-white"
                        >
                          <option value="">Selecciona ciudad...</option>
                          {getCitiesForRegion(editDraft.region).map((cit) => (
                            <option key={cit} value={cit}>{cit}</option>
                          ))}
                        </select>
                      </div>
                    )}
                    <div className="flex items-center justify-end gap-2">
                      <Button type="button" variant="secondary" size="sm" onClick={cancelEdit} disabled={isMutating}>
                        Cancelar
                      </Button>
                      <Button type="submit" variant="primary" size="sm" loading={isMutating} disabled={isMutating}>
                        <Check className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>Guardar</span>
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className={`${ADMIN_THEME.bodyText} font-semibold block truncate`}>{item.name}</span>
                      <span className={`${ADMIN_THEME.metaText} block truncate`}>{getItemSubtitle(item)}</span>
                    </div>
                    {canEdit && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isMutating}
                          onClick={() => startEdit(item)}
                          {...getVoiceProps(`${cfg.editLabelPrefix} ${item.name}`)}
                          className="text-neutral-500 hover:text-brand-navy p-1.5 hover:bg-neutral-100 rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                          aria-label={`${cfg.editLabelPrefix} ${item.name}`}
                          title={`${cfg.editLabelPrefix} ${item.name}`}
                        >
                          <Pencil className="w-4 h-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={isMutating}
                          onClick={() => onDeleteItem(item)}
                          {...getVoiceProps(`${cfg.deleteLabelPrefix} ${item.name}`)}
                          className="text-neutral-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded-lg transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold"
                          aria-label={`${cfg.deleteLabelPrefix} ${item.name}`}
                          title={`${cfg.deleteLabelPrefix} ${item.name}`}
                        >
                          <Trash2 className="w-4 h-4" aria-hidden="true" />
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export const AcademicCatalog = ({
  isAdmin,
  getVoiceProps,
  announce,
}) => {
  const [catalogState, setCatalogState] = useState({
    careers: {
      items: INITIAL_CAREERS_CATALOG,
      newInput: '',
      search: '',
      extra: { school: DUOC_SCHOOLS[0] },
    },
    sedes: {
      items: INITIAL_SEDES_CATALOG,
      newInput: '',
      search: '',
      extra: { region: '', city: '' },
    },
  });
  const [mutatingKind, setMutatingKind] = useState(null);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const updateCatalogField = useCallback((kind, patch) => {
    setCatalogState((prev) => ({ ...prev, [kind]: { ...prev[kind], ...patch } }));
  }, []);

  const sortByNameEs = useCallback((items) => [...items].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es')), []);

  const filterCatalogByName = useCallback((sortedItems, search) => {
    const q = search.toLowerCase().trim();
    if (!q) return sortedItems;
    return sortedItems.filter((item) => (item.name || '').toLowerCase().includes(q));
  }, []);

  const loadCatalogData = useCallback(async () => {
    try {
      const [careersRes, sedesRes] = await Promise.allSettled([api.getAdminCareers(), api.getAdminSedes()]);
      if (careersRes.status === 'fulfilled' && careersRes.value?.success && Array.isArray(careersRes.value.careers) && careersRes.value.careers.length > 0) {
        setCatalogState((prev) => ({ ...prev, careers: { ...prev.careers, items: careersRes.value.careers } }));
      }
      if (sedesRes.status === 'fulfilled' && sedesRes.value?.success && Array.isArray(sedesRes.value.sedes) && sedesRes.value.sedes.length > 0) {
        setCatalogState((prev) => ({ ...prev, sedes: { ...prev.sedes, items: sedesRes.value.sedes } }));
      }
    } catch (err) {
      console.error('[AcademicCatalog] Error cargando catálogos:', err);
    }
  }, []);

  useEffect(() => { loadCatalogData(); }, [loadCatalogData]);

  const sortedCareers = useMemo(() => sortByNameEs(catalogState.careers.items), [catalogState.careers.items, sortByNameEs]);
  const sortedSedes = useMemo(() => sortByNameEs(catalogState.sedes.items), [catalogState.sedes.items, sortByNameEs]);
  const filteredCareers = useMemo(() => filterCatalogByName(sortedCareers, catalogState.careers.search), [sortedCareers, catalogState.careers.search, filterCatalogByName]);
  const filteredSedes = useMemo(() => filterCatalogByName(sortedSedes, catalogState.sedes.search), [sortedSedes, catalogState.sedes.search, filterCatalogByName]);

  const handleCatalogAdd = async (kind, e) => {
    e.preventDefault();
    const cfg = CATALOG_CONFIG[kind];
    const clean = catalogState[kind].newInput.trim();
    if (!clean) return;

    const extra = catalogState[kind].extra || {};
    if (kind === 'sedes') {
      if (!extra.region) {
        setStatusFeedback({ type: 'error', text: 'Debes seleccionar una región para la nueva sede.' });
        return;
      }
      if (!extra.city) {
        setStatusFeedback({ type: 'error', text: 'Debes seleccionar una ciudad o localidad para la nueva sede.' });
        return;
      }
    }

    setMutatingKind(kind);
    setStatusFeedback(null);

    try {
      const res = await cfg.createApi(clean, extra);
      if (!res || res.success === false) {
        const errMsg = res?.message || 'El servidor rechazó el registro. No se aplicaron cambios.';
        setStatusFeedback({ type: 'error', text: errMsg });
        announce(errMsg, 'assertive');
        return;
      }

      const persisted = res.career || res.sede || res.item || {
        id: res.id || `${kind}-${Date.now()}`,
        name: clean,
        ...(kind === 'careers'
          ? { school: extra.school || getSchoolForCareer(clean) }
          : { region: extra.region || 'Región Metropolitana', city: extra.city || 'Santiago' }),
      };

      setCatalogState((prev) => ({
        ...prev,
        [kind]: {
          ...prev[kind],
          items: [persisted, ...prev[kind].items],
          newInput: '',
          extra: kind === 'careers' ? { school: DUOC_SCHOOLS[0] } : { region: '', city: '' },
        },
      }));
      setStatusFeedback({ type: 'success', text: cfg.addFeedback(clean) });
      announce(cfg.addAnnounce(clean), 'polite');
    } catch (err) {
      const errMsg = err?.message || 'Error de conexión con el servidor. Los datos no fueron modificados.';
      setStatusFeedback({ type: 'error', text: errMsg });
      announce(errMsg, 'assertive');
    } finally {
      setMutatingKind(null);
    }
  };

  const handleCatalogEdit = async (kind, item, payload) => {
    const cfg = CATALOG_CONFIG[kind];
    if (!payload?.name) {
      setStatusFeedback({ type: 'error', text: 'El nombre no puede quedar vacío.' });
      return false;
    }
    if (kind === 'sedes' && (!payload.region || !payload.city)) {
      setStatusFeedback({ type: 'error', text: 'Debes seleccionar región y ciudad válidas para actualizar la sede.' });
      return false;
    }

    const targetKey = item._id || item.id || item.name;
    setMutatingKind(kind);
    setStatusFeedback(null);

    try {
      const res = await cfg.updateApi(targetKey, payload);
      if (!res || res.success === false) {
        const errMsg = res?.message || 'No se pudo actualizar el elemento en el servidor.';
        setStatusFeedback({ type: 'error', text: errMsg });
        announce(errMsg, 'assertive');
        return false;
      }

      const updated = res.career || res.sede || res.item || { ...item, ...payload };
      setCatalogState((prev) => ({
        ...prev,
        [kind]: {
          ...prev[kind],
          items: prev[kind].items.map((entry) =>
            (entry._id || entry.id || entry.name) === targetKey ? { ...entry, ...updated } : entry
          ),
        },
      }));
      setStatusFeedback({ type: 'success', text: cfg.editFeedback(updated.name || payload.name) });
      announce(cfg.editAnnounce(updated.name || payload.name), 'polite');
      return true;
    } catch (err) {
      const errMsg = err?.message || 'Error de conexión al actualizar. El catálogo se mantuvo sin cambios.';
      setStatusFeedback({ type: 'error', text: errMsg });
      announce(errMsg, 'assertive');
      return false;
    } finally {
      setMutatingKind(null);
    }
  };

  const handleCatalogDelete = async (kind, item) => {
    const cfg = CATALOG_CONFIG[kind];
    if (!window.confirm(cfg.confirmDelete(item))) return;
    const targetKey = item._id || item.id || item.name;

    setMutatingKind(kind);
    setStatusFeedback(null);

    try {
      const res = await cfg.deleteApi(targetKey);
      if (!res || res.success === false) {
        const errMsg = res?.message || 'El servidor no autorizó la eliminación. El elemento se mantiene.';
        setStatusFeedback({ type: 'error', text: errMsg });
        announce(errMsg, 'assertive');
        return;
      }

      setCatalogState((prev) => ({
        ...prev,
        [kind]: {
          ...prev[kind],
          items: prev[kind].items.filter((entry) => (entry._id || entry.id || entry.name) !== targetKey),
        },
      }));
      setStatusFeedback({ type: 'success', text: cfg.deleteFeedback(item.name) });
      announce(cfg.deleteAnnounce(item.name), 'polite');
    } catch (err) {
      const errMsg = err?.message || 'Error de conexión al eliminar. El catálogo se mantuvo sin cambios.';
      setStatusFeedback({ type: 'error', text: errMsg });
      announce(errMsg, 'assertive');
    } finally {
      setMutatingKind(null);
    }
  };

  return (
    <section aria-labelledby="academic-catalog-title" className="space-y-6 animate-fade-in-up">
      <Card variant="outlined" padding="lg" className="rounded-2xl p-5 sm:p-6 space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-brand-navy bg-blue-100 border border-blue-200">
          <Building2 className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
          <span>Gestión Dinámica de Sedes y Carreras Duoc UC</span>
        </div>
        <h2 id="academic-catalog-title" className={ADMIN_THEME.moduleTitle}>Administración de Carreras y Sedes Oficiales Duoc UC</h2>
        <p className={ADMIN_THEME.moduleSubtitle}>Agrega, edita y gestiona carreras y sedes oficiales de Duoc UC. Toda modificación espera confirmación del servidor antes de aplicarse.</p>
      </Card>

      {statusFeedback && (
        <div
          role={statusFeedback.type === 'error' ? 'alert' : 'status'}
          aria-live={statusFeedback.type === 'error' ? 'assertive' : 'polite'}
          {...getVoiceProps(statusFeedback.text)}
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-xs transition-colors ${statusFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}
        >
          <div className="flex items-center gap-2.5">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" aria-hidden="true" />
            )}
            <span>{statusFeedback.text}</span>
          </div>
          <button type="button" onClick={() => setStatusFeedback(null)} {...getVoiceProps('Cerrar notificación')} className="text-neutral-500 hover:text-neutral-900 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold" aria-label="Cerrar notificación">
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[
          { kind: 'careers', label: 'carrera', items: filteredCareers, totalCount: sortedCareers.length },
          { kind: 'sedes', label: 'sede', items: filteredSedes, totalCount: sortedSedes.length },
        ].map(({ kind, label, items, totalCount }) => (
          <CatalogCrudCard
            key={kind}
            kind={kind}
            canEdit={isAdmin}
            isMutating={mutatingKind === kind}
            items={items}
            totalCount={totalCount}
            newInput={catalogState[kind].newInput}
            searchValue={catalogState[kind].search}
            extraState={catalogState[kind].extra}
            onNewInputChange={(val) => updateCatalogField(kind, { newInput: val })}
            onExtraStateChange={(patch) =>
              updateCatalogField(kind, {
                extra: { ...(catalogState[kind].extra || {}), ...patch },
              })
            }
            onSearchChange={(val) => updateCatalogField(kind, { search: val })}
            onAddSubmit={(e) => handleCatalogAdd(kind, e).catch((err) => { console.error(`[AcademicCatalog] Error agregando ${label}:`, err); })}
            onEditItem={(item, payload) => handleCatalogEdit(kind, item, payload)}
            onDeleteItem={(item) => handleCatalogDelete(kind, item).catch((err) => { console.error(`[AcademicCatalog] Error eliminando ${label}:`, err); })}
            getVoiceProps={getVoiceProps}
          />
        ))}
      </div>
    </section>
  );
};

export default AcademicCatalog;
