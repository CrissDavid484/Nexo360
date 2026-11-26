import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
import { DEFAULT_CAMPUS, getStudentDisplayName } from '../../utils/studentUtils';
import { AcademicWeekBadge } from './AcademicWeekBadge';
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

export const TAB_ROUTE_MAP = {
  'centro-ayuda': '/centro-de-ayuda',
  'toma-ramos': '/toma-ramos',
  'biblioteca': '/biblioteca',
  'vivo-duoc': '/vivo-duoc',
  'tickets': '/soporte',
  'soporte': '/soporte',
  'perfil': '/perfil',
  'admin-panel': '/panel-admin',
  'panel-admin': '/panel-admin',
};

export const resolveTabFromPath = (pathname = '') => {
  if (pathname.startsWith('/panel-admin') || pathname.startsWith('/admin-panel') || pathname.startsWith('/admin')) {
    return 'admin-panel';
  }
  if (pathname.startsWith('/toma-ramos') || pathname.startsWith('/simulador')) {
    return 'toma-ramos';
  }
  if (pathname.startsWith('/biblioteca')) {
    return 'biblioteca';
  }
  if (pathname.startsWith('/vivo-duoc')) {
    return 'vivo-duoc';
  }
  if (pathname.startsWith('/soporte') || pathname.startsWith('/tickets')) {
    return 'tickets';
  }
  if (pathname.startsWith('/perfil')) {
    return 'perfil';
  }
  if (pathname.startsWith('/centro-de-ayuda')) {
    return 'centro-ayuda';
  }
  return null;
};

/**
 * Navegación Principal Unificada Nexo360 (Duoc UC - Sede Alameda)
 * - Modo Escritorio (>= 1024px / lg): Barra superior clásica y estilizada con logo prominente, navegación central, menú de usuario y botón salir.
 * - Modo Móvil y Tablet (< 1024px): Barra superior compacta con logo institucional y botón "Menú" que despliega un Dropdown hacia abajo limpio y sin cajón invasivo.
 * - Accesibilidad WCAG 2.2 AA/AAA: Cierre con Escape, clic fuera, soporte de voz (getVoiceProps) y áreas táctiles >= 44px.
 * - Cero colisiones con el panel de accesibilidad (AccessibilityBar en bottom-5 right-0).
 */
