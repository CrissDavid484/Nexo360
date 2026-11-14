const mongoose = require('mongoose');
const CourseOffering = require('../models/CourseOffering');
const excelParserService = require('./excelParserService');

let alamedaSeedData = null;
try {
  alamedaSeedData = require('../data/alameda2026Seed.json');
} catch (e) {
  alamedaSeedData = null;
}

/**
 * Tabla estándar de bloques horarios institucionales Duoc UC
 */
const STANDARD_BLOCKS = [
  { id: 'b1', start: 8 * 60 + 31, end: 9 * 60 + 10, label: '08:31 - 09:10' },
  { id: 'b2', start: 9 * 60 + 11, end: 9 * 60 + 50, label: '09:11 - 09:50' },
  { id: 'b3', start: 10 * 60 + 1, end: 10 * 60 + 40, label: '10:01 - 10:40' },
  { id: 'b4', start: 10 * 60 + 41, end: 11 * 60 + 20, label: '10:41 - 11:20' },
  { id: 'b5', start: 11 * 60 + 31, end: 12 * 60 + 10, label: '11:31 - 12:10' },
  { id: 'b6', start: 12 * 60 + 11, end: 12 * 60 + 50, label: '12:11 - 12:50' },
  { id: 'b7', start: 13 * 60 + 1, end: 13 * 60 + 40, label: '13:01 - 13:40' },
  { id: 'b7b', start: 13 * 60 + 41, end: 14 * 60 + 20, label: '13:41 - 14:20' },
  { id: 'b8', start: 14 * 60 + 31, end: 15 * 60 + 10, label: '14:31 - 15:10' },
  { id: 'b9', start: 15 * 60 + 11, end: 15 * 60 + 50, label: '15:11 - 15:50' },
  { id: 'b10', start: 16 * 60 + 1, end: 16 * 60 + 40, label: '16:01 - 16:40' },
  { id: 'b11', start: 16 * 60 + 41, end: 17 * 60 + 20, label: '16:41 - 17:20' },
  { id: 'b12', start: 17 * 60 + 31, end: 18 * 60 + 10, label: '17:31 - 18:10' },
  { id: 'b13', start: 18 * 60 + 11, end: 18 * 60 + 50, label: '18:11 - 18:50' },
  { id: 'b14', start: 19 * 60 + 1, end: 19 * 60 + 40, label: '19:01 - 19:40' },
  { id: 'b15', start: 19 * 60 + 41, end: 20 * 60 + 20, label: '19:41 - 20:20' },
  { id: 'b16', start: 20 * 60 + 31, end: 21 * 60 + 10, label: '20:31 - 21:10' },
  { id: 'b17', start: 21 * 60 + 11, end: 21 * 60 + 50, label: '21:11 - 21:50' },
];

/**
 * Parsea un string de horario Duoc UC (ej: "Lu 8:31:00 - 9:50:00" o "Ma 16:01:00 - 17:20:00")
 * y retorna los bloques horarios exactos asignados.
 */
function parseDuocSchedule(scheduleStr, sala = 'ONLINE') {
  if (!scheduleStr || typeof scheduleStr !== 'string') return [];

  const dayMap = {
    lu: 'Lunes',
    ma: 'Martes',
    mi: 'Miércoles',
    ju: 'Jueves',
    vi: 'Viernes',
    sa: 'Sábado',
    do: 'Domingo',
    lunes: 'Lunes',
    martes: 'Martes',
    miercoles: 'Miércoles',
    miércoles: 'Miércoles',
    jueves: 'Jueves',
    viernes: 'Viernes',
    sabado: 'Sábado',
    sábado: 'Sábado',
  };

  const match = scheduleStr
    .trim()
    .match(/^([a-zA-ZáéíóúÁÉÍÓÚ]+)\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)/);

  if (!match) return [];

  const day = dayMap[match[1].toLowerCase()] || 'Lunes';
  const toMinutes = (timeStr) => {
    const parts = timeStr.split(':').map(Number);
    return parts[0] * 60 + parts[1];
  };

  const startMin = toMinutes(match[2]);
  const endMin = toMinutes(match[3]);

  const matched = [];
  for (const blk of STANDARD_BLOCKS) {
    if (Math.max(startMin, blk.start) < Math.min(endMin, blk.end)) {
      matched.push({
        dia: day,
        bloqueId: blk.id,
        horaInicio: match[2],
        horaFin: match[3],
        salaCorta: sala || 'ONLINE',
      });
    }
  }

  if (matched.length === 0) {
    matched.push({
      dia: day,
      bloqueId: startMin < 12 * 60 ? 'b1' : startMin < 17 * 60 ? 'b8' : 'b12',
      horaInicio: match[2],
      horaFin: match[3],
      salaCorta: sala || 'ONLINE',
    });
  }

  return matched;
}

