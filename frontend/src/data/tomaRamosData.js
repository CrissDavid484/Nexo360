/**
 * Datos estructurados para el Simulador Oficial de Toma de Ramos Duoc UC - Sede Alameda (SAP WebDynpro SICOL)
 * Fiel a las pantallas de inscripción de asignaturas:
 * https://portalinsc.duoc.cl/webdynpro/dispatcher/duoc.com.student/sicol/StudentSicol?inportal=xi
 * y a los videos tutoriales oficiales de Duoc UC:
 * - Toma de Ramos: https://www.youtube.com/watch?v=2vwT2RCj3FA
 * - Modificación de Asignaturas: https://www.youtube.com/watch?v=TjOySUq7F3w&t=13s
 */

import infrastructureCatalog from './infrastructureCatalog.json' with { type: 'json' };

export const PORTAL_INSC_URL =
  'https://portalinsc.duoc.cl/webdynpro/dispatcher/duoc.com.student/sicol/StudentSicol?inportal=xi';

export const TOMA_RAMOS_TUTORIAL_VIDEO = {
  videoId: '2vwT2RCj3FA',
  url: 'https://www.youtube.com/watch?v=2vwT2RCj3FA',
  embedUrl: 'https://www.youtube-nocookie.com/embed/2vwT2RCj3FA?rel=0',
  title: 'Inscripción de Asignaturas (Toma de Ramos Oficial Duoc UC)',
  duracion: '3:49 min',
  canal: 'Duoc UC Institucional',
  modificacionVideo: {
    videoId: 'TjOySUq7F3w',
    url: 'https://www.youtube.com/watch?v=TjOySUq7F3w&t=13s',
    embedUrl: 'https://www.youtube-nocookie.com/embed/TjOySUq7F3w?start=13&rel=0',
    title: 'Modificación de Asignaturas Duoc UC',
    duracion: '1:50 min',
  },
  pasosClave: [
    {
      paso: '1. Ingreso y "Haz Click Para Continuar >>"',
      tiempo: '0:25',
      descripcion:
        'Inicia sesión con tu usuario y clave institucional en portalinsc.duoc.cl, verifica tu nombre, RUT, carrera y créditos, y pulsa "Haz Click Para Continuar >>".',
    },
    {
      paso: '2. Seleccionar Asignatura ("Selecciona Opción")',
      tiempo: '0:50',
      descripcion:
        'En la tabla izquierda, haz clic en el ícono de la primera columna (cubo con mano) de la asignatura que deseas inscribir o modificar.',
    },
    {
      paso: '3. Elegir Sección y Verificar Cupos',
      tiempo: '1:15',
      descripcion:
        'Revisa las secciones disponibles, cupos, sala, profesor y horario. Haz clic en el ícono de la primera columna ("Agregar sección a Cursos seleccionados") verificando que no tengas tope horario.',
    },
    {
      paso: '4. Revisar Horario y Cursos Seleccionados',
      tiempo: '1:40',
      descripcion:
        'Comprueba el mensaje verde "Se ha seleccionado la sección \'...\' para inscribir" y verifica que el ramo aparezca en la grilla Horario y en Cursos seleccionados (en modo Modificación puedes eliminar un ramo inscrito con el ícono de documento con X roja en la segunda columna).',
    },
    {
      paso: '5. Avanzar con "Siguiente ▶" a la Malla Alumno',
      tiempo: '2:00',
      descripcion:
        'Una vez elegidos todos tus ramos, presiona "Siguiente ▶" para revisar el resumen en tu Malla Alumno (con tus ramos inscritos resaltados en amarillo) junto a tu horario proyectado.',
    },
    {
      paso: '6. Presionar "Inscribir", "Aceptar" y "Ver Horario"',
      tiempo: '2:16',
      descripcion:
        'Haz clic en "Inscribir", pulsa "Aceptar" en la ventana emergente de Información, y cuando aparezca "Se ha realizado la Inscripción de asignaturas.", presiona "Ver Horario" para imprimir o descargar tu Boletín Oficial.',
    },
  ],
};

export const TOMA_RAMOS_ESTUDIANTE = {
  nombre: 'CRISTIAN GUZMAN GARCIA',
  nombreBoletin: 'GUZMAN, CRISTIAN DAVID',
  rut: '219876543',
  rutFormateado: '21.987.654-3',
  periodo: '2026 - 002',
  codigoCarrera: '1446114',
  carrera: 'INGENIERÍA EN INFORMÁTICA',
  sede: 'ALAMEDA',
  numeroSede: '10',
  jornada: 'DIURNO',
  creditosTotalesCurriculum: 418,
  creditosInscritosAprobados: 378,
  creditosTotalesOptativos: 28,
  creditosAprobadosOptativosInterdisciplinarios: 4,
  creditosAprobadosOptativosFormacionCristiana: 0,
  creditosAprobadosOptativosProfundizacion: 0,
  creditosAprobadosOptativos: 28,
};

