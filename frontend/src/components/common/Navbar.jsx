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
    <header className="bg-white border-b-2 border-slate-200 sticky top-0 z-40 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Marca institucional */}
        <div className="flex items-center gap-4">
          <Link
            to={isAuthenticated ? '/dashboard' : '/login'}
            className="flex items-center gap-3 group focus:ring-4 focus:ring-amber-500 rounded-lg p-1"
            aria-label="Ir a la página de inicio de Nexo360 Duoc UC"
          >
            <div className="w-12 h-12 bg-duoc-navy text-amber-400 font-black text-2xl flex items-center justify-center rounded-xl shadow-md border-2 border-amber-400 group-hover:scale-105 transition-transform">
              N
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black tracking-tight text-slate-900">
                  Nexo<span className="text-amber-500">360</span>
                </span>
                <span className="bg-amber-100 text-amber-900 border border-amber-400 text-xs px-2 py-0.5 rounded-full font-bold">
                  PAEDIS
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium">
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
                <p className="text-sm font-bold text-slate-900 flex items-center justify-end gap-1.5">
                  <User className="w-4 h-4 text-amber-600" aria-hidden="true" />
                  {user.nombre}
                </p>
                <p className="text-xs text-slate-500">
                  {user.carrera} • {user.sede}
                </p>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 bg-slate-100 hover:bg-red-50 text-slate-800 hover:text-red-700 px-4 py-2 rounded-lg font-semibold text-sm border border-slate-300 hover:border-red-300 transition-colors focus:ring-4 focus:ring-red-400"
                aria-label="Cerrar sesión actual"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">Cerrar Sesión</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>Autenticación Segura Institucional</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
