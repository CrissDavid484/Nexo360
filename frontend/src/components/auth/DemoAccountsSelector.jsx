import React, { useState, useEffect, useMemo } from 'react';
import {
  UserCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  User,
  GraduationCap,
  Laptop,
  Database,
  Check,
  KeyRound,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';

/**
 * =========================================================================
 * MÓDULO DE PERFILES Y ESTUDIANTES DE PRUEBA DE LA BASE DE DATOS (NEXO360)
 * =========================================================================
 * Conectado en tiempo real a MongoDB (/api/auth/users).
 * Permite autocompletar credenciales institucionales de prueba (correo y clave)
 * para evaluar diferentes roles, perfiles PAEDIS, alertas de retención y docencia.
 */

const FALLBACK_USERS = [
  {
    email: 'c.guzman@duocuc.cl',
    fullName: 'Cristian Guzmán',
    role: 'admin',
    roleLabel: 'Administrador General • PAEDIS',
    isPaedis: true,
    academicStatus: 'activo',
    badge: 'Admin & PAEDIS',
  },
  {
    email: 'd.rojas@duocuc.cl',
    fullName: 'Daniela Rojas',
    role: 'estudiante_paedis',
    roleLabel: 'Estudiante Regular • PAEDIS',
    isPaedis: true,
    academicStatus: 'activo',
    badge: 'PAEDIS Activa',
  },
  {
    email: 'm.contreras@duocuc.cl',
    fullName: 'Matías Contreras',
    role: 'estudiante',
    roleLabel: 'Estudiante Regular (Alerta RI < 70%)',
    isPaedis: false,
    academicStatus: 'activo',
    badge: 'Riesgo Deserción',
  },
  {
    email: 'v.soto@duocuc.cl',
    fullName: 'Valentina Soto',
    role: 'tutor_par',
    roleLabel: 'Tutora Par & Cuidadora Ley 21.790',
    isPaedis: false,
    academicStatus: 'activo',
    badge: 'Tutora Par',
  },
  {
    email: 'f.morales@duocuc.cl',
    fullName: 'Felipe Morales',
    role: 'estudiante',
    roleLabel: 'Egresado Titulado',
    isPaedis: false,
    academicStatus: 'titulado',
    badge: 'Titulado 2026',
  },
  {
    email: 'j.perez@duocuc.cl',
    fullName: 'Juan Pérez Silva',
    role: 'estudiante',
    roleLabel: 'Estudiante en Riesgo',
    isPaedis: false,
    academicStatus: 'desercion',
    badge: 'Riesgo Académico',
  },
  {
    email: 'matias.wapo@duocuc.cl',
    fullName: 'Matías Sáez',
    role: 'estudiante',
    roleLabel: 'Estudiante Regular',
    isPaedis: false,
    academicStatus: 'activo',
    badge: 'Estudiante',
  },
  {
    email: 'cri.guzmang@duocuc.cl',
    fullName: 'Cristian Guzmán',
    role: 'estudiante_paedis',
    roleLabel: 'Estudiante PAEDIS',
    isPaedis: true,
    academicStatus: 'activo',
    badge: 'PAEDIS',
  },
  {
    email: 'd.diaz@duocuc.cl',
    fullName: 'Daniela Díaz',
    role: 'admin',
    roleLabel: 'Administradora de Sistema',
    isPaedis: false,
    academicStatus: 'activo',
    badge: 'Admin General',
  },
  {
    email: 'm.gomez@profesor.duoc.cl',
    fullName: 'Mauricio Gómez Arratia',
    role: 'profesor',
    roleLabel: 'Docente Titular Capstone',
    isPaedis: false,
    academicStatus: 'activo',
    badge: 'Docente Titular',
  },
  {
    email: 'p.valenzuela@duoc.cl',
    fullName: 'Patricia Valenzuela',
    role: 'director',
    roleLabel: 'Directora de Carrera',
    isPaedis: false,
    academicStatus: 'activo',
    badge: 'Directora',
  },
  {
    email: 'r.mendez@duoc.cl',
    fullName: 'Roberto Méndez',
    role: 'subdirector',
    roleLabel: 'Subdirector Académico',
    isPaedis: false,
    academicStatus: 'activo',
    badge: 'Subdirector',
  },
  {
    email: 't.montes@duoc.cl',
    fullName: 'Tania Montes',
    role: 'coordinador_paedis',
    roleLabel: 'Coordinadora PAEDIS',
    isPaedis: true,
    academicStatus: 'activo',
    badge: 'Coordinación PAEDIS',
  },
  {
    email: 'c.herrera@duoc.cl',
    fullName: 'Camila Herrera',
    role: 'administrativo',
    roleLabel: 'Gestión Biblioteca y Financiamiento',
    isPaedis: false,
    academicStatus: 'activo',
    badge: 'Administrativo',
  },
  {
    email: 'admin.nexo360@duoc.cl',
    fullName: 'Administrador Nexo360',
    role: 'admin',
    roleLabel: 'Administrador General',
    isPaedis: false,
    academicStatus: 'activo',
    badge: 'Admin',
  },
];

export const DemoAccountsSelector = ({ onSelectAccount, selectedEmail = '' }) => {
  const [dbUsers, setDbUsers] = useState(FALLBACK_USERS);
  const [activeFilter, setActiveFilter] = useState('estudiantes'); // 'estudiantes' | 'todos' | 'personal'
  const [isExpanded, setIsExpanded] = useState(true);
  const [fromDatabase, setFromDatabase] = useState(false);

  useEffect(() => {
    let isMounted = true;
    api
      .getInstitutionalUsers()
      .then((res) => {
        if (!isMounted) return;
        if (res?.success && Array.isArray(res.users) && res.users.length > 0) {
          // Normalizar usuarios de la BD
          const formatted = res.users.map((u) => {
            const role = u.role || 'estudiante';
            let badge = 'Estudiante';
            if (u.isPaedis) badge = 'PAEDIS Activa';
            else if (role === 'admin') badge = 'Admin';
            else if (role === 'profesor') badge = 'Docente';
            else if (role === 'tutor_par') badge = 'Tutor Par';
            else if (u.academicStatus === 'titulado') badge = 'Titulado';
            else if (u.academicStatus === 'desercion') badge = 'Riesgo RI';

            return {
              email: u.email,
              fullName: u.fullName || u.nombre || u.email,
              role: role,
              roleLabel: u.roleLabel || (u.isPaedis ? 'Estudiante PAEDIS' : 'Estudiante Regular'),
              isPaedis: Boolean(u.isPaedis),
              academicStatus: u.academicStatus || 'activo',
              badge,
              password: 'Duoc2026!',
            };
          });
          setDbUsers(formatted);
          setFromDatabase(true);
        }
      })
      .catch((err) => {
        console.warn('[DemoAccounts] Usando perfiles institucionales locales:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    if (activeFilter === 'estudiantes') {
      return dbUsers.filter(
        (u) =>
          u.role.includes('estudiante') ||
          u.role.includes('tutor') ||
          u.isPaedis ||
          u.email.includes('guzman') ||
          !['profesor', 'director', 'subdirector', 'administrativo'].includes(u.role)
      );
    }
    if (activeFilter === 'personal') {
      return dbUsers.filter((u) =>
        ['admin', 'profesor', 'director', 'subdirector', 'coordinador_paedis', 'administrativo'].includes(
          u.role
        )
      );
    }
    return dbUsers;
  }, [dbUsers, activeFilter]);

  const handleSelectUser = (user) => {
    onSelectAccount({
      ...user,
      password: user.password || 'Duoc2026!',
    });
  };

  const getRoleIcon = (role, isPaedis) => {
    if (isPaedis) return <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />;
    if (role === 'admin') return <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" />;
    if (role === 'profesor') return <Laptop className="w-3.5 h-3.5 text-emerald-600 shrink-0" />;
    return <GraduationCap className="w-3.5 h-3.5 text-slate-600 shrink-0" />;
  };

  const studentCount = useMemo(() => {
    return dbUsers.filter(
      (u) =>
        u.role.includes('estudiante') ||
        u.role.includes('tutor') ||
        u.isPaedis ||
        u.email.includes('guzman')
    ).length;
  }, [dbUsers]);

  return (
    <div
      role="region"
      aria-label="Cuentas de prueba institucionales de la base de datos"
      className="mt-4 pt-3 border-t border-slate-200"
    >
      {/* Encabezado colapsable */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-left group cursor-pointer"
          aria-expanded={isExpanded}
        >
          <div className="w-5 h-5 rounded-md bg-[#002B49] text-[#FFB81C] flex items-center justify-center">
            <Users className="w-3 h-3" />
          </div>
          <span className="text-xs font-bold text-slate-800 group-hover:text-[#002B49] transition-colors">
            Estudiantes y Cuentas de Prueba
          </span>
          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
            {fromDatabase ? 'Base de Datos' : 'Institucional'} ({dbUsers.length})
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
          )}
        </button>

        <span className="text-[10px] font-medium text-slate-400">
          Clave: <strong className="text-slate-600">Duoc2026!</strong>
        </span>
      </div>

      {isExpanded && (
        <div className="space-y-2 animate-fade-in">
          {/* Píldoras de filtro */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'estudiantes'}
              onClick={() => setActiveFilter('estudiantes')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'estudiantes'
                  ? 'bg-[#002B49] text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Estudiantes ({studentCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'todos'}
              onClick={() => setActiveFilter('todos')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'todos'
                  ? 'bg-[#002B49] text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Todos ({dbUsers.length})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'personal'}
              onClick={() => setActiveFilter('personal')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap cursor-pointer ${
                activeFilter === 'personal'
                  ? 'bg-[#002B49] text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              Docentes / Admin ({dbUsers.length - studentCount})
            </button>
          </div>

          {/* Selector desplegable rápido para accesibilidad / teclado */}
          <div className="relative">
            <select
              id="demo-user-selector"
              value={selectedEmail}
              onChange={(e) => {
                const found = dbUsers.find((u) => u.email === e.target.value);
                if (found) handleSelectUser(found);
              }}
              aria-label="Seleccionar cuenta de prueba para autocompletar"
              className="w-full min-h-[34px] pl-2.5 pr-7 py-1 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#002B49] cursor-pointer appearance-none"
            >
              <option value="">-- Elige un usuario para autocompletar --</option>
              {filteredUsers.map((u) => (
                <option key={u.email} value={u.email}>
                  {u.fullName} — {u.badge || u.roleLabel} ({u.email})
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-slate-400">
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
            </div>
          </div>

          {/* Rejilla de tarjetas clickeables con los estudiantes de la Base de Datos */}
          <div
            role="list"
            aria-label="Lista de estudiantes y perfiles de prueba"
            className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[190px] overflow-y-auto pr-1"
          >
            {filteredUsers.map((u) => {
              const isSelected = selectedEmail.toLowerCase() === u.email.toLowerCase();
              return (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  aria-pressed={isSelected}
                  className={`p-2 rounded-xl border text-left transition-all flex items-start gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-[#002B49] text-white border-[#002B49] shadow-xs ring-2 ring-amber-400'
                      : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="mt-0.5">{getRoleIcon(u.role, u.isPaedis)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold truncate block">
                        {u.fullName}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#FFB81C] shrink-0" aria-hidden="true" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md truncate ${
                          isSelected
                            ? 'bg-white/20 text-[#FFB81C]'
                            : u.isPaedis
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {u.badge || u.roleLabel}
                      </span>
                      <span
                        className={`text-[10px] truncate ${
                          isSelected ? 'text-slate-300' : 'text-slate-400'
                        }`}
                      >
                        {u.email.split('@')[0]}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 font-medium text-center pt-0.5">
            Haz clic en cualquier estudiante o cuenta para rellenar correo y contraseña automáticamente.
          </p>
        </div>
      )}
    </div>
  );
};

export default DemoAccountsSelector;