const BASE_CAREER_DEFAULTS = {
  escuela: 'Escuela de Informática y Telecomunicaciones',
  sede: 'ALAMEDA',
  jornada: 'Diurno',
  periodo: '2026 - 002',
  creditosTotalesCurriculum: 418,
  creditosTotalesOptativos: 28,
  creditosAprobadosOptativos: 28,
  creditosAprobadosOptativosInterdisciplinarios: 4,
  creditosAprobadosOptativosFormacionCristiana: 0,
  creditosAprobadosOptativosProfundizacion: 0,
};

const CAREER_DEFINITIONS = [
  {
    codigo: '1446815',
    nombre: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    nombreCorto: 'Ing. en Infraestructura Tecnológica',
    creditosInscritosAprobados: 350,
  },
  {
    codigo: '1446814',
    nombre: 'ING. EN INFRAEST. Y PLATAFORMAS TECN.',
    nombreCorto: 'Ing. en Infraest. y Plataformas Tecn.',
    creditosInscritosAprobados: 340,
  },
  {
    codigo: '1446114',
    nombre: 'INGENIERÍA EN INFORMÁTICA',
    nombreCorto: 'Ingeniería en Informática',
    creditosInscritosAprobados: 378,
  },
  {
    codigo: '1446112',
    nombre: 'ANALISTA PROGRAMADOR COMPUTACIONAL',
    nombreCorto: 'Analista Programador',
    creditosTotalesCurriculum: 250,
    creditosInscritosAprobados: 190,
    creditosTotalesOptativos: 16,
    creditosAprobadosOptativos: 16,
    creditosAprobadosOptativosInterdisciplinarios: 0,
  },
];

export const CARRERAS_DUOC = CAREER_DEFINITIONS.map((def) => ({
  ...BASE_CAREER_DEFAULTS,
  ...def,
}));

const BLOQUE_RANGES =
  'b1,08:31,09:10|b2,09:11,09:50|b3,10:01,10:40|b4,10:41,11:20|b5,11:31,12:10|b6,12:11,12:50|b7,13:01,13:40|b8,14:31,15:10|b9,15:11,15:50|b10,16:01,16:40|b11,16:41,17:20|b12,17:31,18:10|b13,18:11,18:50|b14,19:01,19:40|b15,19:41,20:20|b16,20:31,21:10|b17,21:11,21:50'
    .split('|')
    .map((row) => row.split(','));

export const BLOQUES_HORARIOS_TOMA = BLOQUE_RANGES.map(([id, start, end]) => ({
  id,
  hora: `${start} - ${end}`,
  labelPdf: `${start} A ${end}`,
}));

const dayBlocks = (dia, bloqueIds, salaCorta) =>
  bloqueIds.map((bloqueId) => ({ dia, bloqueId, salaCorta }));

const createSection = (
  seccion,
  cuposTotales,
  cuposDisponibles,
  sala,
  profesor,
  horarioTexto,
  bloques = [],
  extra = {}
) => ({
  seccion,
  cuposTotales,
  cuposDisponibles,
  sala,
  profesor,
  horarioTexto,
  bloques,
  ...extra,
});

const createCourse = (sigla, nombre, creditos, tipo, secciones, extra = {}) => ({
  sigla,
  siglaEq: '',
  nombre,
  creditos,
  tipo,
  ...extra,
  secciones,
});

const createOptativoSport = (
  sigla,
  nombre,
  cuposTotales,
  cuposDisponibles,
  sala,
  profesor,
  horarioTexto,
  bloques = [],
  sinCupos = false
) =>
  createCourse(sigla, nombre, 0, 'optativo', [
    createSection(
      '001D',
      cuposTotales,
      cuposDisponibles,
      sala,
      profesor,
      horarioTexto,
      bloques,
      sinCupos ? { sinCupos: true } : {}
    ),
  ]);

