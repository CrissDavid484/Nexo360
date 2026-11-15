/**
 * Datos estructurados para el Simulador Oficial de Toma de Ramos Duoc UC (SAP WebDynpro SICOL)
 * Fiel a las pantallas de inscripción de asignaturas:
 * https://portalinsc.duoc.cl/webdynpro/dispatcher/duoc.com.student/sicol/StudentSicol?inportal=xi
 * y al video tutorial oficial de Duoc UC (https://www.youtube.com/watch?v=aEBcCl6RFz8).
 */

export const PORTAL_INSC_URL =
  'https://portalinsc.duoc.cl/webdynpro/dispatcher/duoc.com.student/sicol/StudentSicol?inportal=xi';

export const TOMA_RAMOS_TUTORIAL_VIDEO = {
  videoId: 'aEBcCl6RFz8',
  url: 'https://www.youtube.com/watch?v=aEBcCl6RFz8',
  embedUrl: 'https://www.youtube-nocookie.com/embed/aEBcCl6RFz8?rel=0',
  title: 'Inscripción de Asignaturas (Toma de Ramos Oficial Duoc UC)',
  duracion: '2:20 min',
  canal: 'Duoc UC Institucional',
  pasosClave: [
    {
      paso: '1. Verificación de requisitos',
      tiempo: '0:10',
      descripcion:
        'Asegúrate de no tener cuotas pendientes de matrícula o aranceles, y que tu matrícula o beneficio (Gratuidad/CAE) esté al día sin bloqueos académicos.',
    },
    {
      paso: '2. Tramo horario asignado',
      tiempo: '0:25',
      descripcion:
        'La plataforma se habilita por tramos horarios según tu carrera, año y rendimiento. Respeta tu bloque para asegurar las vacantes.',
    },
    {
      paso: '3. Selección con iconito mano/cubo (🖐️📦)',
      tiempo: '0:45',
      descripcion:
        'En la lista izquierda de asignaturas disponibles, haz clic en el icono de la mano con el cubito para abrir las secciones con cupos.',
    },
    {
      paso: '4. Elección de sección y profesor',
      tiempo: '1:05',
      descripcion:
        'Revisa las vacantes disponibles, sala en Sede Alameda y el nombre del docente antes de seleccionar la sección.',
    },
    {
      paso: '5. Verificación de cuadrícula sin topes',
      tiempo: '1:30',
      descripcion:
        'Comprueba que las clases seleccionadas se ubiquen en bloques sin cruzarse con otras asignaturas en el horario semanal.',
    },
    {
      paso: '6. Grabar y respaldar tu Boletín Oficial',
      tiempo: '1:55',
      descripcion:
        'Haz clic en "Siguiente" y luego en "Grabar". Finalmente pulsa "Ver Horario" para visualizar y descargar tu Boletín de Carga Académica en PDF.',
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

export const CARRERAS_DUOC = [
  {
    codigo: '1446815',
    nombre: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    nombreCorto: 'Ing. en Infraestructura Tecnológica',
    escuela: 'Escuela de Informática y Telecomunicaciones',
    sede: 'ALAMEDA',
    jornada: 'Diurno',
    periodo: '2026 - 002',
    creditosTotalesCurriculum: 418,
    creditosInscritosAprobados: 350,
    creditosTotalesOptativos: 28,
    creditosAprobadosOptativos: 28,
    creditosAprobadosOptativosInterdisciplinarios: 4,
    creditosAprobadosOptativosFormacionCristiana: 0,
    creditosAprobadosOptativosProfundizacion: 0,
  },
  {
    codigo: '1446814',
    nombre: 'ING. EN INFRAEST. Y PLATAFORMAS TECN.',
    nombreCorto: 'Ing. en Infraest. y Plataformas Tecn.',
    escuela: 'Escuela de Informática y Telecomunicaciones',
    sede: 'ALAMEDA',
    jornada: 'Diurno',
    periodo: '2026 - 002',
    creditosTotalesCurriculum: 418,
    creditosInscritosAprobados: 340,
    creditosTotalesOptativos: 28,
    creditosAprobadosOptativos: 28,
    creditosAprobadosOptativosInterdisciplinarios: 4,
    creditosAprobadosOptativosFormacionCristiana: 0,
    creditosAprobadosOptativosProfundizacion: 0,
  },
  {
    codigo: '1446114',
    nombre: 'INGENIERÍA EN INFORMÁTICA',
    nombreCorto: 'Ingeniería en Informática',
    escuela: 'Escuela de Informática y Telecomunicaciones',
    sede: 'ALAMEDA',
    jornada: 'Diurno',
    periodo: '2026 - 002',
    creditosTotalesCurriculum: 418,
    creditosInscritosAprobados: 378,
    creditosTotalesOptativos: 28,
    creditosAprobadosOptativos: 28,
    creditosAprobadosOptativosInterdisciplinarios: 4,
    creditosAprobadosOptativosFormacionCristiana: 0,
    creditosAprobadosOptativosProfundizacion: 0,
  },
  {
    codigo: '1446112',
    nombre: 'ANALISTA PROGRAMADOR COMPUTACIONAL',
    nombreCorto: 'Analista Programador',
    escuela: 'Escuela de Informática y Telecomunicaciones',
    sede: 'ALAMEDA',
    jornada: 'Diurno',
    periodo: '2026 - 002',
    creditosTotalesCurriculum: 250,
    creditosInscritosAprobados: 190,
    creditosTotalesOptativos: 16,
    creditosAprobadosOptativos: 16,
    creditosAprobadosOptativosInterdisciplinarios: 0,
    creditosAprobadosOptativosFormacionCristiana: 0,
    creditosAprobadosOptativosProfundizacion: 0,
  },
];

export const BLOQUES_HORARIOS_TOMA = [
  { id: 'b1', hora: '08:31 - 09:10', labelPdf: '08:31 A 09:10' },
  { id: 'b2', hora: '09:11 - 09:50', labelPdf: '09:11 A 09:50' },
  { id: 'b3', hora: '10:01 - 10:40', labelPdf: '10:01 A 10:40' },
  { id: 'b4', hora: '10:41 - 11:20', labelPdf: '10:41 A 11:20' },
  { id: 'b5', hora: '11:31 - 12:10', labelPdf: '11:31 A 12:10' },
  { id: 'b6', hora: '12:11 - 12:50', labelPdf: '12:11 A 12:50' },
  { id: 'b7', hora: '13:01 - 13:40', labelPdf: '13:01 A 13:40' },
  { id: 'b8', hora: '14:31 - 15:10', labelPdf: '14:31 A 15:10' },
  { id: 'b9', hora: '15:11 - 15:50', labelPdf: '15:11 A 15:50' },
  { id: 'b10', hora: '16:01 - 16:40', labelPdf: '16:01 A 16:40' },
  { id: 'b11', hora: '16:41 - 17:20', labelPdf: '16:41 A 17:20' },
  { id: 'b12', hora: '17:31 - 18:10', labelPdf: '17:31 A 18:10' },
  { id: 'b13', hora: '18:11 - 18:50', labelPdf: '18:11 A 18:50' },
  { id: 'b14', hora: '19:01 - 19:40', labelPdf: '19:01 A 19:40' },
  { id: 'b15', hora: '19:41 - 20:20', labelPdf: '19:41 A 20:20' },
  { id: 'b16', hora: '20:31 - 21:10', labelPdf: '20:31 A 21:10' },
  { id: 'b17', hora: '21:11 - 21:50', labelPdf: '21:11 A 21:50' },
];

export const ASIGNATURAS_DISPONIBLES = [
  {
    sigla: 'PTY4614',
    siglaEq: '',
    nombre: 'PROYECTO CAPSTONE',
    creditos: 10,
    tipo: 'obligatorio',
    yaInscrito: true,
    seccionInscrita: '001D',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 30,
        cuposDisponibles: 12,
        sala: 'AL-503A / AL-LAB-IP4',
        profesor: 'Mauricio Gómez Arratia',
        horarioTexto: 'Mié 08:31-09:50, Vie 08:31-10:40',
        bloques: [
          { dia: 'Miércoles', bloqueId: 'b1', salaCorta: 'AL-503A' },
          { dia: 'Miércoles', bloqueId: 'b2', salaCorta: 'AL-503A' },
          { dia: 'Viernes', bloqueId: 'b1', salaCorta: 'AL-LAB-IP4' },
          { dia: 'Viernes', bloqueId: 'b2', salaCorta: 'AL-LAB-IP4' },
          { dia: 'Viernes', bloqueId: 'b3', salaCorta: 'AL-LAB-IP4' },
        ],
      },
    ],
  },
  {
    sigla: 'ASY4131',
    siglaEq: '',
    nombre: 'ARQUITECTURA DE SOFTWARE',
    creditos: 10,
    tipo: 'obligatorio',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 30,
        cuposDisponibles: 14,
        sala: 'Laboratorio de Software IP2',
        profesor: 'Andrés Silva Paredes',
        horarioTexto: 'Jueves 14:31 - 15:50',
        bloques: [
          { dia: 'Jueves', bloqueId: 'b8', salaCorta: 'AL-LAB-IP2' },
          { dia: 'Jueves', bloqueId: 'b9', salaCorta: 'AL-LAB-IP2' },
        ],
      },
      {
        seccion: '002D',
        cuposTotales: 30,
        cuposDisponibles: 8,
        sala: 'Laboratorio de Software IP1',
        profesor: 'Claudio Vergara Soto',
        horarioTexto: 'Miércoles 08:31 - 09:50 (Tope potencial con Capstone)',
        bloques: [
          { dia: 'Miércoles', bloqueId: 'b1', salaCorta: 'AL-LAB-IP1' },
          { dia: 'Miércoles', bloqueId: 'b2', salaCorta: 'AL-LAB-IP1' },
        ],
      },
      {
        seccion: '003D',
        cuposTotales: 28,
        cuposDisponibles: 11,
        sala: 'Laboratorio Redes IP3',
        profesor: 'Carolina Muñoz R.',
        horarioTexto: 'Viernes 11:31 - 12:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b5', salaCorta: 'AL-LAB-IP3' },
          { dia: 'Viernes', bloqueId: 'b6', salaCorta: 'AL-LAB-IP3' },
        ],
      },
      {
        seccion: '004V',
        cuposTotales: 30,
        cuposDisponibles: 14,
        sala: 'Laboratorio de Software IP2',
        profesor: 'Andrés Silva Paredes',
        horarioTexto: 'Lunes 19:01 - 20:20 (Vespertino)',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b14', salaCorta: 'AL-LAB-IP2' },
          { dia: 'Lunes', bloqueId: 'b15', salaCorta: 'AL-LAB-IP2' },
        ],
      },
    ],
  },
  {
    sigla: 'GPI4121',
    siglaEq: '',
    nombre: 'GESTIÓN DE PROYECTOS ÁGILES',
    creditos: 10,
    tipo: 'obligatorio',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 28,
        cuposDisponibles: 9,
        sala: 'Sala 402 Alameda',
        profesor: 'Lorena Castillo V.',
        horarioTexto: 'Lunes 11:31 - 12:50',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b5', salaCorta: 'AL-402' },
          { dia: 'Lunes', bloqueId: 'b6', salaCorta: 'AL-402' },
        ],
      },
      {
        seccion: '002D',
        cuposTotales: 30,
        cuposDisponibles: 15,
        sala: 'Sala 305 Alameda',
        profesor: 'Rodrigo Fuentes M.',
        horarioTexto: 'Martes 10:01 - 11:20',
        bloques: [
          { dia: 'Martes', bloqueId: 'b3', salaCorta: 'AL-305' },
          { dia: 'Martes', bloqueId: 'b4', salaCorta: 'AL-305' },
        ],
      },
      {
        seccion: '003D',
        cuposTotales: 30,
        cuposDisponibles: 0,
        sala: 'Sala 401 Alameda',
        profesor: 'Esteban Morales P.',
        horarioTexto: 'Lunes 08:31 - 09:50',
        bloques: [],
        sinCupos: true,
      },
      {
        seccion: '004V',
        cuposTotales: 30,
        cuposDisponibles: 12,
        sala: 'Sala 402 Alameda',
        profesor: 'Lorena Castillo V.',
        horarioTexto: 'Martes 19:01 - 20:20 (Vespertino)',
        bloques: [
          { dia: 'Martes', bloqueId: 'b14', salaCorta: 'AL-402' },
          { dia: 'Martes', bloqueId: 'b15', salaCorta: 'AL-402' },
        ],
      },
    ],
  },
  {
    sigla: 'CAL4101',
    siglaEq: '',
    nombre: 'CALIDAD Y TESTING DE SOFTWARE',
    creditos: 8,
    tipo: 'obligatorio',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 26,
        cuposDisponibles: 10,
        sala: 'Laboratorio QA AL-LAB-4',
        profesor: 'Gabriel Arancibia N.',
        horarioTexto: 'Martes 08:31 - 09:50',
        bloques: [
          { dia: 'Martes', bloqueId: 'b1', salaCorta: 'AL-LAB-QA' },
          { dia: 'Martes', bloqueId: 'b2', salaCorta: 'AL-LAB-QA' },
        ],
      },
      {
        seccion: '002D',
        cuposTotales: 26,
        cuposDisponibles: 12,
        sala: 'Laboratorio QA AL-LAB-4',
        profesor: 'Felipe Sandoval G.',
        horarioTexto: 'Jueves 10:01 - 11:20',
        bloques: [
          { dia: 'Jueves', bloqueId: 'b3', salaCorta: 'AL-LAB-QA' },
          { dia: 'Jueves', bloqueId: 'b4', salaCorta: 'AL-LAB-QA' },
        ],
      },
      {
        seccion: '003V',
        cuposTotales: 28,
        cuposDisponibles: 10,
        sala: 'Laboratorio QA AL-LAB-4',
        profesor: 'Gabriel Arancibia N.',
        horarioTexto: 'Miércoles 19:01 - 20:20 (Vespertino)',
        bloques: [
          { dia: 'Miércoles', bloqueId: 'b14', salaCorta: 'AL-LAB-QA' },
          { dia: 'Miércoles', bloqueId: 'b15', salaCorta: 'AL-LAB-QA' },
        ],
      },
    ],
  },
  {
    sigla: 'SEG4102',
    siglaEq: '',
    nombre: 'SEGURIDAD EN APLICACIONES Y REDES',
    creditos: 8,
    tipo: 'obligatorio',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 30,
        cuposDisponibles: 16,
        sala: 'Laboratorio Ciberseguridad IP5',
        profesor: 'Hernán Carrasco D.',
        horarioTexto: 'Lunes 14:31 - 15:50',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b8', salaCorta: 'AL-LAB-CS' },
          { dia: 'Lunes', bloqueId: 'b9', salaCorta: 'AL-LAB-CS' },
        ],
      },
      {
        seccion: '002D',
        cuposTotales: 28,
        cuposDisponibles: 7,
        sala: 'Laboratorio Ciberseguridad IP5',
        profesor: 'Viviana Orellana T.',
        horarioTexto: 'Miércoles 14:31 - 15:50',
        bloques: [
          { dia: 'Miércoles', bloqueId: 'b8', salaCorta: 'AL-LAB-CS' },
          { dia: 'Miércoles', bloqueId: 'b9', salaCorta: 'AL-LAB-CS' },
        ],
      },
      {
        seccion: '003V',
        cuposTotales: 30,
        cuposDisponibles: 15,
        sala: 'Laboratorio Ciberseguridad IP5',
        profesor: 'Hernán Carrasco D.',
        horarioTexto: 'Jueves 19:01 - 20:20 (Vespertino)',
        bloques: [
          { dia: 'Jueves', bloqueId: 'b14', salaCorta: 'AL-LAB-CS' },
          { dia: 'Jueves', bloqueId: 'b15', salaCorta: 'AL-LAB-CS' },
        ],
      },
    ],
  },
  {
    sigla: 'FCG4101',
    siglaEq: '',
    nombre: 'ÉTICA PROFESIONAL',
    creditos: 6,
    tipo: 'formacionCristiana',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 35,
        cuposDisponibles: 18,
        sala: 'Auditorio A-201 Alameda',
        profesor: 'Padre Marcelo Reyes C.',
        horarioTexto: 'Martes 14:31 - 15:50',
        bloques: [
          { dia: 'Martes', bloqueId: 'b8', salaCorta: 'AL-AUD-2' },
          { dia: 'Martes', bloqueId: 'b9', salaCorta: 'AL-AUD-2' },
        ],
      },
      {
        seccion: '002D',
        cuposTotales: 35,
        cuposDisponibles: 22,
        sala: 'Sala 501 Alameda',
        profesor: 'Mónica Henríquez B.',
        horarioTexto: 'Jueves 08:31 - 09:50',
        bloques: [
          { dia: 'Jueves', bloqueId: 'b1', salaCorta: 'AL-501' },
          { dia: 'Jueves', bloqueId: 'b2', salaCorta: 'AL-501' },
        ],
      },
    ],
  },
  {
    sigla: 'AJEMS',
    siglaEq: '',
    nombre: 'AJEDREZ MIXTO SÁBADO',
    creditos: 0,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 30,
        cuposDisponibles: 15,
        sala: 'S-204 Alameda',
        profesor: 'Carlos Riquelme Bravo',
        horarioTexto: 'Sábado 08:31 - 10:40',
        bloques: [
          { dia: 'Sábado', bloqueId: 'b1', salaCorta: 'AL-204' },
          { dia: 'Sábado', bloqueId: 'b2', salaCorta: 'AL-204' },
          { dia: 'Sábado', bloqueId: 'b3', salaCorta: 'AL-204' },
        ],
      },
      {
        seccion: '002D',
        cuposTotales: 30,
        cuposDisponibles: 0,
        sala: 'S-205 Alameda',
        profesor: 'Jorge Valenzuela',
        horarioTexto: 'Sábado 10:41 - 12:50',
        bloques: [],
        sinCupos: true,
      },
    ],
  },
  {
    sigla: 'FITW',
    siglaEq: '',
    nombre: 'FITNESS MIERCOLES',
    creditos: 0,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 25,
        cuposDisponibles: 8,
        sala: 'Gimnasio Alameda',
        profesor: 'Valeria Soto M.',
        horarioTexto: 'Miércoles 11:31 - 12:50',
        bloques: [
          { dia: 'Miércoles', bloqueId: 'b5', salaCorta: 'GIM-ALM' },
          { dia: 'Miércoles', bloqueId: 'b6', salaCorta: 'GIM-ALM' },
        ],
      },
    ],
  },
  {
    sigla: 'BASDW',
    siglaEq: '',
    nombre: 'BASQUETBOL DAMA MIERCOLES',
    creditos: 0,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 20,
        cuposDisponibles: 6,
        sala: 'Multicancha Alameda',
        profesor: 'Patricia Fuentes',
        horarioTexto: 'Miércoles 13:01 - 14:30',
        bloques: [
          { dia: 'Miércoles', bloqueId: 'b7', salaCorta: 'CANCHA-1' },
        ],
      },
    ],
  },
  {
    sigla: 'DEFPL',
    siglaEq: '',
    nombre: 'DEFENSA PERSONAL LUNES',
    creditos: 0,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 25,
        cuposDisponibles: 10,
        sala: 'Sala Multiuso Alameda',
        profesor: 'Rodrigo Morales',
        horarioTexto: 'Lunes 10:01 - 11:20',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b3', salaCorta: 'MULTIUSO' },
          { dia: 'Lunes', bloqueId: 'b4', salaCorta: 'MULTIUSO' },
        ],
      },
    ],
  },
  {
    sigla: 'FUTVJ',
    siglaEq: '',
    nombre: 'FUTBOL VARON JUEVES',
    creditos: 0,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 22,
        cuposDisponibles: 5,
        sala: 'Cancha Central Alameda',
        profesor: 'Esteban Paredes Q.',
        horarioTexto: 'Jueves 11:31 - 12:50',
        bloques: [
          { dia: 'Jueves', bloqueId: 'b5', salaCorta: 'CANCHA-C' },
          { dia: 'Jueves', bloqueId: 'b6', salaCorta: 'CANCHA-C' },
        ],
      },
    ],
  },
  {
    sigla: 'KARAS',
    siglaEq: '',
    nombre: 'KARATE SABADO',
    creditos: 0,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 20,
        cuposDisponibles: 0,
        sala: 'Dojo Alameda',
        profesor: 'Takeshi Miyagi',
        horarioTexto: 'Sábado 11:31 - 13:40',
        bloques: [],
        sinCupos: true,
      },
    ],
  },
];