export const UnifiedNavbar = ({ activeTab: propActiveTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const { getVoiceProps } = useAccessibility();
  const location = useLocation();
  const navigate = useNavigate();

  // Sincronización bidireccional y robusta con la URL activa para persistencia F5
  const activeTab = propActiveTab || resolveTabFromPath(location.pathname) || 'centro-ayuda';

  const handleTabNavigation = (tabId) => {
    const targetPath = TAB_ROUTE_MAP[tabId] || `/${tabId}`;
    if (onTabChange) {
      onTabChange(tabId);
    }
    if (location.pathname !== targetPath && !location.pathname.startsWith(`${targetPath}/`)) {
      navigate(targetPath);
    }
  };

  // Estados para menús en modo escritorio
  const [isSimMenuOpen, setIsSimMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const simMenuRef = useRef(null);
  const userMenuRef = useRef(null);

  // Estados para menú desplegable hacia abajo (Dropdown) en móvil y tablet
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSimulationsOpen, setIsSimulationsOpen] = useState(true);
  const mobileDropdownRef = useRef(null);
  const mobileTriggerRef = useRef(null);

  // Cierres por clic fuera en escritorio
  useOnClickOutside(simMenuRef, () => setIsSimMenuOpen(false), {
    enabled: isSimMenuOpen,
  });
  useOnClickOutside(userMenuRef, () => setIsUserMenuOpen(false), {
    enabled: isUserMenuOpen,
  });

  // Cierre por clic fuera en móvil/tablet
  useOnClickOutside(mobileDropdownRef, () => setIsMobileMenuOpen(false), {
    enabled: isMobileMenuOpen,
    ignoreSelector: '#nexo-mobile-menu-trigger',
  });

  // Cierre por tecla Escape en todos los menús
  useEffect(() => {
    if (!isSimMenuOpen && !isUserMenuOpen && !isMobileMenuOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) {
          setIsMobileMenuOpen(false);
          mobileTriggerRef.current?.focus();
        }
        setIsSimMenuOpen(false);
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSimMenuOpen, isUserMenuOpen, isMobileMenuOpen]);

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
    handleTabNavigation(tabId);
    setIsMobileMenuOpen(false);
    mobileTriggerRef.current?.focus();
  };

  const displayName = getStudentDisplayName(user);
  const displayCampus = `Duoc UC · ${DEFAULT_CAMPUS}`;

  const userRole = (user?.role || '').toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'administrador';
  const isCoordinator = userRole === 'coordinador_paedis';
  const isAdminOrCoordinator = isAdmin || isCoordinator;

  const roleLabel = isCoordinator
    ? 'Coordinador PAEDIS'
    : isAdmin
    ? 'Administrador'
    : userRole === 'docente'
    ? 'Docente'
    : 'Estudiante';

  const adminPanelLabel = isCoordinator
    ? 'Panel PAEDIS'
    : 'Panel Admin';

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
        return isCoordinator ? 'Panel PAEDIS' : 'Panel Admin';
      default:
        return 'Nexo360';
    }
  };

  const activeSectionLabel = getSectionLabel(activeTab);

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-900 sticky top-0 z-40 border-b border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] transition-colors">
      <div className="w-full max-w-none px-4 sm:px-6 lg:px-6 xl:px-10">
        {/* ========================================================= */}
        {/* 1. MODO ESCRITORIO (>= 1024px / lg): Barra Clásica Centrada */}
        {/* ========================================================= */}
        <div className="hidden lg:grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 xl:gap-4 min-h-[70px] sm:min-h-[80px] h-auto py-2">
          {/* Marca Institucional Oficial (Logo 03 - Prominente a la izquierda) */}
          <div className="flex items-center justify-self-start shrink-0">
            <button
              type="button"
              onClick={() => handleTabNavigation('centro-ayuda')}
              {...getVoiceProps(`Ir al inicio de Nexo360 Duoc UC ${DEFAULT_CAMPUS}`)}
              className="h-14 flex items-center group text-left rounded-2xl px-1.5 transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-[#002B49] focus-visible:ring-offset-2 cursor-pointer"
              aria-label={`Ir al inicio de Nexo360 Centro de Ayuda ${DEFAULT_CAMPUS}`}
            >
              <img
                src={logo03}
                alt={`Nexo360 Duoc UC - ${DEFAULT_CAMPUS}`}
                className="w-auto object-contain transition-all duration-200 group-hover:opacity-95 select-none"
                style={{
                  height: 'clamp(32px, 2.4vw + 10px, 46px)',
                  aspectRatio: '1024 / 307',
                }}
              />
            </button>
          </div>

          {/* Bloque Central: Navegación + Perfil de Usuario + Cerrar sesión */}
          <div className="w-full flex items-center justify-center justify-self-center min-w-0 max-w-full">
            <div className="w-full max-w-full flex items-center gap-1.5 xl:gap-2.5 flex-wrap justify-center">
              {/* Navegación Principal */}
              <nav
                aria-label="Secciones principales del portal"
                className="flex flex-wrap justify-center items-center gap-1 max-w-full bg-slate-100/70 p-1 rounded-3xl border border-slate-200/70 shadow-2xs backdrop-blur-xs"
              >
                {/* Opción 1: Centro de Ayuda */}
                <button
                  type="button"
                  onClick={() => handleTabNavigation('centro-ayuda')}
                  aria-current={activeTab === 'centro-ayuda' ? 'page' : undefined}
                  {...getVoiceProps('Centro de Ayuda')}
                  className={`min-h-[38px] flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
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
                    className={`min-h-[38px] flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
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
                    <span className="truncate max-w-[130px] xl:max-w-[155px]">
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
                              handleTabNavigation(item.id);
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
                  onClick={() => handleTabNavigation('tickets')}
                  aria-current={activeTab === 'tickets' ? 'page' : undefined}
                  {...getVoiceProps('Soporte TI')}
                  className={`min-h-[38px] flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
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

              {/* Separador vertical sutil */}
              <div className="h-6 w-px bg-slate-200/90 mx-0.5" aria-hidden="true" />

              {/* Menú de Usuario Desplegable (Escritorio) */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  aria-haspopup="menu"
                  aria-expanded={isUserMenuOpen}
                  {...getVoiceProps(`Menú de cuenta de ${displayName}. Rol ${roleLabel}`)}
                  className={`min-h-[40px] flex items-center gap-2 xl:gap-2.5 pl-1.5 pr-2.5 xl:pr-3 py-1 rounded-full border transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] focus-visible:ring-offset-2 ${
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
                  <div className="text-left hidden xl:block">
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
                              handleTabNavigation('centro-ayuda');
                              setIsUserMenuOpen(false);
                            }}
                            className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-amber-50 hover:bg-amber-100/80 text-amber-950 border border-amber-200/80 transition-colors cursor-pointer"
                          >
                            <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                              <HelpCircle className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-xs font-bold block truncate">
                                Volver al Portal Estudiantil
                              </span>
                              <span className="text-[10px] text-amber-900 block truncate">
                                Ir al Centro de Ayuda
                              </span>
                            </div>
                          </button>
                        ) : (
                          <button
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              handleTabNavigation('admin-panel');
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
                        handleTabNavigation('perfil');
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
                  </div>
                )}
              </div>

              {/* Botón Cerrar Sesión en Letras Rojas (Escritorio) */}
              <button
                type="button"
                onClick={logout}
                {...getVoiceProps('Cerrar sesión')}
                className="nexo-logout-btn min-h-[38px] flex items-center justify-center gap-1.5 px-3 xl:px-3.5 py-1.5 rounded-full text-xs font-bold text-rose-700 hover:text-rose-800 bg-rose-50/80 hover:bg-rose-100/90 border border-rose-200/80 transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 whitespace-nowrap shrink-0"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-700 shrink-0" aria-hidden="true" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>

          {/* Lado Derecho: Semana Académica Duoc UC vigente */}
          <div className="justify-self-end flex items-center shrink-0">
            <AcademicWeekBadge />
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. MODO MÓVIL Y TABLET (< 1024px / < lg): Barra + Dropdown */}
        {/* ========================================================= */}
        <div className="lg:hidden relative">
          <div className="min-h-[56px] sm:min-h-[62px] py-1.5 flex items-center justify-between gap-2.5 flex-wrap">
            {/* Marca Institucional Oficial (Logo 03) */}
            <button
              type="button"
              onClick={() => {
                handleTabNavigation('centro-ayuda');
                setIsMobileMenuOpen(false);
              }}
              {...getVoiceProps(`Ir al inicio de Nexo360 Duoc UC ${DEFAULT_CAMPUS}`)}
              className="h-10 sm:h-12 flex items-center group text-left rounded-xl px-1 transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] cursor-pointer"
              aria-label={`Ir al inicio de Nexo360 Centro de Ayuda ${DEFAULT_CAMPUS}`}
            >
              <img
                src={logo03}
                alt={`Nexo360 Duoc UC - ${DEFAULT_CAMPUS}`}
                className="w-auto object-contain select-none transition-all group-hover:opacity-95"
                style={{
                  height: 'clamp(28px, 4.5vw, 36px)',
                  aspectRatio: '1024 / 307',
                }}
              />
            </button>

            {/* Discreto en sm-md; también visible dentro del dropdown móvil */}
            <AcademicWeekBadge compact className="hidden sm:inline-flex" />

            {/* Botón Disparador del Menú Desplegable */}
            <button
              id="nexo-mobile-menu-trigger"
              ref={mobileTriggerRef}
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="nexo-mobile-dropdown-menu"
              aria-haspopup="menu"
              aria-label={
                isMobileMenuOpen
                  ? 'Cerrar menú de navegación'
                  : 'Abrir menú de navegación'
              }
              {...getVoiceProps(
                isMobileMenuOpen
                  ? 'Cerrar menú de navegación'
                  : `Menú de navegación Nexo360. Sección actual: ${activeSectionLabel}`
              )}
              className={`min-h-[44px] flex items-center gap-2 px-3.5 py-1.5 rounded-full border transition-all duration-150 active:scale-95 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49] ${
                isMobileMenuOpen
                  ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                  : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-800 border-slate-200/90 shadow-2xs'
              }`}
            >
              {user?.photo ? (
                <img
                  src={user.photo}
                  alt=""
                  className="w-6 h-6 rounded-full object-cover border border-slate-200 shrink-0"
                />
              ) : (
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${
                    isMobileMenuOpen
                      ? 'bg-[#FFB81C] text-slate-950'
                      : 'bg-[#002B49] text-white'
                  }`}
                  aria-hidden="true"
                >
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-bold">Menú</span>
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-white shrink-0" aria-hidden="true" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Menú Desplegable hacia Abajo (Dropdown) */}
          {isMobileMenuOpen && (
            <div
              id="nexo-mobile-dropdown-menu"
              ref={mobileDropdownRef}
              role="menu"
              aria-label="Menú principal de navegación"
              className="absolute top-full left-0 right-0 sm:left-auto sm:right-0 sm:w-[380px] mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200/90 max-h-[calc(100vh-76px)] overflow-hidden flex flex-col z-50 animate-fade-in"
            >
              {/* Cabecera Compacta del Usuario */}
              <div className="p-3 bg-slate-50/90 border-b border-slate-100 space-y-2 shrink-0">
                <div className="flex items-center gap-2.5">
                  {user?.photo ? (
                    <img
                      src={user.photo}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                  ) : (
                    <div
                      className="w-8 h-8 rounded-full bg-[#002B49] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs"
                      aria-hidden="true"
                    >
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-bold text-slate-900 block truncate">
                      {displayName}
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-semibold text-[#002B49]">
                        {roleLabel}
                      </span>
                      <span className="text-[10px] text-slate-400">· {DEFAULT_CAMPUS}</span>
                    </div>
                  </div>
                  {(activeTab === 'admin-panel' || activeTab === 'perfil') && (
                    <span
                      className="w-2 h-2 rounded-full bg-amber-500 shrink-0"
                      title="Sección activa"
                      aria-hidden="true"
                    />
                  )}
                </div>
                <AcademicWeekBadge compact className="w-full justify-center max-w-full !whitespace-normal text-center" />
              </div>

              {/* Cuerpo Desplazable de Enlaces y Opciones */}
              <div className="flex-1 overflow-y-auto p-2.5 sm:p-3 space-y-2.5">
                {/* Sección: Navegación General */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block">
                    Navegación
                  </span>

                  {/* Centro de Ayuda */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleMobileNavigation('centro-ayuda')}
                    aria-current={activeTab === 'centro-ayuda' ? 'page' : undefined}
                    {...getVoiceProps('Ir al Centro de Ayuda')}
                    className={`w-full min-h-[44px] flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      activeTab === 'centro-ayuda'
                        ? 'bg-[#002B49] text-white shadow-xs font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          activeTab === 'centro-ayuda'
                            ? 'bg-white/15 text-[#FFB81C]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate">Centro de Ayuda</span>
                        <span
                          className={`text-[10px] block truncate ${
                            activeTab === 'centro-ayuda' ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          Buscador y consultas frecuentes
                        </span>
                      </div>
                    </div>
                    {activeTab === 'centro-ayuda' && (
                      <Check className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Acordeón de Simulaciones e Instrucciones */}
                <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-1.5 space-y-1">
                  <button
                    type="button"
                    onClick={() => setIsSimulationsOpen((prev) => !prev)}
                    aria-expanded={isSimulationsOpen}
                    {...getVoiceProps(
                      isSimulationsOpen
                        ? 'Contraer sección de simulaciones'
                        : 'Expandir sección de simulaciones'
                    )}
                    className="w-full min-h-[38px] flex items-center justify-between px-2.5 py-1 text-left rounded-lg hover:bg-white transition-colors cursor-pointer"
                  >
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
                      <span>Simulaciones e instrucciones</span>
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                        isSimulationsOpen ? 'rotate-180' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>

                  {isSimulationsOpen && (
                    <div className="space-y-1 pt-0.5">
                      {simulationItems.map((item) => {
                        const Icon = item.icon;
                        const isCurrent = activeTab === item.id;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            role="menuitem"
                            onClick={() => handleMobileNavigation(item.id)}
                            aria-current={isCurrent ? 'page' : undefined}
                            {...getVoiceProps(`${item.label}. ${item.subtitle}`)}
                            className={`w-full min-h-[44px] flex items-center justify-between gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-[#002B49] text-white shadow-2xs font-bold'
                                : 'hover:bg-white text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <div
                                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                                  isCurrent
                                    ? 'bg-white/10 text-[#FFB81C]'
                                    : 'bg-white text-slate-700 border border-slate-200/70'
                                }`}
                              >
                                <Icon className="w-3.5 h-3.5" aria-hidden="true" />
                              </div>
                              <div className="truncate">
                                <span className="text-xs font-bold block truncate">{item.label}</span>
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
                                  ? 'bg-[#FFB81C] text-slate-950'
                                  : 'bg-white text-slate-600 border border-slate-200'
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

                {/* Sección: Servicios y Cuenta */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 block">
                    Servicios y Perfil
                  </span>

                  {/* Soporte TI */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleMobileNavigation('tickets')}
                    aria-current={activeTab === 'tickets' ? 'page' : undefined}
                    {...getVoiceProps('Ir a Soporte TI')}
                    className={`w-full min-h-[44px] flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      activeTab === 'tickets'
                        ? 'bg-[#002B49] text-white shadow-xs font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          activeTab === 'tickets'
                            ? 'bg-white/15 text-[#FFB81C]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <Laptop className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate">Soporte TI</span>
                        <span
                          className={`text-[10px] block truncate ${
                            activeTab === 'tickets' ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          Mesa de ayuda institucional
                        </span>
                      </div>
                    </div>
                    {activeTab === 'tickets' && (
                      <Check className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                    )}
                  </button>

                  {/* Mi Perfil Institucional */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleMobileNavigation('perfil')}
                    aria-current={activeTab === 'perfil' ? 'page' : undefined}
                    {...getVoiceProps('Ir a Mi Perfil Institucional')}
                    className={`w-full min-h-[44px] flex items-center justify-between gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
                      activeTab === 'perfil'
                        ? 'bg-[#002B49] text-white shadow-xs font-bold'
                        : 'hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                          activeTab === 'perfil'
                            ? 'bg-white/15 text-[#FFB81C]'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <User className="w-4 h-4" aria-hidden="true" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold block truncate">Mi Perfil Institucional</span>
                        <span
                          className={`text-[10px] block truncate ${
                            activeTab === 'perfil' ? 'text-slate-200' : 'text-slate-500'
                          }`}
                        >
                          Datos y ajustes de accesibilidad
                        </span>
                      </div>
                    </div>
                    {activeTab === 'perfil' && (
                      <Check className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                    )}
                  </button>
                </div>

                {/* Panel de Administración / PAEDIS (Si aplica al rol) */}
                {isAdminOrCoordinator && (
                  <div className="pt-1 border-t border-slate-100">
                    {activeTab === 'admin-panel' ? (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleMobileNavigation('centro-ayuda')}
                        {...getVoiceProps('Volver al Portal Estudiantil')}
                        className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-amber-50 hover:bg-amber-100/90 text-amber-950 border border-amber-300 transition-colors cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-bold block truncate">
                            Volver al Portal Estudiantil
                          </span>
                          <span className="text-[10px] text-amber-800 block truncate">
                            Ir al Centro de Ayuda
                          </span>
                        </div>
                      </button>
                    ) : (
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => handleMobileNavigation('admin-panel')}
                        {...getVoiceProps(`Abrir ${adminPanelLabel}`)}
                        className="w-full min-h-[44px] flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-[#002B49] hover:bg-[#003B66] text-white transition-colors shadow-2xs cursor-pointer"
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
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Pie Compacto: Cerrar Sesión + Respaldo */}
              <div className="px-2.5 pt-2.5 pb-20 bg-slate-50/90 border-t border-slate-100 shrink-0 space-y-1.5">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  {...getVoiceProps('Cerrar sesión')}
                  className="nexo-logout-btn w-full min-h-[44px] flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 border border-rose-200/90 font-bold text-xs transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 shrink-0 text-rose-700" aria-hidden="true" />
                  <span>Cerrar sesión</span>
                </button>
                <p className="text-[10px] text-slate-400 text-center font-medium">
                  Nexo360 • {displayCampus}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