/**
 * Catálogo Semilla de Asignaturas 2026-002
 * Incluye los ramos oficiales proporcionados por el usuario para Ingeniería en Infraestructura Tecnológica,
 * Ingeniería en Informática, y plataformas afines.
 */
const SEED_ROWS_RAW = [
  // --- INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA (Plan 1446815) ---
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'OCY1104',
    nombre: 'CIBERSEGURIDAD OFENSIVA',
    nivel: 'Optativos',
    seccion: 'OCY1104-001D',
    horario: 'Lu 8:31:00 - 9:50:00',
    docente: 'JOSE ERASMO MATUS',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'OCY1104',
    nombre: 'CIBERSEGURIDAD OFENSIVA',
    nivel: 'Optativos',
    seccion: 'OCY1104-001D',
    horario: 'Lu 10:01:00 - 11:20:00',
    docente: 'JOSE ERASMO MATUS',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'OCY1102',
    nombre: 'CIBERSEGURIDAD EN DESARROLLO',
    nivel: 'Optativos',
    seccion: 'OCY1102-021D',
    horario: 'Lu 17:31:00 - 18:50:00',
    docente: 'YASSER GUERRA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'OCY1102',
    nombre: 'CIBERSEGURIDAD EN DESARROLLO',
    nivel: 'Optativos',
    seccion: 'OCY1102-021D',
    horario: 'Lu 16:01:00 - 17:20:00',
    docente: 'YASSER GUERRA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'OCY1102',
    nombre: 'CIBERSEGURIDAD EN DESARROLLO',
    nivel: 'Optativos',
    seccion: 'OCY1102-001D',
    horario: 'Lu 8:31:00 - 9:50:00',
    docente: 'JUAN ARTURO SAGARDIA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'DOY0101',
    nombre: 'INGENIERÍA DEVOPS',
    nivel: 'Optativos',
    seccion: 'DOY0101-001D',
    horario: 'Ma 16:01:00 - 17:20:00',
    docente: 'CRISTIAN ANDRES BUGUEÑO',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'DOY0101',
    nombre: 'INGENIERÍA DEVOPS',
    nivel: 'Optativos',
    seccion: 'DOY0101-001D',
    horario: 'Ma 17:31:00 - 18:50:00',
    docente: 'CRISTIAN ANDRES BUGUEÑO',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'OCY1101',
    nombre: 'CIBERSEGURIDAD, SISTEMA OPERATIVO Y RED.',
    nivel: 'Optativos',
    seccion: 'OCY1101-022D',
    horario: 'Ma 16:01:00 - 17:20:00',
    docente: 'LUIS IGNACIO JAQUE',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'JVY0101',
    nombre: 'JAVA: DIS y CONST. DE SOL. NATIVAS EN NU',
    nivel: 'Optativos',
    seccion: 'JVY0101-011V',
    horario: 'Sa 11:31:00 - 12:50:00',
    docente: 'FABIÁN MAURICIO LÓPEZ',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'ISY0101',
    nombre: 'ING. DE SOL. CON INTELIGENCIA ARTIFICIAL',
    nivel: 'Optativos',
    seccion: 'ISY0101-014V',
    horario: 'Sa 14:31:00 - 15:50:00',
    docente: 'CRISTIAN RODRIGO ARAYA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'DOY0101',
    nombre: 'INGENIERÍA DEVOPS',
    nivel: 'Optativos',
    seccion: 'DOY0101-008V',
    horario: 'Sa 8:31:00 - 9:50:00',
    docente: 'NICOLAS EDUARDO SINGH',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'DOY0101',
    nombre: 'INGENIERÍA DEVOPS',
    nivel: 'Optativos',
    seccion: 'DOY0101-007D',
    horario: 'Ma 16:01:00 - 17:20:00',
    docente: 'PABLO RODRIGO ALONSO RAMIREZ',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'DLY0100',
    nombre: 'DEEP LEARNING',
    nivel: 'Optativos',
    seccion: 'DLY0100-013V',
    horario: 'Sa 14:31:00 - 15:50:00',
    docente: 'CRISTIAN ANDRES CARCAMO',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'DLY0100',
    nombre: 'DEEP LEARNING',
    nivel: 'Optativos',
    seccion: 'DLY0100-012D',
    horario: 'Lu 16:01:00 - 17:20:00',
    docente: 'MARCELO ALEJANDRO TAPIA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'SLY1101',
    nombre: 'SISTEMA OPERATIVO LINUX',
    nivel: 'Optativos',
    seccion: 'SLY1101-001V',
    horario: 'Sa 14:31:00 - 15:50:00',
    docente: 'FABIAN ANDRES MIRANDA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'SLY1101',
    nombre: 'SISTEMA OPERATIVO LINUX',
    nivel: 'Optativos',
    seccion: 'SLY1101-001D',
    horario: 'Lu 16:01:00 - 17:20:00',
    docente: 'FABIAN ANDRES MIRANDA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'PMY0011',
    nombre: 'RENDIMIENTO Y LIDERAZGO',
    nivel: 'Optativos',
    seccion: 'PMY0011-005D',
    horario: 'Vi 16:41:00 - 17:20:00',
    docente: 'MARIO GARCIA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'PMY0011',
    nombre: 'RENDIMIENTO Y LIDERAZGO',
    nivel: 'Optativos',
    seccion: 'PMY0011-004D',
    horario: 'Ju 16:41:00 - 17:20:00',
    docente: 'FERNANDO JAVIER JEREZ',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'CCY0011',
    nombre: 'INFRAESTRUCTURA CLOUD',
    nivel: 'Optativos',
    seccion: 'CCY0011-004V',
    horario: 'Sa 8:31:00 - 9:50:00',
    docente: 'JAVIER ALONSO VERA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'CCY0011',
    nombre: 'INFRAESTRUCTURA CLOUD',
    nivel: 'Optativos',
    seccion: 'CCY0011-003D',
    horario: 'Vi 16:41:00 - 17:20:00',
    docente: 'ALVARO DAVID VALLEJOS',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'BDY0101',
    nombre: 'BASE DE DATOS NO RELACIONALES',
    nivel: 'Optativos',
    seccion: 'BDY0101-003V',
    horario: 'Sa 13:01:00 - 14:20:00',
    docente: 'MATIAS HUMBERTO QUINCHEN',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'BDY0101',
    nombre: 'BASE DE DATOS NO RELACIONALES',
    nivel: 'Optativos',
    seccion: 'BDY0101-002D',
    horario: 'Mi 16:01:00 - 17:20:00',
    docente: 'IGOR ANDRES VENEGAS',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'BCY0011',
    nombre: 'DESARROLLO DE CONTRATOS INTELIGENTES PAR',
    nivel: 'Optativos',
    seccion: 'BCY0011-005V',
    horario: 'Sa 8:31:00 - 9:50:00',
    docente: 'JOSE FERNANDO MOLINA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'BCY0011',
    nombre: 'DESARROLLO DE CONTRATOS INTELIGENTES PAR',
    nivel: 'Optativos',
    seccion: 'BCY0011-004D',
    horario: 'Vi 16:41:00 - 17:20:00',
    docente: 'JOSE FERNANDO MOLINA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'MLY0100',
    nombre: 'MACHINE LEARNING',
    nivel: 'Optativos',
    seccion: 'MLY0100-012D',
    horario: 'Vi 16:01:00 - 17:20:00',
    docente: 'MAURO MACIEL MERCADO',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'MLY0100',
    nombre: 'MACHINE LEARNING',
    nivel: 'Optativos',
    seccion: 'MLY0100-013V',
    horario: 'Lu 19:01:00 - 20:20:00',
    docente: 'VICTOR ANDRES TRIGO',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'PMY0010',
    nombre: 'FUNDAMENTOS DE PROJECT MANAGEMENT',
    nivel: 'Optativos',
    seccion: 'PMY0010-006D',
    horario: 'Vi 16:41:00 - 17:20:00',
    docente: 'FERNANDO JAVIER JEREZ',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Vespertino',
    sigla: 'OCY1105',
    nombre: 'CIBERSEGURIDAD DEFENSIVA',
    nivel: 'Optativos',
    seccion: 'OCY1105-021V',
    horario: 'Sa 8:31:00 - 9:50:00',
    docente: 'JOSE EDUARDO MORALES',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'OCY1105',
    nombre: 'CIBERSEGURIDAD DEFENSIVA',
    nivel: 'Optativos',
    seccion: 'OCY1105-013D',
    horario: 'Vi 16:01:00 - 17:20:00',
    docente: 'JOSE REYNALDO ALVARES',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'OCY1103',
    nombre: 'CIBERSEGURIDAD EN TEC. EN CLOUD Y CONT.',
    nivel: 'Optativos',
    seccion: 'OCY1103-015D',
    horario: 'Vi 16:01:00 - 17:20:00',
    docente: 'FRANCISCA VALENZUELA',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'CCY0010',
    nombre: 'SOLUCIONES CLOUD',
    nivel: 'Optativos',
    seccion: 'CCY0010-006D',
    horario: 'Vi 16:41:00 - 17:20:00',
    docente: 'NICOLAS EDUARDO SINGH',
    modalidad: 'ONLINE SINCRONA',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    plan: '1446815',
    jornada: 'Diurno',
    sigla: 'BCY0010',
    nombre: 'FUNDAMENTOS DE BLOCKCHAIN',
    nivel: 'Optativos',
    seccion: 'BCY0010-004D',
    horario: 'Vi 16:41:00 - 17:20:00',
    docente: 'ROBERT ANTHONY ROZAS',
    modalidad: 'ONLINE SINCRONA',
  },

  // --- INGENIERÍA EN INFORMÁTICA (Plan 1446114) ---
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    plan: '1446114',
    jornada: 'Diurno',
    sigla: 'PTY4614',
    nombre: 'PROYECTO CAPSTONE',
    nivel: 'Semestre 8',
    seccion: 'PTY4614-001D',
    horario: 'Mi 8:31:00 - 9:50:00',
    docente: 'MAURICIO GÓMEZ ARRATIA',
    modalidad: 'PRESENCIAL',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    plan: '1446114',
    jornada: 'Diurno',
    sigla: 'ASY4131',
    nombre: 'ARQUITECTURA DE SOFTWARE',
    nivel: 'Semestre 8',
    seccion: 'ASY4131-001D',
    horario: 'Ju 14:31:00 - 15:50:00',
    docente: 'ANDRÉS SILVA PAREDES',
    modalidad: 'PRESENCIAL',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    plan: '1446114',
    jornada: 'Diurno',
    sigla: 'GPI4121',
    nombre: 'GESTIÓN DE PROYECTOS ÁGILES',
    nivel: 'Semestre 8',
    seccion: 'GPI4121-001D',
    horario: 'Ma 10:01:00 - 11:20:00',
    docente: 'CARLA VERGARA MONTES',
    modalidad: 'PRESENCIAL',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    plan: '1446114',
    jornada: 'Diurno',
    sigla: 'CAL4101',
    nombre: 'CALIDAD Y TESTING DE SOFTWARE',
    nivel: 'Semestre 8',
    seccion: 'CAL4101-001D',
    horario: 'Lu 14:31:00 - 15:50:00',
    docente: 'MARCELO BUSTAMANTE JARA',
    modalidad: 'PRESENCIAL',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    plan: '1446114',
    jornada: 'Diurno',
    sigla: 'SEG4102',
    nombre: 'SEGURIDAD EN APLICACIONES Y REDES',
    nivel: 'Semestre 8',
    seccion: 'SEG4102-001D',
    horario: 'Vi 11:31:00 - 12:50:00',
    docente: 'RODRIGO VÁSQUEZ MELLA',
    modalidad: 'PRESENCIAL',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    plan: '1446114',
    jornada: 'Diurno',
    sigla: 'FCG4101',
    nombre: 'ÉTICA PROFESIONAL',
    nivel: 'Formación Cristiana',
    seccion: 'FCG4101-001D',
    horario: 'Ju 08:31:00 - 09:50:00',
    docente: 'P. GONZALO CASTILLO ROJAS',
    modalidad: 'PRESENCIAL',
  },

  // Deportes y Actividades Físicas Duoc UC
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    plan: '1446114',
    jornada: 'Diurno',
    sigla: 'AJEMS',
    nombre: 'AJEDREZ MIXTO SÁBADO',
    nivel: 'Deportivo',
    seccion: 'AJEMS-001D',
    horario: 'Sa 8:31:00 - 9:50:00',
    docente: 'RICARDO PÉREZ DONOSO',
    modalidad: 'PRESENCIAL',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    plan: '1446114',
    jornada: 'Diurno',
    sigla: 'DEFPL',
    nombre: 'DEFENSA PERSONAL LUNES',
    nivel: 'Deportivo',
    seccion: 'DEFPL-001D',
    horario: 'Lu 14:31:00 - 15:50:00',
    docente: 'HUGO BARRERA CAMPOS',
    modalidad: 'PRESENCIAL',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'INGENIERÍA EN INFORMÁTICA',
    plan: '1446114',
    jornada: 'Diurno',
    sigla: 'FITW',
    nombre: 'FITNESS MIÉRCOLES',
    nivel: 'Deportivo',
    seccion: 'FITW-001D',
    horario: 'Mi 16:01:00 - 17:20:00',
    docente: 'CAMILA PINO ARMIJO',
    modalidad: 'PRESENCIAL',
  },

  // --- ANALISTA PROGRAMADOR COMPUTACIONAL (Plan 1446112) ---
  {
    sede: 'ALAMEDA',
    carrera: 'ANALISTA PROGRAMADOR COMPUTACIONAL',
    plan: '1446112',
    jornada: 'Diurno',
    sigla: 'PGY2121',
    nombre: 'PROGRAMACIÓN ORIENTADA A OBJETOS',
    nivel: 'Semestre 4',
    seccion: 'PGY2121-001D',
    horario: 'Lu 8:31:00 - 11:20:00',
    docente: 'FRANCISCO JAVIER VERGARA',
    modalidad: 'PRESENCIAL',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'ANALISTA PROGRAMADOR COMPUTACIONAL',
    plan: '1446112',
    jornada: 'Diurno',
    sigla: 'BDY2131',
    nombre: 'BASE DE DATOS RELACIONALES',
    nivel: 'Semestre 4',
    seccion: 'BDY2131-001D',
    horario: 'Mi 14:31:00 - 17:20:00',
    docente: 'LILIANA MARGARITA BRAVO',
    modalidad: 'PRESENCIAL',
  },
  {
    sede: 'ALAMEDA',
    carrera: 'ANALISTA PROGRAMADOR COMPUTACIONAL',
    plan: '1446112',
    jornada: 'Diurno',
    sigla: 'MDY2131',
    nombre: 'MODELAMIENTO DE SOFTWARE',
    nivel: 'Semestre 4',
    seccion: 'MDY2131-001D',
    horario: 'Vi 8:31:00 - 11:20:00',
    docente: 'ANDRÉS SILVA PAREDES',
    modalidad: 'PRESENCIAL',
  },
];

