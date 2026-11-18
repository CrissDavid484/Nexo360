import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  GraduationCap,
  Laptop,
  Check,
  Users,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAccessibility } from '../../context/AccessibilityContext';

const ROLE_BADGES = {
  admin: 'Admin',
  profesor: 'Docente',
  tutor_par: 'Tutor Par',
};

function resolveDemoBadge(user) {
  if (user.isPaedis) return 'PAEDIS';
  if (ROLE_BADGES[user.role]) return ROLE_BADGES[user.role];
  if (user.academicStatus === 'titulado') return 'Titulado';
  if (user.academicStatus === 'desercion') return 'Riesgo RI';
  return 'Estudiante';
}

function formatInstitutionalUser(user) {
  const role = user.role || 'estudiante';
  return {
    email: user.email,
    fullName: user.fullName || user.nombre || user.email,
    role,
    roleLabel: user.roleLabel || (user.isPaedis ? 'Estudiante PAEDIS' : 'Estudiante Regular'),
    isPaedis: Boolean(user.isPaedis),
    academicStatus: user.academicStatus || 'activo',
    badge: resolveDemoBadge(user),
    password: 'Duoc2026!',
  };
}

/**
 * =========================================================================
 * MÓDULO DE PERFILES Y ESTUDIANTES DE PRUEBA DE LA BASE DE DATOS (NEXO360)
 * =========================================================================
 * Conectado en tiempo real a MongoDB (/api/auth/users).
 * Diseño minimalista, pulcro y ligero para autocompletar credenciales de prueba.
 */

const FALLBACK_USERS = [
  ['c.guzman@duocuc.cl', 'Cristian Guzmán', 'admin', 'Administrador General • PAEDIS', true, 'Admin & PAEDIS'],
  ['an.ordenesd@duocuc.cl', 'Angelo Órdenes', 'estudiante', 'Estudiante Regular Duoc UC', false, 'Estudiante'],
  ['d.rojas@duocuc.cl', 'Daniela Rojas', 'estudiante_paedis', 'Estudiante Regular • PAEDIS', true, 'PAEDIS Activa'],
  ['m.contreras@duocuc.cl', 'Matías Contreras', 'estudiante', 'Estudiante Regular (Alerta RI < 70%)', false, 'Riesgo Deserción'],
  ['v.soto@duocuc.cl', 'Valentina Soto', 'tutor_par', 'Tutora Par & Cuidadora Ley 21.790', false, 'Tutora Par'],
  ['f.morales@duocuc.cl', 'Felipe Morales', 'estudiante', 'Egresado Titulado', false, 'Titulado', 'titulado'],
  ['j.perez@duocuc.cl', 'Juan Pérez Silva', 'estudiante', 'Estudiante en Riesgo', false, 'Riesgo Académico', 'desercion'],
  ['matias.wapo@duocuc.cl', 'Matías Sáez', 'estudiante', 'Estudiante Regular', false, 'Estudiante'],
  ['cri.guzmang@duocuc.cl', 'Cristian Guzmán G.', 'estudiante_paedis', 'Estudiante PAEDIS', true, 'PAEDIS'],
  ['d.diaz@duocuc.cl', 'Daniela Díaz', 'admin', 'Administradora de Sistema', false, 'Admin General'],
  ['m.gomez@profesor.duoc.cl', 'Mauricio Gómez Arratia', 'profesor', 'Docente Titular Capstone', false, 'Docente Titular'],
  ['p.valenzuela@duoc.cl', 'Patricia Valenzuela', 'director', 'Directora de Carrera', false, 'Directora'],
  ['r.mendez@duoc.cl', 'Roberto Méndez', 'subdirector', 'Subdirector Académico', false, 'Subdirector'],
  ['t.montes@duoc.cl', 'Tania Montes', 'coordinador_paedis', 'Coordinadora PAEDIS', true, 'Coord. PAEDIS'],
  ['c.herrera@duoc.cl', 'Camila Herrera', 'administrativo', 'Gestión Biblioteca y Financiamiento', false, 'Administrativo'],
  ['admin.nexo360@duoc.cl', 'Administrador Nexo360', 'admin', 'Administrador General', false, 'Admin'],
].map(([email, fullName, role, roleLabel, isPaedis, badge, status]) => ({
  email,
  fullName,
  role,
  roleLabel,
  isPaedis,
  academicStatus: status || 'activo',
  badge,
}));

const isStudentAccount = (user) => {
  const r = user?.role || '';
  return (
    r.includes('estudiante') ||
    r.includes('tutor') ||
    Boolean(user?.isPaedis) ||
    !['profesor', 'director', 'subdirector', 'administrativo'].includes(r)
  );
};