/**
 * Parsea un horario de Duoc UC a bloques horarios de la cuadrícula
 */
export function parseDuocSchedule(scheduleStr, sala = 'ONLINE') {
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
  for (const blk of BLOQUES_HORARIOS_TOMA) {
    const [hIni, hFin] = blk.hora.split(' - ');
    const bStart = toMinutes(hIni);
    const bEnd = toMinutes(hFin);

    if (Math.max(startMin, bStart) < Math.min(endMin, bEnd)) {
      matched.push({
        dia: day,
        bloqueId: blk.id,
        salaCorta: sala || 'ONLINE',
      });
    }
  }

  if (matched.length === 0) {
    matched.push({
      dia: day,
      bloqueId: startMin < 12 * 60 ? 'b1' : startMin < 17 * 60 ? 'b8' : 'b12',
      salaCorta: sala || 'ONLINE',
    });
  }

  return matched;
}

/**
 * Catálogo completo de asignaturas por carrera para generación aleatoria
 */
export const CATALOGO_INFRAESTRUCTURA_TECNOLOGICA = [
  {
    sigla: 'OCY1104',
    siglaEq: '',
    nombre: 'CIBERSEGURIDAD OFENSIVA',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 30,
        cuposDisponibles: 11,
        sala: 'ONLINE SINCRONA',
        profesor: 'JOSE ERASMO MATUS',
        horarioTexto: 'Lu 8:31 - 11:20',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b1', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b2', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b3', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b4', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '002D',
        cuposTotales: 28,
        cuposDisponibles: 9,
        sala: 'ONLINE SINCRONA',
        profesor: 'JOSE REYNALDO ALVARES',
        horarioTexto: 'Lu 12:11 - 15:10',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b6', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b7', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b8', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '010D',
        cuposTotales: 30,
        cuposDisponibles: 14,
        sala: 'ONLINE SINCRONA',
        profesor: 'FELIPE ANDRES CACERES',
        horarioTexto: 'Vi 16:01 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '016V',
        cuposTotales: 25,
        cuposDisponibles: 0,
        sala: 'ONLINE SINCRONA',
        profesor: 'CAMILA ANDREA FARIAS',
        horarioTexto: 'Sa 14:31 - 17:20',
        bloques: [],
        sinCupos: true,
      },
    ],
  },
  {
    sigla: 'OCY1102',
    siglaEq: '',
    nombre: 'CIBERSEGURIDAD EN DESARROLLO',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 30,
        cuposDisponibles: 15,
        sala: 'ONLINE SINCRONA',
        profesor: 'JUAN ARTURO SAGARDIA',
        horarioTexto: 'Lu 8:31 - 11:20',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b1', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b2', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b3', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '005D',
        cuposTotales: 28,
        cuposDisponibles: 8,
        sala: 'ONLINE SINCRONA',
        profesor: 'LEONARDO ANDRES SOTO',
        horarioTexto: 'Ma 16:01 - 18:50',
        bloques: [
          { dia: 'Martes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Martes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Martes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '021D',
        cuposTotales: 32,
        cuposDisponibles: 19,
        sala: 'ONLINE SINCRONA',
        profesor: 'YASSER GUERRA',
        horarioTexto: 'Lu 16:01 - 18:50',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'DOY0101',
    siglaEq: '',
    nombre: 'INGENIERÍA DEVOPS',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 30,
        cuposDisponibles: 12,
        sala: 'ONLINE SINCRONA',
        profesor: 'CRISTIAN ANDRES BUGUEÑO',
        horarioTexto: 'Ma 16:01 - 18:50',
        bloques: [
          { dia: 'Martes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Martes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Martes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '004D',
        cuposTotales: 28,
        cuposDisponibles: 10,
        sala: 'ONLINE SINCRONA',
        profesor: 'CRISTIAN ANDRES BUGUEÑO',
        horarioTexto: 'Vi 16:01 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '008V',
        cuposTotales: 25,
        cuposDisponibles: 5,
        sala: 'ONLINE SINCRONA',
        profesor: 'NICOLAS EDUARDO SINGH',
        horarioTexto: 'Sa 8:31 - 11:20',
        bloques: [
          { dia: 'Sábado', bloqueId: 'b1', salaCorta: 'ONLINE' },
          { dia: 'Sábado', bloqueId: 'b2', salaCorta: 'ONLINE' },
          { dia: 'Sábado', bloqueId: 'b3', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'OCY1101',
    siglaEq: '',
    nombre: 'CIBERSEGURIDAD, SISTEMA OPERATIVO Y RED.',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '004D',
        cuposTotales: 30,
        cuposDisponibles: 17,
        sala: 'ONLINE SINCRONA',
        profesor: 'JAIME ANDRES GOMEZ',
        horarioTexto: 'Lu 16:01 - 18:50',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '022D',
        cuposTotales: 28,
        cuposDisponibles: 13,
        sala: 'ONLINE SINCRONA',
        profesor: 'LUIS IGNACIO JAQUE',
        horarioTexto: 'Ma 16:01 - 18:50',
        bloques: [
          { dia: 'Martes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Martes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Martes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'JVY0101',
    siglaEq: '',
    nombre: 'JAVA: DIS y CONST. DE SOL. NATIVAS EN NU',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '006D',
        cuposTotales: 30,
        cuposDisponibles: 14,
        sala: 'ONLINE SINCRONA',
        profesor: 'ALDO ANTONIO PIZARRO',
        horarioTexto: 'Vi 16:01 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '011V',
        cuposTotales: 26,
        cuposDisponibles: 6,
        sala: 'ONLINE SINCRONA',
        profesor: 'FABIÁN MAURICIO LÓPEZ',
        horarioTexto: 'Sa 11:31 - 14:20',
        bloques: [
          { dia: 'Sábado', bloqueId: 'b5', salaCorta: 'ONLINE' },
          { dia: 'Sábado', bloqueId: 'b6', salaCorta: 'ONLINE' },
          { dia: 'Sábado', bloqueId: 'b7', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'ISY0101',
    siglaEq: '',
    nombre: 'ING. DE SOL. CON INTELIGENCIA ARTIFICIAL',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '008D',
        cuposTotales: 30,
        cuposDisponibles: 16,
        sala: 'ONLINE SINCRONA',
        profesor: 'FRANCISCO ANDRES MACAYA',
        horarioTexto: 'Ju 16:01 - 18:50',
        bloques: [
          { dia: 'Jueves', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Jueves', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Jueves', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '014V',
        cuposTotales: 28,
        cuposDisponibles: 11,
        sala: 'ONLINE SINCRONA',
        profesor: 'CRISTIAN RODRIGO ARAYA',
        horarioTexto: 'Sa 14:31 - 17:20',
        bloques: [
          { dia: 'Sábado', bloqueId: 'b8', salaCorta: 'ONLINE' },
          { dia: 'Sábado', bloqueId: 'b9', salaCorta: 'ONLINE' },
          { dia: 'Sábado', bloqueId: 'b10', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'DLY0100',
    siglaEq: '',
    nombre: 'DEEP LEARNING',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '007D',
        cuposTotales: 30,
        cuposDisponibles: 9,
        sala: 'ONLINE SINCRONA',
        profesor: 'MARCELO ALEJANDRO TAPIA',
        horarioTexto: 'Mi 16:01 - 18:50',
        bloques: [
          { dia: 'Miércoles', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Miércoles', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Miércoles', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
      {
        seccion: '012D',
        cuposTotales: 30,
        cuposDisponibles: 15,
        sala: 'ONLINE SINCRONA',
        profesor: 'MARCELO ALEJANDRO TAPIA',
        horarioTexto: 'Lu 16:01 - 18:50',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'SLY1101',
    siglaEq: '',
    nombre: 'SISTEMA OPERATIVO LINUX',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '001D',
        cuposTotales: 30,
        cuposDisponibles: 18,
        sala: 'ONLINE SINCRONA',
        profesor: 'FABIAN ANDRES MIRANDA',
        horarioTexto: 'Lu 16:01 - 18:50',
        bloques: [
          { dia: 'Lunes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Lunes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'CCY0011',
    siglaEq: '',
    nombre: 'INFRAESTRUCTURA CLOUD',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '003D',
        cuposTotales: 30,
        cuposDisponibles: 12,
        sala: 'ONLINE SINCRONA',
        profesor: 'ALVARO DAVID VALLEJOS',
        horarioTexto: 'Vi 16:41 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'BDY0101',
    siglaEq: '',
    nombre: 'BASE DE DATOS NO RELACIONALES',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '002D',
        cuposTotales: 30,
        cuposDisponibles: 14,
        sala: 'ONLINE SINCRONA',
        profesor: 'IGOR ANDRES VENEGAS',
        horarioTexto: 'Mi 16:01 - 18:50',
        bloques: [
          { dia: 'Miércoles', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Miércoles', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Miércoles', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'BCY0011',
    siglaEq: '',
    nombre: 'DESARROLLO DE CONTRATOS INTELIGENTES PAR',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '004D',
        cuposTotales: 30,
        cuposDisponibles: 16,
        sala: 'ONLINE SINCRONA',
        profesor: 'JOSE FERNANDO MOLINA',
        horarioTexto: 'Vi 16:41 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'MLY0100',
    siglaEq: '',
    nombre: 'MACHINE LEARNING',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '011D',
        cuposTotales: 30,
        cuposDisponibles: 15,
        sala: 'ONLINE SINCRONA',
        profesor: 'MAURO MACIEL MERCADO',
        horarioTexto: 'Ju 16:01 - 18:50',
        bloques: [
          { dia: 'Jueves', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Jueves', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Jueves', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'PMY0010',
    siglaEq: '',
    nombre: 'FUNDAMENTOS DE PROJECT MANAGEMENT',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '006D',
        cuposTotales: 30,
        cuposDisponibles: 19,
        sala: 'ONLINE SINCRONA',
        profesor: 'FERNANDO JAVIER JEREZ',
        horarioTexto: 'Vi 16:41 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'OCY1105',
    siglaEq: '',
    nombre: 'CIBERSEGURIDAD DEFENSIVA',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '013D',
        cuposTotales: 30,
        cuposDisponibles: 11,
        sala: 'ONLINE SINCRONA',
        profesor: 'JOSE REYNALDO ALVARES',
        horarioTexto: 'Vi 16:01 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'OCY1103',
    siglaEq: '',
    nombre: 'CIBERSEGURIDAD EN TEC. EN CLOUD Y CONT.',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '015D',
        cuposTotales: 30,
        cuposDisponibles: 17,
        sala: 'ONLINE SINCRONA',
        profesor: 'FRANCISCA VALENZUELA',
        horarioTexto: 'Vi 16:01 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b10', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'CCY0010',
    siglaEq: '',
    nombre: 'SOLUCIONES CLOUD',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '006D',
        cuposTotales: 30,
        cuposDisponibles: 13,
        sala: 'ONLINE SINCRONA',
        profesor: 'NICOLAS EDUARDO SINGH',
        horarioTexto: 'Vi 16:41 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
  {
    sigla: 'BCY0010',
    siglaEq: '',
    nombre: 'FUNDAMENTOS DE BLOCKCHAIN',
    creditos: 10,
    tipo: 'optativo',
    secciones: [
      {
        seccion: '004D',
        cuposTotales: 30,
        cuposDisponibles: 15,
        sala: 'ONLINE SINCRONA',
        profesor: 'ROBERT ANTHONY ROZAS',
        horarioTexto: 'Vi 16:41 - 18:50',
        bloques: [
          { dia: 'Viernes', bloqueId: 'b11', salaCorta: 'ONLINE' },
          { dia: 'Viernes', bloqueId: 'b12', salaCorta: 'ONLINE' },
        ],
      },
    ],
  },
];

/**
 * Plantillas Institucionales para Prácticas y Portafolio Duoc UC
 */
export const PRACTICA_LABORAL_COURSE = {
  sigla: 'PRL3100',
  siglaEq: '',
  nombre: 'PRÁCTICA LABORAL',
  creditos: 0,
  tipo: 'practica',
  subtipo: 'laboral',
  secciones: [
    {
      seccion: '001D',
      cuposTotales: 60,
      cuposDisponibles: 35,
      sala: 'CENTRO DE PRÁCTICA',
      profesor: 'COORDINACIÓN DE PRÁCTICAS DUOC UC',
      horarioTexto: 'Supervisión en terreno (360 hrs)',
      bloques: [],
      detallePractica: {
        tipo: 'Práctica Laboral',
        centroPractica: 'Empresa TI en Convenio • Sede Alameda',
        supervisor: 'Coordinador de Prácticas Laborales Escuela Informática',
        horas: '360 horas cronológicas',
        periodo: 'Primer y Segundo Semestre 2026',
      },
    },
  ],
};

export const PRACTICA_PROFESIONAL_COURSE = {
  sigla: 'PPR4100',
  siglaEq: '',
  nombre: 'PRÁCTICA PROFESIONAL',
  creditos: 0,
  tipo: 'practica',
  subtipo: 'profesional',
  secciones: [
    {
      seccion: '001D',
      cuposTotales: 60,
      cuposDisponibles: 40,
      sala: 'EMPRESA / EN TERRENO',
      profesor: 'DIRECCIÓN DE CARRERA Y EMPRESA',
      horarioTexto: 'Supervisión profesional (480 hrs)',
      bloques: [],
      detallePractica: {
        tipo: 'Práctica Profesional',
        centroPractica: 'Entidad Empleadora TI / En Terreno',
        supervisor: 'Comité de Titulación y Supervisor Institucional',
        horas: '480 horas cronológicas',
        periodo: 'Semestre de Egreso 2026',
      },
    },
  ],
};

export const PORTAFOLIO_TITULO_COURSE = {
  sigla: 'PTF6101',
  siglaEq: '',
  nombre: 'PORTAFOLIO DE TÍTULO',
  creditos: 10,
  tipo: 'portafolio',
  secciones: [
    {
      seccion: '001D',
      cuposTotales: 30,
      cuposDisponibles: 18,
      sala: 'AL-503A',
      profesor: 'Mauricio Gómez Arratia',
      horarioTexto: 'Mi 08:31 - 09:50 / Vi 08:31 - 10:40',
      bloques: [
        { dia: 'Miércoles', bloqueId: 'b1', salaCorta: 'AL-503A' },
        { dia: 'Viernes', bloqueId: 'b1', salaCorta: 'AL-LAB-IP4' },
      ],
      clasesPortafolio: [
        { nro: 'Clase 01', fecha: 'Miércoles 04 de Marzo de 2026', horario: '08:31 a 09:50', sala: 'AL-503A' },
        { nro: 'Clase 02', fecha: 'Viernes 06 de Marzo de 2026', horario: '08:31 a 10:40', sala: 'AL-LAB-IP4' },
        { nro: 'Clase 03', fecha: 'Miércoles 11 de Marzo de 2026', horario: '08:31 a 09:50', sala: 'AL-503A' },
        { nro: 'Clase 04', fecha: 'Viernes 13 de Marzo de 2026', horario: '08:31 a 10:40', sala: 'AL-LAB-IP4' },
      ],
    },
  ],
};

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
  const month = date.getMonth() + 1; // 1-12
  const day = date.getDate();
  const year = date.getFullYear();

  let semester = '1er Sem.';
  if (month >= 3 && (month < 7 || (month === 7 && day <= 15))) {
    semester = '1er Sem.';
  } else if ((month === 7 && day >= 16) || (month > 7 && (month < 12 || (month === 12 && day <= 21)))) {
    semester = '2do Sem.';
  } else {
    semester = '1er Sem.';
  }

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
 * Función que retorna asignaturas aleatorias según la carrera elegida y nivel de dificultad
 */
export function getRandomCoursesForCareer(carreraNombre, limit = 7, difficulty = 'facil') {
  const norm = (carreraNombre || '').toLowerCase();
  let pool = [];

  if (norm.includes('infraestructura') || norm.includes('plataformas')) {
    pool = [...CATALOGO_INFRAESTRUCTURA_TECNOLOGICA, ...ASIGNATURAS_DISPONIBLES];
  } else if (norm.includes('informática') || norm.includes('informatica')) {
    pool = [...ASIGNATURAS_DISPONIBLES, ...CATALOGO_INFRAESTRUCTURA_TECNOLOGICA];
  } else {
    pool = [...CATALOGO_INFRAESTRUCTURA_TECNOLOGICA, ...ASIGNATURAS_DISPONIBLES];
  }

  // Asegurar catálogo de Portafolio
  if (!pool.some((c) => c.sigla === PORTAFOLIO_TITULO_COURSE.sigla)) {
    pool.unshift(PORTAFOLIO_TITULO_COURSE);
  }

  // Ajustar límite según dificultad
  let effectiveLimit = limit;
  if (difficulty === 'dificil' || difficulty === 'muy-dificil') {
    effectiveLimit = Math.max(limit, 16);
  } else if (difficulty === 'intermedio') {
    effectiveLimit = Math.max(limit, 10);
  }

  // Barajado aleatorio Fisher-Yates
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, Math.min(effectiveLimit, shuffled.length));

  // Simular 1 asignatura previamente inscrita
  const list = selected.map((item, idx) => ({
    ...item,
    yaInscrito: idx === 0,
    seccionInscrita: idx === 0 && item.secciones[0] ? item.secciones[0].seccion : undefined,
  }));

  // Agregar prácticas si la dificultad lo requiere
  if (difficulty === 'intermedio' || difficulty === 'muy-dificil') {
    if (!list.some((c) => c.sigla === PRACTICA_LABORAL_COURSE.sigla)) {
      list.push(PRACTICA_LABORAL_COURSE);
    }
  }
  if (difficulty === 'muy-dificil') {
    if (!list.some((c) => c.sigla === PRACTICA_PROFESIONAL_COURSE.sigla)) {
      list.push(PRACTICA_PROFESIONAL_COURSE);
    }
  }

  return list;
}

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
  const coursesToUse = selectableCourses.length >= requiredRegularCount ? selectableCourses : validCourses;

  // Registrar bloques de cualquier curso pre-inscrito en la sesión para evitar colisiones
  const preInscrito = courses.find((c) => c.yaInscrito);
  const preInscritoSlots = new Set();
  if (preInscrito && Array.isArray(preInscrito.secciones) && preInscrito.secciones.length > 0) {
    const preSec =
      preInscrito.secciones.find((s) => s.seccion === preInscrito.seccionInscrita) ||
      preInscrito.secciones[0];
    (preSec.bloques || []).forEach((b) => preInscritoSlots.add(`${b.dia}-${b.bloqueId}`));
  }

  const configs = [
    {
      id: 'pkg-manana',
      name: 'Paquete 1: Bloque Diurno Mañana',
      badge: 'Jornada Mañana',
      jornada: 'Diurno',
      color: 'emerald',
      description:
        `Cursos en horario matutino (08:31 - 12:50 hrs). ${diffConfig.badge} coordinados sin topes.`,
      filterBlock: (bId) => ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'].includes(bId),
    },
    {
      id: 'pkg-media-tarde',
      name: 'Paquete 2: Bloque Media Tarde',
      badge: 'Media Tarde',
      jornada: 'Diurno',
      color: 'blue',
      description:
        `Cursos planificados entre 13:01 y 16:40 hrs. Diseñado para evitar traslados matutinos.`,
      filterBlock: (bId) => ['b7', 'b8', 'b9', 'b10'].includes(bId),
    },
    {
      id: 'pkg-tarde',
      name: 'Paquete 3: Bloque Tarde',
      badge: 'Jornada Tarde',
      jornada: 'Diurno',
      color: 'amber',
      description:
        `Cursos en la segunda mitad de la tarde (16:41 - 19:40 hrs). Ideal para liberar mañanas.`,
      filterBlock: (bId) => ['b11', 'b12', 'b13', 'b14'].includes(bId),
    },
    {
      id: 'pkg-vespertino',
      name: 'Paquete 4: Bloque Vespertino',
      badge: 'Jornada Vespertina',
      jornada: 'Vespertino',
      color: 'purple',
      description:
        `Asignaturas en horario vespertino (19:01 - 21:50 hrs). Compatibilidad laboral garantizada.`,
      filterBlock: (bId) => ['b14', 'b15', 'b16', 'b17'].includes(bId),
    },
  ];

  // Asignaturas curriculares requeridas para esta sesión (uniformes en todos los paquetes)
  const targetSubjects = coursesToUse.slice(0, requiredRegularCount);

  return configs.map((cfg, pIdx) => {
    const selected = [];
    const occupiedSlots = new Set(preInscritoSlots);

    // Iterar de forma consistente sobre las mismas asignaturas curriculares del paquete
    for (const course of targetSubjects) {
      if (selected.length >= requiredRegularCount) break;
      if (selected.some((s) => s.sigla === course.sigla)) continue;

      const eligibleSections = (course.secciones || [])
        .filter((sec) => !sec.sinCupos && (sec.bloques || []).length > 0)
        .sort((s1, s2) => {
          const match1 = (s1.bloques || []).some((b) => cfg.filterBlock(b.bloqueId)) ? 1 : 0;
          const match2 = (s2.bloques || []).some((b) => cfg.filterBlock(b.bloqueId)) ? 1 : 0;
          return match2 - match1;
        });

      for (const sec of eligibleSections) {
        const hasConflict = (sec.bloques || []).some((b) =>
          occupiedSlots.has(`${b.dia}-${b.bloqueId}`)
        );

        if (!hasConflict) {
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
          break;
        }
      }
    }

    // Si faltaron asignaturas para cumplir el objetivo regular, completar sin choque desde coursesToUse
    if (selected.length < requiredRegularCount) {
      for (const course of coursesToUse) {
        if (selected.length >= requiredRegularCount) break;
        if (selected.some((s) => s.sigla === course.sigla)) continue;

        for (const sec of course.secciones || []) {
          if (sec.sinCupos || !(sec.bloques || []).length) continue;
          const hasConflict = (sec.bloques || []).some((b) =>
            occupiedSlots.has(`${b.dia}-${b.bloqueId}`)
          );
          if (!hasConflict) {
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
            break;
          }
        }
      }
    }

    // Agregar Práctica Laboral si la dificultad lo requiere
    if (diffConfig.hasPracticaLaboral) {
      selected.push({
        sigla: PRACTICA_LABORAL_COURSE.sigla,
        nombre: PRACTICA_LABORAL_COURSE.nombre,
        creditos: PRACTICA_LABORAL_COURSE.creditos,
        tipo: 'practica',
        seccion: PRACTICA_LABORAL_COURSE.secciones[0].seccion,
        profesor: PRACTICA_LABORAL_COURSE.secciones[0].profesor,
        sala: PRACTICA_LABORAL_COURSE.secciones[0].sala,
        horarioTexto: PRACTICA_LABORAL_COURSE.secciones[0].horarioTexto,
        bloques: [],
        detallePractica: PRACTICA_LABORAL_COURSE.secciones[0].detallePractica,
      });
    }

    // Agregar Práctica Profesional si la dificultad lo requiere
    if (diffConfig.hasPracticaProfesional) {
      selected.push({
        sigla: PRACTICA_PROFESIONAL_COURSE.sigla,
        nombre: PRACTICA_PROFESIONAL_COURSE.nombre,
        creditos: PRACTICA_PROFESIONAL_COURSE.creditos,
        tipo: 'practica',
        seccion: PRACTICA_PROFESIONAL_COURSE.secciones[0].seccion,
        profesor: PRACTICA_PROFESIONAL_COURSE.secciones[0].profesor,
        sala: PRACTICA_PROFESIONAL_COURSE.secciones[0].sala,
        horarioTexto: PRACTICA_PROFESIONAL_COURSE.secciones[0].horarioTexto,
        bloques: [],
        detallePractica: PRACTICA_PROFESIONAL_COURSE.secciones[0].detallePractica,
      });
    }

    return {
      id: cfg.id,
      name: cfg.name,
      badge: `${cfg.badge} • ${diffConfig.name}`,
      jornada: cfg.jornada,
      color: cfg.color,
      description: cfg.description,
      difficulty: diffConfig.id,
      targetCourses: selected,
    };
  });
}

