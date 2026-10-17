import React from 'react';
import { VIVO_ASISTENCIAS } from '../../data/vivoDuocData';
import { CheckCircle2, FilePlus2, AlertTriangle } from 'lucide-react';

export const AsistenciasView = ({ onNavigate }) => {
  return (
    <div className="space-y-6">
      {/* Título y descripción oficial (Screenshot 5) */}
      <div className="border-b border-slate-200 pb-4">
        <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight">
          Asistencias
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
          Por reglamento académico tienes que tener un 70% de asistencia en cada uno de tus ramos para aprobar el curso, en esta sección podrás revisar el avance y así no repetir por no ir a clases.
        </p>
      </div>

      {/* Tabla Oficial de Asistencias (Screenshot 5) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {/* Cabecera azul marino con título oficial */}
        <div className="bg-[#002B49] text-white px-6 py-3 flex items-center justify-between">
          <h2 className="text-base font-bold tracking-wide">
            Asistencias
          </h2>
          <span className="text-xs text-amber-300 font-semibold hidden sm:inline">
            Mínimo exigido: 70%
          </span>
        </div>

        {/* Tabla con scroll horizontal accesible */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-dashed border-slate-300">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Curso
                </th>
                <th scope="col" className="px-6 py-3.5 text-center">
                  N° de Clases Registradas
                </th>
                <th scope="col" className="px-6 py-3.5 text-center">
                  Asistencia
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Porcentaje de Asistencia Actual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {VIVO_ASISTENCIAS.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{item.curso}</span>
                      {item.porcentajeNum >= 70 && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-700">
                    {item.clasesRegistradas}
                  </td>
                  <td className="px-6 py-4 text-center font-medium text-slate-700">
                    {item.asistencia}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-base font-black text-slate-900 tracking-tight">
                      {item.porcentaje}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Justificación de Inasistencias Integrada con Solicitudes */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">
            ¿Faltaste a clases por motivos de salud, terapia médica o PAEDIS?
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Recuerda que tienes hasta 5 días hábiles para adjuntar tu certificado médico o respaldo de adecuación curricular desde la pestaña de Solicitudes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => onNavigate('solicitudes')}
          className="px-4 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-2 transition-colors focus:ring-2 focus:ring-amber-400"
        >
          <FilePlus2 className="w-4 h-4 text-amber-400" aria-hidden="true" />
          <span>Ingresar Justificativo</span>
        </button>
      </div>
    </div>
  );
};
