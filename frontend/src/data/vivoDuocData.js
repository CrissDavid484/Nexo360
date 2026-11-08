/**
 * Datos estructurados de Vivo Duoc para Nexo360
 * Adaptado para Cristian Guzmán • Duoc UC Sede Alameda.
 */

export const VIVO_STUDENT_PROFILE = {
  nombre: 'Cristian Guzmán',
  rut: '19.876.543-2',
  carrera: 'Ingeniería en Informática',
  sede: 'Sede Alameda',
  direccion: 'Las Moreras 12196',
  emailDuoc: 'c.guzman@duocuc.cl',
  telefonoPersonal: '+56 9 3016 6745',
  emailPersonal: 'cristian.david.g123@gmail.com',
  preferenciasAccesibilidad: {
    sede: 'Sede Alameda',
    diagnosticoDeclarado: 'Ajuste de Accesibilidad Sensorial / Motriz',
    ajustesVisuales: 'Plataforma adaptada a lectores de pantalla, alto contraste y navegación por teclado',
    recursosPreferidos: 'Salas de estudio colaborativas e individuales en Biblioteca Alameda',
    ajustesAprobados: [
      { tipo: 'Tiempo Adicional', descripcion: '50% de tiempo adicional en certámenes y evaluaciones teóricas' },
      { tipo: 'Material Digital Accesible', descripcion: 'Entrega de material en formatos accesibles compatibles con lectores de pantalla' },
      { tipo: 'Mobiliario y Entorno', descripcion: 'Ubicación preferencial en primera fila y acceso a salas de estudio adaptadas' },
    ],
  },
};

export const VIVO_HORARIOS = [
  {
    dia: 'Lunes',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    items: [],
    emptyMessage: 'No tienes clases programadas para este día',
  },
  {
    dia: 'Martes',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    items: [],
    emptyMessage: 'No tienes clases programadas para este día',
  },
  {
    dia: 'Miércoles',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    items: [
      {
        ramo: 'PROYECTO CAPSTONE',
        seccion: 'INF-001D',
        horario: '18:45 - 21:00 hrs',
        sala: 'Sala 402 (Edificio Central - Sede Alameda)',
        docente: 'Mauricio Gómez Arratia',
        modalidad: 'Presencial',
      },
    ],
  },
  {
    dia: 'Jueves',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    items: [
      {
        ramo: 'ARQUITECTURA DE SOFTWARE',
        seccion: 'INF-003D',
        horario: '19:30 - 22:00 hrs',
        sala: 'Laboratorio de Software (Piso 3 - Sede Alameda)',
        docente: 'Andrés Silva Paredes',
        modalidad: 'Presencial',
      },
    ],
  },
  {
    dia: 'Viernes',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    items: [],
    emptyMessage: 'No tienes clases programadas para este día',
  },
  {
    dia: 'Sábado',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    items: [],
    emptyMessage: 'No tienes clases programadas para este día',
  },
];

export const VIVO_NOTAS = [
  {
    id: 'capstone',
    curso: 'CAPSTONE',
    carrera: 'INGENIERIA EN INFORMATICA',
    notaFinal: '--',
    estado: 'En curso',
    evaluaciones: [
      { nombre: 'Parcial 1 - Levantamiento y Alcance', ponderacion: '25%', nota: '6.8' },
      { nombre: 'Parcial 2 - Arquitectura y Prototipo Accesible', ponderacion: '35%', nota: '6.5' },
      { nombre: 'Parcial 3 - Integración de Servicios', ponderacion: '20%', nota: '--' },
      { nombre: 'Examen Transversal - Defensa de Título', ponderacion: '20%', nota: '--' },
    ],
  },
  {
    id: 'arq-soft',
    curso: 'ARQUITECTURA DE SOFTWARE',
    carrera: 'INGENIERIA EN INFORMATICA',
    notaFinal: '6.6',
    estado: 'Aprobado',
    evaluaciones: [
      { nombre: 'Certamen 1 - Patrones y Microservicios', ponderacion: '30%', nota: '6.2' },
      { nombre: 'Certamen 2 - Ciberseguridad y Autenticación', ponderacion: '35%', nota: '7.0' },
      { nombre: 'Proyecto Final - API Gateway', ponderacion: '35%', nota: '6.6' },
    ],
  },
  {
    id: 'gestion-proy',
    curso: 'GESTIÓN DE PROYECTOS ÁGILES',
    carrera: 'INGENIERIA EN INFORMATICA',
    notaFinal: '6.7',
    estado: 'Aprobado',
    evaluaciones: [
      { nombre: 'Entrega 1 - Product Backlog & Historias', ponderacion: '30%', nota: '6.5' },
      { nombre: 'Entrega 2 - Sprint Review & Retrospectiva', ponderacion: '35%', nota: '6.9' },
      { nombre: 'Examen Práctico Scrum', ponderacion: '35%', nota: '6.8' },
    ],
  },
];

export const VIVO_ASISTENCIAS = [
  {
    curso: 'Capstone',
    clasesRegistradas: 18,
    asistencia: 16,
    porcentaje: '88.9%',
    porcentajeNum: 88.9,
    minimoRequerido: 70,
    estado: 'Cumpliendo',
    justificadas: 0,
  },
  {
    curso: 'Arquitectura de Software',
    clasesRegistradas: 20,
    asistencia: 18,
    porcentaje: '90.0%',
    porcentajeNum: 90.0,
    minimoRequerido: 70,
    estado: 'Cumpliendo',
    justificadas: 1,
  },
  {
    curso: 'Gestión de Proyectos Ágiles',
    clasesRegistradas: 16,
    asistencia: 15,
    porcentaje: '93.8%',
    porcentajeNum: 93.8,
    minimoRequerido: 70,
    estado: 'Cumpliendo',
    justificadas: 0,
  },
];

export const DUOC_BIBLIOTECAS_SEDES = [
  'Biblioteca Alameda',
  'Biblioteca San Joaquín',
  'Biblioteca Antonio Varas',
  'Biblioteca Arauco',
  'Biblioteca Concepción',
  'Biblioteca Maipú',
  'Biblioteca Melipilla',
  'Biblioteca Nacimiento',
  'Biblioteca Plaza Norte',
  'Biblioteca Plaza Oeste',
  'Biblioteca Plaza Vespucio',
  'Biblioteca Puente Alto',
  'Biblioteca San Bernardo',
  'Biblioteca San Carlos de Apoquindo',
  'Biblioteca Valparaíso',
  'Biblioteca Viña del Mar',
];
