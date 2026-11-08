import React from 'react';
import { VIVO_ASISTENCIAS } from '../../data/vivoDuocData';
import { CheckCircle2, FilePlus2 } from 'lucide-react';

export const AsistenciasView = ({ onNavigate }) => {
  return (
    // A11y: Uso de elemento semántico <section> con encabezado accesible
    <section aria-labelledby="asistencias-heading" className="space-y-6">
      {/* Título y descripción oficial */}
      <div className="border-b border-slate-200 pb-4">
        <h2 id="asistencias-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Mis Asistencias a Clases
        </h2>
        <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-3xl leading-relaxed font-medium">
          Por reglamento académico de Duoc UC, necesitas un 70% de asistencia mínima en cada uno de tus ramos. En esta sección puedes monitorear tu avance por curso.
        </p>
      </div>

      {/* Tabla Oficial de Asistencias */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 overflow-hidden shadow-sm">
        {/* Cabecera azul marino con título oficial */}
        <header className="bg-[#002B49] text-white px-6 py-4 flex items-center justify-between border-b-2 border-[#FFB81C]">
          <h3 className="text-base font-black tracking-wide">
            Registro de Asistencia Semestral
          </h3>
          <span className="text-xs text-[#FFB81C] font-black hidden sm:inline">
            Mínimo exigido: 70%
          </span>
        </header>

        {/* Tabla con scroll horizontal accesible */}
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabla desplazable de asistencia por asignaturas">
          <table className="w-full text-left text-xs sm:text-sm">
            {/* A11y: <caption> para accesibilidad con lectores de pantalla */}
            <caption className="sr-only">
              Tabla de porcentaje de asistencia y número de clases registradas por asignatura
            </caption>
            <thead className="bg-slate-100 text-slate-800 font-black border-b-2 border-slate-300">
              <tr>
                <th scope="col" className="px-6 py-3.5">
                  Curso
                </th>
                <th scope="col" className="px-6 py-3.5 text-center">
                  N° de Clases Registradas
                </th>
                <th scope="col" className="px-6 py-3.5 text-center">
                  Asistencia Realizada
                </th>
                <th scope="col" className="px-6 py-3.5 text-right">
                  Porcentaje de Asistencia Actual
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {VIVO_ASISTENCIAS.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-black text-slate-900">
                    <div className="flex items-center gap-2">
                      <span>{item.curso}</span>
                      {item.porcentajeNum >= 70 && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" aria-hidden="true" />
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800">
                    {item.clasesRegistradas}
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-slate-800">
                    {item.asistencia}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-base font-black text-slate-950 tracking-tight">
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
      <article className="p-6 bg-white rounded-2xl border-2 border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="font-black text-slate-900 text-sm sm:text-base">
            ¿Faltaste a clases por motivos de salud o fuerza mayor?
          </h3>
          <p className="text-xs sm:text-sm text-slate-700 mt-1 max-w-2xl font-medium leading-relaxed">
            Recuerda que tienes hasta 5 días hábiles para adjuntar tu certificado médico o documento de respaldo.
          </p>
        </div>

        {/* A11y: Botón con tamaño mínimo táctil 44x44px y foco ultra-visible Duoc */}
        <button
          type="button"
          onClick={() => onNavigate('solicitudes')}
          className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white text-xs sm:text-sm font-black rounded-xl shrink-0 flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 shadow-sm"
        >
          <FilePlus2 className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
          <span>Ingresar Justificativo</span>
        </button>
      </article>
    </section>
  );
};
