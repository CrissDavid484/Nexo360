import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { DUOC_CATEGORIES } from '../data/duocModulesData';
import { VIVO_STUDENT_PROFILE } from '../data/vivoDuocData';
import { ModuleCard } from '../components/dashboard/ModuleCard';
import { ModuleModal } from '../components/dashboard/ModuleModal';
import { SearchBar } from '../components/dashboard/SearchBar';
import { UnifiedNavbar } from '../components/common/UnifiedNavbar';
import { AccessibilityBar } from '../components/common/AccessibilityBar';

// Vistas complementarias
import { BibliotecaView } from '../components/views/BibliotecaView';
import { SolicitudesView } from '../components/views/SolicitudesView';
import { PerfilView } from '../components/views/PerfilView';
import { VivoDuocSummaryView } from '../components/views/VivoDuocSummaryView';

import {
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  Clock,
  BookMarked,
  FilePlus,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('centro-ayuda');
  const [isA11yOpen, setIsA11yOpen] = useState(false);

  // Estados para el Centro de Ayuda y Módulos Institucionales
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [faqExpanded, setFaqExpanded] = useState(null);

  // Preguntas frecuentes del Centro de Ayuda Duoc UC (ayuda.duoc.cl)
  const officialDuocFaqs = [
    {
      q: '¿Cómo funciona la justificación de inasistencias por salud o terapias?',
      a: 'Tienes hasta 5 días hábiles desde ocurrida la inasistencia para ingresar a la pestaña "Solicitudes Académicas" de Nexo360, adjuntando tu licencia médica o certificado de terapias. Al estar en PAEDIS Sede Alameda, tu solicitud cuenta con prioridad accesible.',
    },
    {
      q: '¿Cómo reservo una sala de estudio en Sede Alameda y cómo registro mi ingreso?',
      a: 'Ve a la pestaña "Biblioteca (Reserva de Salas)", elige Biblioteca Alameda y tu bloque de horario. Recibirás un código como RES-ALM-8942 con el cual puedes hacer clic en "Registra el ingreso" al llegar a la biblioteca.',
    },
    {
      q: '¿Dónde revalido mi pase escolar TNE o consulto sobre Gratuidad?',
      a: 'La revalidación TNE se hace en los tótems Bip habilitados en el hall de Sede Alameda. Para Gratuidad o Crédito CAE, asegúrate de firmar tu pagaré semestral en el portal de pagos de Duoc UC.',
    },
    {
      q: '¿Cómo puedo simular mi toma de ramos antes del día oficial?',
      a: 'Nexo360 incorporará un simulador idéntico de toma de ramos para que los alumnos de PAEDIS Alameda planifiquen sus horarios y secciones con total tranquilidad y sin estrés.',
    },
  ];

  // Filtrado reactivo de módulos institucionales
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
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-colors">
      {/* 1. Barra de Accesibilidad PAEDIS (desplegable) */}
      {isA11yOpen && (
        <div className="border-b border-amber-400/40 bg-slate-900">
          <AccessibilityBar />
        </div>
      )}

      {/* 2. Barra Superior Unificada con Pestañas Rápidas */}
      <UnifiedNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isA11yOpen={isA11yOpen}
        onToggleAccessibility={() => setIsA11yOpen(!isA11yOpen)}
      />

      {/* 3. Contenido Principal */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* PESTAÑA 1: CENTRO DE AYUDA Y MÓDULOS INSTITUCIONALES (EL CORAZÓN DE NEXO360) */}
        {activeTab === 'centro-ayuda' && (
          <div className="space-y-8">
            {/* Banner de Estado del Estudiante PAEDIS Sede Alameda */}
            <section
              aria-labelledby="paedis-summary-heading"
              className="bg-gradient-to-r from-[#002B49] via-[#0b3152] to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border-2 border-amber-400"
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-amber-400 text-slate-950 font-black text-xs px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                      Estudiante Activo PAEDIS
                    </span>
                    <span className="text-slate-300 text-xs hidden sm:inline">
                      Periodo Académico 2026 • Sede Alameda
                    </span>
                  </div>

                  <h1 id="paedis-summary-heading" className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                    ¡Bienvenido, {user?.nombre || VIVO_STUDENT_PROFILE.nombre}!
                  </h1>

                  <p className="mt-2 text-slate-200 text-sm sm:text-base max-w-2xl font-medium leading-relaxed">
                    Plataforma Centralizada de Accesibilidad Universal y Autonomía Digital: realiza trámites directamente mediante scraping, reserva salas de biblioteca y consulta tu avance académico en un solo lugar.
                  </p>
                </div>

                {/* Tarjeta de Autonomía y Acreditación PAEDIS Alameda (Reemplaza a Tutorías) */}
                <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-2xl w-full lg:w-auto min-w-[280px]">
                  <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block mb-1">
                    Acreditación PAEDIS Alameda
                  </span>
                  <p className="font-extrabold text-base text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-400" aria-hidden="true" />
                    Autonomía y Accesibilidad Total
                  </p>
                  <p className="text-xs text-slate-300 mt-1">
                    Trámites 100% integrados sin intermediarios ni webs externas
                  </p>
                </div>
              </div>
            </section>

            {/* BARRA DE ACCESOS RÁPIDOS VIVO DUOC */}
            <section aria-label="Accesos rápidos a servicios oficiales">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* 1. Asistencia */}
                <button
                  type="button"
                  onClick={() => setActiveTab('vivo-duoc')}
                  className="bg-white p-4 rounded-2xl border-2 border-slate-200 hover:border-[#002B49] text-left transition-all hover:shadow-md flex items-center justify-between group focus:ring-4 focus:ring-amber-400"
                >
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      Mi Asistencia
                    </span>
                    <span className="text-xl font-black text-slate-900 block mt-0.5">
                      Capstone 88.9%
                    </span>
                    <span className="text-xs text-emerald-700 font-semibold">
                      ✓ Asistencia Cumpliendo
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center group-hover:bg-[#002B49] group-hover:text-amber-400 transition-colors">
                    <CheckSquare className="w-5 h-5" />
                  </div>
                </button>

                {/* 2. Biblioteca */}
                <button
                  type="button"
                  onClick={() => setActiveTab('biblioteca')}
                  className="bg-white p-4 rounded-2xl border-2 border-slate-200 hover:border-[#002B49] text-left transition-all hover:shadow-md flex items-center justify-between group focus:ring-4 focus:ring-amber-400"
                >
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      Biblioteca Duoc UC
                    </span>
                    <span className="text-xl font-black text-slate-900 block mt-0.5">
                      Reserva de Salas
                    </span>
                    <span className="text-xs text-amber-700 font-semibold">
                      Alameda • Check-in
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center group-hover:bg-[#002B49] group-hover:text-amber-400 transition-colors">
                    <BookMarked className="w-5 h-5" />
                  </div>
                </button>

                {/* 3. Horarios */}
                <button
                  type="button"
                  onClick={() => setActiveTab('vivo-duoc')}
                  className="bg-white p-4 rounded-2xl border-2 border-slate-200 hover:border-[#002B49] text-left transition-all hover:shadow-md flex items-center justify-between group focus:ring-4 focus:ring-amber-400"
                >
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      Mis Horarios
                    </span>
                    <span className="text-xl font-black text-slate-900 block mt-0.5">
                      Miércoles 18:45
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Sala 402 • Capstone Alameda
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#002B49] flex items-center justify-center group-hover:bg-[#002B49] group-hover:text-amber-400 transition-colors">
                    <Clock className="w-5 h-5" />
                  </div>
                </button>

                {/* 4. Solicitud Rápida */}
                <button
                  type="button"
                  onClick={() => setActiveTab('solicitudes')}
                  className="bg-white p-4 rounded-2xl border-2 border-slate-200 hover:border-[#002B49] text-left transition-all hover:shadow-md flex items-center justify-between group focus:ring-4 focus:ring-amber-400"
                >
                  <div>
                    <span className="text-[11px] font-bold text-slate-500 uppercase block">
                      Gestión Académica
                    </span>
                    <span className="text-xl font-black text-slate-900 block mt-0.5">
                      Nueva Solicitud
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      Justificativos y Notas
                    </span>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center group-hover:bg-[#002B49] group-hover:text-amber-400 transition-colors">
                    <FilePlus className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </section>

            {/* Barra de Búsqueda Accesible del Centro de Ayuda (Corregida sin solapamiento de lupa) */}
            <section aria-label="Buscador de trámites y centro de ayuda">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                resultsCount={filteredCategories.length}
              />
            </section>

            {/* Grilla de las 9 Categorías Institucionales de Duoc UC */}
            <section aria-labelledby="modules-grid-heading">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 id="modules-grid-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Centro de Ayuda & Módulos Institucionales Duoc UC
                  </h2>
                  <p className="text-sm text-slate-600 font-medium">
                    Haz clic en cualquier tarjeta para realizar el trámite directamente mediante scraping sin salir de la plataforma.
                  </p>
                </div>
                <span className="text-sm font-bold text-slate-500 hidden sm:inline">
                  Mostrando {filteredCategories.length} de 9 módulos
                </span>
              </div>

              {filteredCategories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-slate-300 p-8">
                  <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-slate-800">No encontramos trámites con esa palabra</h3>
                  <p className="text-sm text-slate-500 mt-1">
                    Prueba buscando "toma de ramos", "gratuidad", "PAEDIS", "asistencia" o "biblioteca".
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="mt-4 px-4 py-2 bg-[#002B49] text-white text-sm font-bold rounded-lg focus:ring-4 focus:ring-amber-400"
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

            {/* SECCIÓN PREGUNTAS FRECUENTES DEL CENTRO DE AYUDA OFICIAL */}
            <section
              aria-labelledby="faqs-heading"
              className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-200 shadow-md space-y-4"
            >
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <HelpCircle className="w-6 h-6 text-amber-700" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="faqs-heading" className="text-xl sm:text-2xl font-black text-slate-900">
                    Preguntas Frecuentes del Centro de Ayuda Duoc UC
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Respuestas oficiales para estudiantes de Duoc UC Sede Alameda
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {officialDuocFaqs.map((faq, idx) => {
                  const isOpen = faqExpanded === idx;
                  return (
                    <div key={idx} className="py-4">
                      <button
                        type="button"
                        onClick={() => setFaqExpanded(isOpen ? null : idx)}
                        className="w-full flex items-center justify-between text-left gap-4 font-bold text-slate-900 text-sm sm:text-base hover:text-[#002B49] focus:outline-none focus:ring-2 focus:ring-[#002B49] rounded p-1"
                        aria-expanded={isOpen}
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-slate-500 shrink-0" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {isOpen && (
                        <div className="mt-3 pl-3 border-l-2 border-amber-400 text-xs sm:text-sm text-slate-600 leading-relaxed animate-fadeIn">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}

        {/* PESTAÑA 2: BIBLIOTECA DUOC (RESERVA DE SALAS & CHECK-IN/OUT) */}
        {activeTab === 'biblioteca' && <BibliotecaView />}

        {/* PESTAÑA 3: MI VIVO DUOC (NOTAS, ASISTENCIA, HORARIOS) */}
        {activeTab === 'vivo-duoc' && (
          <VivoDuocSummaryView initialTab="asistencia" onNavigate={setActiveTab} />
        )}

        {/* PESTAÑA 4: SOLICITUDES ACADÉMICAS */}
        {activeTab === 'solicitudes' && <SolicitudesView onNavigate={setActiveTab} />}

        {/* PESTAÑA 5: MI PERFIL */}
        {activeTab === 'perfil' && <PerfilView />}
      </main>

      {/* Modal Interactivo de Submenús Institucionales con Tramitación Directa por Scraping */}
      {selectedCategory && (
        <ModuleModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      {/* Pie de Página Institucional */}
      <footer className="bg-slate-900 text-slate-400 py-6 px-4 border-t-4 border-amber-400 mt-auto text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-bold text-slate-200">
              Nexo360 • Centro de Ayuda Centralizado Duoc UC PAEDIS Alameda
            </p>
            <p className="text-slate-400 mt-0.5">
              Diseñado con accesibilidad universal WCAG 2.2 AA y automatización headless.
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-slate-300">
              Mesa de Ayuda PAEDIS Alameda: <span className="font-bold text-amber-400">paedis.alameda@duoc.cl</span>
            </p>
            <p className="text-slate-500 mt-0.5">
              Sede Alameda • Periodo Académico 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
