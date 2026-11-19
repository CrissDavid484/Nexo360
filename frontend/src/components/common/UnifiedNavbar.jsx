import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';
import { DEFAULT_CAMPUS, getStudentDisplayName } from '../../utils/studentUtils';
import logo03 from '../../assets/logo03.png';
import {
  HelpCircle,
  BookMarked,
  GraduationCap,
  Laptop,
  User,
  LogOut,
  Calendar,
  ChevronDown,
  Menu,
  X,
  Layers,
  Check,
  ShieldAlert,
  ArrowRight,
} from 'lucide-react';

/**
 * Menú de Navegación Flotante y Accesible Nexo360 (Duoc UC - Sede Alameda)
 * - Botón disparador accesible fijo (top-4 left-4, z-40) con alto contraste y min-h-[44px].
 * - Cajón deslizable (drawer) con foco atrapado (useAccessibleModal), cierre con Escape y useOnClickOutside.
 * - Despliegue de destinos: Centro de Ayuda, Simulaciones Alameda, Soporte TI, Mi Perfil, Panel Admin.
 * - Cumplimiento WCAG 2.2 AAA y Guía Institucional de Accesibilidad Digital Duoc UC.
 */
export const UnifiedNavbar = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const { getVoiceProps } = useAccessibility();

  const [isOpen, setIsOpen] = useState(false);
  const [isSimulationsOpen, setIsSimulationsOpen] = useState(true);

  const drawerRef = useRef(null);
  const triggerRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Hook WCAG 2.2 para atrapar foco, tecla Escape y restaurar foco al disparador al cerrar
  useAccessibleModal({
    isOpen,
    onClose: () => setIsOpen(false),
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
    restoreFocus: true,
  });

  // Cierre por clic fuera del cajón
  useOnClickOutside(drawerRef, () => setIsOpen(false), {
    enabled: isOpen,
    ignoreSelector: '#nexo-floating-menu-trigger',
  });

  const simulationItems = [
    {
      id: 'toma-ramos',
      label: 'Toma de Ramos',
      subtitle: 'Simulador con validación de jornada y choque horario',
      icon: Calendar,
      badge: 'Simulador',
    },
    {
      id: 'biblioteca',
      label: 'Biblioteca Alameda',
      subtitle: 'Reserva de salas de estudio y visores VR',
      icon: BookMarked,
      badge: 'Reserva',
    },
    {
      id: 'vivo-duoc',
      label: 'Experiencia Vivo',
      subtitle: 'Manual interactivo oficial del portal Vivo Duoc',
      icon: GraduationCap,
      badge: 'Manual',
    },
  ];

  const handleNavigation = (tabId) => {
    onTabChange(tabId);
    setIsOpen(false);
  };

  const displayName = getStudentDisplayName(user);
  const displayCampus = `Duoc UC · ${DEFAULT_CAMPUS}`;

  const isAdmin = user?.role === 'admin' || user?.role === 'administrador';
  const isCoordinator = user?.role === 'coordinador_paedis';
  const isAdminOrCoordinator = isAdmin || isCoordinator;

  const roleLabel = isCoordinator
    ? 'Coordinador PAEDIS'
    : isAdmin
    ? 'Administrador'
    : user?.role === 'docente'
    ? 'Docente'
    : 'Estudiante';

  const adminPanelLabel = isCoordinator
    ? 'Panel Coordinación PAEDIS'
    : 'Panel de Administración';

  const getSectionLabel = (tab) => {
    switch (tab) {
      case 'centro-ayuda':
        return 'Centro de Ayuda';
      case 'toma-ramos':
        return 'Toma de Ramos';
      case 'biblioteca':
        return 'Biblioteca Alameda';
      case 'vivo-duoc':
        return 'Experiencia Vivo';
      case 'tickets':
        return 'Soporte TI';
      case 'perfil':
        return 'Mi Perfil';
      case 'admin-panel':
        return isCoordinator ? 'Coord. PAEDIS' : 'Admin';
      default:
        return 'Nexo360';
    }
  };

  const activeSectionLabel = getSectionLabel(activeTab);

  return (
    <aside
      id="unified-floating-navbar"
      aria-label="Navegación principal Nexo360"
      className="fixed top-4 left-4 z-40"
    >
      {/* Botón flotante accesible / Disparador del Menú */}
      <button
        id="nexo-floating-menu-trigger"
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-controls="nexo-floating-nav-drawer"
        aria-haspopup="dialog"
        aria-label={
          isOpen
            ? 'Cerrar menú de navegación Nexo360'
            : 'Abrir menú de navegación Nexo360'
        }
        {...getVoiceProps(
          isOpen
            ? 'Cerrar menú de navegación Nexo360'
            : `Menú de navegación Nexo360 Duoc UC. Sección actual: ${activeSectionLabel}`
        )}
        className="group min-h-[44px] flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-md text-slate-900 border border-slate-200/90 shadow-md hover:shadow-lg hover:border-slate-300 transition-all duration-200 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#002B49] focus-visible:ring-offset-2"
      >
        <img
          src={logo03}
          alt={`Nexo360 Duoc UC - ${DEFAULT_CAMPUS}`}
          className="h-7 sm:h-8 w-auto object-contain select-none"
          style={{ aspectRatio: '1024 / 307' }}
        />

        <div className="h-5 w-px bg-slate-300/80" aria-hidden="true" />

        <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-[#002B49]">
          <Menu
            className="w-4 h-4 shrink-0 text-[#002B49] group-hover:scale-110 transition-transform"
            aria-hidden="true"
          />
          <span>Menú</span>
        </div>

        <span className="hidden sm:inline-flex items-center text-[11px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full max-w-[140px] truncate border border-slate-200/70">
          {activeSectionLabel}
        </span>
      </button>

      {/* Cajón de Navegación Lateral Desplegable */}
      {isOpen && (
        <>
          {/* Fondo oscuro traslúcido accesible */}
          <div
            className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs z-50 transition-opacity animate-fade-in"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Panel Lateral Deslizable (Drawer) */}
          <div
            id="nexo-floating-nav-drawer"
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Menú principal de navegación Nexo360"
            className="fixed top-0 left-0 bottom-0 z-50 w-full sm:w-[410px] max-w-[92vw] bg-white text-slate-900 shadow-2xl border-r border-slate-200 flex flex-col animate-fade-in overflow-hidden"
          >
            {/* 1. Encabezado Institucional con botón cerrar [✕] */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-white shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <img
                  src={logo03}
                  alt={`Nexo360 Duoc UC - ${DEFAULT_CAMPUS}`}
                  className="h-8 sm:h-9 w-auto object-contain select-none shrink-0"
                  style={{ aspectRatio: '1024 / 307' }}
                />
                <div className="min-w-0">
                  <h2 className="text-xs font-black uppercase tracking-wider text-[#002B49] truncate">
                    Nexo360 Duoc UC
                  </h2>
                  <span className="text-[11px] text-slate-500 font-semibold block truncate">
                    {displayCampus}
                  </span>
                </div>
              </div>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Cerrar menú de navegación"
                {...getVoiceProps('Cerrar menú de navegación')}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* 2. Resumen del Perfil de Usuario */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 shrink-0">
              <div className="flex items-center gap-3">
                {user?.photo ? (
                  <img
                    src={user.photo}
                    alt={`Fotografía de ${displayName}`}
                    className="w-12 h-12 rounded-full object-cover border-2 border-[#002B49]/20 shadow-xs shrink-0"
                  />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full bg-[#002B49] text-white flex items-center justify-center font-black text-base shadow-xs shrink-0 select-none"
                    aria-hidden="true"
                  >
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-slate-900 truncate">
                    {displayName}
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {user?.email || 'estudiante@duocuc.cl'}
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#002B49]/10 text-[#002B49] border border-[#002B49]/20">
                      {roleLabel}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium truncate">
                      · {displayCampus}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Enlaces y Destinos de Navegación */}
            <nav
              aria-label="Destinos del portal"
              className="flex-1 overflow-y-auto p-4 space-y-3.5"
            >
              {/* Opción 1: Centro de Ayuda (Inicio / dashboard) */}
              <button
                type="button"
                onClick={() => handleNavigation('centro-ayuda')}
                aria-current={activeTab === 'centro-ayuda' ? 'page' : undefined}
                {...getVoiceProps('Centro de Ayuda. Inicio y buscador de preguntas frecuentes')}
                className={`w-full min-h-[48px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                  activeTab === 'centro-ayuda'
                    ? 'bg-[#002B49] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'centro-ayuda'
                      ? 'bg-white/15 text-[#FFB81C]'
                      : 'bg-slate-100 text-[#002B49]'
                  }`}
                >
                  <HelpCircle className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        activeTab === 'centro-ayuda' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Centro de Ayuda
                    </span>
                    {activeTab === 'centro-ayuda' && (
                      <Check className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] block truncate ${
                      activeTab === 'centro-ayuda' ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    Inicio y buscador institucional
                  </span>
                </div>
              </button>

              {/* Opción 2: Simulaciones e instrucciones (desplegable) */}
              <div className="bg-slate-50/90 rounded-2xl p-3 border border-slate-200 space-y-2">
                <button
                  type="button"
                  onClick={() => setIsSimulationsOpen((prev) => !prev)}
                  aria-expanded={isSimulationsOpen}
                  aria-controls="drawer-simulations-list"
                  {...getVoiceProps(
                    isSimulationsOpen
                      ? 'Ocultar simulaciones e instrucciones'
                      : 'Mostrar simulaciones e instrucciones'
                  )}
                  className="w-full min-h-[44px] flex items-center justify-between px-1.5 py-1 text-left cursor-pointer rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-[#002B49]/10 text-[#002B49] flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-900 block truncate">
                        Simulaciones e instrucciones
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate">
                        Módulos prácticos oficiales
                      </span>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 shrink-0 ${
                      isSimulationsOpen ? 'rotate-180' : ''
                    }`}
                    aria-hidden="true"
                  />
                </button>

                {isSimulationsOpen && (
                  <div id="drawer-simulations-list" className="space-y-1.5 pt-1">
                    {simulationItems.map((item) => {
                      const Icon = item.icon;
                      const isCurrent = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleNavigation(item.id)}
                          aria-current={isCurrent ? 'page' : undefined}
                          {...getVoiceProps(`${item.label}. ${item.subtitle}`)}
                          className={`w-full min-h-[46px] flex items-center justify-between gap-2.5 p-2.5 rounded-xl text-left border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                            isCurrent
                              ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                              : 'bg-white hover:bg-slate-100/90 text-slate-800 border-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div
                              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                                isCurrent
                                  ? 'bg-white/15 text-[#FFB81C]'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <span
                                className={`text-xs font-bold block truncate ${
                                  isCurrent ? 'text-white' : 'text-slate-900'
                                }`}
                              >
                                {item.label}
                              </span>
                              <span
                                className={`text-[10px] block truncate ${
                                  isCurrent ? 'text-slate-200' : 'text-slate-500'
                                }`}
                              >
                                {item.subtitle}
                              </span>
                            </div>
                          </div>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                              isCurrent
                                ? 'bg-[#FFB81C] text-slate-950 font-black'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {item.badge}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Opción 3: Soporte TI */}
              <button
                type="button"
                onClick={() => handleNavigation('tickets')}
                aria-current={activeTab === 'tickets' ? 'page' : undefined}
                {...getVoiceProps('Soporte TI. Mesa de ayuda y requerimientos técnicos')}
                className={`w-full min-h-[48px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                  activeTab === 'tickets'
                    ? 'bg-[#002B49] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'tickets'
                      ? 'bg-white/15 text-[#FFB81C]'
                      : 'bg-slate-100 text-[#002B49]'
                  }`}
                >
                  <Laptop className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        activeTab === 'tickets' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Soporte TI
                    </span>
                    {activeTab === 'tickets' && (
                      <Check className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] block truncate ${
                      activeTab === 'tickets' ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    Mesa de ayuda y requerimientos técnicos
                  </span>
                </div>
              </button>

              {/* Opción 4: Mi Perfil Institucional */}
              <button
                type="button"
                onClick={() => handleNavigation('perfil')}
                aria-current={activeTab === 'perfil' ? 'page' : undefined}
                {...getVoiceProps('Mi Perfil Institucional. Datos y ajustes PAEDIS')}
                className={`w-full min-h-[48px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-left transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                  activeTab === 'perfil'
                    ? 'bg-[#002B49] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90'
                }`}
              >
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    activeTab === 'perfil'
                      ? 'bg-white/15 text-[#FFB81C]'
                      : 'bg-slate-100 text-[#002B49]'
                  }`}
                >
                  <User className="w-5 h-5" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        activeTab === 'perfil' ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Mi Perfil Institucional
                    </span>
                    {activeTab === 'perfil' && (
                      <Check className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                    )}
                  </div>
                  <span
                    className={`text-[11px] block truncate ${
                      activeTab === 'perfil' ? 'text-slate-200' : 'text-slate-500'
                    }`}
                  >
                    Datos y ajustes de accesibilidad PAEDIS
                  </span>
                </div>
              </button>

              {/* Opción 5: Panel Admin / Coordinación PAEDIS (condicional) */}
              {isAdminOrCoordinator && (
                <div className="pt-2 border-t border-slate-200">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 block mb-2">
                    Gestión Institucional
                  </span>
                  {activeTab === 'admin-panel' ? (
                    <button
                      type="button"
                      onClick={() => handleNavigation('centro-ayuda')}
                      {...getVoiceProps('Volver al Portal Estudiantil')}
                      className="w-full min-h-[48px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-left bg-amber-50 hover:bg-amber-100/90 text-amber-950 border border-amber-300 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                        <HelpCircle className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block truncate">
                          Volver al Portal Estudiantil
                        </span>
                        <span className="text-[11px] text-amber-800/90 block truncate">
                          Ir al Centro de Ayuda
                        </span>
                      </div>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleNavigation('admin-panel')}
                      {...getVoiceProps(`Abrir ${adminPanelLabel}`)}
                      className="w-full min-h-[48px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-left bg-[#002B49] hover:bg-[#003B66] text-white transition-colors shadow-sm cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
                    >
                      <div className="w-9 h-9 rounded-xl bg-white/15 text-[#FFB81C] flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-5 h-5" aria-hidden="true" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold block truncate text-white">
                          {adminPanelLabel}
                        </span>
                        <span className="text-[11px] text-slate-200 block truncate">
                          Métricas SAT y gestión institucional
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
                    </button>
                  )}
                </div>
              )}
            </nav>

            {/* 4. Pie con Cerrar Sesión y Respaldo Institucional */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                {...getVoiceProps('Cerrar sesión segura')}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100/90 text-rose-700 hover:text-rose-900 border border-rose-200/90 font-bold text-xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
              >
                <LogOut className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
                <span>Cerrar sesión</span>
              </button>

              <div className="text-center text-[10px] text-slate-500 font-medium space-y-0.5">
                <p className="font-bold text-slate-700">{displayCampus}</p>
                <p>Nexo360 • Subdirección de Inclusión Educativa</p>
                <p className="text-[9px] text-slate-400">
                  Ley N° 20.422 • WCAG 2.2 AAA (Ally 100%)
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
};
