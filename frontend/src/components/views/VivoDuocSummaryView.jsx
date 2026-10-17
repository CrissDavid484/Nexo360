import React, { useState } from 'react';
import { NotasView } from './NotasView';
import { AsistenciasView } from './AsistenciasView';
import { HorariosView } from './HorariosView';
import { CheckSquare, GraduationCap, Clock } from 'lucide-react';

export const VivoDuocSummaryView = ({ initialTab = 'asistencia', onNavigate }) => {
  const [activeSubView, setActiveSubView] = useState(initialTab);

  return (
    <div className="space-y-6">
      {/* Selector de Pestañas Rápidas de Vivo Duoc */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveSubView('asistencia')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all focus:ring-4 focus:ring-amber-400 ${
            activeSubView === 'asistencia'
              ? 'bg-[#002B49] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <CheckSquare className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Mis Asistencias (88.9%)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('notas')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all focus:ring-4 focus:ring-amber-400 ${
            activeSubView === 'notas'
              ? 'bg-[#002B49] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Mis Notas y Certámenes</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveSubView('horarios')}
          className={`flex-1 min-w-[140px] py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition-all focus:ring-4 focus:ring-amber-400 ${
            activeSubView === 'horarios'
              ? 'bg-[#002B49] text-white shadow-md'
              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Mi Horario Semanal</span>
        </button>
      </div>

      {/* Renderizado de la sub-vista seleccionada */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        {activeSubView === 'asistencia' && <AsistenciasView onNavigate={onNavigate} />}
        {activeSubView === 'notas' && <NotasView />}
        {activeSubView === 'horarios' && <HorariosView />}
      </div>
    </div>
  );
};
