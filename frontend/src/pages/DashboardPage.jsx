import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DUOC_CATEGORIES } from '../data/duocModulesData';
import { ModuleCard } from '../components/dashboard/ModuleCard';
import { ModuleModal } from '../components/dashboard/ModuleModal';
import { SearchBar } from '../components/dashboard/SearchBar';
import {
  Sparkles,
  ShieldCheck,
  Calendar,
  HeartHandshake,
  CheckCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Filtrado reactivo accesible de categorías y submenús
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return DUOC_CATEGORIES;

    const term = searchTerm.toLowerCase();
    return DUOC_CATEGORIES.filter((category) => {
      const matchTitle = category.title.toLowerCase().includes(term);
      const matchDesc = category.description.toLowerCase().includes(term);
      const matchSubmodules = category.submodules.some(
        (sub) =>
          sub.title.toLowerCase().includes(term) ||
          sub.description.toLowerCase().includes(term) ||
          (sub.paedisSupport && sub.paedisSupport.toLowerCase().includes(term))
      );
      return matchTitle || matchDesc || matchSubmodules;
    });
  }, [searchTerm]);

  return (
    <main id="main-content" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Banner de Estado del Estudiante PAEDIS */}
      <section
        aria-labelledby="paedis-summary-heading"
        className="bg-gradient-to-r from-duoc-navy to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-400 mb-8"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                Estudiante Activo PAEDIS
              </span>
              <span className="text-slate-300 text-xs hidden sm:inline">
                Periodo Académico 2026
              </span>
            </div>

            <h1 id="paedis-summary-heading" className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              ¡Bienvenido/a, {user?.nombre || 'Estudiante Duoc UC'}!
            </h1>

            <p className="mt-2 text-slate-200 text-sm sm:text-base max-w-2xl font-medium">
              Tu portal centralizado One-Stop-Shop reúne todos los servicios institucionales con ajustes de accesibilidad garantizados.
            </p>
          </div>

          {/* Tarjeta de Acompañamiento PAEDIS */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl w-full lg:w-auto min-w-[280px]">
            <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-1">
              Tutoría PAR Asignada
            </span>
            <p className="font-extrabold text-base text-white flex items-center gap-2">
              <HeartHandshake className="w-5 h-5 text-amber-400" aria-hidden="true" />
              {user?.paedis?.tutorParAsignado || 'Tania Montes (Tutor PAR)'}
            </p>
            <p className="text-xs text-slate-300 mt-1">
              Ajustes: Tiempo adicional en pruebas y formato accesible
            </p>
          </div>
        </div>
      </section>

      {/* Barra de Búsqueda Accesible */}
      <section aria-label="Buscador de trámites y servicios institucionales">
        <SearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          resultsCount={filteredCategories.length}
        />
      </section>

      {/* Grilla de Navegación por Tarjetas Grandes (9 Categorías Institucionales) */}
      <section aria-labelledby="modules-grid-heading" className="my-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 id="modules-grid-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Módulos Institucionales Duoc UC
            </h2>
            <p className="text-sm text-slate-600 font-medium">
              Selecciona una tarjeta para explorar todos sus trámites, reglamentos y accesos directos.
            </p>
          </div>
          <span className="text-sm font-bold text-slate-500 hidden sm:inline">
            Mostrando {filteredCategories.length} de 9 módulos
          </span>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8">
            <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" aria-hidden="true" />
            <h3 className="text-lg font-bold text-slate-800">No encontramos resultados</h3>
            <p className="text-sm text-slate-500 mt-1">
              Intenta buscar con otra palabra clave como "toma de ramos", "arancel", "PAEDIS" o "licencias".
            </p>
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="mt-4 px-4 py-2 bg-duoc-navy text-white text-sm font-bold rounded-lg focus:ring-4 focus:ring-amber-400"
            >
              Ver todos los módulos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((category) => (
              <ModuleCard
                key={category.id}
                category={category}
                onSelect={(cat) => setSelectedCategory(cat)}
              />
            ))}
          </div>
        )}
      </section>

      {/* Módulo Especial Destacado: Acceso Rápido a Vida Académica */}
      <section
        aria-labelledby="highlight-academic-heading"
        className="my-10 bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-md"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl bg-amber-100 text-amber-800">
            <BookOpen className="w-6 h-6" aria-hidden="true" />
          </div>
          <div>
            <h2 id="highlight-academic-heading" className="text-xl sm:text-2xl font-black text-slate-900">
              Trámites Académicos Frecuentes 2026
            </h2>
            <p className="text-xs text-slate-500">
              Accesos prioritarios a los submenús más consultados por los estudiantes
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: 'Inscripción Asignaturas', link: 'https://experienciavivo.duoc.cl/toma-ramos' },
            { name: 'Calendario 2026', link: 'https://www.duoc.cl/alumnos/calendario-academico/' },
            { name: 'Notas y Exámenes', link: 'https://experienciavivo.duoc.cl/notas' },
            { name: 'Asistencia y Justificativos', link: 'https://experienciavivo.duoc.cl/asistencia' },
            { name: 'Créditos y Becas', link: 'https://experienciavivo.duoc.cl/financiamiento' },
            { name: 'Revalidación TNE', link: 'https://www.tne.cl/' },
          ].map((item, idx) => (
            <a
              key={idx}
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="p-3 text-center rounded-xl bg-slate-50 hover:bg-duoc-navy hover:text-white border border-slate-200 hover:border-duoc-navy transition-all font-bold text-xs text-slate-800 flex flex-col justify-center items-center gap-1 focus:ring-4 focus:ring-amber-400"
            >
              <CheckCircle className="w-4 h-4 text-amber-500" aria-hidden="true" />
              <span>{item.name}</span>
            </a>
          ))}
        </div>
      </section>

      {/* Modal Interactivo de Submenús */}
      {selectedCategory && (
        <ModuleModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}
    </main>
  );
};
