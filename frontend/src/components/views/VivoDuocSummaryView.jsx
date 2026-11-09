import React, { useState } from 'react';
import {
  ExternalLink,
  CheckSquare,
  GraduationCap,
  Clock,
  Compass,
  ArrowRight,
  Sparkles,
  Play,
  FileText,
  ChevronDown,
  ChevronUp,
  MapPin,
  Briefcase,
  HelpCircle,
  Calendar,
  Layers,
  Award,
  DollarSign,
  Scroll,
  Heart,
  Package,
} from 'lucide-react';
import {
  VIVO_STUDENT_PROFILE,
  VIVO_HORARIOS,
  VIVO_NOTAS,
  VIVO_ASISTENCIAS,
  VIVO_PROGRESO_ACADEMICO,
  VIVO_VIDA_ESTUDIANTIL,
} from '../../data/vivoDuocData';
import { TomaRamosSimulator } from '../simulation/TomaRamosSimulator';
import { useAccessibility } from '../../context/AccessibilityContext';

export const VivoDuocSummaryView = () => {
  const { announce } = useAccessibility();
  // Pestañas: 'video-instrucciones' | 'portal-vivo' | 'simulador-toma'
  const [activeTab, setActiveTab] = useState('video-instrucciones');
  const [selectedDay, setSelectedDay] = useState('Miércoles');
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(false);

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  // Directorio de servicios con las 9 URLs oficiales específicas entregadas por Duoc UC
  const serviciosVivo = [
    {
      id: 'horarios',
      title: 'Mis Horarios de Clases',
      icon: Clock,
      badge: 'Semana a Semana',
      queHace:
        'Permite consultar el cronograma semanal completo con los bloques horarios, números de salas, laboratorios asignados y nombres de los docentes de cada asignatura.',
      dondeEncontrarlo:
        'En el menú de Experiencia Vivo, selecciona la sección "Horarios de clases" para visualizar el calendario interactivo.',
      link: 'https://experienciavivo.duoc.cl/alumnos/horarios',
      btnText: 'Ir a Horarios en Vivo Duoc',
    },
    {
      id: 'notas',
      title: 'Mis Notas y Calificaciones',
      icon: GraduationCap,
      badge: 'Evaluaciones Parciales',
      queHace:
        'Muestra el desglose de todas tus evaluaciones parciales, notas de certámenes, ponderaciones porcentuales por ramo y la nota final de presentación a examen.',
      dondeEncontrarlo:
        'En el menú lateral de Experiencia Vivo, pulsa sobre la opción "Notas" para desplegar tus ramos del semestre.',
      link: 'https://experienciavivo.duoc.cl/alumnos/notas',
      btnText: 'Ir a Notas en Vivo Duoc',
    },
    {
      id: 'asistencia',
      title: 'Mis Asistencias',
      icon: CheckSquare,
      badge: 'Reglamento 70%',
      queHace:
        'Permite revisar clase a clase el porcentaje de asistencia registrado por los docentes en cada una de tus asignaturas. Recuerda que la asistencia mínima obligatoria para aprobar cualquier curso en Duoc UC es de 70%.',
      dondeEncontrarlo:
        'Dentro de Experiencia Vivo, dirígete al menú lateral izquierdo y haz clic en la pestaña "Asistencias".',
      link: 'https://experienciavivo.duoc.cl/alumnos/asistencias',
      btnText: 'Ir a Asistencias en Vivo Duoc',
    },
    {
      id: 'malla',
      title: 'Progreso Académico y Malla',
      icon: Compass,
      badge: 'Progreso Académico',
      queHace:
        'Te permite monitorear el cumplimiento de tu plan de estudios, créditos aprobados (SCT), requisitos previos y ramos pendientes para egresar de tu carrera.',
      dondeEncontrarlo:
        'Accede a la opción "Progreso Académico" en la barra de navegación lateral de Vivo Duoc.',
      link: 'https://experienciavivo.duoc.cl/alumnos/progreso-academico',
      btnText: 'Ir a Progreso Académico en Vivo Duoc',
    },
    {
      id: 'solicitudes',
      title: 'Portal de Solicitudes',
      icon: FileText,
      badge: 'Gestión en Línea',
      queHace:
        'Permite ingresar requerimientos académicos formales, justificación de inasistencias por salud, postergaciones y apelaciones institucionales.',
      dondeEncontrarlo:
        'Dirígete a la opción "Solicitudes" en el menú principal de Experiencia Vivo.',
      link: 'https://experienciavivo.duoc.cl/alumnos/solicitudes',
      btnText: 'Ir a Solicitudes en Vivo Duoc',
    },
    {
      id: 'finanzas',
      title: 'Finanzas y Pagos',
      icon: DollarSign,
      badge: 'Aranceles y Becas',
      queHace:
        'Revisa el estado de tus cuotas de matrícula, pagarés, firma de aranceles, beneficios ministeriales (Gratuidad, CAE) y convenios de repactación.',
      dondeEncontrarlo:
        'Selecciona "Finanzas" en el menú lateral de Experiencia Vivo para ingresar al portal de pagos.',
      link: 'https://experienciavivo.duoc.cl/alumnos/finanzas',
      btnText: 'Ir a Finanzas en Vivo Duoc',
    },
    {
      id: 'certificados',
      title: 'Certificados Oficiales',
      icon: Scroll,
      badge: 'Descarga con QR',
      queHace:
        'Genera y descarga al instante certificados de alumno regular, concentración de notas y certificados de matrícula con firma electrónica avanzada.',
      dondeEncontrarlo:
        'Haz clic en "Certificados" en el menú lateral de autoservicio de Vivo Duoc.',
      link: 'https://experienciavivo.duoc.cl/alumnos/certificados',
      btnText: 'Ir a Certificados en Vivo Duoc',
    },
    {
      id: 'pastoral',
      title: 'Pastoral y Actividades Estudiantiles',
      icon: Heart,
      badge: 'Vida Comunitaria',
      queHace:
        'Conoce los voluntariados, misiones solidarias, encuentros formativos, talleres y actividades de pastoral y punto estudiantil en tu sede.',
      dondeEncontrarlo:
        'Accede a la sección "Actividades punto estudiantil y pastoral" en Experiencia Vivo.',
      link: 'https://experienciavivo.duoc.cl/alumnos/actividades/posts',
      btnText: 'Ir a Actividades Pastoral en Vivo Duoc',
    },
    {
      id: 'laboral',
      title: 'Duoc Laboral',
      icon: Briefcase,
      badge: 'Empleo & Prácticas',
      queHace:
        'Postula a ofertas de trabajo exclusivas, pasantías y centros de práctica profesional validados con empresas e instituciones en convenio.',
      dondeEncontrarlo:
        'Selecciona "Duoc Laboral" al final del menú lateral de Experiencia Vivo.',
      link: 'https://experienciavivo.duoc.cl/alumnos/duoc-laboral',
      btnText: 'Ir a Duoc Laboral en Vivo Duoc',
    },
  ];

  // Horario del día seleccionado
  const horarioDiaActual = VIVO_HORARIOS.find((h) => h.dia === selectedDay);

  return (
    <section aria-labelledby="vivoduoc-view-title" className="space-y-6">
      {/* 1. Encabezado limpio de Experiencia Vivo Duoc */}
      <header className="bg-white px-6 sm:px-8 py-6 sm:py-7 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200/80 shadow-2xs">
        <div>
          <span className="text-xs font-semibold text-[#002B49] block mb-1">
            Experiencia Vivo • Portal del Estudiante
          </span>
          <h2
            id="vivoduoc-view-title"
            className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
          >
            Guía y accesos a Experiencia Vivo Duoc
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 max-w-2xl leading-relaxed">
            Revisa dónde encontrar tus horarios, notas, asistencias y certificados, o practica tu inscripción de asignaturas en el simulador.
          </p>
        </div>

        <div className="shrink-0">
          <a
            href="https://experienciavivo.duoc.cl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir portal oficial Experiencia Vivo Duoc (nueva pestaña)"
            className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl font-semibold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-all active:scale-[0.98]"
          >
            <span>Abrir Experiencia Vivo</span>
            <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </header>

      {/* 2. Selector de Pestañas Internas Limpio */}
      <nav
        aria-label="Subnavegación de Experiencia Vivo Duoc"
        className="bg-white p-1.5 rounded-2xl border border-slate-200/80 shadow-2xs inline-flex flex-wrap gap-1.5"
      >
        <button
          type="button"
          onClick={() => {
            setActiveTab('video-instrucciones');
            announce('Mostrando guía y accesos directos de Vivo Duoc', 'polite');
          }}
          aria-current={activeTab === 'video-instrucciones' ? 'page' : undefined}
          className={`min-h-[40px] px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
            activeTab === 'video-instrucciones'
              ? 'bg-[#002B49] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Play
            className={`w-3.5 h-3.5 ${
              activeTab === 'video-instrucciones' ? 'text-[#FFB81C]' : 'text-slate-400'
            }`}
            aria-hidden="true"
          />
          <span>Guía y accesos directos</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('portal-vivo');
            announce('Mostrando resumen académico en Vivo Duoc', 'polite');
          }}
          aria-current={activeTab === 'portal-vivo' ? 'page' : undefined}
          className={`min-h-[40px] px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
            activeTab === 'portal-vivo'
              ? 'bg-[#002B49] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Layers
            className={`w-3.5 h-3.5 ${
              activeTab === 'portal-vivo' ? 'text-[#FFB81C]' : 'text-slate-400'
            }`}
            aria-hidden="true"
          />
          <span>Mi resumen académico</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveTab('simulador-toma');
            announce('Mostrando simulador de Toma de Ramos', 'polite');
          }}
          aria-current={activeTab === 'simulador-toma' ? 'page' : undefined}
          className={`min-h-[40px] px-4 py-2 rounded-xl font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all duration-200 ${
            activeTab === 'simulador-toma'
              ? 'bg-[#002B49] text-white shadow-2xs'
              : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
          }`}
        >
          <Package
            className={`w-3.5 h-3.5 ${
              activeTab === 'simulador-toma' ? 'text-[#FFB81C]' : 'text-slate-400'
            }`}
            aria-hidden="true"
          />
          <span>Simulador Toma de Ramos</span>
        </button>
      </nav>

      {/* 3. PESTAÑA A: VIDEO TUTORIAL & ACCESOS DIRECTOS */}
      {activeTab === 'video-instrucciones' && (
        <div className="space-y-6 animate-fade-in">
          <article className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-2xs">
            <header className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Recorrido en video por Experiencia Vivo Duoc
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Conoce cómo revisar tu horario, asistencia y solicitudes en pocos minutos.
                </p>
              </div>
              <a
                href="https://www.youtube.com/watch?v=TAKnZG5th2k"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Abrir este video en YouTube (nueva pestaña)"
                className="min-h-[38px] px-3.5 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 border border-slate-200/80 transition-colors self-start sm:self-auto"
              >
                <span>Ver en YouTube</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
              </a>
            </header>

            <div className="p-4 sm:p-6 bg-slate-950">
              <div className="relative aspect-video w-full rounded-xl overflow-hidden shadow-lg bg-black">
                <iframe
                  src="https://www.youtube-nocookie.com/embed/TAKnZG5th2k?rel=0"
                  title="Video tutorial oficial: Inducción y navegación en Experiencia Vivo Duoc UC"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  className="absolute inset-0 w-full h-full border-0"
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-semibold text-slate-800">
                    Resumen en texto del video
                  </h4>
                </div>

                <button
                  type="button"
                  onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                  aria-expanded={isTranscriptOpen}
                  aria-controls="video-transcript-content"
                  className="min-h-[36px] px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200/90 inline-flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5 text-[#002B49]" aria-hidden="true" />
                  <span>{isTranscriptOpen ? 'Ocultar resumen' : 'Leer resumen paso a paso'}</span>
                  {isTranscriptOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                  )}
                </button>
              </div>

              {isTranscriptOpen && (
                <div
                  id="video-transcript-content"
                  className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-600 animate-fade-in"
                >
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                    <span className="font-bold text-slate-900 block">
                      1. Ingreso al portal
                    </span>
                    <p className="leading-relaxed">
                      Entra a <strong className="text-slate-800">experienciavivo.duoc.cl</strong> con tu cuenta @duocuc.cl y verificación en dos pasos (MFA).
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                    <span className="font-bold text-slate-900 block">
                      2. Menú lateral
                    </span>
                    <p className="leading-relaxed">
                      En la columna izquierda encontrarás Horarios, Notas, Asistencia, Progreso Académico, Solicitudes y Certificados.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                    <span className="font-bold text-slate-900 block">
                      3. Seguimiento de asistencia (70%)
                    </span>
                    <p className="leading-relaxed">
                      Revisa periódicamente tu porcentaje en cada ramo para cumplir con el mínimo de 70% exigido.
                    </p>
                  </div>

                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/70 space-y-1">
                    <span className="font-bold text-slate-900 block">
                      4. Horarios y salas
                    </span>
                    <p className="leading-relaxed">
                      Consulta tus bloques semanales, salas asignadas en sede y el nombre de cada docente.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </article>

          {/* Directorio de Servicios Limpio */}
          <div className="pt-2 space-y-4">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                Secciones de Experiencia Vivo
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Conoce para qué sirve cada apartado y accede directamente.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {serviciosVivo.map((srv) => {
                const Icon = srv.icon;

                return (
                  <article
                    key={srv.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col justify-between hover:border-slate-300 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div
                          className="w-10 h-10 rounded-xl bg-slate-100 text-[#002B49] group-hover:bg-[#002B49] group-hover:text-[#FFB81C] flex items-center justify-center shrink-0 transition-colors"
                          aria-hidden="true"
                        >
                          <Icon className="w-5 h-5" aria-hidden="true" />
                        </div>

                        <span className="bg-slate-50 text-slate-500 text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-slate-200/70 shrink-0">
                          {srv.badge}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-base font-bold text-slate-900">
                          {srv.title}
                        </h4>
                        <p className="text-xs text-slate-600 leading-relaxed mt-1">
                          {srv.queHace}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200/60">
                        <span className="text-[11px] font-semibold text-slate-700 block mb-0.5">
                          Dónde encontrarlo:
                        </span>
                        <p className="text-xs text-slate-600 leading-relaxed">
                          {srv.dondeEncontrarlo}
                        </p>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-100">
                      <a
                        href={srv.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${srv.btnText} (nueva pestaña)`}
                        className="w-full min-h-[40px] px-4 py-2 bg-slate-50 hover:bg-[#002B49] text-slate-800 hover:text-white border border-slate-200/80 hover:border-[#002B49] text-xs font-semibold rounded-xl flex items-center justify-between gap-2 transition-all duration-200 group/btn active:scale-[0.98]"
                      >
                        <span>{srv.btnText}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover/btn:text-[#FFB81C] group-hover/btn:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. PESTAÑA B: VISTA RÉPLICA DEL PORTAL VIVO DUOC (SEDE ALAMEDA) */}
      {activeTab === 'portal-vivo' && (
        <div className="space-y-6">
          {/* Cabecera del Portal Vivo Duoc Oficial */}
          <div className="bg-[#002B49] text-white rounded-3xl p-6 shadow-md border-b-4 border-[#FFB81C]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/20 pb-4">
              <div className="flex items-center gap-3">
                <span className="font-black text-2xl tracking-tight text-white">
                  vivo<span className="text-[#FFB81C]">Duoc</span>
                </span>
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider pl-2 border-l border-white/30">
                  Alumnos
                </span>
              </div>

              {/* Botones de acción institucional */}
              <div className="flex items-center gap-2">
                <a
                  href="https://ava.duoc.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3 py-1.5 bg-white text-[#002B49] text-xs font-black rounded-lg hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  aria-label="Abrir AVA Blackboard (abre en nueva pestaña)"
                >
                  AVA
                </a>
                <a
                  href="https://outlook.office.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-black rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  aria-label="Abrir Correo institucional Microsoft 365 (abre en nueva pestaña)"
                >
                  Correo
                </a>
                <a
                  href="https://experienciavivo.duoc.cl"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] px-4 py-1.5 border border-white/40 hover:bg-white/15 text-white text-xs font-black rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  aria-label="Ir a portal oficial Vivo Duoc"
                >
                  Abrir portal oficial
                </a>
              </div>
            </div>

            {/* Saludo al Estudiante y Fecha Oficial */}
            <div className="pt-4 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
              <h3 className="text-xl sm:text-2xl font-black text-white">
                Buenas tardes, {VIVO_STUDENT_PROFILE.nombre}.
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 font-bold">
                Domingo 8 de Noviembre de 2026
              </p>
            </div>
          </div>

          {/* Banner: ¿Dónde está mi horario? */}
          <article className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-5 text-center transition-all hover:shadow-md">
            <div className="flex flex-wrap items-center justify-center gap-2 text-slate-800 text-sm sm:text-base font-bold">
              <span>¿Dónde está mi horario?</span>
              <Clock className="w-4 h-4 text-slate-700 inline" aria-hidden="true" />
              <span>Revísalo</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedDay('Miércoles');
                  announce('Desplazando hacia la sección de Horarios', 'polite');
                }}
                className="min-h-[44px] inline-flex items-center text-[#002B49] font-black underline hover:text-amber-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded-lg px-2"
              >
                aquí
              </button>
            </div>
          </article>

          {/* Sección 1: Vida Estudiantil (Navy Bar) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
            <header className="bg-[#002B49] text-white px-6 py-4 border-b-2 border-[#FFB81C]">
              <h3 className="text-base sm:text-lg font-black tracking-wide">
                Vida Estudiantil
              </h3>
            </header>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {VIVO_VIDA_ESTUDIANTIL.map((card) => (
                <article
                  key={card.id}
                  className="flex flex-col sm:flex-row bg-white border-2 border-slate-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="sm:w-44 h-40 sm:h-auto shrink-0 relative overflow-hidden bg-slate-100">
                    <img
                      src={card.imgSrc}
                      alt={`Fotografía representativa para ${card.title}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-5 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base leading-snug">
                        {card.title}
                      </h4>
                      <p className="text-xs text-slate-700 mt-1 font-medium leading-relaxed">
                        {card.description}
                      </p>
                    </div>
                    <div className="mt-4 pt-2">
                      <a
                        href={card.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white text-xs font-black rounded-xl transition-all inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
                        aria-label={`${card.btnText} para ${card.title} (abre en nueva pestaña)`}
                      >
                        <span>{card.btnText}</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sección 2: Horarios (Navy Bar con enlace oficial) */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
            <header className="bg-[#002B49] text-white px-6 py-4 border-b-2 border-[#FFB81C] flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black tracking-wide">
                Horarios
              </h3>
              <a
                href="https://experienciavivo.duoc.cl/alumnos/horarios"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-1.5 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                aria-label="Ver horarios completos en Experiencia Vivo (abre en nueva pestaña)"
              >
                <span>Ver horarios</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </header>

            {/* Pestañas de días de la semana */}
            <div className="border-b-2 border-slate-200 bg-slate-50 px-4 py-2 flex flex-wrap gap-2">
              {diasSemana.map((dia) => (
                <button
                  key={dia}
                  type="button"
                  onClick={() => {
                    setSelectedDay(dia);
                    announce(`Mostrando horario del día ${dia}`, 'polite');
                  }}
                  aria-pressed={selectedDay === dia}
                  className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-black transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2 ${
                    selectedDay === dia
                      ? 'bg-[#002B49] text-white shadow-xs'
                      : 'bg-white text-slate-800 hover:bg-slate-200 border border-slate-300'
                  }`}
                >
                  {dia}
                </button>
              ))}
            </div>

            {/* Contenido del Horario */}
            <div className="p-6">
              {horarioDiaActual && horarioDiaActual.items.length > 0 ? (
                <div className="space-y-4">
                  {horarioDiaActual.items.map((item, idx) => (
                    <article
                      key={idx}
                      className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <span className="text-xs font-black uppercase text-amber-800 block">
                          {item.seccion} • {item.modalidad}
                        </span>
                        <h4 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                          {item.ramo}
                        </h4>
                        <p className="text-xs text-slate-700 mt-1 font-medium">
                          Docente: <strong className="text-slate-900">{item.docente}</strong>
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="inline-flex items-center gap-1.5 text-xs font-black text-slate-950 bg-amber-100 border border-amber-400 px-3 py-1 rounded-full">
                          <Clock className="w-3.5 h-3.5 text-amber-800" aria-hidden="true" />
                          {item.horario}
                        </span>
                        <p className="text-xs text-slate-700 mt-1 font-bold">
                          {item.sala}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="py-10 text-center text-slate-600 font-bold text-sm sm:text-base">
                  <p>No tienes ramos para este día</p>
                </div>
              )}
            </div>
          </div>

          {/* Sección 3: Grilla Doble - Asistencias y Notas (Idéntica a Captura 2) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna 1: Asistencias */}
            <article className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <header className="bg-[#002B49] text-white px-6 py-4 border-b-2 border-[#FFB81C] flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black tracking-wide">
                    Asistencias
                  </h3>
                  <a
                    href="https://experienciavivo.duoc.cl/alumnos/asistencias"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-3.5 py-1.5 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                    aria-label="Ver todas las asistencias en Experiencia Vivo (abre en nueva pestaña)"
                  >
                    <span>Ver asistencias</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </header>

                <div className="p-6 space-y-4">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    INGENIERÍA EN INFORMÁTICA
                  </span>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-black text-slate-900">
                      <span>Capstone</span>
                      <span className="text-emerald-800 font-black text-base">88%</span>
                    </div>

                    {/* A11y: Barra de progreso con rol y atributos para tecnologías asistivas */}
                    <div
                      role="progressbar"
                      aria-valuenow={88}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Porcentaje de asistencia en Capstone: 88%"
                      className="w-full bg-slate-200 h-4 rounded-full overflow-hidden"
                    >
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: '88%' }}
                      />
                    </div>

                    <p className="text-[11px] text-slate-600 font-bold pt-1">
                      ✓ Asistencia cumpliendo el mínimo exigido del 70%.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* Columna 2: Notas */}
            <article className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between">
              <div>
                <header className="bg-[#002B49] text-white px-6 py-4 border-b-2 border-[#FFB81C] flex items-center justify-between">
                  <h3 className="text-base sm:text-lg font-black tracking-wide">
                    Notas
                  </h3>
                  <a
                    href="https://experienciavivo.duoc.cl/alumnos/notas"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-3.5 py-1.5 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                    aria-label="Ver todas las notas en Experiencia Vivo (abre en nueva pestaña)"
                  >
                    <span>Ver notas</span>
                    <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                  </a>
                </header>

                <div className="p-6 space-y-4">
                  <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                    INGENIERÍA EN INFORMÁTICA
                  </span>

                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-black text-slate-900 block">
                        Sección PTY4414
                      </span>
                      <h4 className="text-sm sm:text-base font-black text-[#002B49] mt-0.5">
                        CAPSTONE
                      </h4>
                      <span className="text-xs text-slate-600 font-bold">Estado: En curso</span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-600 block font-bold">Nota actual</span>
                      <span className="text-xl font-black text-slate-900">0.0</span>
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>

          {/* Sección 4: Resumen de mi Progreso Académico (Capturas 2 y 3) */}
          <article className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-sm">
            <header className="bg-[#002B49] text-white px-6 py-4 border-b-2 border-[#FFB81C] flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-black tracking-wide">
                RESUMEN DE MI PROGRESO ACADÉMICO
              </h3>
              <a
                href="https://experienciavivo.duoc.cl/alumnos/progreso-academico"
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-4 py-1.5 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 text-xs font-black rounded-lg inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
                aria-label="Ver malla curricular completa en Experiencia Vivo (abre en nueva pestaña)"
              >
                <span>Ver todo</span>
                <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
              </a>
            </header>

            <div className="p-6 space-y-6">
              {/* Encabezado del Progreso */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-4">
                <div>
                  <h4 className="text-lg sm:text-xl font-black text-slate-900">
                    {VIVO_PROGRESO_ACADEMICO.carrera}
                  </h4>
                  <p className="text-xs text-slate-600 font-bold">
                    Plan Curricular Regular Vigente
                  </p>
                </div>
                <div className="flex items-center gap-4 text-xs font-black text-slate-800">
                  <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300">
                    Total Créditos: {VIVO_PROGRESO_ACADEMICO.totalCreditos}
                  </span>
                  <span className="bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-300">
                    Créditos Optativos: {VIVO_PROGRESO_ACADEMICO.creditosOptativos}
                  </span>
                </div>
              </div>

              {/* Indicadores de Asignaturas (Píldoras de colores según Captura 3) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-emerald-50 border-2 border-emerald-400 rounded-2xl text-center">
                  <span className="text-xl font-black text-emerald-950 block">
                    {VIVO_PROGRESO_ACADEMICO.asignaturasAprobadas}
                  </span>
                  <span className="text-xs font-bold text-emerald-900">Asignaturas aprobadas</span>
                </div>

                <div className="p-3 bg-blue-50 border-2 border-blue-400 rounded-2xl text-center">
                  <span className="text-xl font-black text-blue-950 block">
                    {VIVO_PROGRESO_ACADEMICO.asignaturasInscritas}
                  </span>
                  <span className="text-xs font-bold text-blue-900">Asignaturas inscritas</span>
                </div>

                <div className="p-3 bg-red-50 border-2 border-red-300 rounded-2xl text-center">
                  <span className="text-xl font-black text-red-950 block">
                    {VIVO_PROGRESO_ACADEMICO.asignaturasReprobadas}
                  </span>
                  <span className="text-xs font-bold text-red-900">Asignaturas reprobadas</span>
                </div>

                <div className="p-3 bg-amber-50 border-2 border-amber-400 rounded-2xl text-center">
                  <span className="text-xl font-black text-amber-950 block">
                    {VIVO_PROGRESO_ACADEMICO.asignaturasPendientes}
                  </span>
                  <span className="text-xs font-bold text-amber-900">Asignaturas pendientes</span>
                </div>
              </div>

              {/* Barra de Progreso y Gráfico de Avance */}
              <div className="p-5 bg-slate-50 rounded-2xl border-2 border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center justify-between text-xs font-black text-slate-800">
                    <span>Avance de Asignaturas de la Carrera</span>
                    <span className="text-[#002B49] text-sm">39 de 41 Asignaturas</span>
                  </div>

                  <div className="w-full bg-slate-200 h-5 rounded-full overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: '95%' }}
                      title="39 asignaturas aprobadas"
                    />
                    <div
                      className="bg-blue-500 h-full"
                      style={{ width: '2.5%' }}
                      title="1 asignatura en curso"
                    />
                    <div
                      className="bg-amber-400 h-full"
                      style={{ width: '2.5%' }}
                      title="1 asignatura pendiente"
                    />
                  </div>
                </div>

                {/* Resumen Circular de Créditos */}
                <div className="shrink-0 p-4 bg-white rounded-2xl border-2 border-slate-300 text-center min-w-[220px]">
                  <span className="text-2xl font-black text-[#002B49] block">
                    {VIVO_PROGRESO_ACADEMICO.porcentajeAvance}%
                  </span>
                  <span className="text-xs font-black text-slate-900 block mt-0.5">
                    Avance total de la carrera
                  </span>
                  <p className="text-[11px] text-slate-600 font-bold mt-1">
                    {VIVO_PROGRESO_ACADEMICO.creditosAprobados} créditos aprobados (+{VIVO_PROGRESO_ACADEMICO.creditosInscritos} inscritos)
                  </p>
                </div>
              </div>
            </div>
          </article>

          {/* Sección 5: Duoc Laboral & Sede Alameda (Captura 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Duoc Laboral */}
            <article className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center font-black text-xl" aria-hidden="true">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Duoc Laboral.cl</h4>
                    <span className="text-xs text-slate-600 font-bold">Portal de Empleabilidad y Prácticas</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  Regístrate en Duoc Laboral para poder recibir y acceder a todas las ofertas laborales y de prácticas profesionales para tu carrera.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 mt-4">
                <a
                  href="https://experienciavivo.duoc.cl/alumnos/duoc-laboral"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] w-full px-5 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white text-xs font-black rounded-xl inline-flex items-center justify-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  aria-label="Ir a portal Duoc Laboral (abre en nueva pestaña)"
                >
                  <span>Ir a DuocLaboral.cl</span>
                  <ExternalLink className="w-3.5 h-3.5 text-[#FFB81C]" aria-hidden="true" />
                </a>
              </div>
            </article>

            {/* Sede Alameda */}
            <article className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center font-black text-xl border border-amber-300" aria-hidden="true">
                    <MapPin className="w-6 h-6 text-amber-800" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900">Sede Alameda</h4>
                    <span className="text-xs text-slate-600 font-bold">Duoc UC • Sede del Estudiante</span>
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  Av. España 8, Santiago. Horario de atención: Lunes a Viernes 08:00 a 22:30 hrs. Sábados 08:30 a 14:00 hrs.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 mt-4">
                <a
                  href="https://www.duoc.cl/sedes/alameda/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-h-[44px] w-full px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs font-black rounded-xl inline-flex items-center justify-center gap-2 border border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
                  aria-label="Ver información y servicios de Sede Alameda (abre en nueva pestaña)"
                >
                  <span>Conocer Sede Alameda</span>
                  <ExternalLink className="w-3.5 h-3.5 text-slate-700" aria-hidden="true" />
                </a>
              </div>
            </article>
          </div>

          {/* Sello de Acreditación Institucional */}
          <footer className="p-5 bg-slate-900 text-white rounded-3xl border-2 border-[#FFB81C] flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-[#FFB81C] shrink-0" aria-hidden="true" />
              <div>
                <p className="font-black text-sm text-white">
                  7 AÑOS ACREDITADO • NIVEL DE EXCELENCIA
                </p>
                <p className="text-xs text-slate-300 font-medium">
                  Comisión Nacional de Acreditación (CNA-Chile) hasta Octubre de 2031.
                </p>
              </div>
            </div>

            <a
              href="https://mesadeservicios.duoc.cl"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-5 py-2 bg-[#FFB81C] hover:bg-amber-300 text-slate-950 font-black text-xs rounded-xl inline-flex items-center gap-2 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white"
              aria-label="Abrir Mesa de Servicios Digitales Duoc UC (abre en nueva pestaña)"
            >
              <HelpCircle className="w-4 h-4" aria-hidden="true" />
              <span>Mesa de Servicios</span>
            </a>
          </footer>
        </div>
      )}

      {/* 5. PESTAÑA C: SIMULADOR DE TOMA DE RAMOS */}
      {activeTab === 'simulador-toma' && (
        <TomaRamosSimulator onExit={() => setActiveTab('video-instrucciones')} />
      )}
    </section>
  );
};
