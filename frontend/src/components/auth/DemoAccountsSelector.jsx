import React, { useState } from 'react';
import { UserCheck, ChevronDown, Sparkles, Shield, User, GraduationCap, Laptop } from 'lucide-react';

/**
 * =========================================================================
 * MÓDULO AISLADO DE PERFILES DE PRUEBA INSTITUCIONALES (DEMO EVALUACIÓN)
 * =========================================================================
 * NOTA DE ARQUITECTURA:
 * Este componente agrupa y aísla exclusivamente los perfiles de prueba para la
 * muestra académica. Para pasar a producción oficial Duoc UC, basta con
 * deshabilitar o eliminar este archivo y su importación en LoginPage / LoginForm.
 */

export const INSTITUTIONAL_DEMO_USERS = [
  {
    category: 'Administradores Nexo360',
    users: [
      {
        id: 'c_guzman',
        label: 'Cristian Guzmán',
        roleTag: 'Administrador General',
        email: 'c.guzman@duocuc.cl',
        password: 'Duoc2026!',
        badge: 'Admin & PAEDIS',
        role: 'admin',
      },
      {
        id: 'd_diaz',
        label: 'Daniela Díaz',
        roleTag: 'Administradora de Sistema',
        email: 'd.diaz@duocuc.cl',
        password: 'Duoc2026!',
        badge: 'Admin General',
        role: 'admin',
      },
    ],
  },
  {
    category: 'Estudiantes y Tutores Duoc UC',
    users: [
      {
        id: 'd_rojas',
        label: 'Daniela Rojas',
        roleTag: 'Estudiante Regular PAEDIS',
        email: 'd.rojas@duocuc.cl',
        password: 'Duoc2026!',
        badge: 'PAEDIS Activa',
        role: 'estudiante_paedis',
      },
      {
        id: 'm_contreras',
        label: 'Matías Contreras',
        roleTag: 'Estudiante Regular (Alerta RI < 70%)',
        email: 'm.contreras@duocuc.cl',
        password: 'Duoc2026!',
        badge: 'Riesgo Deserción',
        role: 'estudiante',
      },
      {
        id: 'v_soto',
        label: 'Valentina Soto',
        roleTag: 'Tutora Par & Cuidadora Ley 21.790',
        email: 'v.soto@duocuc.cl',
        password: 'Duoc2026!',
        badge: 'Tutora Par',
        role: 'tutor_par',
      },
      {
        id: 'f_morales',
        label: 'Felipe Morales',
        roleTag: 'Egresado Titulado',
        email: 'f.morales@duocuc.cl',
        password: 'Duoc2026!',
        badge: 'Titulado 2026',
        role: 'estudiante',
      },
    ],
  },
  {
    category: 'Cuerpo Docente y Dirección',
    users: [
      {
        id: 'm_gomez',
        label: 'Mauricio Gómez',
        roleTag: 'Profesor Titular Proyecto Capstone',
        email: 'm.gomez@profesor.duoc.cl',
        password: 'Duoc2026!',
        badge: 'Docente Titular',
        role: 'profesor',
      },
    ],
  },
];

export const DemoAccountsSelector = ({ onSelectAccount }) => {
  const [selectedId, setSelectedId] = useState('');

  const handleChange = (e) => {
    const userId = e.target.value;
    setSelectedId(userId);

    if (!userId) return;

    for (const group of INSTITUTIONAL_DEMO_USERS) {
      const found = group.users.find((u) => u.id === userId);
      if (found) {
        onSelectAccount(found);
        break;
      }
    }
  };

  return (
    <div
      role="region"
      aria-label="Selector de cuentas institucionales de prueba"
      className="mt-6 p-4 bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-300/80 shadow-xs space-y-2.5 transition-all"
    >
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="demo-user-selector"
          className="flex items-center gap-2 text-xs font-black text-slate-800 uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
          <span>Perfiles de Demostración Académica</span>
        </label>
        <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
          Entorno Evaluativo
        </span>
      </div>

      <div className="relative">
        <select
          id="demo-user-selector"
          value={selectedId}
          onChange={handleChange}
          aria-label="Seleccionar usuario de prueba para autocompletar credenciales"
          className="w-full min-h-[44px] pl-3.5 pr-10 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] cursor-pointer appearance-none transition-colors"
        >
          <option value="">-- Seleccionar perfil institucional para autocompletar --</option>
          {INSTITUTIONAL_DEMO_USERS.map((group) => (
            <optgroup key={group.category} label={group.category}>
              {group.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} — {u.roleTag} ({u.email})
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500">
          <ChevronDown className="w-4 h-4" aria-hidden="true" />
        </div>
      </div>

      <p className="text-[11px] text-slate-500 font-medium">
        Selecciona un perfil para rellenar automáticamente el correo institucional y la clave cifrada correspondiente.
      </p>
    </div>
  );
};