export const ASIGNATURAS_DISPONIBLES = [
  createCourse(
    'PTY4614',
    'PROYECTO CAPSTONE',
    10,
    'obligatorio',
    [
      createSection(
        '001D',
        30,
        12,
        'AL-503A / AL-LAB-IP4',
        'Mauricio Gómez Arratia',
        'Mié 08:31-09:50, Vie 08:31-10:40',
        [
          ...dayBlocks('Miércoles', ['b1', 'b2'], 'AL-503A'),
          ...dayBlocks('Viernes', ['b1', 'b2', 'b3'], 'AL-LAB-IP4'),
        ]
      ),
    ],
    { yaInscrito: true, seccionInscrita: '001D' }
  ),
  createCourse('ASY4131', 'ARQUITECTURA DE SOFTWARE', 10, 'obligatorio', [
    createSection(
      '001D',
      30,
      14,
      'Laboratorio de Software IP2',
      'Andrés Silva Paredes',
      'Jueves 14:31 - 15:50',
      dayBlocks('Jueves', ['b8', 'b9'], 'AL-LAB-IP2')
    ),
    createSection(
      '002D',
      30,
      8,
      'Laboratorio de Software IP1',
      'Claudio Vergara Soto',
      'Miércoles 08:31 - 09:50 (Tope potencial con Capstone)',
      dayBlocks('Miércoles', ['b1', 'b2'], 'AL-LAB-IP1')
    ),
    createSection(
      '003D',
      28,
      11,
      'Laboratorio Redes IP3',
      'Carolina Muñoz R.',
      'Viernes 11:31 - 12:50',
      dayBlocks('Viernes', ['b5', 'b6'], 'AL-LAB-IP3')
    ),
    createSection(
      '004V',
      30,
      14,
      'Laboratorio de Software IP2',
      'Andrés Silva Paredes',
      'Lunes 19:01 - 20:20 (Vespertino)',
      dayBlocks('Lunes', ['b14', 'b15'], 'AL-LAB-IP2')
    ),
  ]),
  createCourse('GPI4121', 'GESTIÓN DE PROYECTOS ÁGILES', 10, 'obligatorio', [
    createSection(
      '001D',
      28,
      9,
      'Sala 402 Alameda',
      'Lorena Castillo V.',
      'Lunes 11:31 - 12:50',
      dayBlocks('Lunes', ['b5', 'b6'], 'AL-402')
    ),
    createSection(
      '002D',
      30,
      15,
      'Sala 305 Alameda',
      'Rodrigo Fuentes M.',
      'Martes 10:01 - 11:20',
      dayBlocks('Martes', ['b3', 'b4'], 'AL-305')
    ),
    createSection(
      '003D',
      30,
      0,
      'Sala 401 Alameda',
      'Esteban Morales P.',
      'Lunes 08:31 - 09:50',
      [],
      { sinCupos: true }
    ),
    createSection(
      '004V',
      30,
      12,
      'Sala 402 Alameda',
      'Lorena Castillo V.',
      'Martes 19:01 - 20:20 (Vespertino)',
      dayBlocks('Martes', ['b14', 'b15'], 'AL-402')
    ),
  ]),
  createCourse('CAL4101', 'CALIDAD Y TESTING DE SOFTWARE', 8, 'obligatorio', [
    createSection(
      '001D',
      26,
      10,
      'Laboratorio QA AL-LAB-4',
      'Gabriel Arancibia N.',
      'Martes 08:31 - 09:50',
      dayBlocks('Martes', ['b1', 'b2'], 'AL-LAB-QA')
    ),
    createSection(
      '002D',
      26,
      12,
      'Laboratorio QA AL-LAB-4',
      'Felipe Sandoval G.',
      'Jueves 10:01 - 11:20',
      dayBlocks('Jueves', ['b3', 'b4'], 'AL-LAB-QA')
    ),
    createSection(
      '003V',
      28,
      10,
      'Laboratorio QA AL-LAB-4',
      'Gabriel Arancibia N.',
      'Miércoles 19:01 - 20:20 (Vespertino)',
      dayBlocks('Miércoles', ['b14', 'b15'], 'AL-LAB-QA')
    ),
  ]),
  createCourse('SEG4102', 'SEGURIDAD EN APLICACIONES Y REDES', 8, 'obligatorio', [
    createSection(
      '001D',
      30,
      16,
      'Laboratorio Ciberseguridad IP5',
      'Hernán Carrasco D.',
      'Lunes 14:31 - 15:50',
      dayBlocks('Lunes', ['b8', 'b9'], 'AL-LAB-CS')
    ),
    createSection(
      '002D',
      28,
      7,
      'Laboratorio Ciberseguridad IP5',
      'Viviana Orellana T.',
      'Miércoles 14:31 - 15:50',
      dayBlocks('Miércoles', ['b8', 'b9'], 'AL-LAB-CS')
    ),
    createSection(
      '003V',
      30,
      15,
      'Laboratorio Ciberseguridad IP5',
      'Hernán Carrasco D.',
      'Jueves 19:01 - 20:20 (Vespertino)',
      dayBlocks('Jueves', ['b14', 'b15'], 'AL-LAB-CS')
    ),
  ]),
  createCourse('FCG4101', 'ÉTICA PROFESIONAL', 6, 'formacionCristiana', [
    createSection(
      '001D',
      35,
      18,
      'Auditorio A-201 Alameda',
      'Padre Marcelo Reyes C.',
      'Martes 14:31 - 15:50',
      dayBlocks('Martes', ['b8', 'b9'], 'AL-AUD-2')
    ),
    createSection(
      '002D',
      35,
      22,
      'Sala 501 Alameda',
      'Mónica Henríquez B.',
      'Jueves 08:31 - 09:50',
      dayBlocks('Jueves', ['b1', 'b2'], 'AL-501')
    ),
  ]),
  createCourse('AJEMS', 'AJEDREZ MIXTO SÁBADO', 0, 'optativo', [
    createSection(
      '001D',
      30,
      15,
      'S-204 Alameda',
      'Carlos Riquelme Bravo',
      'Sábado 08:31 - 10:40',
      dayBlocks('Sábado', ['b1', 'b2', 'b3'], 'AL-204')
    ),
    createSection(
      '002D',
      30,
      0,
      'S-205 Alameda',
      'Jorge Valenzuela',
      'Sábado 10:41 - 12:50',
      [],
      { sinCupos: true }
    ),
  ]),
  createOptativoSport(
    'FITW',
    'FITNESS MIERCOLES',
    25,
    8,
    'Gimnasio Alameda',
    'Valeria Soto M.',
    'Miércoles 11:31 - 12:50',
    dayBlocks('Miércoles', ['b5', 'b6'], 'GIM-ALM')
  ),
  createOptativoSport(
    'BASDW',
    'BASQUETBOL DAMA MIERCOLES',
    20,
    6,
    'Multicancha Alameda',
    'Patricia Fuentes',
    'Miércoles 13:01 - 14:30',
    dayBlocks('Miércoles', ['b7'], 'CANCHA-1')
  ),
  createOptativoSport(
    'DEFPL',
    'DEFENSA PERSONAL LUNES',
    25,
    10,
    'Sala Multiuso Alameda',
    'Rodrigo Morales',
    'Lunes 10:01 - 11:20',
    dayBlocks('Lunes', ['b3', 'b4'], 'MULTIUSO')
  ),
  createOptativoSport(
    'FUTVJ',
    'FUTBOL VARON JUEVES',
    22,
    5,
    'Cancha Central Alameda',
    'Esteban Paredes Q.',
    'Jueves 11:31 - 12:50',
    dayBlocks('Jueves', ['b5', 'b6'], 'CANCHA-C')
  ),
  createOptativoSport(
    'KARAS',
    'KARATE SABADO',
    20,
    0,
    'Dojo Alameda',
    'Takeshi Miyagi',
    'Sábado 11:31 - 13:40',
    [],
    true
  ),
];

