import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Smile, LogOut, Sliders } from 'lucide-react';

export const VivoDuocNavbar = ({ activeTab, onTabChange, onToggleAccessibility, isA11yOpen }) => {
  const { logout } = useAuth();

  return (
    // A11y: Encabezado semántico <header>
    <header className="bg-[#002B49] text-white sticky top-0 z-40 shadow-md border-b-4 border-[#FFB81C]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Marca Oficial: vivoDuoc | Alumnos */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onTabChange('inicio')}
            className="min-h-[44px] flex items-center gap-2 group text-left rounded-xl p-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 transition-transform"
            aria-label="Ir a Inicio de Vivo Duoc"
          >
            <span className="text-2xl font-black tracking-tight text-white">
              vivo<span className="text-[#FFB81C]">Duoc</span>
            </span>
            <span className="text-white/40 font-light text-xl" aria-hidden="true">|</span>
            <span className="text-slate-100 font-bold text-base tracking-wide">
              Alumnos
            </span>
          </button>
        </div>

        {/* Accesos rápidos superiores */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* A11y: Botón con aria-expanded y tamaño >= 44px */}
          <button
            type="button"
            onClick={onToggleAccessibility}
            aria-expanded={isA11yOpen}
            className={`min-h-[44px] flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 ${
              isA11yOpen
                ? 'bg-[#FFB81C] text-slate-950 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-[#FFB81C] border border-[#FFB81C]/50'
            }`}
            title="Activar o desactivar herramientas de accesibilidad universal"
            aria-label="Herramientas de accesibilidad universal"
          >
            <Sliders className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Ajustes Accesibilidad</span>
          </button>

          {/* Botón AVA */}
          <button
            type="button"
            onClick={() => onTabChange('ava')}
            className={`min-h-[44px] min-w-[44px] px-3.5 py-2 text-xs font-black rounded-xl shadow-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 ${
              activeTab === 'ava'
                ? 'bg-[#FFB81C] text-slate-950 ring-2 ring-white'
                : 'bg-white text-[#002B49] hover:bg-slate-100'
            }`}
            aria-label="Abrir Aula Virtual AVA Blackboard"
          >
            AVA
          </button>

          {/* Botón Correo */}
          <button
            type="button"
            onClick={() => onTabChange('correo')}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 flex items-center justify-center ${
              activeTab === 'correo'
                ? 'bg-[#FFB81C] text-slate-950'
                : 'text-white hover:bg-white/15'
            }`}
            title="Ir a Correo institucional"
            aria-label="Bandeja de Correo institucional Microsoft 365"
          >
            <Mail className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>

          {/* Botón Perfil */}
          <button
            type="button"
            onClick={() => onTabChange('perfil')}
            className={`min-h-[44px] min-w-[44px] p-2.5 rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 flex items-center justify-center ${
              activeTab === 'perfil'
                ? 'bg-[#FFB81C] text-slate-950'
                : 'text-white hover:bg-white/15'
            }`}
            title="Ver mi perfil institucional DuocUC"
            aria-label="Perfil del estudiante y Preferencias de Accesibilidad"
          >
            <Smile className="w-5 h-5 shrink-0" aria-hidden="true" />
          </button>

          {/* Botón Cerrar Sesión */}
          <button
            type="button"
            onClick={logout}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 border-2 border-white/40 hover:bg-white/15 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
            aria-label="Cerrar sesión actual"
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};
