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

export const UnifiedNavbar = ({
  activeTab,
  onTabChange,
}) => {
  const { user, logout } = useAuth();

  const navTabs = [
    { id: 'centro-ayuda', label: 'Centro de Ayuda & Trámites', icon: HelpCircle },
    { id: 'biblioteca', label: 'Biblioteca (Instrucciones & Acceso)', icon: BookMarked },
    { id: 'vivo-duoc', label: 'Mi Vivo Duoc (Guía & Acceso)', icon: GraduationCap },
    { id: 'tickets', label: 'Tickets Servicios Digitales', icon: Laptop },
    { id: 'perfil', label: 'Mi Perfil', icon: User },
  ];

  return (
    // A11y: Encabezado institucional semántico <header>
    <header className="bg-[#002B49] text-white sticky top-0 z-40 shadow-md border-b-4 border-[#FFB81C]">
      {/* 1. Fila Superior: Marca y Acciones de Usuario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        {/* Marca institucional unificada */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTabChange('centro-ayuda')}
            className="min-h-[44px] flex items-center gap-3 group text-left rounded-xl p-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-transform"
            aria-label="Ir al inicio de Nexo360 Centro de Ayuda & Trámites"
          >
            <div
              className="w-11 h-11 rounded-xl bg-[#FFB81C] text-[#002B49] font-black text-2xl flex items-center justify-center shadow border-2 border-white/20"
              aria-hidden="true"
            >
              N
            </div>
            <div>
              <div className="flex items-center gap-2 leading-none">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Nexo<span className="text-[#FFB81C]">360</span>
                </span>
              </div>
              <p className="text-xs text-slate-200 font-semibold mt-1">
                Centro de Ayuda & Servicios Duoc UC
              </p>
            </div>
          </button>
        </div>

        {/* Acciones de usuario a la derecha */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* Nombre del alumno y Sede Alameda oficial */}
          <div className="text-right border-l-2 border-white/20 pl-4 py-1">
            <span className="text-xs sm:text-sm font-black text-white block">
              {user?.nombre || 'Cristian Guzmán'}
            </span>
            <span className="text-[11px] text-[#FFB81C] block font-bold">
              Ingeniería en Informática • Sede Alameda
            </span>
          </div>

          {/* A11y: Botón de Cerrar Sesión con tamaño mínimo de 44x44px */}
          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 border-2 border-white/40 hover:bg-white/15 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
            aria-label="Cerrar sesión en Nexo360"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* 2. Fila Inferior: Pestañas Principales Accesibles */}
      <div className="bg-[#00223a] border-t border-white/10 px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Pestañas principales de navegación del portal"
          className="max-w-7xl mx-auto flex items-center overflow-x-auto gap-2 py-2"
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
                className={`min-h-[44px] flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shrink-0 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 ${
                  isActive
                    ? 'bg-[#FFB81C] text-slate-950 font-black shadow-md'
                    : 'text-slate-100 hover:bg-white/15 hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
