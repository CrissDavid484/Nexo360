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
  rut: '192767350',
  rutFormateado: '19.276.735-0',
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
 * Función que retorna asignaturas aleatorias según la carrera elegida
 */
export function getRandomCoursesForCareer(carreraNombre, limit = 7) {
  const norm = (carreraNombre || '').toLowerCase();
  let pool = [];

  if (norm.includes('infraestructura') || norm.includes('plataformas')) {
    pool = [...CATALOGO_INFRAESTRUCTURA_TECNOLOGICA];
  } else if (norm.includes('informática') || norm.includes('informatica')) {
    pool = [...ASIGNATURAS_DISPONIBLES];
  } else {
    // Combinado variado
    pool = [...CATALOGO_INFRAESTRUCTURA_TECNOLOGICA, ...ASIGNATURAS_DISPONIBLES];
  }

  // Barajado aleatorio Fisher-Yates
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selected = shuffled.slice(0, Math.min(limit, shuffled.length));

  // Simular auténticamente 1 asignatura previamente inscrita
  return selected.map((item, idx) => ({
    ...item,
    yaInscrito: idx === 0,
    seccionInscrita: idx === 0 && item.secciones[0] ? item.secciones[0].seccion : undefined,
  }));
}