// Almacén en memoria fallback (en caso de que MongoDB no esté conectado)
let inMemoryCourses = [];

/**
 * Normaliza y expande una fila sin procesar en una entidad con bloques horarios
 */
function normalizeRowToOffering(row) {
  const sede = (row.sede || 'ALAMEDA').toString().trim().toUpperCase();
  const carrera = (row.carrera || 'INGENIERÍA EN INFORMÁTICA').toString().trim().toUpperCase();
  const plan = (row.plan || '1446114').toString().trim();
  const jornada = (row.jornada || 'Diurno').toString().trim();
  const periodo = (row.periodo || '2026 - 002').toString().trim();
  const sigla = (row.sigla || row['sigla asignatura'] || '').toString().trim().toUpperCase();
  const siglaEq = (row.siglaEq || row['sigla eq'] || '').toString().trim().toUpperCase();
  const nombre = (row.nombre || row['nombre asignatura'] || '').toString().trim().toUpperCase();
  const nivel = (row.nivel || 'Optativos').toString().trim();
  const seccion = (row.seccion || row['sección'] || `${sigla}-001D`).toString().trim().toUpperCase();
  const horarioRaw = (row.horario || row['horario'] || '').toString().trim();
  const docente = (row.docente || 'DOCENTE ASIGNADO').toString().trim().toUpperCase();
  const modalidad = (
    row.modalidad ||
    row['asignatura virtual sincronica'] ||
    'ONLINE SINCRONA'
  )
    .toString()
    .trim()
    .toUpperCase();

  const creditos = Number(row.creditos || (nivel.toLowerCase().includes('deport') ? 0 : 10));
  const sala = modalidad.includes('ONLINE') ? 'ONLINE' : 'AL-LAB';
  const bloques = parseDuocSchedule(horarioRaw, sala);

  return {
    sede,
    carrera,
    plan,
    jornada,
    periodo,
    sigla,
    siglaEq,
    nombre,
    nivel,
    creditos,
    tipo: nivel.toLowerCase().includes('deport') ? 'deportivo' : 'optativo',
    seccion,
    horarioRaw,
    docente,
    modalidad,
    cuposTotales: 30,
    cuposDisponibles: Math.floor(Math.random() * 18) + 2,
    bloques,
  };
}

