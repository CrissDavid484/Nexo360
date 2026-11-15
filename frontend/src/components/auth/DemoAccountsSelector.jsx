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

const INSTITUTIONAL_DEMO_USERS = [
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
    <div className="pt-2 border-t border-slate-100">
      <label
        htmlFor="demo-user-selector"
        className="block text-[11px] font-semibold text-slate-500 mb-1"
      >
        Cuentas de prueba (autocompletar):
      </label>
      <div className="relative">
        <select
          id="demo-user-selector"
          value={selectedId}
          onChange={handleChange}
          aria-label="Seleccionar usuario de prueba para autocompletar credenciales"
          className="w-full min-h-[36px] pl-3 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#002B49] cursor-pointer appearance-none transition-colors"
        >
          <option value="">Selecciona una cuenta de prueba...</option>
          {INSTITUTIONAL_DEMO_USERS.map((group) => (
            <optgroup key={group.category} label={group.category}>
              {group.users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label} — {u.roleTag}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
          <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
};
