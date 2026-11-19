import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useOnClickOutside } from '../../hooks/useOnClickOutside';
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
 * Barra de Navegación Principal Nexo360 (Duoc UC - Sede Alameda)
 * - Diseño simétrico, estilizado y uniforme para todos los roles (administradores y estudiantes).
 * - Agrupa simuladores en el menú desplegable "Simulaciones".
 * - Acceso a Panel de Administración y Perfil centralizado en el menú de usuario de la derecha.
 * - Cumplimiento WCAG 2.2 AAA y Guía Institucional de Accesibilidad Digital Duoc UC.
 */
export const UnifiedNavbar = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const { getVoiceProps } = useAccessibility();
  const [isSimMenuOpen, setIsSimMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const simMenuRef = useRef(null);
  const userMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Sub-opciones de "Simulaciones"
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
      label: 'Biblioteca',
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

  useOnClickOutside(simMenuRef, () => setIsSimMenuOpen(false), {
    enabled: isSimMenuOpen,
  });
  useOnClickOutside(userMenuRef, () => setIsUserMenuOpen(false), {
    enabled: isUserMenuOpen,
  });
  useOnClickOutside(mobileMenuRef, () => setIsMobileMenuOpen(false), {
    enabled: isMobileMenuOpen,
    ignoreSelector: '#mobile-menu-button',
  });

  // Cerrar menús al presionar Escape
  useEffect(() => {
    if (!isSimMenuOpen && !isMobileMenuOpen && !isUserMenuOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSimMenuOpen(false);
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSimMenuOpen, isMobileMenuOpen, isUserMenuOpen]);

  const handleSelectSimItem = (id) => {
    onTabChange(id);
    setIsSimMenuOpen(false);
    setIsMobileMenuOpen(false);
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

  const adminPanelLabel = isCoordinator ? 'Panel Coordinación PAEDIS' : 'Panel de Administración';

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-900 sticky top-0 z-40 border-b border-slate-200/90 shadow-[0_2px_10px_-2px_rgba(0,0,0,0.04)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[70px] sm:h-20 py-2 flex items-center justify-between gap-4">
          {/* 1. Marca Institucional Oficial (Logo 03 - Prominente y legible) */}
          <button
            type="button"
            onClick={() => {
              onTabChange('centro-ayuda');
              setIsMobileMenuOpen(false);
            }}
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

          {/* 2. Bloque Coherente: Navegación + Perfil de Usuario + Salir + Menú Móvil */}
          <div className="flex items-center gap-2 sm:gap-2.5 lg:gap-3">
            {/* Navegación en Escritorio (>= lg) */}
            <nav
              aria-label="Secciones principales del portal"
              className="hidden lg:flex items-center gap-1 bg-slate-100/70 p-1 rounded-full border border-slate-200/70 shadow-2xs backdrop-blur-xs"
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
                          onClick={() => handleSelectSimItem(item.id)}
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
            <div className="hidden lg:block h-6 w-px bg-slate-200/90 mx-0.5" aria-hidden="true" />

            {/* Menú de Usuario Desplegable (Escritorio / Tablet) */}
            <div className="relative hidden sm:block" ref={userMenuRef}>
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

                  {/* Acceso a Panel de Administración / PAEDIS (Si aplica al rol) */}
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-amber-50 hover:bg-amber-100/80 text-amber-950 border border-amber-200/80 transition-colors cursor-pointer"
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left bg-[#002B49] hover:bg-[#003B66] text-white transition-colors shadow-xs cursor-pointer"
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
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left transition-colors cursor-pointer ${
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
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-left hover:bg-rose-50 text-rose-700 hover:text-rose-900 transition-colors cursor-pointer"
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
              className="hidden sm:flex min-h-[38px] items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100/70 hover:bg-slate-200/80 border border-slate-200/70 transition-all duration-150 active:scale-[0.98] cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002B49]"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              <span>Salir</span>
            </button>

            {/* BOTÓN MÓVIL (Menú hamburguesa accesible) */}
            <button
              id="mobile-menu-button"
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              {...getVoiceProps(
                isMobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'
              )}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-200/90 transition-colors shadow-2xs active:scale-95 cursor-pointer"
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              aria-label={isMobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
            >
              {isMobileMenuOpen ? (
                <>
                  <X className="w-5 h-5 text-slate-950" />
                  <span className="font-bold">Cerrar</span>
                </>
              ) : (
                <>
                  <Menu className="w-5 h-5 text-slate-950" />
                  <span className="font-bold">Menú</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* 4. MENÚ DESPLEGABLE MÓVIL (< lg) */}
        {isMobileMenuOpen && (
          <nav
            id="mobile-nav-drawer"
            ref={mobileMenuRef}
            aria-label="Navegación móvil completa"
            className="lg:hidden py-3 border-t border-slate-200 animate-fade-in space-y-3"
          >
            {/* Opciones directas principales */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onTabChange('centro-ayuda');
                  setIsMobileMenuOpen(false);
                }}
                {...getVoiceProps('Centro de Ayuda')}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                  activeTab === 'centro-ayuda'
                    ? 'bg-[#002B49] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-[#FFB81C]" />
                <span>Centro de Ayuda</span>
              </button>
            </div>

            {/* Bloque desplegable: Simulaciones */}
            <div className="bg-slate-50 rounded-2xl p-2.5 border border-slate-200/90 space-y-2">
              <div className="px-2 pt-1">
                <span className="text-[11px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#002B49]" />
                  <span>Simulaciones e instrucciones</span>
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Selecciona una herramienta interactiva:
                </p>
              </div>

              <div className="space-y-1.5">
                {simulationItems.map((item) => {
                  const Icon = item.icon;
                  const isCurrent = activeTab === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSimItem(item.id)}
                      {...getVoiceProps(`${item.label}. ${item.subtitle}`)}
                      className={`w-full min-h-[46px] flex items-center justify-between gap-3 p-2.5 rounded-xl text-left border transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isCurrent ? 'text-[#FFB81C]' : 'text-slate-600'
                          }`}
                        />
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
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opciones directas secundarias */}
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onTabChange('tickets');
                  setIsMobileMenuOpen(false);
                }}
                {...getVoiceProps('Soporte TI')}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                  activeTab === 'tickets'
                    ? 'bg-[#002B49] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Laptop className="w-4 h-4 shrink-0 text-[#FFB81C]" />
                <span>Soporte TI</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onTabChange('perfil');
                  setIsMobileMenuOpen(false);
                }}
                {...getVoiceProps(`Mi Perfil de ${displayName}`)}
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                  activeTab === 'perfil'
                    ? 'bg-[#002B49] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                {user?.photo ? (
                  <img
                    src={user.photo}
                    alt=""
                    className="w-5 h-5 rounded-full object-cover border border-slate-200 shrink-0"
                  />
                ) : (
                  <User className="w-4 h-4 shrink-0 text-[#FFB81C]" />
                )}
                <span>Mi Perfil ({displayName})</span>
              </button>

              {isAdminOrCoordinator && (
                <button
                  type="button"
                  onClick={() => {
                    onTabChange(activeTab === 'admin-panel' ? 'centro-ayuda' : 'admin-panel');
                    setIsMobileMenuOpen(false);
                  }}
                  {...getVoiceProps(
                    activeTab === 'admin-panel' ? 'Volver al Portal Estudiantil' : adminPanelLabel
                  )}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors cursor-pointer ${
                    activeTab === 'admin-panel'
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-[#002B49] text-white shadow-xs'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-[#FFB81C]" />
                  <span>
                    {activeTab === 'admin-panel'
                      ? 'Volver al Portal Estudiantil'
                      : adminPanelLabel}
                  </span>
                </button>
              )}
            </div>

            {/* Salir en móvil */}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between px-1">
              <div className="text-xs text-slate-500 font-medium">
                <span>{displayCampus}</span>
              </div>
              <button
                type="button"
                onClick={logout}
                {...getVoiceProps('Cerrar sesión')}
                className="min-h-[40px] px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
