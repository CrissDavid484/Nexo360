import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Mail, Smile, LogOut, Sliders } from 'lucide-react';

export const VivoDuocNavbar = ({ activeTab, onTabChange, onToggleAccessibility, isA11yOpen }) => {
  const { logout } = useAuth();

  return (
    <header className="bg-[#002B49] text-white sticky top-0 z-40 shadow-md border-b-2 border-amber-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Marca Oficial: vivoDuoc | Alumnos */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onTabChange('inicio')}
            className="flex items-center gap-2 group text-left focus:outline-none focus:ring-2 focus:ring-amber-400 rounded-lg p-1 transition-transform"
            aria-label="Ir a Inicio de Vivo Duoc"
          >
            <span className="text-2xl font-black tracking-tight text-white">
              vivo<span className="text-[#FFA300]">Duoc</span>
            </span>
            <span className="text-white/40 font-light text-xl">|</span>
            <span className="text-slate-200 font-semibold text-base tracking-wide">
              Alumnos
            </span>
          </button>
        </div>

        {/* Accesos rápidos superiores (AVA, Correo, Perfil, Salir, y Ajustes PAEDIS) */}
        <div className="flex items-center gap-3">
          {/* Botón Accesibilidad PAEDIS */}
          <button
            type="button"
            onClick={onToggleAccessibility}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all focus:ring-2 focus:ring-amber-400 ${
              isA11yOpen
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'bg-white/10 hover:bg-white/20 text-amber-300 border border-amber-400/40'
            }`}
            title="Activar/Ocultar herramientas de accesibilidad (Alto contraste, Dislexia, Tamaño letra)"
            aria-label="Herramientas de accesibilidad PAEDIS"
          >
            <Sliders className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Ajustes PAEDIS</span>
          </button>

          {/* Botón AVA */}
          <button
            type="button"
            onClick={() => onTabChange('ava')}
            className={`px-2.5 py-1 text-xs font-extrabold rounded-md shadow-sm transition-all focus:ring-2 focus:ring-amber-400 ${
              activeTab === 'ava'
                ? 'bg-amber-400 text-slate-950 ring-2 ring-white'
                : 'bg-white text-[#002B49] hover:bg-slate-100'
            }`}
            aria-label="Abrir Aula Virtual AVA"
          >
            AVA
          </button>

          {/* Botón Correo */}
          <button
            type="button"
            onClick={() => onTabChange('correo')}
            className={`p-2 rounded-full transition-colors focus:ring-2 focus:ring-amber-400 ${
              activeTab === 'correo'
                ? 'bg-amber-400 text-slate-950'
                : 'text-white hover:bg-white/10'
            }`}
            title="Ir a Correo institucional"
            aria-label="Bandeja de Correo institucional"
          >
            <Mail className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Botón Perfil (Carita feliz oficial) */}
          <button
            type="button"
            onClick={() => onTabChange('perfil')}
            className={`p-2 rounded-full transition-colors focus:ring-2 focus:ring-amber-400 ${
              activeTab === 'perfil'
                ? 'bg-amber-400 text-slate-950'
                : 'text-white hover:bg-white/10'
            }`}
            title="Ver mi perfil DuocUC"
            aria-label="Perfil del estudiante"
          >
            <Smile className="w-5 h-5" aria-hidden="true" />
          </button>

          {/* Botón Cerrar Sesión */}
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-1.5 border border-white/50 hover:bg-white/10 text-white px-3 py-1 rounded-md text-xs font-bold transition-colors focus:ring-2 focus:ring-amber-400 ml-1"
            aria-label="Cerrar Sesión"
          >
            <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
            <span className="hidden md:inline">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </header>
  );
};
