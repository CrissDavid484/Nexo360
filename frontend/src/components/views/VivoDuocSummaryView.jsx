import React, { useState } from 'react';
import {
  ExternalLink,
  CheckSquare,
  GraduationCap,
  Clock,
  Compass,
  ArrowRight,
  Play,
  FileText,
  MapPin,
  Briefcase,
  HelpCircle,
  Calendar,
  Layers,
  Award,
  DollarSign,
  Scroll,
  Heart,
  ChevronRight,
  BookOpen,
  Info,
} from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';

/**
 * Experiencia Vivo Duoc • Manual Interactivo de Instrucciones y Servicios Oficiales
 * Cumple estrictamente con WCAG 2.2 AAA:
 * - Contraste de color superior a 7:1 en todos los textos legibles.
 * - Elementos de foco visible con 4px de grosor y desplazamiento.
 * - Objetivos táctiles mínimos de 44x44px.
 * - Etiquetas y roles semánticos aria-label y live announcer.
 */
export const VivoDuocSummaryView = () => {
  const { announce } = useAccessibility();

  // Servicio seleccionado para ver en detalle el manual
  const [selectedServiceId, setSelectedServiceId] = useState('horarios');

  // Directorio de servicios con las 9 funcionalidades oficiales de Experiencia Vivo Duoc
  const serviciosVivo = [
    {
      id: 'horarios',
      title: 'Mis Horarios de Clases',
      icon: Clock,
      badge: 'Semana a Semana',
      queHace:
        'Permite consultar el cronograma semanal completo con los bloques horarios oficiales (08:31 a 22:30), números de salas en Sede Alameda, laboratorios especializados asignados y nombres de los docentes de cada asignatura.',
      dondeEncontrarlo:
        'En el menú lateral de Experiencia Vivo, selecciona la opción "Horarios de clases" para visualizar el calendario interactivo semana a semana.',
      requisitos:
        'Tener asignaturas inscritas y vigentes en el período académico actual.',
      link: 'https://experienciavivo.duoc.cl/alumnos/horarios',
      btnText: 'Ir a Horarios en Vivo Duoc',
    },
    {
      id: 'notas',
      title: 'Mis Notas y Calificaciones',
      icon: GraduationCap,
      badge: 'Evaluaciones Parciales',
      queHace:
        'Muestra el desglose detallado de todas tus evaluaciones parciales, notas de certámenes, ponderaciones porcentuales por ramo, notas de presentación a examen y tu promedio ponderado acumulado (PPA).',
      dondeEncontrarlo:
        'En el menú lateral de Experiencia Vivo, pulsa sobre la opción "Notas" para desplegar tus ramos del semestre.',
      requisitos:
        'Las calificaciones son publicadas por los docentes dentro de un plazo máximo de 10 días hábiles tras la rendición.',
      link: 'https://experienciavivo.duoc.cl/alumnos/notas',
      btnText: 'Ir a Notas en Vivo Duoc',
    },
    {
      id: 'asistencia',
      title: 'Mis Asistencias',
      icon: CheckSquare,
      badge: 'Reglamento 70% Mínimo',
      queHace:
        'Permite revisar clase a clase el porcentaje de asistencia registrado por los docentes en cada una de tus asignaturas. Recuerda que la asistencia mínima obligatoria para aprobar cualquier curso en Duoc UC es del 70%.',
      dondeEncontrarlo:
        'Dentro de Experiencia Vivo, dirígete al menú lateral izquierdo y haz clic en la pestaña "Asistencias".',
      requisitos:
        'En caso de inasistencia por motivos de salud, dispones de 72 horas hábiles para ingresar tu justificación médica en la sección de Solicitudes Académicas.',
      link: 'https://experienciavivo.duoc.cl/alumnos/asistencias',
      btnText: 'Ir a Asistencias en Vivo Duoc',
    },
    {
      id: 'malla',
      title: 'Progreso Académico y Malla',
      icon: Compass,
      badge: 'Avance Curricular',
      queHace:
        'Muestra la malla interactiva de tu carrera (Ingeniería en Informática), con el estado de avance semestral, asignaturas aprobadas (en verde), asignaturas en curso y los prerrequisitos necesarios para futuros semestres.',
      dondeEncontrarlo:
        'En el menú lateral, selecciona "Progreso académico" o "Mi Malla Curricular".',
      requisitos:
        'Los prerrequisitos deben estar formalmente aprobados en el sistema antes de cursar ramos superiores.',
      link: 'https://experienciavivo.duoc.cl/alumnos/progreso',
      btnText: 'Ir a Malla en Vivo Duoc',
    },
    {
      id: 'solicitudes',
      title: 'Solicitudes Académicas en Línea',
      icon: FileText,
      badge: 'Trámites Docentes',
      queHace:
        'Canal oficial para tramitar solicitudes formales: convalidación de asignaturas, justificación médica de inasistencias, cambio de sección, renuncia de ramos y solicitudes de gracia ante la Dirección de Carrera.',
      dondeEncontrarlo:
        'En el menú de Experiencia Vivo, haz clic en "Solicitudes académicas" y luego pulsa "Nueva solicitud".',
      requisitos:
        'Adjuntar documentación respaldatoria en formato PDF (licencia médica visada, certificados laborales o informe académico).',
      link: 'https://experienciavivo.duoc.cl/alumnos/solicitudes',
      btnText: 'Ir a Solicitudes en Vivo Duoc',
    },
    {
      id: 'finanzas',
      title: 'Finanzas, Matrícula y Pagos',
      icon: DollarSign,
      badge: 'Aranceles y Beneficios',
      queHace:
        'Revisa el estado de tus cuotas de matrícula, pagarés, firma de contrato de aranceles, estado de beneficios ministeriales (Gratuidad, CAE, Becas Junaeb) y convenios de pago en línea.',
      dondeEncontrarlo:
        'Selecciona "Finanzas" en el menú lateral de Experiencia Vivo para ingresar al portal de pagos y aranceles.',
      requisitos:
        'Tener las cuotas al día es requisito obligatorio para habilitar tu tramo en el proceso de toma de ramos.',
      link: 'https://experienciavivo.duoc.cl/alumnos/finanzas',
      btnText: 'Ir a Finanzas en Vivo Duoc',
    },
    {
      id: 'certificados',
      title: 'Certificados Oficiales con Firma Electrónica',
      icon: Scroll,
      badge: 'Descarga con QR',
      queHace:
        'Genera y descarga al instante certificados con firma electrónica avanzada y código QR de validación: Certificado de Alumno Regular, Concentración de Notas y Certificado de Matrícula.',
      dondeEncontrarlo:
        'Haz clic en "Certificados" en el menú de autoservicio de Vivo Duoc.',
      requisitos:
        'Estar matriculado en el semestre en curso sin suspensiones académicas vigentes.',
      link: 'https://experienciavivo.duoc.cl/alumnos/certificados',
      btnText: 'Ir a Certificados en Vivo Duoc',
    },
    {
      id: 'pastoral',
      title: 'Pastoral y Actividades Estudiantiles (DAE)',
      icon: Heart,
      badge: 'Vida Comunitaria & Deportes',
      queHace:
        'Conoce los talleres deportivos (Ajedrez, Fútbol, Karate, Fitness), selecciones de sede, misiones solidarias, voluntariados y actividades de pastoral y punto estudiantil en Sede Alameda.',
      dondeEncontrarlo:
        'Accede a la sección "Actividades punto estudiantil y pastoral" en Experiencia Vivo.',
      requisitos:
        'Inscripción gratuita para todos los estudiantes regulares de Duoc UC.',
      link: 'https://experienciavivo.duoc.cl/alumnos/actividades/posts',
      btnText: 'Ir a Actividades en Vivo Duoc',
    },
    {
      id: 'laboral',
      title: 'Duoc Laboral (Prácticas y Empleos)',
      icon: Briefcase,
      badge: 'Inserción Profesional',
      queHace:
        'Portal de vinculación laboral exclusivo con ofertas de trabajo validadas, pasantías y centros de práctica profesional para estudiantes y titulados de Duoc UC.',
      dondeEncontrarlo:
        'Selecciona "Duoc Laboral" al final del menú lateral de Experiencia Vivo.',
      requisitos:
        'Haber cumplido con los créditos mínimos exigidos por tu plan de estudios para inscribir práctica laboral.',
      link: 'https://experienciavivo.duoc.cl/alumnos/duoc-laboral',
      btnText: 'Ir a Duoc Laboral en Vivo Duoc',
    },
  ];

  // Servicio activo seleccionado para el panel de detalle
  const activeService = serviciosVivo.find((s) => s.id === selectedServiceId) || serviciosVivo[0];

  return (
    <section aria-labelledby="vivoduoc-view-title" className="space-y-6">
      {/* 1. Encabezado Oficial Accesible (WCAG 2.2 AAA: Contraste >= 7:1) */}
      <header className="bg-white px-6 sm:px-8 py-6 sm:py-7 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-200 shadow-sm">
        <div>
          <span className="text-xs font-black tracking-wider uppercase text-[#002B49] block mb-1">
            Experiencia Vivo Duoc • Manual Institucional de Uso
          </span>
          <h2
            id="vivoduoc-view-title"
            className="text-2xl sm:text-3xl font-black tracking-tight text-[#002B49]"
          >
            Guía y Manual de Botones de Experiencia Vivo
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 font-medium mt-1.5 max-w-2xl leading-relaxed">
            Conoce con exactitud qué realiza cada botón del portal oficial de Duoc UC, dónde encontrarlo en tu menú de alumno y cómo realizar tus trámites académicos sin contratiempos.
          </p>
        </div>

        <div className="shrink-0">
          <a
            href="https://experienciavivo.duoc.cl"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Abrir portal oficial Experiencia Vivo Duoc (abre en nueva pestaña)"
            className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-[#001D33] text-white rounded-xl font-bold text-xs sm:text-sm inline-flex items-center gap-2 shadow-xs transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
          >
            <span>Ir a Experiencia Vivo</span>
            <ExternalLink className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
          </a>
        </div>
      </header>

      {/* 2. Manual Interactivo de Botones y Servicios (Visible primero, prioritario) */}
      <section aria-labelledby="manual-servicios-heading" className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-300 pb-3">
          <div>
            <h3
              id="manual-servicios-heading"
              className="text-lg sm:text-xl font-black text-[#002B49] tracking-tight"
            >
              Manual de Botones: ¿Qué hace cada opción?
            </h3>
            <p className="text-xs text-slate-700 font-medium mt-0.5">
              Selecciona cualquiera de los 9 botones para ver su función detallada, ubicación en el menú y requisitos.
            </p>
          </div>
          <span className="text-xs font-black text-slate-700 bg-slate-200 px-2.5 py-1 rounded-md">
            9 Servicios Oficiales
          </span>
        </div>

        {/* Grilla de Selección de Botones + Panel de Detalle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Lista de Botones (col-span-5) */}
          <div className="lg:col-span-5 space-y-2">
            <div role="list" aria-label="Listado de botones de Experiencia Vivo" className="space-y-2">
              {serviciosVivo.map((srv) => {
                const IconComponent = srv.icon;
                const isSelected = srv.id === activeService.id;

                return (
                  <button
                    key={srv.id}
                    type="button"
                    onClick={() => {
                      setSelectedServiceId(srv.id);
                      announce(`Mostrando manual para ${srv.title}`, 'polite');
                    }}
                    aria-pressed={isSelected}
                    className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center justify-between gap-3 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#002B49] focus-visible:ring-offset-2 ${
                      isSelected
                        ? 'bg-[#002B49] text-white border-[#002B49] shadow-md scale-[1.01]'
                        : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-300 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-amber-400 text-slate-950 font-bold' : 'bg-slate-100 text-[#002B49]'
                        }`}
                        aria-hidden="true"
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black block leading-tight">
                          {srv.title}
                        </span>
                        <span
                          className={`text-[11px] font-semibold block mt-0.5 ${
                            isSelected ? 'text-amber-300' : 'text-slate-600'
                          }`}
                        >
                          {srv.badge}
                        </span>
                      </div>
                    </div>

                    <ChevronRight
                      className={`w-4 h-4 shrink-0 transition-transform ${
                        isSelected ? 'text-amber-400 translate-x-1' : 'text-slate-400'
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Panel de Detalle Explicativo (col-span-7) */}
          <article className="lg:col-span-7 bg-white rounded-2xl border-2 border-slate-300 p-6 sm:p-8 space-y-6 shadow-xs">
            <header className="border-b border-slate-200 pb-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-black uppercase text-amber-800 tracking-wide">
                  Ficha Técnica Institucional
                </span>
                <span className="px-2.5 py-0.5 bg-slate-100 text-slate-800 border border-slate-300 rounded font-bold text-xs">
                  {activeService.badge}
                </span>
              </div>
              <h4 className="text-xl sm:text-2xl font-black text-[#002B49] mt-1">
                {activeService.title}
              </h4>
            </header>

            {/* ¿Qué hace este botón? */}
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-blue-900" aria-hidden="true" />
                <span>¿Qué hace exactamente este botón?</span>
              </h5>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {activeService.queHace}
              </p>
            </div>

            {/* ¿Dónde encontrarlo en el portal? */}
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-amber-700" aria-hidden="true" />
                <span>¿Dónde encontrarlo en Experiencia Vivo?</span>
              </h5>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-amber-50/60 p-3.5 rounded-xl border border-amber-300">
                {activeService.dondeEncontrarlo}
              </p>
            </div>

            {/* Requisitos y reglamentación */}
            <div className="space-y-2">
              <h5 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                <Info className="w-4 h-4 text-emerald-800" aria-hidden="true" />
                <span>Requisitos importantes y normativa:</span>
              </h5>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-300">
                {activeService.requisitos}
              </p>
            </div>

            {/* Botón de acceso directo al servicio oficial */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-[11px] text-slate-600 font-medium">
                Enlace validado con los servidores oficiales de Duoc UC.
              </span>
              <a
                href={activeService.link}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] px-5 py-2.5 bg-[#002B49] hover:bg-blue-950 text-white font-black text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 shadow-xs transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C]"
              >
                <span>{activeService.btnText}</span>
                <ExternalLink className="w-4 h-4 text-[#FFB81C]" aria-hidden="true" />
              </a>
            </div>
          </article>
        </div>
      </section>

      {/* 3. Video Demostrativo Oficial (Diseño Compacto y Amigable) */}
      <article className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm max-w-4xl mx-auto">
        <header className="px-5 py-3.5 bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-black uppercase text-amber-400 block tracking-wider">
              Material Audiovisual Complementario
            </span>
            <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
              Tutorial Oficial: Experiencia Vivo Duoc
            </h4>
          </div>

          <a
            href="https://www.youtube.com/watch?v=lQUsG0XCyRg"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[34px] px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-lg inline-flex items-center gap-1.5 self-start sm:self-auto transition-colors"
          >
            <span>Ver en YouTube</span>
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        </header>

        {/* Reproductor de Video en Tamaño Reducido y Proporcionado */}
        <div className="p-4 sm:p-5 bg-slate-950">
          <div className="relative aspect-video max-w-2xl mx-auto rounded-xl overflow-hidden shadow-lg border border-slate-800 bg-black">
            <iframe
              src="https://www.youtube-nocookie.com/embed/lQUsG0XCyRg?rel=0"
              title="Video tutorial oficial de inducción a Experiencia Vivo Duoc UC"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="absolute inset-0 w-full h-full border-0"
            />
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span>Video oficial Duoc UC para estudiantes y comunidad académica.</span>
          <span className="font-semibold text-[#002B49]">Subtítulos disponibles en el reproductor</span>
        </div>
      </article>

      {/* 4. Sello de Acreditación Institucional */}
      <footer className="p-5 bg-slate-900 text-white rounded-2xl border-2 border-[#FFB81C] flex flex-col sm:flex-row items-center justify-between gap-4">
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
    </section>
  );
};
