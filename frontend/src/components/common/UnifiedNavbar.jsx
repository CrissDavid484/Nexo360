import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HelpCircle,
  BookMarked,
  GraduationCap,
  Laptop,
  User,
  LogOut,
} from 'lucide-react';

/**
 * Barra de Navegación Principal Nexo360
 * Diseño limpio, luminoso y de baja sobrecarga visual inspirado en portales modernos de soporte.
 */
export const UnifiedNavbar = ({ activeTab, onTabChange }) => {
  const { user, logout } = useAuth();

  const navTabs = [
    { id: 'centro-ayuda', label: 'Centro de Ayuda', icon: HelpCircle },
    { id: 'biblioteca', label: 'Biblioteca', icon: BookMarked },
    { id: 'vivo-duoc', label: 'Experiencia Vivo', icon: GraduationCap },
    { id: 'tickets', label: 'Soporte TI', icon: Laptop },
    { id: 'perfil', label: 'Mi Perfil', icon: User },
  ];

  const displayName = user?.nombre || user?.fullName || user?.email || 'Cristian Guzmán';
  const displayCampus = user?.campus || user?.sede || 'Sede Alameda';

  return (
    <header className="bg-white/95 backdrop-blur-md text-slate-900 sticky top-0 z-40 border-b border-slate-200/80 shadow-2xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[68px] py-2.5 flex items-center justify-between gap-4">
          {/* 1. Marca Institucional Limpia */}
          <button
            type="button"
            onClick={() => onTabChange('centro-ayuda')}
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

          {/* 2. Navegación Central en Escritorio */}
          <nav
            aria-label="Secciones principales del portal"
            className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl border border-slate-200/60"
          >
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => onTabChange(tab.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`min-h-[40px] flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-[0.98] ${
                    isActive
                      ? 'bg-[#002B49] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/70'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isActive ? 'text-[#FFB81C]' : 'text-slate-500'
                    }`}
                    aria-hidden="true"
                  />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* 3. Perfil de Usuario y Salida */}
          <div className="flex items-center gap-3">
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
              className="min-h-[40px] min-w-[40px] flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 hover:text-slate-950 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200/80 transition-all duration-150 active:scale-[0.98]"
              aria-label="Cerrar sesión"
            >
              <LogOut className="w-4 h-4 shrink-0 text-slate-500" aria-hidden="true" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>

        {/* Navegación adaptable para tablets y móviles */}
        <nav
          aria-label="Secciones principales (vista compacta)"
          className="flex lg:hidden items-center overflow-x-auto gap-1.5 py-2 border-t border-slate-100"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                  isActive
                    ? 'bg-[#002B49] text-white shadow-xs'
                    : 'text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? 'text-[#FFB81C]' : 'text-slate-500'
                  }`}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
