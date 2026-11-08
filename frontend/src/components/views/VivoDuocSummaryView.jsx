import React from 'react';
import {
  ExternalLink,
  CheckSquare,
  GraduationCap,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

export const VivoDuocSummaryView = () => {
  const serviciosVivo = [
    {
      id: 'asistencia',
      title: 'Mis Asistencias',
      icon: CheckSquare,
      badge: 'Reglamento 70%',
      queHace: 'Permite revisar clase a clase el porcentaje de asistencia registrado por los docentes en cada una de tus asignaturas. Recuerda que la asistencia mínima obligatoria para aprobar cualquier curso en Duoc UC es de 70%.',
      dondeEncontrarlo: 'Dentro de Experiencia Vivo, dirígete al menú lateral izquierdo y haz clic en la pestaña "Asistencias".',
      link: 'https://experienciavivo.duoc.cl',
      btnText: 'Ir a Mis Asistencias en Vivo Duoc',
    },
    {
      id: 'notas',
      title: 'Mis Notas y Calificaciones',
      icon: GraduationCap,
      badge: 'Evaluaciones Parciales',
      queHace: 'Muestra el desglose de todas tus evaluaciones parciales, notas de certámenes, ponderaciones porcentuales por ramo y la nota final de presentación a examen.',
      dondeEncontrarlo: 'En el menú lateral de Experiencia Vivo, pulsa sobre la opción "Notas" para desplegar tus ramos del semestre.',
      link: 'https://experienciavivo.duoc.cl',
      btnText: 'Ir a Mis Notas en Vivo Duoc',
    },
    {
      id: 'horarios',
      title: 'Mis Horarios de Clases',
      icon: Clock,
      badge: 'Semana a Semana',
      queHace: 'Permite consultar el cronograma semanal completo con los bloques horarios, números de salas, laboratorios asignados y nombres de los docentes de cada asignatura.',
      dondeEncontrarlo: 'En el menú de Experiencia Vivo, selecciona la sección "Horarios de clases" para visualizar el calendario interactivo.',
      link: 'https://experienciavivo.duoc.cl',
      btnText: 'Ir a Mis Horarios en Vivo Duoc',
    },
    {
      id: 'malla',
      title: 'Malla y Avance Curricular',
      icon: Compass,
      badge: 'Progreso Académico',
      queHace: 'Te permite monitorear el cumplimiento de tu plan de estudios, créditos aprobados (SCT), requisitos previos y ramos pendientes para egresar de tu carrera.',
      dondeEncontrarlo: 'Accede a la opción "Malla Curricular" o "Progreso Académico" en la barra de navegación de Vivo Duoc.',
      link: 'https://experienciavivo.duoc.cl',
      btnText: 'Ir a Malla Curricular en Vivo Duoc',
    },
  ];

  return (
    // A11y: Elemento semántico <section> con encabezado accesible
    <section aria-labelledby="vivoduoc-view-title" className="space-y-6">
      {/* 1. Banner Superior con Enlace Directo a Experiencia Vivo Duoc */}
      <div className="bg-[#002B49] text-white px-6 py-6 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-4 border-[#FFB81C] shadow-md">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-black text-xl text-white">
              vivo<span className="text-[#FFB81C]">Duoc</span>
            </span>
            <span className="text-xs text-slate-300 font-bold border-l border-white/30 pl-2">
              Portal Oficial de Autoservicio del Estudiante
            </span>
          </div>
          <h2 id="vivoduoc-view-title" className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Guía de Servicios y Enlaces Directos de Vivo Duoc
          </h2>
          <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-2xl font-medium">
            Conoce qué hace cada herramienta académica, en qué parte de la plataforma encontrarla y accede con un solo clic al portal oficial.
          </p>
        </div>

        {/* Botón de Enlace Directo Principal */}
        <div className="shrink-0">
          <a
            href="https://experienciavivo.duoc.cl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir portal Experiencia Vivo Duoc en una nueva pestaña"
            className="min-h-[48px] px-6 py-3 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 shadow-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#002B49]"
          >
            <span>Ir al Portal Experiencia Vivo Duoc</span>
            <ExternalLink className="w-4 h-4 text-[#002B49] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </div>

      {/* 2. Cuadrícula de Servicios Explicados con Enlaces Directos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {serviciosVivo.map((srv) => {
          const Icon = srv.icon;

          return (
            <article
              key={srv.id}
              className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-7 shadow-sm flex flex-col justify-between hover:border-[#002B49] transition-all"
            >
              <div className="space-y-4">
                {/* Cabecera de la tarjeta */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center shrink-0 shadow-xs" aria-hidden="true">
                      <Icon className="w-6 h-6" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-slate-900">
                        {srv.title}
                      </h3>
                      <span className="text-xs font-bold text-slate-600">
                        Servicio Académico Oficial
                      </span>
                    </div>
                  </div>

                  <span className="bg-amber-100 text-slate-950 text-xs font-black px-3 py-1 rounded-full border border-amber-300">
                    {srv.badge}
                  </span>
                </div>

                {/* Explicación: ¿Qué hace? */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <span className="text-xs font-black text-slate-900 uppercase tracking-wider block">
                    ¿Qué hace esta sección?
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                    {srv.queHace}
                  </p>
                </div>

                {/* Explicación: ¿Dónde encontrarlo? */}
                <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-1">
                  <span className="text-xs font-black text-amber-950 uppercase tracking-wider block flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-800" aria-hidden="true" />
                    <span>¿Dónde encontrarlo en Vivo Duoc?</span>
                  </span>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    {srv.dondeEncontrarlo}
                  </p>
                </div>
              </div>

              {/* Botón con enlace directo */}
              <div className="pt-5 border-t-2 border-slate-100 mt-4">
                <a
                  href={srv.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${srv.btnText} (se abre en una nueva pestaña)`}
                  className="w-full min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white text-xs sm:text-sm font-black rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                >
                  <span>{srv.btnText}</span>
                  <ArrowRight className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
