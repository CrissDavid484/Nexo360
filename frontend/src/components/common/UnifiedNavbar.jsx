import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  Sparkles,
  Check,
  ShieldAlert,
} from 'lucide-react';

/**
 * Barra de Navegación Principal Nexo360
 * - Agrupa "Toma de Ramos", "Biblioteca" y "Experiencia Vivo" en el menú desplegable "Simulaciones e instrucciones".
 * - En modo móvil, reemplaza el carrusel horizontal con un botón de menú desplegable limpio y accesible (WCAG 2.2 AAA).
 */
export const UnifiedNavbar = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();
  const [isSimMenuOpen, setIsSimMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const simMenuRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Sub-opciones de "Simulaciones e instrucciones"
  const simulationItems = [
    {
      id: 'toma-ramos',
      label: 'Toma de Ramos',
      subtitle: 'Simula de tu toma de ramos',
      icon: Calendar,
      badge: 'Simulador',
    },
    {
      id: 'biblioteca',
      label: 'Biblioteca',
      subtitle: 'Reserva de salas de estudio y lentes VR',
      icon: BookMarked,
      badge: 'Reserva de Salas',
    },
    {
      id: 'vivo-duoc',
      label: 'Experiencia Vivo',
      subtitle: 'Manual interactivo del portal Vivo Duoc',
      icon: GraduationCap,
      badge: 'Manual Oficial',
    },
  ];

  const isSimActive =
    activeTab === 'toma-ramos' ||
    activeTab === 'biblioteca' ||
    activeTab === 'vivo-duoc';

  const activeSimItem = simulationItems.find((item) => item.id === activeTab);

  // Cerrar menús al hacer clic fuera o presionar Escape
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (simMenuRef.current && !simMenuRef.current.contains(e.target)) {
        setIsSimMenuOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !e.target.closest('#mobile-menu-button')
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsSimMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelectSimItem = (id) => {
    onTabChange(id);
    setIsSimMenuOpen(false);
    setIsMobileMenuOpen(false);
  };

  const displayName = user?.nombre || user?.fullName || user?.email || 'Cristian Guzmán';
  const displayCampus = user?.campus || user?.sede || 'Sede Alameda';

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-900 sticky top-0 z-40 border-b border-slate-200 shadow-[0_2px_12px_-2px_rgba(0,0,0,0.06)] transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[68px] py-2.5 flex items-center justify-between gap-4">
          {/* 1. Marca Institucional Limpia */}
          <button
            type="button"
            onClick={() => {
              onTabChange('centro-ayuda');
              setIsMobileMenuOpen(false);
            }}
            className="min-h-[44px] flex items-center gap-3 group text-left rounded-xl pr-2 transition-transform duration-150 active:scale-[0.98]"
            aria-label="Ir al inicio de Nexo360 Centro de Ayuda"
          >
            <div
              className="w-10 h-10 rounded-xl bg-[#002B49] text-[#FFB81C] font-bold text-lg flex items-center justify-center shadow-xs transition-transform duration-200 group-hover:scale-105"
              aria-hidden="true"
            >
              N
            </div>
            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="text-lg sm:text-xl font-bold tracking-tight text-[#002B49]">
                  Nexo<span className="text-amber-600">360</span>
                </span>
                <span className="hidden sm:inline-block text-[11px] font-semibold text-slate-500 border-l border-slate-200 pl-2">
                  Duoc UC
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Centro de Ayuda y Servicios
              </p>
            </div>
          </button>

          {/* 2. Navegación Central en Escritorio (>= lg) */}
          <nav
            aria-label="Secciones principales del portal"
            className="hidden lg:flex items-center gap-1.5 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60"
          >
            {/* Opción 1: Centro de Ayuda */}
            <button
              type="button"
              onClick={() => onTabChange('centro-ayuda')}
              aria-current={activeTab === 'centro-ayuda' ? 'page' : undefined}
              className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                activeTab === 'centro-ayuda'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
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

            {/* Opción 2: Menú Desplegable "Simulaciones e instrucciones" */}
            <div className="relative" ref={simMenuRef}>
              <button
                type="button"
                onClick={() => setIsSimMenuOpen(!isSimMenuOpen)}
                aria-haspopup="menu"
                aria-expanded={isSimMenuOpen}
                className={`min-h-[44px] flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl transition-all duration-200 active:scale-[0.98] ${
                  isSimActive
                    ? 'bg-[#002B49] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                    isSimActive ? 'bg-white/10 text-[#FFB81C]' : 'text-slate-500'
                  }`}
                  aria-hidden="true"
                >
                  {isSimActive && activeSimItem ? (
                    <activeSimItem.icon className="w-4 h-4" />
                  ) : (
                    <Layers className="w-4 h-4" />
                  )}
                </div>

                {isSimActive && activeSimItem ? (
                  <div className="flex flex-col text-left leading-tight">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                      Simulaciones e instrucciones
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-white mt-0.5">
                      {activeSimItem.label}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-semibold">
                    Simulaciones e instrucciones
                  </span>
                )}

                <ChevronDown
                  className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ml-0.5 ${
                    isSimMenuOpen ? 'rotate-180' : ''
                  } ${isSimActive ? 'text-[#FFB81C]' : 'text-slate-400'}`}
                  aria-hidden="true"
                />
              </button>

              {/* Menú Flotante Desplegable en Escritorio */}
              {isSimMenuOpen && (
                <div
                  role="menu"
                  aria-label="Submenú de simulaciones e instrucciones"
                  className="absolute left-0 mt-2 w-80 bg-white rounded-2xl shadow-[0_20px_40px_-10px_rgba(0,43,73,0.18),0_4px_12px_rgba(0,0,0,0.08)] border border-slate-300 p-2 z-50 animate-fade-in space-y-1 ring-1 ring-slate-900/5"
                >
                  <div className="px-3 py-1.5 border-b border-slate-100">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Módulos Prácticos
                    </span>
                    <p className="text-xs text-slate-600 font-medium">
                      Simuladores oficiales y guías paso a paso
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
                        className={`w-full min-h-[44px] flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors ${
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
                            <span className={`text-xs font-bold block truncate ${
                              isCurrent ? 'text-white' : 'text-slate-900'
                            }`}>
                              {item.label}
                            </span>
                            {isCurrent && (
                              <Check className="w-3.5 h-3.5 text-[#FFB81C] shrink-0" />
                            )}
                          </div>
                          <p className={`text-[11px] leading-tight mt-0.5 truncate ${
                            isCurrent ? 'text-slate-200' : 'text-slate-500'
                          }`}>
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
              className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                activeTab === 'tickets'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
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

            {/* Opción 4: Mi Perfil */}
            <button
              type="button"
              onClick={() => onTabChange('perfil')}
              aria-current={activeTab === 'perfil' ? 'page' : undefined}
              className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                activeTab === 'perfil'
                  ? 'bg-[#002B49] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
              }`}
            >
              <User
                className={`w-4 h-4 shrink-0 transition-colors ${
                  activeTab === 'perfil' ? 'text-[#FFB81C]' : 'text-slate-500'
                }`}
                aria-hidden="true"
              />
              <span>Mi Perfil</span>
            </button>

            {/* Opción 5: Panel Admin (Exclusivo Administrador) */}
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => onTabChange('admin-panel')}
                aria-current={activeTab === 'admin-panel' ? 'page' : undefined}
                className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-black transition-all duration-200 active:scale-[0.98] ${
                  activeTab === 'admin-panel'
                    ? 'bg-amber-500 text-slate-950 shadow-xs'
                    : 'text-amber-800 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-300'
                }`}
              >
                <ShieldAlert
                  className={`w-4 h-4 shrink-0 transition-colors ${
                    activeTab === 'admin-panel' ? 'text-slate-950' : 'text-amber-700'
                  }`}
                  aria-hidden="true"
                />
                <span>Panel Admin</span>
              </button>
            )}
          </nav>

          {/* 3. Acciones Derecha: Perfil, Salir y Botón Menú Móvil */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => onTabChange('perfil')}
              className="hidden sm:flex items-center gap-2.5 text-right pl-3 py-1 rounded-xl hover:bg-slate-50 transition-colors"
              title="Ver mi perfil institucional"
            >
              <div className="text-right">
                <span className="text-xs sm:text-sm font-semibold text-slate-800 block leading-tight">
                  {displayName}
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  {displayCampus}
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={logout}
              className="hidden sm:flex min-h-[40px] min-w-[40px] items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200/80 transition-all duration-150 active:scale-[0.98]"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span>Salir</span>
            </button>

            {/* BOTÓN MÓVIL (Reemplaza el carrusel horizontal recortado) */}
            <button
              id="mobile-menu-button"
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden min-h-[44px] min-w-[44px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs border border-slate-300 transition-colors shadow-2xs active:scale-95"
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
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors ${
                  activeTab === 'centro-ayuda'
                    ? 'bg-[#002B49] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <HelpCircle className="w-4 h-4 shrink-0 text-[#FFB81C]" />
                <span>Centro de Ayuda</span>
              </button>
            </div>

            {/* Bloque desplegable: Simulaciones e instrucciones */}
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
                      className={`w-full min-h-[46px] flex items-center justify-between gap-3 p-2.5 rounded-xl text-left border transition-all ${
                        isCurrent
                          ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs'
                          : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isCurrent ? 'text-[#FFB81C]' : 'text-slate-600'}`} />
                        <div className="truncate">
                          <span className="font-bold text-xs block">{item.label}</span>
                          <span className={`text-[10px] block truncate ${isCurrent ? 'text-slate-200' : 'text-slate-500'}`}>
                            {item.subtitle}
                          </span>
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        isCurrent
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
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
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors ${
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
                className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-colors ${
                  activeTab === 'perfil'
                    ? 'bg-[#002B49] text-white shadow-xs'
                    : 'bg-slate-50 text-slate-800 hover:bg-slate-100'
                }`}
              >
                <User className="w-4 h-4 shrink-0 text-[#FFB81C]" />
                <span>Mi Perfil ({displayName})</span>
              </button>

              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => {
                    onTabChange('admin-panel');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-black text-left transition-colors ${
                    activeTab === 'admin-panel'
                      ? 'bg-amber-500 text-slate-950 shadow-xs'
                      : 'bg-amber-50 text-amber-950 hover:bg-amber-100 border border-amber-300'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-700" />
                  <span>Panel de Administración (Admin)</span>
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
                className="min-h-[40px] px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-1.5"
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
