import React from 'react';
import { ExternalLink, CheckCircle, ShieldCheck, ArrowLeft } from 'lucide-react';

export const GenericModuleView = ({ moduleId, onBackToInicio }) => {
  const moduleConfig = {
    ava: {
      title: 'AVA Blackboard • Duoc UC',
      description: 'Accede a tus asignaturas virtuales, material de cátedra, foros de discusión y entregas de proyectos.',
      url: 'https://ava.duoc.cl',
      btnText: 'Abrir AVA en pestaña segura',
      badges: ['Autenticación SSO Integrada', 'Formato Accesible PAEDIS'],
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
      title: 'Acompañamiento y Accesibilidad PAEDIS',
      description: 'Servicios de apoyo técnico, adecuaciones curriculares, tecnologías adaptativas y recursos inclusivos en Sede Alameda.',
      url: 'https://experienciavivo.duoc.cl/paedis',
      btnText: 'Solicitar Apoyo PAEDIS',
      badges: ['PAEDIS Sede Alameda', 'Atención Presencial y Online'],
      highlights: [
        'Préstamo y configuración de tecnologías asistivas (lectores de pantalla, softwares de magnificación).',
        'Coordinación directa de adecuaciones curriculares y formatos de evaluación accesibles.',
        'Atención preferencial y acompañamiento institucional en Duoc UC Sede Alameda.',
      ],
    },
    correo: {
      title: 'Correo Institucional Microsoft Outlook',
      description: 'Bandeja de entrada oficial de tu cuenta c.guzmang@duocuc.cl para comunicaciones docentes, avisos institucionales y confirmaciones de biblioteca.',
      url: 'https://outlook.office.com',
      btnText: 'Abrir Correo en Microsoft 365',
      badges: ['Almacenamiento OneDrive 1TB', 'Office 365 ProPlus'],
      highlights: [
        'Notificaciones en tiempo real sobre aprobación de ajustes PAEDIS y notas.',
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
    'paedis-programas': {
      title: 'Programas de Apoyo al Estudiante (PAEDIS)',
      description: 'El corazón del Programa de Apoyo a Estudiantes con Discapacidad de Duoc UC. Diseñado para garantizar equidad, autonomía e inclusión en tu experiencia formativa.',
      url: 'https://www.duoc.cl/alumnos/paedis/',
      btnText: 'Conocer más de PAEDIS',
      badges: ['Acompañamiento 360°', 'Ley N° 21.790'],
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
    <div className="space-y-6">
      <div className="border-b border-slate-200 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-normal text-slate-800 tracking-tight">
            {current.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-3xl leading-relaxed">
            {current.description}
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToInicio}
          className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-[#002B49] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Inicio</span>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {current.badges.map((badge, idx) => (
            <span
              key={idx}
              className="bg-amber-100 text-amber-950 border border-amber-300 text-xs font-extrabold px-3 py-1 rounded-full"
            >
              {badge}
            </span>
          ))}
        </div>

        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Detalles y Características del Servicio:
          </h2>
          <ul className="space-y-2.5">
            {current.highlights.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2.5 bg-[#002B49] hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-black shadow-sm flex items-center gap-2 transition-transform active:scale-95 focus:ring-4 focus:ring-amber-400"
          >
            <span>{current.btnText}</span>
            <ExternalLink className="w-4 h-4 text-amber-400" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  );
};
