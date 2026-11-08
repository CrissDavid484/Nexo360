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
import { ServiciosDigitalesTicketsView } from '../components/views/ServiciosDigitalesTicketsView';
import { PerfilView } from '../components/views/PerfilView';
import { VivoDuocSummaryView } from '../components/views/VivoDuocSummaryView';

import {
  HelpCircle,
  Clock,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Laptop,
  Calendar,
} from 'lucide-react';

export const DashboardPage = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('centro-ayuda');

  // Estados para el Centro de Ayuda y Módulos Institucionales
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [faqExpanded, setFaqExpanded] = useState(null);

  // Preguntas frecuentes oficiales del Centro de Ayuda Duoc UC
  const officialDuocFaqs = [
    {
      q: '¿Cómo funciona la justificación de inasistencias por salud o fuerza mayor?',
      a: 'Tienes hasta 5 días hábiles desde ocurrida la inasistencia para presentar tu certificado médico o respaldo formal en la coordinación docente de Sede Alameda.',
    },
    {
      q: '¿Cómo reservo una sala de estudio en Sede Alameda y cómo registro mi ingreso?',
      a: 'Ingresa a la pestaña "Biblioteca (Instrucciones & Acceso)" para seguir los pasos oficiales. Puedes reservar salas grupales o individuales y confirmar tu asistencia en el mesón de biblioteca.',
    },
    {
      q: '¿Dónde revalido mi pase escolar TNE o consulto sobre Gratuidad?',
      a: 'La revalidación TNE se realiza en los tótems Bip habilitados en el hall de Sede Alameda o en puntos Metro. Para Gratuidad o CAE, asegúrate de firmar tu pagaré semestral en el portal de pagos de Duoc UC.',
    },
    {
      q: '¿Cómo puedo simular mi toma de ramos antes del día oficial?',
      a: 'Revisa tu tramo de inscripción en Experiencia Vivo Duoc para planificar con anticipación las secciones y horarios más convenientes para tu semestre.',
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
          sub.description.toLowerCase().includes(term)
      );
      return matchTitle || matchDesc || matchSubmodules;
    });
  }, [searchTerm]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-colors">
      {/* 1. Barra de Accesibilidad Universal Permanentemente Visible */}
      <AccessibilityBar />

      {/* 2. Barra Superior Unificada con Pestañas Rápidas */}
      <UnifiedNavbar
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* 3. Contenido Principal Semántico */}
      <main id="main-content" className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* PESTAÑA 1: CENTRO DE AYUDA Y MÓDULOS INSTITUCIONALES */}
        {activeTab === 'centro-ayuda' && (
          <div className="space-y-8">
            {/* Banner Principal de Bienvenida (Ajustado, centrado y limpio) */}
            <section
              aria-labelledby="main-summary-heading"
              className="bg-gradient-to-r from-[#002B49] via-[#09355c] to-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-xl border-4 border-[#FFB81C]"
            >
              <div className="max-w-4xl">
                {/* Píldora de periodo académico oficial */}
                <div className="mb-3">
                  <span className="bg-[#FFB81C] text-slate-950 font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-xs">
                    <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Periodo Académico 2026 • Sede Alameda</span>
                  </span>
                </div>

                {/* Único <h1> de la vista con el nombre oficial del estudiante */}
                <h1 id="main-summary-heading" className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white">
                  ¡Bienvenido, {user?.nombre || VIVO_STUDENT_PROFILE.nombre}!
                </h1>

                <p className="mt-3 text-slate-200 text-sm sm:text-base lg:text-lg font-medium leading-relaxed max-w-3xl">
                  Plataforma Centralizada de Información y Servicios Institucionales: consulta instrucciones de trámites, revisa tus accesos de biblioteca, orientaciones de Vivo Duoc y gestiona tickets de soporte a servicios digitales en un solo lugar.
                </p>
              </div>
            </section>

            {/* BARRA DE ACCESOS RÁPIDOS VIVO DUOC (3 tarjetas balanceadas sin tarjeta de biblioteca) */}
            <section aria-labelledby="quick-access-heading">
              <h2 id="quick-access-heading" className="sr-only">
                Accesos rápidos a servicios oficiales
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 1. Mi Asistencia */}
                <button
                  type="button"
                  onClick={() => setActiveTab('vivo-duoc')}
                  className="min-h-[88px] bg-white p-6 rounded-2xl border-2 border-slate-300 hover:border-[#002B49] text-left transition-all hover:shadow-lg flex items-center justify-between group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                >
                  <div>
                    <span className="text-xs font-black text-slate-700 uppercase block tracking-wider">
                      Mi Asistencia
                    </span>
                    <span className="text-2xl font-black text-slate-950 block mt-0.5">
                      Capstone 88.9%
                    </span>
                    <span className="text-xs text-emerald-800 font-bold mt-1 block">
                      ✓ Asistencia Cumpliendo
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:bg-[#002B49] group-hover:text-[#FFB81C] transition-colors" aria-hidden="true">
                    <CheckSquare className="w-7 h-7" aria-hidden="true" />
                  </div>
                </button>

                {/* 2. Mis Horarios */}
                <button
                  type="button"
                  onClick={() => setActiveTab('vivo-duoc')}
                  className="min-h-[88px] bg-white p-6 rounded-2xl border-2 border-slate-300 hover:border-[#002B49] text-left transition-all hover:shadow-lg flex items-center justify-between group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                >
                  <div>
                    <span className="text-xs font-black text-slate-700 uppercase block tracking-wider">
                      Mis Horarios
                    </span>
                    <span className="text-2xl font-black text-slate-950 block mt-0.5">
                      Miércoles 18:45
                    </span>
                    <span className="text-xs text-slate-700 font-bold mt-1 block">
                      Sala 402 • Capstone Alameda
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-[#002B49] flex items-center justify-center group-hover:bg-[#002B49] group-hover:text-[#FFB81C] transition-colors" aria-hidden="true">
                    <Clock className="w-7 h-7" aria-hidden="true" />
                  </div>
                </button>

                {/* 3. Tickets a Servicios Digitales */}
                <button
                  type="button"
                  onClick={() => setActiveTab('tickets')}
                  className="min-h-[88px] bg-white p-6 rounded-2xl border-2 border-slate-300 hover:border-[#002B49] text-left transition-all hover:shadow-lg flex items-center justify-between group focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                >
                  <div>
                    <span className="text-xs font-black text-slate-700 uppercase block tracking-wider">
                      Soporte Técnico
                    </span>
                    <span className="text-2xl font-black text-slate-950 block mt-0.5">
                      Servicios Digitales
                    </span>
                    <span className="text-xs text-slate-700 font-bold mt-1 block">
                      Cuentas, AVA, WiFi y Software
                    </span>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center group-hover:bg-[#002B49] group-hover:text-[#FFB81C] transition-colors" aria-hidden="true">
                    <Laptop className="w-7 h-7" aria-hidden="true" />
                  </div>
                </button>
              </div>
            </section>

            {/* Barra de Búsqueda Accesible */}
            <section aria-label="Buscador de trámites y centro de ayuda">
              <SearchBar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                resultsCount={filteredCategories.length}
              />
            </section>

            {/* Grilla de las 9 Categorías Institucionales de Duoc UC */}
            <section aria-labelledby="modules-grid-heading">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
                <div>
                  <h2 id="modules-grid-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    Centro de Ayuda & Módulos Institucionales Duoc UC
                  </h2>
                  <p className="text-sm text-slate-700 font-bold mt-1">
                    Selecciona cualquier categoría para conocer las instrucciones de cada trámite y acceder a los enlaces oficiales.
                  </p>
                </div>
                <span className="text-sm font-black text-slate-700 shrink-0">
                  Mostrando {filteredCategories.length} de 9 categorías
                </span>
              </div>

              {filteredCategories.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-slate-300 p-8">
                  <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" aria-hidden="true" />
                  <h3 className="text-lg font-black text-slate-900">No encontramos trámites con esa palabra</h3>
                  <p className="text-sm text-slate-700 mt-1 font-medium">
                    Prueba buscando "toma de ramos", "gratuidad", "asistencia", "certificados" o "software".
                  </p>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="mt-4 min-h-[44px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white text-xs sm:text-sm font-black rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-all"
                  >
                    Ver todas las categorías
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
              <div className="flex items-center gap-3 border-b-2 border-slate-100 pb-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold" aria-hidden="true">
                  <HelpCircle className="w-7 h-7 text-amber-700" aria-hidden="true" />
                </div>
                <div>
                  <h2 id="faqs-heading" className="text-xl sm:text-2xl font-black text-slate-900">
                    Preguntas Frecuentes del Centro de Ayuda Duoc UC
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-700 font-bold">
                    Respuestas y orientaciones para estudiantes de Duoc UC Sede Alameda
                  </p>
                </div>
              </div>

              <div className="divide-y divide-slate-200">
                {officialDuocFaqs.map((faq, idx) => {
                  const isOpen = faqExpanded === idx;
                  const buttonId = `faq-btn-${idx}`;
                  const panelId = `faq-panel-${idx}`;

                  return (
                    <div key={idx} className="py-4">
                      <button
                        id={buttonId}
                        type="button"
                        onClick={() => setFaqExpanded(isOpen ? null : idx)}
                        aria-expanded={isOpen}
                        aria-controls={panelId}
                        className="w-full min-h-[44px] flex items-center justify-between text-left gap-4 font-black text-slate-900 text-sm sm:text-base hover:text-[#002B49] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 rounded-xl p-2"
                      >
                        <span>{faq.q}</span>
                        {isOpen ? (
                          <ChevronUp className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" aria-hidden="true" />
                        )}
                      </button>

                      {isOpen && (
                        <div
                          id={panelId}
                          role="region"
                          aria-labelledby={buttonId}
                          className="mt-3 pl-4 border-l-4 border-[#FFB81C] text-xs sm:text-sm text-slate-800 font-medium leading-relaxed"
                        >
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

        {/* PESTAÑA 2: BIBLIOTECA DUOC */}
        {activeTab === 'biblioteca' && <BibliotecaView />}

        {/* PESTAÑA 3: MI VIVO DUOC */}
        {activeTab === 'vivo-duoc' && <VivoDuocSummaryView />}

        {/* PESTAÑA 4: TICKETS A SERVICIOS DIGITALES */}
        {activeTab === 'tickets' && <ServiciosDigitalesTicketsView />}

        {/* PESTAÑA 5: MI PERFIL */}
        {activeTab === 'perfil' && <PerfilView />}
      </main>

      {/* Modal Interactivo de Submenús e Instrucciones de Trámites */}
      {selectedCategory && (
        <ModuleModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
        />
      )}

      {/* A11y: Pie de Página Institucional semántico <footer> */}
      <footer className="bg-slate-900 text-slate-200 py-8 px-4 border-t-4 border-[#FFB81C] mt-auto text-xs font-semibold">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="font-black text-white text-sm">
              Nexo360 • Centro de Ayuda Centralizado Duoc UC Sede Alameda
            </p>
            <p className="text-slate-300 mt-1">
              Plataforma diseñada bajo estándares de accesibilidad universal WCAG 2.2 AA.
            </p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-slate-200">
              Mesa de Ayuda Alameda:{' '}
              <a
                href="mailto:ayuda.alameda@duoc.cl"
                className="font-black text-[#FFB81C] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded px-1"
              >
                ayuda.alameda@duoc.cl
              </a>
            </p>
            <p className="text-slate-400 mt-1">
              Sede Alameda • Periodo Académico 2026
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