export const DemoAccountsSelector = ({ onSelectAccount, selectedEmail = '' }) => {
  const { getVoiceProps } = useAccessibility();
  const [dbUsers, setDbUsers] = useState(FALLBACK_USERS);
  const [activeFilter, setActiveFilter] = useState('estudiantes'); // 'estudiantes' | 'personal' | 'todos'
  const [isExpanded, setIsExpanded] = useState(false);
  const [fromDatabase, setFromDatabase] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadInstitutionalUsers = async () => {
      try {
        const res = await api.getInstitutionalUsers();
        if (!isMounted) return;
        if (res?.success && Array.isArray(res.users) && res.users.length > 0) {
          setDbUsers(res.users.map(formatInstitutionalUser));
          setFromDatabase(true);
        }
      } catch (err) {
        console.warn('[DemoAccounts] Usando perfiles institucionales locales:', err);
      }
    };

    loadInstitutionalUsers().catch((err) => {
      console.warn('[DemoAccounts] Error cargando perfiles demo:', err);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    let list = dbUsers;
    if (activeFilter === 'estudiantes') {
      list = dbUsers.filter(isStudentAccount);
    } else if (activeFilter === 'personal') {
      list = dbUsers.filter((u) => !isStudentAccount(u));
    }
    // Orden alfabético estricto de A a Z
    return [...list].sort((a, b) => {
      const nameA = (a.fullName || a.nombre || a.email || '').trim();
      const nameB = (b.fullName || b.nombre || b.email || '').trim();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });
  }, [dbUsers, activeFilter]);

  const studentCount = useMemo(() => {
    return dbUsers.filter(isStudentAccount).length;
  }, [dbUsers]);

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
    return <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
  };

  return (
    <div
      role="region"
      aria-label="Cuentas de prueba institucionales"
      className="mt-3 pt-3 border-t border-slate-200/80"
    >
      {/* Botón trigger minimalista y elegante */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        {...getVoiceProps(
          `Cuentas de prueba institucionales. ${dbUsers.length} perfiles disponibles.`
        )}
        className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors text-xs font-medium cursor-pointer border border-slate-200/70"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#002B49]" />
          <span className="font-semibold text-slate-800">
            Cuentas de prueba institucionales
          </span>
          <span className="text-[10px] font-semibold text-slate-500 bg-white px-1.5 py-0.2 rounded-full border border-slate-200">
            {fromDatabase ? 'BD' : 'Demo'} ({dbUsers.length})
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span>Duoc2026!</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
          )}
        </div>
      </button>

      {/* Lista minimalista desplegable */}
      {isExpanded && (
        <div className="mt-2 space-y-2 animate-fade-in">
          {/* Filtros sutiles en texto */}
          <div className="flex items-center gap-1 pb-1 border-b border-slate-100" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'estudiantes'}
              onClick={() => setActiveFilter('estudiantes')}
              {...getVoiceProps(`Estudiantes, ${studentCount} cuentas`)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                activeFilter === 'estudiantes'
                  ? 'bg-[#002B49] text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Estudiantes ({studentCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'personal'}
              onClick={() => setActiveFilter('personal')}
              {...getVoiceProps(`Docentes y Administración, ${dbUsers.length - studentCount} cuentas`)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                activeFilter === 'personal'
                  ? 'bg-[#002B49] text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Docentes / Admin ({dbUsers.length - studentCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'todos'}
              onClick={() => setActiveFilter('todos')}
              {...getVoiceProps(`Todos, ${dbUsers.length} cuentas`)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                activeFilter === 'todos'
                  ? 'bg-[#002B49] text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Todos ({dbUsers.length})
            </button>
          </div>

          {/* Lista minimalista de fila única */}
          <div
            role="list"
            aria-label="Lista de cuentas de prueba institucionales"
            className="max-h-[195px] overflow-y-auto space-y-1 pr-0.5 divide-y divide-slate-100/80"
          >
            {filteredUsers.map((u) => {
              const isSelected = selectedEmail.toLowerCase() === u.email.toLowerCase();
              return (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleSelectUser(u)}
                  aria-pressed={isSelected}
                  {...getVoiceProps(`${u.fullName}, ${u.badge || u.roleLabel}`)}
                  className={`w-full pt-1.5 pb-1 px-2 rounded-lg text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/80 text-slate-900 ring-1 ring-amber-300'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0">
                      {getRoleIcon(u.role, u.isPaedis)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {u.fullName}
                        </span>
                        <span
                          className={`text-[9px] font-medium px-1.5 py-0.2 rounded shrink-0 ${
                            u.isPaedis
                              ? 'bg-amber-100 text-amber-900'
                              : u.role === 'admin'
                              ? 'bg-blue-100 text-blue-800'
                              : u.role === 'profesor'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {u.badge || u.roleLabel}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-700 bg-amber-100/90 px-1.5 py-0.2 rounded">
                        <Check className="w-3 h-3 text-amber-700" />
                        <span>Listo</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 hover:text-slate-600">
                        Usar
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-400 text-center pt-0.5">
            Selecciona una cuenta para autocompletar correo y contraseña.
          </p>
        </div>
      )}
    </div>
  );
};

export default DemoAccountsSelector;
