import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, GraduationCap, MapPin, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';
import {
  CHILE_REGIONS,
  CHILE_REGIONS_CITIES,
  CHILE_CITIES_BY_REGION,
  getCitiesForRegion,
  DUOC_SCHOOLS,
  getSchoolForCareer,
  getCatalogItemSubtitle,
} from '../../utils/studentUtils';

export { CHILE_CITIES_BY_REGION };

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2';

const ENTITY_KINDS = {
  careers: {
    title: 'Carreras Duoc UC',
    singular: 'carrera',
    icon: GraduationCap,
    listKey: 'careers',
    fetch: () => api.getAdminCareers(),
    create: (payload) =>
      api.createAdminCareer(
        typeof payload === 'string'
          ? { name: payload, school: getSchoolForCareer(payload) }
          : payload
      ),
    remove: (key) => api.deleteAdminCareer(key),
  },
  sedes: {
    title: 'Sedes Duoc UC',
    singular: 'sede',
    icon: MapPin,
    listKey: 'sedes',
    fetch: () => api.getAdminSedes(),
    create: (payload) =>
      api.createAdminSede(
        typeof payload === 'string'
          ? { name: payload, region: 'Región Metropolitana', city: 'Santiago' }
          : payload
      ),
    remove: (key) => api.deleteAdminSede(key),
  },
};

const itemKey = (item) => item._id || item.id || item.name;

const CareerForm = ({ canManage, onAdd, getVoiceProps }) => {
  const [name, setName] = useState('');
  const [school, setSchool] = useState(DUOC_SCHOOLS[0]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName) return;
    onAdd('careers', { name: cleanName, school })
      .then((ok) => {
        if (ok) {
          setName('');
          setSchool(DUOC_SCHOOLS[0]);
        }
      })
      .catch((err) => console.error('[CatalogEntitiesPanel] Error agregando carrera:', err));
  };

  if (!canManage) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label htmlFor="entity-career-name" className="block text-xs font-bold text-slate-800 mb-1">
            Nombre de la carrera
          </label>
          <input
            id="entity-career-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Ingeniería en Inteligencia Artificial"
            {...getVoiceProps('Escribir nombre de la nueva carrera')}
            className={`w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-400 text-sm text-slate-900 bg-white ${FOCUS_RING}`}
          />
        </div>
        <div>
          <label htmlFor="entity-career-school" className="block text-xs font-bold text-slate-800 mb-1">
            Escuela oficial Duoc UC
          </label>
          <select
            id="entity-career-school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            {...getVoiceProps('Seleccionar escuela oficial para la carrera')}
            className={`w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-400 text-sm text-slate-900 bg-white ${FOCUS_RING}`}
          >
            {DUOC_SCHOOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        {...getVoiceProps('Agregar carrera oficial')}
        className={`w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl text-sm font-bold bg-[#002B49] text-white inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs ${FOCUS_RING}`}
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span>Agregar Carrera</span>
      </button>
    </form>
  );
};

