import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronDown, GraduationCap, MapPin, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';
import { DEFAULT_CAMPUS } from '../../utils/studentUtils';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2';

const ENTITY_KINDS = {
  careers: {
    title: 'Carreras',
    singular: 'carrera',
    icon: GraduationCap,
    listKey: 'careers',
    fetch: () => api.getAdminCareers(),
    create: (name) => api.createAdminCareer({ name, school: `Escuela Duoc UC - ${DEFAULT_CAMPUS}` }),
    remove: (key) => api.deleteAdminCareer(key),
  },
  sedes: {
    title: 'Sedes',
    singular: 'sede',
    icon: MapPin,
    listKey: 'sedes',
    fetch: () => api.getAdminSedes(),
    create: (name) => api.createAdminSede({ name, city: 'Región Metropolitana' }),
    remove: (key) => api.deleteAdminSede(key),
  },
};

const itemKey = (item) => item._id || item.id || item.name;

const EntityList = ({ kind, items, canManage, onAdd, onDelete }) => {
  const { getVoiceProps } = useAccessibility();
  const cfg = ENTITY_KINDS[kind];
  const [name, setName] = useState('');
  const Icon = cfg.icon;

  const handleSubmit = (e) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    onAdd(kind, clean)
      .then((ok) => ok && setName(''))
      .catch((err) => console.error('[CatalogEntitiesPanel] Error agregando:', err));
  };

  return (
    <section aria-labelledby={`entity-${kind}-title`} className="space-y-3">
      <h3 id={`entity-${kind}-title`} className="flex items-center gap-2 text-sm font-black text-slate-950">
        <Icon className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
        {cfg.title} ({items.length})
      </h3>

      {canManage && (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <label htmlFor={`entity-${kind}-input`} className="sr-only">
            Nombre de la nueva {cfg.singular}
          </label>
          <input
            id={`entity-${kind}-input`}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={`Nombre de la nueva ${cfg.singular}`}
            {...getVoiceProps(`Escribir nombre de la nueva ${cfg.singular}`)}
            className={`flex-1 min-w-0 min-h-[44px] px-3 py-2 rounded-xl border border-slate-400 text-sm text-slate-900 ${FOCUS_RING}`}
          />
          <button
            type="submit"
            {...getVoiceProps(`Agregar ${cfg.singular}`)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold bg-[#002B49] text-white inline-flex items-center justify-center gap-2 cursor-pointer ${FOCUS_RING}`}
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Agregar</span>
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-xs text-slate-700">No hay {cfg.title.toLowerCase()} registradas.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-xl border border-slate-300 bg-white max-h-64 overflow-y-auto">
          {items.map((item) => (
            <li key={itemKey(item)} className="flex items-center justify-between gap-2 p-2.5">
              <span className="text-sm font-semibold text-slate-900 break-words min-w-0">{item.name}</span>
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
 * Sección secundaria (colapsada por defecto) para gestionar Carreras y Sedes.
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
    const results = await Promise.allSettled(Object.keys(ENTITY_KINDS).map(loadKind));
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

  const handleAdd = (kind, name) => {
    const cfg = ENTITY_KINDS[kind];
    return runMutation(
      kind,
      () => cfg.create(name),
      `Se agregó la ${cfg.singular} "${name}".`,
      `No se pudo agregar la ${cfg.singular}.`
    );
  };

  const handleDelete = (kind, item) => {
    const cfg = ENTITY_KINDS[kind];
    requestConfirm({
      title: `¿Eliminar la ${cfg.singular} "${item.name}"?`,
      message: `Se quitará "${item.name}" del registro institucional. Esta acción no se puede deshacer.`,
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
            `Administrar carreras y sedes, opciones avanzadas. ${isOpen ? 'Expandido' : 'Contraído'}`
          )}
          className={`w-full min-h-[44px] flex items-center justify-between gap-3 text-left rounded-xl cursor-pointer ${FOCUS_RING}`}
        >
          <span>
            Administrar carreras y sedes
            <span className="block text-xs font-normal text-slate-700">
              Opciones avanzadas. Normalmente no necesitas cambiarlas.
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
                Cargando carreras y sedes…
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
