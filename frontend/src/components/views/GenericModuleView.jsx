import React from 'react';
import { ExternalLink, CheckCircle, ArrowLeft } from 'lucide-react';

export const GenericModuleView = ({ moduleId, onBackToInicio }) => {
  const moduleConfig = {
    ava: {
      title: 'AVA Blackboard • Duoc UC',
      description: 'Accede a tus asignaturas virtuales, material de cátedra, foros de discusión y entregas de proyectos.',
      url: 'https://ava.duoc.cl',
      btnText: 'Abrir AVA en pestaña segura',
      badges: ['Autenticación SSO Integrada', 'Formato Accesible Universal'],
      highlights: [
        'Todas las rúbricas y material multimedia cuentan con compatibilidad para lectores de pantalla.',
        'Las evaluaciones en AVA tienen precargado el ajuste de 50% de tiempo adicional.',
        'Soporte técnico preferente en aula virtual ante caídas de conexión durante entregas.',
      ],
    },
    progreso: {
      title: 'Progreso Académico y Malla Curricular',
      description: 'Monitorea tu avance curricular en la carrera de Ingeniería en Informática, ramos aprobados y créditos acumulados.',
      url: 'https://experienciavivo.duoc.cl/malla',
      btnText: 'Ver Malla Curricular Completa',
      badges: ['Avance: 87.5%', 'Estado: Alumno Regular'],
      highlights: [
        'Total de créditos aprobados: 210 de 240.',
        'Práctica Profesional: En proceso de postulación con convenios inclusivos.',
        'Asignaturas en curso: Capstone, Arquitectura de Software, Gestión de Proyectos Ágiles.',
      ],
    },
    tutoriales: {
      title: 'Tutoriales y Guías Paso a Paso',
      description: 'Video-tutoriales con subtítulos y transcripciones accesibles sobre trámites, software institucional y servicios de sede.',
      url: 'https://experienciavivo.duoc.cl/tutoriales',
      btnText: 'Explorar Catálogo de Tutoriales',
      badges: ['Subtítulos en Español', 'Lengua de Señas Chilena (LSCh)'],
      highlights: [
        'Cómo utilizar el proxy de autenticación Zero-Knowledge de Nexo360.',
        'Guía para reserva y check-in en salas de estudio de biblioteca.',
        'Paso a paso para la revalidación y pase escolar TNE.',
      ],
    },
    bibliografia: {
      title: 'Bibliografía de Asignaturas',
      description: 'Consulta los textos guía y bibliografía básica/complementaria de tus asignaturas inscritas con acceso a libros digitales (e-books).',
      url: 'https://bibliotecas.duoc.cl/bibliografia',
      btnText: 'Ir a Bibliografía Digital',
      badges: ['Formatos EPUB / PDF Accesible', 'Lectura por Voz'],
      highlights: [
        'Libro Guía Capstone: Metodologías Ágiles y Diseño Universal en Desarrollo de Software.',
        'Patrones de Arquitectura de Software: Clean Architecture y Microservicios en la Nube.',
        'Todos los libros digitales cuentan con soporte de contraste y texto redimensionable.',
      ],
    },
    apoyo: {
      title: 'Acompañamiento y Accesibilidad Estudiantil',
      description: 'Servicios de apoyo técnico, adecuaciones curriculares, tecnologías adaptativas y recursos de accesibilidad en Sede Alameda.',
      url: 'https://experienciavivo.duoc.cl/apoyo',
      btnText: 'Solicitar Apoyo Estudiantil',
      badges: ['Sede Alameda', 'Atención Presencial y Online'],
      highlights: [
        'Préstamo y configuración de tecnologías asistivas (lectores de pantalla, softwares de magnificación).',
        'Coordinación directa de adecuaciones curriculares y formatos de evaluación accesibles.',
        'Atención preferencial y acompañamiento institucional en Duoc UC Sede Alameda.',
      ],
    },
    correo: {
      title: 'Correo Institucional Microsoft Outlook',
      description: 'Bandeja de entrada oficial de tu cuenta c.guzman@duocuc.cl para comunicaciones docentes, avisos institucionales y confirmaciones de biblioteca.',
      url: 'https://outlook.office.com',
      btnText: 'Abrir Correo en Microsoft 365',
      badges: ['Almacenamiento OneDrive 1TB', 'Office 365 ProPlus'],
      highlights: [
        'Notificaciones en tiempo real sobre resoluciones de solicitudes y notas.',
        'Códigos de ingreso a salas de biblioteca enviados automáticamente.',
        'Integración con Microsoft Teams para clases remotas y reuniones con docentes.',
      ],
    },
    eventos: {
      title: 'Actividades y Eventos Online',
      description: 'Talleres extracurriculares, charlas técnicas de informática, ferias laborales inclusivas y torneos deportivos.',
      url: 'https://experienciavivo.duoc.cl/eventos',
      btnText: 'Ver Calendario de Eventos',
      badges: ['Eventos Accesibles', 'Modalidad Híbrida'],
      highlights: [
        'Semana de la Innovación y Tecnología Duoc UC 2026.',
        'Feria Laboral de Inclusión: Empresas bajo la Ley N° 21.015.',
        'Talleres de Ciberseguridad, Inteligencia Artificial y Cloud Computing.',
      ],
    },
    'programas-apoyo': {
      title: 'Programas de Apoyo al Estudiante',
      description: 'Programas institucionales de Duoc UC diseñados para garantizar equidad, autonomía e inclusión en tu experiencia formativa.',
      url: 'https://www.duoc.cl/alumnos/apoyo/',
      btnText: 'Conocer más de los Programas',
      badges: ['Acompañamiento 360°', 'Inclusión Institucional'],
      highlights: [
        'Coordinación directa de ajustes razonables en aula, laboratorios y evaluaciones.',
        'Asignación personalizada de Tutor PAR para apoyo pedagógico entre pares.',
        'Préstamo de tecnologías asistivas y mobiliario adaptado en sede.',
      ],
    },
  };

  const current = moduleConfig[moduleId] || {
    title: 'Módulo Institucional Duoc UC',
    description: 'Información institucional centralizada y accesible.',
    url: 'https://experienciavivo.duoc.cl',
    btnText: 'Ir al sitio oficial',
    badges: ['Nexo360 Unificado'],
    highlights: ['Servicio integrado dentro de la plataforma One-Stop-Shop.'],
  };

  return (
    // A11y: Elemento semántico <section> con encabezado accesible
    <section aria-labelledby="generic-module-heading" className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h2 id="generic-module-heading" className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {current.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 mt-2 max-w-3xl leading-relaxed font-medium">
            {current.description}
          </p>
        </div>

        {/* A11y: Botón volver con target size accesible */}
        <button
          type="button"
          onClick={onBackToInicio}
          className="min-h-[44px] hidden sm:flex items-center gap-2 text-xs sm:text-sm font-black text-[#002B49] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] rounded-lg px-2"
        >
          <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
          <span>Volver al Inicio</span>
        </button>
      </div>

      <article className="bg-white rounded-3xl border-2 border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {current.badges.map((badge, idx) => (
            <span
              key={idx}
              className="bg-amber-100 text-amber-950 border border-amber-400 text-xs font-black px-3 py-1 rounded-full"
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
            Detalles y Características del Servicio:
          </h3>
          <ul className="space-y-2.5">
            {current.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-800 font-medium">
                <CheckCircle className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t-2 border-slate-100 flex flex-wrap items-center gap-4">
          {/* A11y: Enlace externo con target size >= 44px, indicación de nueva pestaña y foco accesible */}
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${current.btnText} (se abre en una nueva pestaña)`}
            className="min-h-[44px] px-6 py-2.5 bg-[#002B49] hover:bg-[#001f35] text-white rounded-xl text-xs sm:text-sm font-black shadow-sm flex items-center gap-2 transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#FFB81C] focus-visible:ring-offset-2"
          >
            <span>{current.btnText}</span>
            <ExternalLink className="w-4 h-4 text-[#FFB81C] shrink-0" aria-hidden="true" />
          </a>
        </div>
      </article>
    </section>
  );
};
