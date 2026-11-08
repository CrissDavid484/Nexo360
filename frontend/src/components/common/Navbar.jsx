import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    // A11y: Encabezado semántico <header>
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-40 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Marca institucional */}
        <div className="flex items-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="min-h-[44px] flex items-center gap-3 group rounded-xl p-1.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
            aria-label="Ir a la página principal de Nexo360 Duoc UC"
          >
            <div
              className="w-12 h-12 bg-[#002B49] text-[#FFB81C] font-black text-2xl flex items-center justify-center rounded-xl shadow-md border-2 border-[#FFB81C] group-hover:scale-105 transition-transform"
              aria-hidden="true"
            >
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  Nexo<span className="text-amber-600">360</span>
                </span>
              </div>
              <p className="text-xs text-slate-700 font-bold">
                Portal Centralizado Inclusivo • Duoc UC
              </p>
            </div>
          </Link>
        </div>

        {/* Zona de Usuario / Acciones */}
        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <p className="text-sm font-black text-slate-900 flex items-center justify-end gap-1.5">
                  <User className="w-4 h-4 text-amber-700" aria-hidden="true" />
                  <span>{user.nombre}</span>
                </p>
                <p className="text-xs text-slate-700 font-bold">
                  {user.carrera} • {user.sede}
                </p>
              </div>

              {/* A11y: Botón cerrar sesión con tamaño mínimo 44x44px y foco ultra-visible */}
              <button
                type="button"
                onClick={handleLogout}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-900 hover:text-red-700 px-4 py-2 rounded-xl font-black text-xs sm:text-sm border-2 border-slate-300 hover:border-red-300 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                aria-label="Cerrar sesión institucional actual"
              >
                <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-100 px-4 py-2 rounded-xl border border-slate-300">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
              <span>Autenticación Segura Institucional</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
