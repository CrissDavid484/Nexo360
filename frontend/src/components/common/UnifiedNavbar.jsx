import React, { useState, useEffect, useRef } from 'react';
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
 * Navegación Principal Nexo360 (Duoc UC - Sede Alameda)
 * - Modo Escritorio (>= 1024px / lg): Barra superior clásica y estilizada, con logo, navegación central, perfil de usuario y salida.
 * - Modo Móvil y Tablet (< 1024px): Botón flotante accesible (top-4 left-4, z-40) con cajón deslizable (drawer) y foco accesible.
 * - Cero colisiones con el panel de accesibilidad (AccessibilityBar en bottom-5 right-0).
 * - Textos sobrios y fieles a Sede Alameda, eliminando textos grandilocuentes o menciones no institucionales.
 */
export const UnifiedNavbar = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const { getVoiceProps } = useAccessibility();

  // Estados para modo escritorio
  const [isSimMenuOpen, setIsSimMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const simMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Estados para modo móvil y tablet (botón flotante + drawer)
  const [isOpen, setIsOpen] = useState(false);
  const [isSimulationsOpen, setIsSimulationsOpen] = useState(true);
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);
  const closeButtonRef = useRef(null);

  // Cierres por clic fuera en escritorio
  useOnClickOutside(simMenuRef, () => setIsSimMenuOpen(false), {
    enabled: isSimMenuOpen,
  });
  useOnClickOutside(userMenuRef, () => setIsUserMenuOpen(false), {
    enabled: isUserMenuOpen,
  });

  // Cierre por Escape en escritorio
  useEffect(() => {
    if (!isSimMenuOpen && !isUserMenuOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSimMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSimMenuOpen, isUserMenuOpen]);

  // Hook WCAG 2.2 para atrapar foco en drawer móvil/tablet
  useAccessibleModal({
    isOpen,
    onClose: () => setIsOpen(false),
    containerRef: drawerRef,
    initialFocusRef: closeButtonRef,
    restoreFocus: true,
  });

  // Cierre por clic fuera del cajón móvil/tablet
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

  const isSimActive =
    activeTab === 'toma-ramos' ||
    activeTab === 'biblioteca' ||
    activeTab === 'vivo-duoc';

  const activeSimItem = simulationItems.find((item) => item.id === activeTab);

  const handleMobileNavigation = (tabId) => {
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
    <>
      {/* ========================================================= */}
      {/* 1. NAVBAR CLÁSICO SUPERIOR (SOLO ESCRITORIO >= 1024px / lg) */}
      {/* ========================================================= */}
      <header className="hidden lg:block bg-white/95 backdrop-blur-md text-slate-900 sticky top-0 z-40 border-b border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="min-h-[70px] sm:h-20 py-2 grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4">
            {/* 1. Marca Institucional Oficial (Logo 03 - Prominente y legible a la izquierda) */}
            <div className="flex items-center justify-self-start shrink-0">
              <button
                type="button"
                onClick={() => onTabChange('centro-ayuda')}
                {...getVoiceProps(`Ir al inicio de Nexo360 Duoc UC ${DEFAULT_CAMPUS}`)}
                className="h-14 flex items-center group text-left rounded-2xl px-1.5 transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#002B49] focus-visible:ring-offset-2 cursor-pointer"
                aria-label={`Ir al inicio de Nexo360 Centro de Ayuda ${DEFAULT_CAMPUS}`}
              >
                <img
                  src={logo03}
                  alt={`Nexo360 Duoc UC - ${DEFAULT_CAMPUS}`}
                  className="w-auto object-contain transition-all duration-200 group-hover:opacity-95 select-none"
                  style={{
                    height: 'clamp(36px, 2.6vw + 16px, 48px)',
                    aspectRatio: '1024 / 307',
                  }}
                />
              </button>
            </div>

            {/* 2. Bloque Central: Navegación + Perfil de Usuario + Salir (Centrado en el encabezado) */}
            <div className="flex items-center justify-center justify-self-center">
              <div className="flex items-center gap-2 lg:gap-2.5">
                {/* Navegación en Escritorio */}
                <nav
                  aria-label="Secciones principales del portal"
                  className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-slate-200/70 shadow-2xs backdrop-blur-xs"
                >
                  {/* Opción 1: Centro de Ayuda */}
                  <button
                    type="button"
                    onClick={() => onTabChange('centro-ayuda')}
                    aria-current={activeTab === 'centro-ayuda' ? 'page' : undefined}
                    {...getVoiceProps('Centro de Ayuda')}
                    className={`min-h-[38px] flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                      activeTab === 'centro-ayuda'
                        ? 'bg-[#002B49] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <HelpCircle
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeTab === 'centro-ayuda' ? 'text-[#FFB81C]' : 'text-slate-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span>Centro de Ayuda</span>
                  </button>

                  {/* Opción 2: Menú Desplegable "Simulaciones" */}
                  <div className="relative" ref={simMenuRef}>
                    <button
                      type="button"
                      onClick={() => setIsSimMenuOpen(!isSimMenuOpen)}
                      aria-haspopup="menu"
                      aria-expanded={isSimMenuOpen}
                      {...getVoiceProps(
                        isSimActive && activeSimItem
                          ? `Simulaciones, seleccionado actualmente ${activeSimItem.label}`
                          : 'Simulaciones'
                      )}
                      className={`min-h-[38px] flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                        isSimActive
                          ? 'bg-[#002B49] text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                      }`}
                    >
                      <Layers
                        className={`w-4 h-4 shrink-0 transition-colors ${
                          isSimActive ? 'text-[#FFB81C]' : 'text-slate-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate max-w-[150px]">
                        {isSimActive && activeSimItem ? activeSimItem.label : 'Simulaciones'}
                      </span>
                      <ChevronDown
                        className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${
                          isSimMenuOpen ? 'rotate-180' : ''
                        } ${isSimActive ? 'text-[#FFB81C]' : 'text-slate-400'}`}
                        aria-hidden="true"
                      />
                    </button>

                    {/* Menú Flotante Desplegable en Escritorio */}
                    {isSimMenuOpen && (
                      <div
                        role="menu"
                        aria-label="Submenú de simulaciones prácticas"
                        className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in space-y-1"
                      >
                        <div className="px-3 py-1.5 border-b border-slate-100">
                          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                            Módulos Prácticos
                          </span>
                          <p className="text-xs text-slate-600 font-medium">
                            Simuladores oficiales y guías interactivas
                          </p>
                        </div>

                        {simulationItems.map((item) => {
                          const Icon = item.icon;
                          const isCurrent = activeTab === item.id;

                          return (
                            <button
                              key={item.id}
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                onTabChange(item.id);
                                setIsSimMenuOpen(false);
                              }}
                              {...getVoiceProps(`${item.label}. ${item.subtitle}`)}
                              className={`w-full min-h-[44px] flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                                isCurrent
                                  ? 'bg-[#002B49] text-white shadow-2xs'
                                  : 'hover:bg-slate-50 text-slate-800'
                              }`}
                            >
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                                  isCurrent
                                    ? 'bg-white/10 text-[#FFB81C]'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Icon className="w-4 h-4" aria-hidden="true" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-1">
                                  <span
                                    className={`text-xs font-bold block truncate ${
                                      isCurrent ? 'text-white' : 'text-slate-900'
                                    }`}
                                  >
                                    {item.label}
                                  </span>
                                  {isCurrent && (
                                    <Check className="w-3.5 h-3.5 text-[#FFB81C] shrink-0" />
                                  )}
                                </div>
                                <p
                                  className={`text-[11px] leading-tight mt-0.5 truncate ${
                                    isCurrent ? 'text-slate-200' : 'text-slate-500'
                                  }`}
                                >
                                  {item.subtitle}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Opción 3: Soporte TI */}
                  <button
                    type="button"
                    onClick={() => onTabChange('tickets')}
                    aria-current={activeTab === 'tickets' ? 'page' : undefined}
                    {...getVoiceProps('Soporte TI')}
                    className={`min-h-[38px] flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                      activeTab === 'tickets'
                        ? 'bg-[#002B49] text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                    }`}
                  >
                    <Laptop
                      className={`w-4 h-4 shrink-0 transition-colors ${
                        activeTab === 'tickets' ? 'text-[#FFB81C]' : 'text-slate-500'
                      }`}
                      aria-hidden="true"
                    />
                    <span>Soporte TI</span>
                  </button>
                </nav>

                {/* Separador vertical sutil entre navegación y sesión */}
                <div className="h-6 w-px bg-slate-200/90 mx-0.5" aria-hidden="true" />

                {/* Menú de Usuario Desplegable (Escritorio) */}
                <div className="relative" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                    {...getVoiceProps(`Menú de cuenta de ${displayName}. Rol ${roleLabel}`)}
                    className={`min-h-[40px] flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-full border transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] focus-visible:ring-offset-2 ${
                      isUserMenuOpen || activeTab === 'perfil' || activeTab === 'admin-panel'
                        ? 'bg-slate-100/90 border-slate-300 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200 shadow-2xs hover:border-slate-300'
                    }`}
                    aria-label="Abrir menú de usuario y cuenta"
                  >
                    {/* Avatar */}
                    {user?.photo ? (
                      <img
                        src={user.photo}
                        alt=""
                        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full bg-[#002B49] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                        aria-hidden="true"
                      >
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Info de texto */}
                    <div className="text-left hidden md:block">
                      <span className="text-xs font-bold text-slate-800 block leading-tight max-w-[130px] truncate">
                        {displayName}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium block leading-tight truncate">
                        {isAdminOrCoordinator ? roleLabel : displayCampus}
                      </span>
                    </div>

                    {/* Indicador de estado activo si está en admin-panel o perfil */}
                    {(activeTab === 'admin-panel' || activeTab === 'perfil') && (
                      <span
                        className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                        title={activeTab === 'admin-panel' ? 'Panel Activo' : 'Perfil Activo'}
                        aria-hidden="true"
                      />
                    )}

                    {/* Flecha desplegable */}
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                        isUserMenuOpen ? 'rotate-180 text-slate-700' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {/* Menú Desplegable Flotante */}
                  {isUserMenuOpen && (
                    <div
                      role="menu"
                      aria-label="Menú de cuenta y accesos"
                      className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-fade-in space-y-1.5"
                    >
                      {/* Tarjeta de Resumen de Usuario */}
                      <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          {user?.photo ? (
                            <img
                              src={user.photo}
                              alt=""
                              className="w-9 h-9 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-[#002B49] text-white flex items-center justify-center font-bold text-sm shrink-0">
                              {displayName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="text-xs font-bold text-slate-900 block truncate">
                              {displayName}
                            </span>
                            <span className="text-[11px] text-slate-500 block truncate">
                              {user?.email || 'usuario@duocuc.cl'}
                            </span>
                            <div className="mt-1 flex items-center gap-1.5">
                              <span className="inline-flex items-center text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#002B49]/10 text-[#002B49] border border-[#002B49]/20">
                                {roleLabel}
                              </span>
                              <span className="text-[10px] text-slate-400">· {DEFAULT_CAMPUS}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Acceso a Panel de Administración / PAEDIS */}
                      {isAdminOrCoordinator && (
                        <div className="pt-0.5">
                          {activeTab === 'admin-panel' ? (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                onTabChange('centro-ayuda');
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-amber-50 hover:bg-amber-100/80 text-amber-950 border border-amber-200/80 transition-colors cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                                <HelpCircle className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold block truncate">
                                  Volver al Portal Estudiantil
                                </span>
                                <span className="text-[10px] text-amber-800/80 block truncate">
                                  Ir al Centro de Ayuda
                                </span>
                              </div>
                            </button>
                          ) : (
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => {
                                onTabChange('admin-panel');
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-[#002B49] hover:bg-[#003B66] text-white transition-colors shadow-xs cursor-pointer"
                            >
                              <div className="w-7 h-7 rounded-lg bg-white/15 text-[#FFB81C] flex items-center justify-center shrink-0">
                                <ShieldAlert className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold block truncate text-white">
                                  {adminPanelLabel}
                                </span>
                                <span className="text-[10px] text-slate-200 block truncate">
                                  Métricas SAT y gestión institucional
                                </span>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Opción: Mi Perfil Institucional */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          onTabChange('perfil');
                          setIsUserMenuOpen(false);
                        }}
                        className={`w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                          activeTab === 'perfil'
                            ? 'bg-slate-100 text-slate-900 font-bold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                          <User className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold block">Mi Perfil Institucional</span>
                          <span className="text-[10px] text-slate-500 block">
                            Datos y accesibilidad PAEDIS
                          </span>
                        </div>
                        {activeTab === 'perfil' && (
                          <Check className="w-3.5 h-3.5 text-[#002B49] shrink-0" />
                        )}
                      </button>

                      <div className="h-px bg-slate-100 my-1" />

                      {/* Opción: Cerrar Sesión */}
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          logout();
                        }}
                        className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-rose-50 text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-100/70 flex items-center justify-center text-rose-600 shrink-0">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold block">Cerrar sesión</span>
                          <span className="text-[10px] text-rose-500 block">
                            Finalizar sesión segura en Nexo360
                          </span>
                        </div>
                      </button>
                    </div>
                  )}
                </div>

                {/* Botón Salir Rápido (Escritorio) */}
                <button
                  type="button"
                  onClick={logout}
                  {...getVoiceProps('Cerrar sesión')}
                  className="min-h-[38px] flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100/70 hover:bg-slate-200/80 border border-slate-200/70 transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
                  aria-label="Cerrar sesión"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  <span>Salir</span>
                </button>
              </div>
            </div>

            {/* 3. Lado Derecho: Balanceador simétrico de 1fr en desktop */}
            <div className="justify-self-end" aria-hidden="true" />
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 2. MENÚ FLOTANTE ACCESIBLE (SOLO MÓVIL Y TABLET < 1024px) */}
      {/* ========================================================= */}
      <aside
        id="unified-floating-navbar"
        aria-label="Navegación móvil y tablet Nexo360"
        className="lg:hidden fixed top-4 left-4 z-40"
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
          <span className="h-4 w-px bg-slate-200" aria-hidden="true" />
          <span className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Menu className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
            <span>Menú</span>
          </span>
          {activeSectionLabel && (
            <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500 max-w-[120px] truncate">
              · {activeSectionLabel}
            </span>
          )}
        </button>

        {/* Cajón lateral deslizante (Drawer Modal) */}
        {isOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Fondo oscuro traslúcido accesible */}
            <div
              className="fixed inset-0 bg-slate-950/45 backdrop-blur-xs transition-opacity animate-fade-in"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />

            {/* Contenedor del Drawer */}
            <div
              id="nexo-floating-nav-drawer"
              ref={drawerRef}
              role="dialog"
              aria-modal="true"
              aria-label="Panel de navegación principal Nexo360"
              className="relative w-full max-w-sm sm:max-w-md bg-white text-slate-900 h-full shadow-2xl flex flex-col z-10 animate-slide-in-right overflow-hidden"
            >
              {/* 1. Cabecera del Cajón */}
              <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between gap-3 bg-slate-50/80">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={logo03}
                    alt={`Nexo360 Duoc UC - ${DEFAULT_CAMPUS}`}
                    className="h-7 w-auto object-contain select-none"
                    style={{ aspectRatio: '1024 / 307' }}
                  />
                  <div className="min-w-0">
                    <span className="text-xs font-black text-slate-900 block truncate">
                      Nexo360
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium block truncate">
                      {displayCampus}
                    </span>
                  </div>
                </div>

                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={() => setIsOpen(false)}
                  {...getVoiceProps('Cerrar menú de navegación')}
                  className="min-h-[44px] min-w-[44px] rounded-xl flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-200/80 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
                  aria-label="Cerrar panel de navegación"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>

              {/* 2. Tarjeta Resumen del Usuario */}
              <div className="p-4 bg-white border-b border-slate-100">
                <div className="flex items-center gap-3">
                  {user?.photo ? (
                    <img
                      src={user.photo}
                      alt=""
                      className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-11 h-11 rounded-full bg-[#002B49] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm"
                      aria-hidden="true"
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-bold text-slate-900 block truncate">
                      {displayName}
                    </span>
                    <span className="text-xs text-slate-500 block truncate">
                      {user?.email || 'usuario@duocuc.cl'}
                    </span>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#002B49]/10 text-[#002B49] border border-[#002B49]/20">
                        {roleLabel}
                      </span>
                      <span className="text-[10px] text-slate-400">· {DEFAULT_CAMPUS}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Lista de Destinos y Simuladores (Scrollable) */}
              <nav
                aria-label="Opciones de navegación del portal"
                className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4"
              >
                {/* Destinos Principales */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 block mb-1">
                    Navegación General
                  </span>

                  {/* Inicio / Centro de Ayuda */}
                  <button
                    type="button"
                    onClick={() => handleMobileNavigation('centro-ayuda')}
                    aria-current={activeTab === 'centro-ayuda' ? 'page' : undefined}
                    {...getVoiceProps('Ir al Centro de Ayuda e inicio')}
                    className={`w-full min-h-[48px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                      activeTab === 'centro-ayuda'
                        ? 'bg-[#002B49] text-white shadow-xs font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        activeTab === 'centro-ayuda'
                          ? 'bg-white/15 text-[#FFB81C]'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <HelpCircle className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block truncate">Centro de Ayuda</span>
                      <span
                        className={`text-[11px] block truncate ${
                          activeTab === 'centro-ayuda' ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        Buscador y consultas frecuentes
                      </span>
                    </div>
                    {activeTab === 'centro-ayuda' && (
                      <Check className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Acordeón de Simulaciones e Instrucciones */}
                <div className="bg-slate-50/90 rounded-2xl p-2.5 border border-slate-200 space-y-2">
                  <button
                    type="button"
                    onClick={() => setIsSimulationsOpen((prev) => !prev)}
                    aria-expanded={isSimulationsOpen}
                    {...getVoiceProps(
                      isSimulationsOpen
                        ? 'Contraer sección de simulaciones'
                        : 'Expandir sección de simulaciones'
                    )}
                    className="w-full flex items-center justify-between px-2 py-1.5 text-left rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <span className="text-[11px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
                      <span>Simulaciones e instrucciones</span>
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                        isSimulationsOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isSimulationsOpen && (
                    <div className="space-y-1.5 pt-1">
                      {simulationItems.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleMobileNavigation(item.id)}
                            aria-current={isCurrent ? 'page' : undefined}
                            {...getVoiceProps(`${item.label}. ${item.subtitle}`)}
                            className={`w-full min-h-[46px] flex items-center justify-between gap-3 p-2.5 rounded-xl text-left border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                              isCurrent
                                ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isCurrent
                                    ? 'bg-white/10 text-[#FFB81C]'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                <Icon className="w-4 h-4" aria-hidden="true" />
                              </div>
                              <div className="truncate">
                                <span className="font-bold text-xs block">{item.label}</span>
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
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-md shrink-0 ${
                                isCurrent
                                  ? 'bg-[#FFB81C] text-slate-950'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
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

                {/* Soporte TI y Perfil */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 block mb-1">
                    Servicios y Cuenta
                  </span>

                  {/* Soporte TI */}
                  <button
                    type="button"
                    onClick={() => handleMobileNavigation('tickets')}
                    aria-current={activeTab === 'tickets' ? 'page' : undefined}
                    {...getVoiceProps('Ir a Soporte TI')}
                    className={`w-full min-h-[48px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                      activeTab === 'tickets'
                        ? 'bg-[#002B49] text-white shadow-xs font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        activeTab === 'tickets'
                          ? 'bg-white/15 text-[#FFB81C]'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <Laptop className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block truncate">Soporte TI</span>
                      <span
                        className={`text-[11px] block truncate ${
                          activeTab === 'tickets' ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        Mesa de ayuda institucional
                      </span>
                    </div>
                    {activeTab === 'tickets' && (
                      <Check className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                    )}
                  </button>

                  {/* Mi Perfil Institucional */}
                  <button
                    type="button"
                    onClick={() => handleMobileNavigation('perfil')}
                    aria-current={activeTab === 'perfil' ? 'page' : undefined}
                    {...getVoiceProps('Ir a Mi Perfil Institucional')}
                    className={`w-full min-h-[48px] flex items-center gap-3.5 px-3.5 py-2.5 rounded-2xl text-left transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                      activeTab === 'perfil'
                        ? 'bg-[#002B49] text-white shadow-xs font-bold'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-800'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        activeTab === 'perfil'
                          ? 'bg-white/15 text-[#FFB81C]'
                          : 'bg-white text-slate-700 border border-slate-200'
                      }`}
                    >
                      <User className="w-5 h-5" aria-hidden="true" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs font-bold block truncate">Mi Perfil Institucional</span>
                      <span
                        className={`text-[11px] block truncate ${
                          activeTab === 'perfil' ? 'text-slate-200' : 'text-slate-500'
                        }`}
                      >
                        Ajustes de accesibilidad y datos personales
                      </span>
                    </div>
                    {activeTab === 'perfil' && (
                      <Check className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Panel de Administración / PAEDIS (Si aplica al rol) */}
                {isAdminOrCoordinator && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-1 block mb-2">
                      Gestión Institucional
                    </span>
                    {activeTab === 'admin-panel' ? (
                      <button
                        type="button"
                        onClick={() => handleMobileNavigation('centro-ayuda')}
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
                        onClick={() => handleMobileNavigation('admin-panel')}
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

              {/* 4. Pie con Cerrar Sesión y Respaldo Institucional Sobrio */}
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
                  <p className="text-slate-500">Plataforma de inducción y orientación académica</p>
                  <p className="text-[9px] text-slate-400">
                    Duoc UC - Sede Alameda
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};
