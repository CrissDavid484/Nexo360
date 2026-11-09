/**
 * Datos estructurados para el Simulador de Toma de Ramos Duoc UC
 * Fiel a las pantallas oficiales de Inscripción de Asignaturas de Duoc UC
 * y al video tutorial oficial (https://www.youtube.com/watch?v=2vwT2RCj3FA).
 */

export const TOMA_RAMOS_TUTORIAL_VIDEO = {
  videoId: '2vwT2RCj3FA',
  url: 'https://www.youtube.com/watch?v=2vwT2RCj3FA',
  embedUrl: 'https://www.youtube-nocookie.com/embed/2vwT2RCj3FA?rel=0',
  title: 'Video Tutorial: Cómo inscribir tus ramos en Duoc UC (Toma de Ramos)',
  duracion: '3:45 min',
  pasosClave: [
    {
      paso: '1. Verificación de requisitos',
      descripcion: 'Asegúrate de no tener cuotas pendientes de matrícula o aranceles, y que tu matrícula o beneficio (Gratuidad/CAE) esté al día sin bloqueos académicos.',
    },
    {
      paso: '2. Tramo horario asignado',
      descripcion: 'La plataforma se habilita por tramos horarios según tu carrera, año y rendimiento. Respeta tu bloque para asegurar las vacantes.',
    },
    {
      paso: '3. Selección con iconito mano/cubo (🖐️📦)',
      descripcion: 'En la lista izquierda de asignaturas disponibles, haz clic en el icono de la mano con el cubito para abrir las secciones con cupos.',
    },
    {
      paso: '4. Elección de sección y profesor',
      descripcion: 'Revisa las vacantes disponibles, sala en Sede Alameda y el nombre del docente antes de seleccionar la sección.',
    },
    {
      paso: '5. Verificación de cuadrícula sin topes',
      descripcion: 'Comprueba que las clases seleccionadas se ubiquen en bloques sin cruzarse con otras asignaturas en el horario semanal.',
    },
    {
      paso: '6. Grabar y respaldar tu Boletín Oficial',
      descripcion: 'Haz clic en "Siguiente" y luego en "Grabar". Finalmente pulsa "Ver Horario" para visualizar y descargar tu Boletín de Carga Académica en PDF.',
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
    sigla: 'ASY4131',
    siglaEq: '',
    nombre: 'ARQUITECTURA DE SOFTWARE',
    creditos: 10,
    tipo: 'obligatorio',
    secciones: [
      {
        seccion: '003D',
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
        seccion: '002D',
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