/**
 * Agrupa una lista de ofertas planas (secciones) en la estructura jerárquica esperada por el Simulador SAP
 */
function groupOfferingsIntoCourses(offerings) {
  const map = new Map();

  for (const item of offerings) {
    if (!item.sigla || !item.nombre) continue;

    if (!map.has(item.sigla)) {
      map.set(item.sigla, {
        sigla: item.sigla,
        siglaEq: item.siglaEq || '',
        nombre: item.nombre,
        creditos: item.creditos,
        tipo: item.tipo || 'optativo',
        nivel: item.nivel,
        carrera: item.carrera,
        plan: item.plan,
        periodo: item.periodo,
        secciones: [],
      });
    }

    const course = map.get(item.sigla);
    const existingSec = course.secciones.find((s) => s.seccion === item.seccion);

    if (existingSec) {
      // Combinar bloques adicionales si la sección aparece en varias filas (ej. Lunes y Viernes)
      for (const blk of item.bloques || []) {
        if (!existingSec.bloques.some((b) => b.dia === blk.dia && b.bloqueId === blk.bloqueId)) {
          existingSec.bloques.push(blk);
        }
      }
    } else {
      course.secciones.push({
        seccion: item.seccion,
        cuposTotales: item.cuposTotales || 30,
        cuposDisponibles: item.cuposDisponibles ?? 12,
        sala: item.modalidad || 'ONLINE SINCRONA',
        profesor: item.docente || 'Docente Duoc UC',
        horarioTexto: item.horarioRaw || 'Por definir',
        bloques: item.bloques || [],
      });
    }
  }

  return Array.from(map.values());
}

