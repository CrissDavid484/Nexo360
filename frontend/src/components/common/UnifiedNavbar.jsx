import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  HelpCircle,
  BookMarked,
  GraduationCap,
  FileText,
  User,
  LogOut,
  Sliders,
  ShieldCheck,
} from 'lucide-react';

export const UnifiedNavbar = ({
  activeTab,
  onTabChange,
  isA11yOpen,
  onToggleAccessibility,
}) => {
  const { user, logout } = useAuth();

  const navTabs = [
    { id: 'centro-ayuda', label: 'Centro de Ayuda & Trámites', icon: HelpCircle },
    { id: 'biblioteca', label: 'Biblioteca (Reserva de Salas)', icon: BookMarked, badge: 'Duoc' },
    { id: 'vivo-duoc', label: 'Mi Vivo Duoc (Notas/Asistencia)', icon: GraduationCap },
    { id: 'solicitudes', label: 'Solicitudes Académicas', icon: FileText },
    { id: 'perfil', label: 'Mi Perfil', icon: User },
  ];

  return (
    <header className="bg-[#002B49] text-white sticky top-0 z-40 shadow-md border-b-2 border-amber-400">
      {/* 1. Fila Superior: Marca y Acciones de Usuario */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Marca institucional unificada */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTabChange('centro-ayuda')}
            className="flex items-center gap-2 group text-left focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-1"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-[#002B49] font-black text-xl flex items-center justify-center shadow-sm">
              N
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none">
                <span className="text-xl font-black tracking-tight text-white">
                  Nexo<span className="text-amber-400">360</span>
                </span>
                <span className="bg-amber-400 text-slate-950 font-black text-[10px] px-1.5 py-0.5 rounded uppercase">
                  PAEDIS
                </span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                Centro de Ayuda & Servicios Duoc UC
              </p>
            </div>
          </button>
        </div>

        {/* Acciones de usuario a la derecha */}
        <div className="flex items-center gap-3">
          {/* Botón Accesibilidad PAEDIS */}
          <button
            type="button"
            onClick={onToggleAccessibility}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all focus:ring-2 focus:ring-amber-400 ${
              isA11yOpen
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/50'
            }`}
            title="Herramientas de accesibilidad WCAG 2.2 AA (Alto contraste, Dislexia, Tamaño de letra)"
            aria-label="Abrir herramientas de accesibilidad"
          >
            <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Ajustes Accesibilidad</span>
          </button>

          {/* Nombre del alumno */}
          <div className="hidden md:block text-right border-l border-white/20 pl-3">
            <span className="text-xs font-bold text-white block">
              {user?.nombre || 'Cristian Guzman Garcia'}
            </span>
            <span className="text-[10px] text-amber-300 block font-medium">
              Ingeniería en Informática • San Joaquín
            </span>
          </div>

          {/* Cerrar Sesión */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 border border-white/40 hover:bg-white/10 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-colors focus:ring-2 focus:ring-amber-400"
            aria-label="Cerrar sesión"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </div>

      {/* 2. Fila Inferior: Pestañas Principales Grandes y Fáciles */}
      <div className="bg-[#00223a] border-t border-white/10 px-4 sm:px-6 lg:px-8">
        <nav
          aria-label="Pestañas principales del portal"
          className="max-w-7xl mx-auto flex items-center overflow-x-auto no-scrollbar gap-1 sm:gap-2 py-1.5"
        >
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all shrink-0 focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                    : 'text-slate-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-slate-950' : 'text-amber-400'
                  }`}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      isActive ? 'bg-[#002B49] text-amber-300' : 'bg-white/20 text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
