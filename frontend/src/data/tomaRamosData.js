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