const DAY_PREFIXES = ['lu', 'ma', 'mi', 'ju', 'vi', 'sa', 'do'];
const DAY_LABELS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

const resolveScheduleDay = (rawDay) => {
  const normalized = (rawDay || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .slice(0, 2);
  const idx = DAY_PREFIXES.indexOf(normalized);
  return idx >= 0 ? DAY_LABELS[idx] : 'Lunes';
};

const toMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Parsea un horario de Duoc UC a bloques horarios de la cuadrícula
 */
export function parseDuocSchedule(scheduleStr, sala = 'ONLINE') {
  if (!scheduleStr || typeof scheduleStr !== 'string') return [];

  const match = scheduleStr
    .trim()
    .match(/^([a-zA-ZáéíóúÁÉÍÓÚ]+)\s*(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(\d{1,2}:\d{2}(?::\d{2})?)/);

  if (!match) return [];

  const day = resolveScheduleDay(match[1]);
  const startMin = toMinutes(match[2]);
  const endMin = toMinutes(match[3]);
  const targetSala = sala || 'ONLINE';

  const matched = [];
  for (const blk of BLOQUES_HORARIOS_TOMA) {
    const [hIni, hFin] = blk.hora.split(' - ');
    if (Math.max(startMin, toMinutes(hIni)) < Math.min(endMin, toMinutes(hFin))) {
      matched.push({ dia: day, bloqueId: blk.id, salaCorta: targetSala });
    }
  }

  if (matched.length === 0) {
    const fallbackId = startMin < 12 * 60 ? 'b1' : startMin < 17 * 60 ? 'b8' : 'b12';
    matched.push({ dia: day, bloqueId: fallbackId, salaCorta: targetSala });
  }

  return matched;
}

/**
 * Catálogo completo de asignaturas por carrera para generación aleatoria
 */
export const CATALOGO_INFRAESTRUCTURA_TECNOLOGICA = infrastructureCatalog;

/**
 * Plantillas Institucionales para Prácticas y Portafolio Duoc UC - Sede Alameda
 */
const createPracticaCourse = ({
  sigla,
  nombre,
  subtipo,
  cuposDisponibles,
  sala,
  profesor,
  horarioTexto,
  tipoDetalle,
  centroPractica,
  supervisor,
  horas,
  periodo,
}) =>
  createCourse(
    sigla,
    nombre,
    0,
    'practica',
    [
      createSection('001D', 60, cuposDisponibles, sala, profesor, horarioTexto, [], {
        detallePractica: {
          tipo: tipoDetalle,
          centroPractica,
          supervisor,
          horas,
          periodo,
        },
      }),
    ],
    { subtipo }
  );

export const PRACTICA_LABORAL_COURSE = createPracticaCourse({
  sigla: 'PRL3100',
  nombre: 'PRÁCTICA LABORAL',
  subtipo: 'laboral',
  cuposDisponibles: 35,
  sala: 'CENTRO DE PRÁCTICA',
  profesor: 'COORDINACIÓN DE PRÁCTICAS DUOC UC',
  horarioTexto: 'Supervisión en terreno (360 hrs)',
  tipoDetalle: 'Práctica Laboral',
  centroPractica: 'Empresa TI en Convenio • Duoc UC - Sede Alameda',
  supervisor: 'Coordinador de Prácticas Laborales Escuela Informática',
  horas: '360 horas cronológicas',
  periodo: 'Primer y Segundo Semestre 2026',
});

export const PRACTICA_PROFESIONAL_COURSE = createPracticaCourse({
  sigla: 'PPR4100',
  nombre: 'PRÁCTICA PROFESIONAL',
  subtipo: 'profesional',
  cuposDisponibles: 40,
  sala: 'EMPRESA / EN TERRENO',
  profesor: 'DIRECCIÓN DE CARRERA Y EMPRESA',
  horarioTexto: 'Supervisión profesional (480 hrs)',
  tipoDetalle: 'Práctica Profesional',
  centroPractica: 'Entidad Empleadora TI / En Terreno',
  supervisor: 'Comité de Titulación y Supervisor Institucional',
  horas: '480 horas cronológicas',
  periodo: 'Semestre de Egreso 2026',
});

export const PORTAFOLIO_TITULO_COURSE = createCourse('PTF6101', 'PORTAFOLIO DE TÍTULO', 10, 'portafolio', [
  createSection(
    '001D',
    30,
    18,
    'AL-503A',
    'Mauricio Gómez Arratia',
    'Mi 08:31 - 09:50 / Vi 08:31 - 10:40',
    [
      ...dayBlocks('Miércoles', ['b1'], 'AL-503A'),
      ...dayBlocks('Viernes', ['b1'], 'AL-LAB-IP4'),
    ],
    {
      clasesPortafolio: [
        { nro: 'Clase 01', fecha: 'Miércoles 04 de Marzo de 2026', horario: '08:31 a 09:50', sala: 'AL-503A' },
        { nro: 'Clase 02', fecha: 'Viernes 06 de Marzo de 2026', horario: '08:31 a 10:40', sala: 'AL-LAB-IP4' },
        { nro: 'Clase 03', fecha: 'Miércoles 11 de Marzo de 2026', horario: '08:31 a 09:50', sala: 'AL-503A' },
        { nro: 'Clase 04', fecha: 'Viernes 13 de Marzo de 2026', horario: '08:31 a 10:40', sala: 'AL-LAB-IP4' },
      ],
    }
  ),
]);

/**
 * 4 Niveles de Dificultad para el Simulador
 */
export const DIFFICULTY_LEVELS = [
  {
    id: 'facil',
    name: 'Fácil',
    regularCount: 3,
    totalTargetCount: 3,
    hasPracticaLaboral: false,
    hasPracticaProfesional: false,
    description: '3 asignaturas regulares. Ideal para familiarizarse con la plataforma.',
    badge: '3 Ramos',
    color: 'emerald',
    multiplier: 1.0,
  },
  {
    id: 'intermedio',
    name: 'Intermedio',
    regularCount: 4,
    totalTargetCount: 5,
    hasPracticaLaboral: true,
    hasPracticaProfesional: false,
    description: '4 asignaturas regulares + Práctica Laboral. Carga estándar.',
    badge: '4 Ramos + Práctica Laboral',
    color: 'blue',
    multiplier: 1.25,
  },
  {
    id: 'dificil',
    name: 'Difícil',
    regularCount: 8,
    totalTargetCount: 8,
    hasPracticaLaboral: false,
    hasPracticaProfesional: false,
    description: '8 asignaturas regulares. Desafío de coordinación horaria completa sin topes.',
    badge: '8 Ramos',
    color: 'amber',
    multiplier: 1.75,
  },
  {
    id: 'muy-dificil',
    name: 'Muy Difícil',
    regularCount: 8,
    totalTargetCount: 10,
    hasPracticaLaboral: true,
    hasPracticaProfesional: true,
    description: '8 asignaturas regulares + Práctica Laboral + Práctica Profesional. Máxima complejidad académica.',
    badge: '8 Ramos + 2 Prácticas',
    color: 'rose',
    multiplier: 2.5,
  },
];

/**
 * Retorna el título dinámico del Boletín de Carga Académica oficial
 * Mar - 15 Jul: 1er Sem. / 16 Jul - 21 Dic: 2do Sem.
 */
export function getBoletinSemesterTitle(date = new Date()) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = date.getFullYear();

  const isSecondSemester =
    (month === 7 && day >= 16) ||
    (month > 7 && month < 12) ||
    (month === 12 && day <= 21);
  const semester = isSecondSemester ? '2do Sem.' : '1er Sem.';

  return `BOLETIN DE CARGA ACADEMICA ${semester}    ${year}`;
}

/**
 * Formatea el nombre del alumno para el boletín en formato oficial: APELLIDO, NOMBRE
 */
export function formatStudentNameForBoletin(fullName) {
  if (!fullName) return 'GUZMAN, CRISTIAN';
  const parts = fullName.trim().toUpperCase().split(/\s+/);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[1]}, ${parts[0]}`;
  if (parts.length === 3) return `${parts[1]} ${parts[2]}, ${parts[0]}`;
  return `${parts.slice(2).join(' ')}, ${parts.slice(0, 2).join(' ')}`;
}

/**
 * Anexa prácticas institucionales a una lista de asignaturas según nivel de dificultad.
 */
export function appendDifficultyPracticas(coursesList, difficulty) {
  const result = [...coursesList];
  if (difficulty === 'intermedio' || difficulty === 'muy-dificil') {
    if (!result.some((c) => c.sigla === PRACTICA_LABORAL_COURSE.sigla)) {
      result.push(PRACTICA_LABORAL_COURSE);
    }
  }
  if (difficulty === 'muy-dificil') {
    if (!result.some((c) => c.sigla === PRACTICA_PROFESIONAL_COURSE.sigla)) {
      result.push(PRACTICA_PROFESIONAL_COURSE);
    }
  }
  return result;
}

/**
 * Función que retorna asignaturas aleatorias según la carrera elegida y nivel de dificultad
 */
export function getRandomCoursesForCareer(carreraNombre, limit = 7, difficulty = 'facil') {
  const norm = (carreraNombre || '').toLowerCase();
  const isInformatica = norm.includes('informática') || norm.includes('informatica');
  const pool = isInformatica
    ? [...ASIGNATURAS_DISPONIBLES, ...CATALOGO_INFRAESTRUCTURA_TECNOLOGICA]
    : [...CATALOGO_INFRAESTRUCTURA_TECNOLOGICA, ...ASIGNATURAS_DISPONIBLES];

  if (!pool.some((c) => c.sigla === PORTAFOLIO_TITULO_COURSE.sigla)) {
    pool.unshift(PORTAFOLIO_TITULO_COURSE);
  }

  let effectiveLimit = limit;
  if (difficulty === 'dificil' || difficulty === 'muy-dificil') {
    effectiveLimit = Math.max(limit, 16);
  } else if (difficulty === 'intermedio') {
    effectiveLimit = Math.max(limit, 10);
  }

  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, Math.min(effectiveLimit, shuffled.length)).map((item, idx) => ({
    ...item,
    yaInscrito: idx === 0,
    seccionInscrita: idx === 0 && item.secciones[0] ? item.secciones[0].seccion : undefined,
  }));

  return appendDifficultyPracticas(selected, difficulty);
}

const hasBlockConflict = (bloques, occupiedSlots) =>
  (bloques || []).some((b) => occupiedSlots.has(`${b.dia}-${b.bloqueId}`));

const addCourseSectionToPackage = (selected, occupiedSlots, course, sec) => {
  selected.push({
    sigla: course.sigla,
    nombre: course.nombre,
    creditos: course.creditos,
    tipo: course.tipo || 'obligatorio',
    seccion: sec.seccion,
    profesor: sec.profesor || 'Docente Asignado Duoc UC',
    sala: sec.sala || 'Sede Alameda',
    horarioTexto: sec.horarioTexto || 'Horario coordinado',
    bloques: sec.bloques || [],
    clasesPortafolio: sec.clasesPortafolio,
  });
  (sec.bloques || []).forEach((b) => occupiedSlots.add(`${b.dia}-${b.bloqueId}`));
};

const addPracticaToPackage = (selected, practicaCourse) => {
  const sec = practicaCourse.secciones[0] || {};
  selected.push({
    sigla: practicaCourse.sigla,
    nombre: practicaCourse.nombre,
    creditos: practicaCourse.creditos,
    tipo: 'practica',
    seccion: sec.seccion,
    profesor: sec.profesor,
    sala: sec.sala,
    horarioTexto: sec.horarioTexto,
    bloques: [],
    detallePractica: sec.detallePractica,
  });
};

const fillPackageCourses = ({ courses, selected, occupiedSlots, limit, filterBlock }) => {
  for (const course of courses) {
    if (selected.length >= limit) break;
    if (selected.some((s) => s.sigla === course.sigla)) continue;

    const validSections = (course.secciones || []).filter(
      (sec) => !sec.sinCupos && (sec.bloques || []).length > 0
    );

    const orderedSections = filterBlock
      ? [...validSections].sort((s1, s2) => {
          const m1 = s1.bloques.some((b) => filterBlock(b.bloqueId)) ? 1 : 0;
          const m2 = s2.bloques.some((b) => filterBlock(b.bloqueId)) ? 1 : 0;
          return m2 - m1;
        })
      : validSections;

    const chosen = orderedSections.find((sec) => !hasBlockConflict(sec.bloques, occupiedSlots));
    if (chosen) {
      addCourseSectionToPackage(selected, occupiedSlots, course, chosen);
    }
  }
};

const PACKAGE_SHIFT_RAW = [
  'pkg-manana|Paquete 1: Bloque Diurno Mañana|Jornada Mañana|Diurno|emerald|b1,b2,b3,b4,b5,b6|Cursos en horario matutino (08:31 - 12:50 hrs). {DIFF} coordinados sin topes.',
  'pkg-media-tarde|Paquete 2: Bloque Media Tarde|Media Tarde|Diurno|blue|b7,b8,b9,b10|Cursos planificados entre 13:01 y 16:40 hrs. Diseñado para evitar traslados matutinos.',
  'pkg-tarde|Paquete 3: Bloque Tarde|Jornada Tarde|Diurno|amber|b11,b12,b13,b14|Cursos en la segunda mitad de la tarde (16:41 - 19:40 hrs). Ideal para liberar mañanas.',
  'pkg-vespertino|Paquete 4: Bloque Vespertino|Jornada Vespertina|Vespertino|purple|b14,b15,b16,b17|Asignaturas en horario vespertino (19:01 - 21:50 hrs). Compatibilidad laboral garantizada.',
];

const PACKAGE_SHIFT_CONFIGS = PACKAGE_SHIFT_RAW.map((entry) => {
  const [id, name, badge, jornada, color, blocksCsv, descTemplate] = entry.split('|');
  const allowedBlocks = new Set(blocksCsv.split(','));
  return {
    id,
    name,
    badge,
    jornada,
    color,
    buildDesc: (diffBadge) => descTemplate.replace('{DIFF}', diffBadge),
    filterBlock: (bId) => allowedBlocks.has(bId),
  };
});

/**
 * Genera los paquetes objetivos predefinidos (Mañana, Media Tarde, Tarde y Vespertino)
 * soportando los 4 niveles de dificultad (Fácil, Intermedio, Difícil, Muy Difícil).
 */
export function generateTargetPackages(courses, difficulty = 'facil') {
  if (!courses || courses.length === 0) return [];

  const diffConfig = DIFFICULTY_LEVELS.find((d) => d.id === difficulty) || DIFFICULTY_LEVELS[0];
  const requiredRegularCount = diffConfig.regularCount;

  const validCourses = courses.filter(
    (c) =>
      c.tipo !== 'practica' &&
      Array.isArray(c.secciones) &&
      c.secciones.some((s) => !s.sinCupos && (s.bloques || []).length > 0)
  );

  const selectableCourses = validCourses.filter((c) => !c.yaInscrito);
  const coursesToUse =
    selectableCourses.length >= requiredRegularCount ? selectableCourses : validCourses;

  const preInscrito = courses.find((c) => c.yaInscrito);
  const preInscritoSlots = new Set();
  if (preInscrito && Array.isArray(preInscrito.secciones) && preInscrito.secciones.length > 0) {
    const preSec =
      preInscrito.secciones.find((s) => s.seccion === preInscrito.seccionInscrita) ||
      preInscrito.secciones[0];
    (preSec.bloques || []).forEach((b) => preInscritoSlots.add(`${b.dia}-${b.bloqueId}`));
  }

  const targetSubjects = coursesToUse.slice(0, requiredRegularCount);

  return PACKAGE_SHIFT_CONFIGS.map((cfg) => {
    const selected = [];
    const occupiedSlots = new Set(preInscritoSlots);

    fillPackageCourses({
      courses: targetSubjects,
      selected,
      occupiedSlots,
      limit: requiredRegularCount,
      filterBlock: cfg.filterBlock,
    });

    if (selected.length < requiredRegularCount) {
      fillPackageCourses({
        courses: coursesToUse,
        selected,
        occupiedSlots,
        limit: requiredRegularCount,
      });
    }

    if (diffConfig.hasPracticaLaboral) {
      addPracticaToPackage(selected, PRACTICA_LABORAL_COURSE);
    }
    if (diffConfig.hasPracticaProfesional) {
      addPracticaToPackage(selected, PRACTICA_PROFESIONAL_COURSE);
    }

    return {
      id: cfg.id,
      name: cfg.name,
      badge: `${cfg.badge} • ${diffConfig.name}`,
      jornada: cfg.jornada,
      color: cfg.color,
      description: cfg.buildDesc(diffConfig.badge),
      difficulty: diffConfig.id,
      targetCourses: selected,
    };
  });
}

const MALLA_STATUS_CODES = {
  A: 'aprobado',
  C: 'convalidado',
  R: 'reprobado',
  P: 'pendiente',
  S: 'sin-inscribir',
};

const MALLA_SEMESTERS_RAW = [
  ['Semestre 1', ['IPF1501:A', 'SPD1501:A', 'THS1501:A', 'LMT1501:C', 'FET001:A', 'MAT100:A']],
  ['Semestre 2', ['OIN1446101:A', 'MAT200:A', 'PEF2501:A', 'MDD2501:A', 'LDP2501:A', 'FET102:C']],
  ['Semestre 3', ['OPR1446101:A', 'MAT330:R', 'INU111:A', 'LDP3501:A', 'TAP3501:A', 'PBD3501:A']],
  ['Semestre 4', ['FDR1501:A', 'DAI4501:A', 'INU211:P', 'FET003:A', 'SOR4501:A', 'EMP110:A']],
  ['Semestre 5', ['FET212:A', 'PLF5503:A', 'ASF5501:A', 'ABD5501:A', 'MPN5501:A', 'INU311:A', 'ISF5501:S']],
  ['Semestre 6', ['CPI6501:S', 'ADF4501:S', 'INU411:S', 'GBI6501:S']],
  ['Semestre 7', ['EMP120:S', 'SCF6501:S', 'SSC7501:S', 'TSF7502:S', 'EDP7201:S']],
  ['Semestre 8', ['ARF8502:S', 'DSF7501:S', 'AHF8502:S', 'TAL011:S', 'PTF8502:S', 'PPF8502:S']],
  ['Semestre 9', ['-:S:info']],
];

/**
 * Malla curricular de referencia (Semestres 1 al 9) fiel a las capturas de SAP SICOL "Malla Alumno"
 */
export const MALLA_CURRICULAR_BASE = MALLA_SEMESTERS_RAW.map(([semestre, items]) => ({
  semestre,
  asignaturas: items.map((entry) => {
    const [sigla, code, flag] = entry.split(':');
    return {
      sigla,
      ...(flag === 'info' ? { isInfoPlaceholder: true } : {}),
      defaultStatus: MALLA_STATUS_CODES[code] || 'sin-inscribir',
    };
  }),
}));

export const MALLA_CURRICULAR_SEMANAL = MALLA_CURRICULAR_BASE;
