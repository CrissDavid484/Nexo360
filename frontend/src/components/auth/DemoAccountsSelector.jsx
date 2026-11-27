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

function resolveBadgeFromAccount(user) {
  const roleLabel = String(user.roleLabel || '');
  if (/paedis/i.test(roleLabel)) return 'PAEDIS';
  if (/admin/i.test(roleLabel)) return 'Admin';
  if (/docente|profesor/i.test(roleLabel)) return 'Docente';
  if (/tutor/i.test(roleLabel)) return 'Tutor Par';
  if (/director|subdirector/i.test(roleLabel)) return 'Dirección';
  return roleLabel || 'Demo';
}

function isStudentAccount(user) {
  const label = String(user?.roleLabel || user?.role || '').toLowerCase();
  if (label.includes('estudiante') || label.includes('tutor')) return true;
  if (
    label.includes('admin') ||
    label.includes('docente') ||
    label.includes('profesor') ||
    label.includes('director') ||
    label.includes('coordinador')
  ) {
    return false;
  }
  return String(user?.email || '').toLowerCase().endsWith('@duocuc.cl');
}

export const DemoAccountsSelector = ({ onSelectAccount, selectedEmail = '' }) => {
  const { getVoiceProps } = useAccessibility();
  const [demoUsers, setDemoUsers] = useState([]);
  const [isDemoEnabled, setIsDemoEnabled] = useState(false);
  const [activeFilter, setActiveFilter] = useState('estudiantes');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadDemoAccounts = async () => {
      try {
        const res = await api.getDemoAccounts();
        if (!isMounted) return;
        const list = res?.accounts || res?.users || [];
        if (res?.success && Array.isArray(list) && list.length > 0) {
          setDemoUsers(
            list.map((u) => ({
              email: u.email,
              fullName: u.fullName || u.nombre || u.email,
              roleLabel: u.roleLabel || 'Cuenta Demo',
              badge: resolveBadgeFromAccount(u),
            }))
          );
          setIsDemoEnabled(true);
        } else {
          setDemoUsers([]);
          setIsDemoEnabled(false);
        }
      } catch {
        if (isMounted) {
          setDemoUsers([]);
          setIsDemoEnabled(false);
        }
      }
    };

    void loadDemoAccounts();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredUsers = useMemo(() => {
    let list = demoUsers;
    if (activeFilter === 'estudiantes') {
      list = demoUsers.filter(isStudentAccount);
    } else if (activeFilter === 'personal') {
      list = demoUsers.filter((u) => !isStudentAccount(u));
    }
    return [...list].sort((a, b) => {
      const nameA = (a.fullName || a.email || '').trim();
      const nameB = (b.fullName || b.email || '').trim();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });
  }, [demoUsers, activeFilter]);

  const studentCount = useMemo(
    () => demoUsers.filter(isStudentAccount).length,
    [demoUsers]
  );

  // En producción o cuando el endpoint demo está deshabilitado (404), ocultar completamente el selector
  if (!isDemoEnabled || demoUsers.length === 0) {
    return null;
  }

  const getRoleIcon = (user) => {
    const label = String(user.roleLabel || '').toLowerCase();
    if (label.includes('paedis')) return <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden="true" />;
    if (label.includes('admin')) return <Shield className="w-3.5 h-3.5 text-blue-600 shrink-0" aria-hidden="true" />;
    if (label.includes('docente') || label.includes('profesor')) {
      return <Laptop className="w-3.5 h-3.5 text-emerald-600 shrink-0" aria-hidden="true" />;
    }
    return <GraduationCap className="w-3.5 h-3.5 text-slate-500 shrink-0" aria-hidden="true" />;
  };

  return (
    <div
      role="region"
      aria-label="Cuentas de demostración (solo desarrollo)"
      className="mt-3 pt-3 border-t border-slate-200/80"
    >
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        {...getVoiceProps(
          `Cuentas de demostración disponibles. ${demoUsers.length} perfiles.`
        )}
        className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors text-xs font-medium cursor-pointer border border-slate-200/70"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
          <span className="font-semibold text-slate-800">
            Cuentas de prueba (Entorno Demo)
          </span>
          <span className="text-[10px] font-semibold text-slate-600 bg-white px-1.5 py-0.5 rounded-full border border-slate-200">
            {demoUsers.length}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>Desarrollo</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
          )}
        </div>
      </button>

      {isExpanded && (
        <div className="mt-2 space-y-2 animate-fade-in">
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
              {...getVoiceProps(`Docentes y Administración, ${demoUsers.length - studentCount} cuentas`)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                activeFilter === 'personal'
                  ? 'bg-[#002B49] text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Docentes / Admin ({demoUsers.length - studentCount})
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFilter === 'todos'}
              onClick={() => setActiveFilter('todos')}
              {...getVoiceProps(`Todos, ${demoUsers.length} cuentas`)}
              className={`px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                activeFilter === 'todos'
                  ? 'bg-[#002B49] text-white'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'
              }`}
            >
              Todos ({demoUsers.length})
            </button>
          </div>

          <div
            role="list"
            aria-label="Lista de cuentas de demostración"
            className="max-h-[195px] overflow-y-auto space-y-1 pr-0.5 divide-y divide-slate-100/80"
          >
            {filteredUsers.map((u) => {
              const isSelected = selectedEmail.toLowerCase() === u.email.toLowerCase();
              return (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => onSelectAccount(u)}
                  aria-pressed={isSelected}
                  {...getVoiceProps(`${u.fullName}, ${u.badge}`)}
                  className={`w-full pt-1.5 pb-1 px-2 rounded-lg text-left transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/80 text-slate-900 ring-1 ring-amber-300'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="shrink-0">{getRoleIcon(u)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {u.fullName}
                        </span>
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded shrink-0 bg-slate-100 text-slate-700">
                          {u.badge}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono truncate">
                        {u.email}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    {isSelected ? (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded">
                        <Check className="w-3 h-3 text-amber-800" aria-hidden="true" />
                        <span>Listo</span>
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 hover:text-slate-700">
                        Usar
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 text-center pt-0.5">
            Acceso rápido de demostración (solo entorno no productivo).
          </p>
        </div>
      )}
    </div>
  );
};

export default DemoAccountsSelector;
