import React from 'react';

/**
 * Tabla accesible para visualización del catálogo de asignaturas en el panel de administración.
 *
 * @param {Object} props
 * @param {Array} props.courses - Lista de asignaturas a mostrar
 * @param {Function} [props.onSelectCourse] - Callback invocado al seleccionar una fila
 * @param {Object|string} [props.selectedCourse] - Asignatura o sigla actualmente seleccionada
 */
export const CoursesCatalogTable = ({
  courses = [],
  onSelectCourse,
  selectedCourse,
  ...props
}) => {
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-xs" {...props}>
      <table className="w-full text-left text-xs" role="table">
        <caption className="sr-only">
          Catálogo actual de asignaturas almacenadas en la base de datos de Nexo360
        </caption>
        <thead className="bg-[#002B49] text-white font-bold">
          <tr>
            <th scope="col" className="p-3.5">
              Sigla
            </th>
            <th scope="col" className="p-3.5">
              Nombre de la Asignatura
            </th>
            <th scope="col" className="p-3.5">
              Créditos / Tipo
            </th>
            <th scope="col" className="p-3.5">
              Secciones Disponibles
            </th>
            <th scope="col" className="p-3.5">
              Horarios & Docentes
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200 text-slate-900">
          {!courses || courses.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-8 text-center text-slate-600 font-medium">
                No se encontraron asignaturas que coincidan con los filtros aplicados.
              </td>
            </tr>
          ) : (
            courses.map((course) => {
              const isSelected = Boolean(
                selectedCourse &&
                  ((typeof selectedCourse === 'string' && selectedCourse === course.sigla) ||
                    (selectedCourse.sigla && selectedCourse.sigla === course.sigla))
              );

              return (
                <tr
                  key={course.sigla}
                  onClick={() => onSelectCourse && onSelectCourse(course)}
                  className={`transition-colors ${
                    isSelected ? 'bg-blue-50/80 hover:bg-blue-100/70' : 'hover:bg-slate-50'
                  } ${onSelectCourse ? 'cursor-pointer' : ''}`}
                >
                  <td className="p-3.5 font-mono font-black text-[#002B49] align-top">
                    <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                      {course.sigla}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold align-top">
                    <div className="text-slate-950">{course.nombre}</div>
                    <div className="text-[11px] text-slate-600 font-normal mt-0.5">
                      {course.carrera || 'Ingeniería Duoc UC'}
                    </div>
                  </td>
                  <td className="p-3.5 align-top font-medium">
                    <span className="font-bold text-slate-950">{course.creditos} cr</span>
                    <span className="block text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                      {course.tipo || 'Optativo'}
                    </span>
                  </td>
                  <td className="p-3.5 align-top">
                    <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                      {course.secciones?.length || 0} sección(es)
                    </span>
                  </td>
                  <td className="p-3.5 align-top space-y-1">
                    {course.secciones?.slice(0, 3).map((sec, sIdx) => (
                      <div
                        key={sIdx}
                        className="text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-300"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-[#002B49]">
                            Sec: {sec.seccion}
                          </span>
                          <span className="text-[10px] text-slate-600 font-medium">
                            {sec.sala}
                          </span>
                        </div>
                        <div className="text-slate-700 font-medium text-[10px] mt-0.5">
                          {sec.profesor} • <em>{sec.horarioTexto}</em>
                        </div>
                      </div>
                    ))}
                    {course.secciones?.length > 3 && (
                      <span className="text-[10px] text-slate-500 font-semibold block">
                        +{course.secciones.length - 3} secciones adicionales...
                      </span>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default CoursesCatalogTable;