/**
 * Servicio Central de Asignaturas y Oferta Académica
 */
const courseService = {
  /**
   * Inicializa la base de datos o almacén en memoria con las filas semilla oficiales
   * Carga prioritariamente el catálogo Alameda 2026 completo (7,174 ofertas)
   */
  async seedInitialCourses({ force = false } = {}) {
    try {
      const seedItems = Array.isArray(alamedaSeedData) && alamedaSeedData.length > 0
        ? alamedaSeedData
        : SEED_ROWS_RAW.map(normalizeRowToOffering);

      inMemoryCourses = [...seedItems];

      if (mongoose.connection.readyState === 1) {
        const count = await CourseOffering.countDocuments();
        if (count === 0 || force) {
          if (force) {
            await CourseOffering.deleteMany({});
          }
          // Inserción en bloques de 1000 para optimizar rendimiento y memoria BSON
          for (let i = 0; i < seedItems.length; i += 1000) {
            const chunk = seedItems.slice(i, i + 1000);
            await CourseOffering.insertMany(chunk, { ordered: false });
          }
          console.log(`[courseService] Sembradas ${seedItems.length} secciones oficiales de Alameda 2026 en MongoDB`);
        }
      }
      return {
        success: true,
        count: inMemoryCourses.length,
        source: alamedaSeedData ? 'ALAMEDA_2026_OFFICIAL_CATALOG' : 'SEED_ROWS_RAW',
      };
    } catch (err) {
      console.warn('[courseService] Advertencia sembrando en BD:', err.message);
      return { success: true, count: inMemoryCourses.length, warning: err.message };
    }
  },

  /**
   * Retorna todas las carreras disponibles con conteos
   */
  async getCareersSummary() {
    let all = inMemoryCourses;
    if (mongoose.connection.readyState === 1) {
      try {
        all = await CourseOffering.find({}).lean();
      } catch (e) {
        // Fallback a inMemory
      }
    }

    const careerMap = new Map();
    for (const item of all) {
      const key = item.carrera;
      if (!careerMap.has(key)) {
        careerMap.set(key, {
          carrera: item.carrera,
          plan: item.plan,
          sede: item.sede,
          periodo: item.periodo,
          totalSecciones: 0,
          asignaturasUnicas: new Set(),
        });
      }
      const data = careerMap.get(key);
      data.totalSecciones++;
      data.asignaturasUnicas.add(item.sigla);
    }

    return Array.from(careerMap.values()).map((c) => ({
      carrera: c.carrera,
      plan: c.plan,
      sede: c.sede,
      periodo: c.periodo,
      totalSecciones: c.totalSecciones,
      totalAsignaturas: c.asignaturasUnicas.size,
    }));
  },

  /**
   * Obtiene la lista de asignaturas para el simulador
   * Si random=true, baraja y selecciona un subconjunto dinámico (5 a 8) de la carrera
   */
  async getCoursesForSimulation({ carrera, periodo = '2026 - 002', jornada, random = false, limit = 8 }) {
    let items = inMemoryCourses;

    if (mongoose.connection.readyState === 1) {
      try {
        const query = {};
        if (carrera) query.carrera = new RegExp(carrera.trim(), 'i');
        if (periodo) query.periodo = periodo;
        if (jornada) query.jornada = new RegExp(jornada.trim(), 'i');
        items = await CourseOffering.find(query).lean();
      } catch (e) {
        // fallback
      }
    }

    if (carrera) {
      items = items.filter((it) => it.carrera.toLowerCase().includes(carrera.toLowerCase()));
    }

    // Agrupar en cursos
    let grouped = groupOfferingsIntoCourses(items);

    if (grouped.length === 0) {
      // Fallback a todos los ramos en memoria si la carrera no tiene asignaturas cargadas aún
      grouped = groupOfferingsIntoCourses(inMemoryCourses);
    }

    if (random && grouped.length > 0) {
      // Barajar cursos con algoritmo Fisher-Yates
      const shuffled = [...grouped];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // Asegurar que haya entre 5 y 8 ramos
      const takeCount = Math.min(Math.max(limit, 6), shuffled.length);
      grouped = shuffled.slice(0, takeCount);

      // En el simulador oficial SAP, marcar 1 ramo al azar como ya inscrito para realismo
      if (grouped.length > 0) {
        grouped = grouped.map((g, idx) => ({
          ...g,
          yaInscrito: idx === 0,
          seccionInscrita: idx === 0 && g.secciones[0] ? g.secciones[0].seccion : undefined,
        }));
      }
    }

    return grouped;
  },

  /**
   * Importación masiva desde datos parseados de Excel (.xlsx / .csv), Markdown (.md) o JSON
   * Soporta payloads con { rows, markdown, md, base64, buffer, replace: true }
   */
  async bulkImport(input, { replace = false, periodo = '2026 - 002' } = {}) {
    let rowsToProcess = [];
    let sourceFormat = 'JSON';

    if (Array.isArray(input)) {
      rowsToProcess = input;
    } else if (typeof input === 'string') {
      const trimmed = input.trim();
      if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmed);
          rowsToProcess = Array.isArray(parsed) ? parsed : (parsed.rows || []);
        } catch {
          const mdRes = excelParserService.parseMarkdownTable(trimmed, { periodo });
          rowsToProcess = mdRes.offerings;
          sourceFormat = 'MARKDOWN';
        }
      } else {
        const mdRes = excelParserService.parseMarkdownTable(trimmed, { periodo });
        rowsToProcess = mdRes.offerings;
        sourceFormat = 'MARKDOWN';
      }
    } else if (Buffer.isBuffer(input)) {
      const uploadRes = await excelParserService.processCatalogUpload({
        buffer: input,
        filename: 'upload.xlsx',
        replace: false,
        periodo,
      });
      rowsToProcess = uploadRes.offerings;
      sourceFormat = 'XLSX';
    } else if (input && typeof input === 'object') {
      if (input.markdown || input.md || input.textContent) {
        const mdText = input.markdown || input.md || input.textContent;
        const mdRes = excelParserService.parseMarkdownTable(mdText, { periodo: input.periodo || periodo });
        rowsToProcess = mdRes.offerings;
        sourceFormat = 'MARKDOWN';
      } else if (input.base64 || input.fileBase64) {
        const buf = Buffer.from(input.base64 || input.fileBase64, 'base64');
        const filename = input.filename || 'upload.xlsx';
        const uploadRes = await excelParserService.processCatalogUpload({
          buffer: buf,
          filename,
          replace: false,
          periodo: input.periodo || periodo,
        });
        rowsToProcess = uploadRes.offerings;
        sourceFormat = filename.endsWith('.md') ? 'MARKDOWN' : 'XLSX';
      } else if (Array.isArray(input.rows)) {
        rowsToProcess = input.rows;
      }
      if (input.replace !== undefined) {
        replace = Boolean(input.replace);
      }
      if (input.periodo) {
        periodo = input.periodo;
      }
    }

    if (!Array.isArray(rowsToProcess) || rowsToProcess.length === 0) {
      throw new Error('No se recibieron filas válidas para importar.');
    }

    const normalized = rowsToProcess
      .map((r) => excelParserService.normalizeRow(r, periodo))
      .filter((r) => r.sigla && r.nombre);

    if (normalized.length === 0) {
      throw new Error('Ninguna fila contiene sigla y nombre de asignatura válidos.');
    }

    if (replace) {
      inMemoryCourses = [...normalized];
    } else {
      inMemoryCourses = [...inMemoryCourses, ...normalized];
    }

    if (mongoose.connection.readyState === 1) {
      try {
        if (replace) {
          // Limpia asignaturas del período (o todo) para evitar duplicados entre años
          await CourseOffering.deleteMany({ periodo });
        }
        for (let i = 0; i < normalized.length; i += 1000) {
          const chunk = normalized.slice(i, i + 1000);
          await CourseOffering.insertMany(chunk, { ordered: false });
        }
      } catch (err) {
        console.warn('[courseService] Advertencia al persistir en MongoDB:', err.message);
      }
    }

    const uniqueSiglas = new Set(normalized.map((n) => n.sigla));
    const uniqueCarreras = new Set(normalized.map((n) => n.carrera));

    return {
      success: true,
      sourceFormat,
      totalFilas: rowsToProcess.length,
      seccionesImportadas: normalized.length,
      asignaturasUnicas: uniqueSiglas.size,
      carrerasDetectadas: Array.from(uniqueCarreras),
      periodo,
      reemplazado: replace,
    };
  },

  /**
   * Genera una representación en formato Markdown (.md) de los cursos disponibles
   */
  async exportToMarkdown({ carrera, periodo = '2026 - 002' } = {}) {
    let items = inMemoryCourses;
    if (mongoose.connection.readyState === 1) {
      try {
        const q = {};
        if (carrera) q.carrera = new RegExp(carrera.trim(), 'i');
        if (periodo) q.periodo = periodo;
        items = await CourseOffering.find(q).lean();
      } catch (e) {}
    }
    if (carrera) {
      items = items.filter((it) => it.carrera.toLowerCase().includes(carrera.toLowerCase()));
    }
    const headers = [
      'Sede',
      'Carrera',
      'Plan',
      'Jornada',
      'Sigla Asignatura',
      'Nombre Asignatura',
      'Nivel',
      'Sección',
      'Horario',
      'Docente',
      'Modalidad',
    ];
    const headerRow = `| ${headers.map((h) => `**${h}**`).join(' | ')} |`;
    const alignRow = `| ${headers.map(() => ':-:').join(' | ')} |`;
    const dataRows = items.map(
      (it) =>
        `| ${it.sede || 'ALAMEDA'} | ${it.carrera || ''} | ${it.plan || ''} | ${it.jornada || ''} | ${it.sigla || ''} | ${it.nombre || ''} | ${it.nivel || ''} | ${it.seccion || ''} | ${it.horarioRaw || ''} | ${it.docente || ''} | ${it.modalidad || ''} |`
    );
    return [headerRow, alignRow, ...dataRows].join('\n');
  },

  /**
   * Limpia o reinicia las asignaturas registradas
   */
  async clearAll() {
    inMemoryCourses = [];
    if (mongoose.connection.readyState === 1) {
      await CourseOffering.deleteMany({});
    }
    return { success: true };
  },

  parseDuocSchedule,
};

// Inicializar semilla al cargar el módulo
courseService.seedInitialCourses().catch((err) => {
  console.warn('[courseService] Falló inicialización inicial de cursos:', err.message);
});

module.exports = courseService;