const SedeForm = ({ canManage, onAdd, getVoiceProps }) => {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('');
  const [city, setCity] = useState('');

  const availableCities = getCitiesForRegion(region);

  const handleSubmit = (e) => {
    e.preventDefault();
    const cleanName = name.trim();
    if (!cleanName || !region || !city) return;

    onAdd('sedes', { name: cleanName, region, city })
      .then((ok) => {
        if (ok) {
          setName('');
          setRegion('');
          setCity('');
        }
      })
      .catch((err) => console.error('[CatalogEntitiesPanel] Error agregando sede:', err));
  };

  if (!canManage) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-2 bg-slate-50 p-3 rounded-2xl border border-slate-200">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-1">
          <label htmlFor="entity-sede-name" className="block text-xs font-bold text-slate-800 mb-1">
            Nombre de la sede
          </label>
          <input
            id="entity-sede-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej. Campus Villarrica"
            {...getVoiceProps('Escribir nombre de la nueva sede')}
            className={`w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-400 text-sm text-slate-900 bg-white ${FOCUS_RING}`}
          />
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="entity-sede-region" className="block text-xs font-bold text-slate-800 mb-1">
            Región (16 de Chile)
          </label>
          <select
            id="entity-sede-region"
            required
            value={region}
            onChange={(e) => {
              const newReg = e.target.value;
              setRegion(newReg);
              setCity('');
            }}
            {...getVoiceProps('Seleccionar región de Chile')}
            className={`w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-400 text-sm text-slate-900 bg-white ${FOCUS_RING}`}
          >
            <option value="">Selecciona una región...</option>
            {CHILE_REGIONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-1">
          <label htmlFor="entity-sede-city" className="block text-xs font-bold text-slate-800 mb-1">
            Ciudad / Comuna
          </label>
          <select
            id="entity-sede-city"
            required
            disabled={!region}
            value={city}
            onChange={(e) => setCity(e.target.value)}
            {...getVoiceProps('Seleccionar ciudad o comuna')}
            className={`w-full min-h-[44px] px-3 py-2 rounded-xl border border-slate-400 text-sm text-slate-900 bg-white disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed ${FOCUS_RING}`}
          >
            <option value="">
              {region ? 'Selecciona una ciudad / comuna...' : 'Primero selecciona una región...'}
            </option>
            {availableCities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>
      <button
        type="submit"
        {...getVoiceProps('Agregar sede oficial')}
        className={`w-full sm:w-auto min-h-[44px] px-5 py-2 rounded-xl text-sm font-bold bg-[#002B49] text-white inline-flex items-center justify-center gap-2 cursor-pointer shadow-xs ${FOCUS_RING}`}
      >
        <Plus className="w-4 h-4" aria-hidden="true" />
        <span>Agregar Sede</span>
      </button>
    </form>
  );
};

const EntityList = ({ kind, items, canManage, onAdd, onDelete }) => {
  const { getVoiceProps } = useAccessibility();
  const cfg = ENTITY_KINDS[kind];
  const Icon = cfg.icon;

  const getItemSubtitle = (item) => getCatalogItemSubtitle(kind, item);

  return (
    <section aria-labelledby={`entity-${kind}-title`} className="space-y-3">
      <h3 id={`entity-${kind}-title`} className="flex items-center gap-2 text-sm font-black text-slate-950">
        <Icon className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
        {cfg.title} ({items.length})
      </h3>

      {kind === 'careers' ? (
        <CareerForm canManage={canManage} onAdd={onAdd} getVoiceProps={getVoiceProps} />
      ) : (
        <SedeForm canManage={canManage} onAdd={onAdd} getVoiceProps={getVoiceProps} />
      )}

      {items.length === 0 ? (
        <p className="text-xs text-slate-700">No hay {cfg.title.toLowerCase()} registradas.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-300 bg-white max-h-64 overflow-y-auto">
          {items.map((item) => (
            <li key={itemKey(item)} className="flex items-center justify-between gap-2 p-2.5 hover:bg-slate-50">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-slate-900 break-words block">{item.name}</span>
                <span className="text-xs text-slate-600 block truncate">{getItemSubtitle(item)}</span>
              </div>
              {canManage && (
                <button
                  type="button"
                  onClick={() => onDelete(kind, item)}
                  aria-label={`Eliminar ${cfg.singular} ${item.name}`}
                  {...getVoiceProps(`Eliminar ${cfg.singular} ${item.name}`)}
                  className={`min-h-[44px] min-w-[44px] shrink-0 inline-flex items-center justify-center rounded-xl text-red-800 hover:bg-red-50 border border-red-300 cursor-pointer ${FOCUS_RING}`}
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

/**
 * Sección secundaria (colapsada por defecto) para gestionar Carreras y Sedes oficiales Duoc UC a nivel nacional.
 * Eliminar exige confirmación mediante `requestConfirm` (diálogo en la sección padre).
 */
export const CatalogEntitiesPanel = ({ canManage, requestConfirm, notify }) => {
  const { getVoiceProps } = useAccessibility();
  const [isOpen, setIsOpen] = useState(false);
  const [lists, setLists] = useState({ careers: [], sedes: [] });
  const [isLoading, setIsLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const loadKind = useCallback(async (kind) => {
    const cfg = ENTITY_KINDS[kind];
    const res = await cfg.fetch();
    const list = res?.success && Array.isArray(res[cfg.listKey]) ? res[cfg.listKey] : [];
    if (isMountedRef.current) setLists((prev) => ({ ...prev, [kind]: list }));
  }, []);

  const loadAll = useCallback(async () => {
    setIsLoading(true);
    const results = await Promise.allSettled(Object.keys(ENTITY_KINDS).map((kind) => loadKind(kind)));
    results.forEach((r) => {
      if (r.status === 'rejected') console.warn('[CatalogEntitiesPanel] Error cargando listado:', r.reason);
    });
    if (isMountedRef.current) setIsLoading(false);
  }, [loadKind]);

  const toggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next && !hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadAll().catch((err) => console.error('[CatalogEntitiesPanel] Error inicial:', err));
    }
  };

  // Devuelve true si el backend confirmó el cambio y la lista fue refrescada.
  const runMutation = useCallback(
    async (kind, call, okText, failText) => {
      try {
        const res = await call();
        if (!res?.success) {
          notify('error', res?.message || failText);
          return false;
        }
        await loadKind(kind);
        notify('success', okText);
        return true;
      } catch (err) {
        console.error('[CatalogEntitiesPanel] Error de conexión:', err);
        notify('error', failText);
        return false;
      }
    },
    [loadKind, notify]
  );

  const handleAdd = (kind, payload) => {
    const cfg = ENTITY_KINDS[kind];
    const itemName = typeof payload === 'object' && payload !== null ? payload.name : payload;
    return runMutation(
      kind,
      () => cfg.create(payload),
      `Se agregó la ${cfg.singular} "${itemName}".`,
      `No se pudo agregar la ${cfg.singular}.`
    );
  };

  const handleDelete = (kind, item) => {
    const cfg = ENTITY_KINDS[kind];
    requestConfirm({
      title: `¿Eliminar la ${cfg.singular} "${item.name}"?`,
      message: `Se quitará "${item.name}" del registro institucional oficial. Esta acción no se puede deshacer.`,
      confirmLabel: `Sí, eliminar ${cfg.singular}`,
      run: () =>
        runMutation(
          kind,
          () => cfg.remove(itemKey(item)),
          `Se eliminó la ${cfg.singular} "${item.name}".`,
          `No se pudo eliminar la ${cfg.singular}.`
        ),
    });
  };

  return (
    <section className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-300 shadow-xs">
      <h2 className="text-base sm:text-lg font-bold text-slate-950">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls="catalog-entities-body"
          {...getVoiceProps(
            `Administrar catálogo oficial de carreras y sedes Duoc UC a nivel nacional. ${isOpen ? 'Expandido' : 'Contraído'}`
          )}
          className={`w-full min-h-[44px] flex items-center justify-between gap-3 text-left rounded-xl cursor-pointer ${FOCUS_RING}`}
        >
          <span>
            Administrar Carreras y Sedes Oficiales Duoc UC
            <span className="block text-xs font-normal text-slate-700">
              Catálogo oficial a nivel nacional (20 sedes y 9 escuelas). Opciones avanzadas.
            </span>
          </span>
          <ChevronDown
            className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>
      </h2>

      <div id="catalog-entities-body" hidden={!isOpen} className="mt-4">
        {isOpen && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {isLoading && (
              <p role="status" className="text-xs text-slate-700 lg:col-span-2">
                Cargando catálogo oficial de carreras y sedes…
              </p>
            )}
            {Object.keys(ENTITY_KINDS).map((kind) => (
              <EntityList
                key={kind}
                kind={kind}
                items={lists[kind]}
                canManage={canManage}
                onAdd={handleAdd}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CatalogEntitiesPanel;
