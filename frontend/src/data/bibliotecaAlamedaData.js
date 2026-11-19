/**
 * Datos y configuración de Biblioteca Duoc UC - Sede Alameda
 * Integración con plataforma LibCal (lid=14008) sin scraping directo.
 * Cumplimiento WCAG 2.2 AAA y Ley N° 21.719.
 */

export const LIBCAL_ALAMEDA_CONFIG = {
  lid: 14008, // ID oficial de Biblioteca Sede Alameda en LibCal
  campusName: 'Sede Alameda',
  institution: 'Duoc UC',
  urls: {
    basePortal: 'https://bibliotecas.duoc.cl/reserva-sala',
    alamedaSpaces: 'https://agenda-bibliotecas.duoc.cl/reserve/spaces/alameda',
    accessibleBase: 'https://duoc.libcal.com/r/accessible',
    checkin: 'https://duoc.libcal.com/r/checkin',
    consultas: 'https://bibliotecas.duoc.cl',
    videoTutorial: 'https://www.youtube-nocookie.com/embed/SxU_2BFHVI4?rel=0',
    videoWatch: 'https://www.youtube.com/watch?v=SxU_2BFHVI4',
  },
};

/**
 * Genera el enlace directo a la vista accesible oficial de LibCal para una categoría.
 * @param {number} gid - ID de grupo/categoría en LibCal
 * @returns {string} URL accesible oficial
 */
export function getLibCalAccessibleUrl(gid = 31398) {
  return `${LIBCAL_ALAMEDA_CONFIG.urls.accessibleBase}?lid=${LIBCAL_ALAMEDA_CONFIG.lid}&gid=${gid}`;
}

/**
 * Catálogo institucional de categorías y espacios en Sede Alameda
 */
export const BIBLIOTECA_ALAMEDA_CATEGORIES = [
  {
    id: 'salas-estudio',
    gid: 31398, // GID oficial de Salas de estudio - Alameda
    name: 'Salas de estudio - Alameda',
    shortName: 'Salas de estudio',
    type: 'study-room',
    description: 'Espacios de trabajo colaborativo equipados para grupos de estudio presenciales.',
    capacityLabel: 'Hasta 6 personas por sala',
    maxCapacity: 6,
    equipmentSummary: 'Pizarra acrílica, tomas eléctricas y mobiliario ergonómico',
    spaces: [
      {
        id: 1,
        code: 'SALA-1',
        name: 'Sala de estudio 1',
        capacity: 6,
        accessible: true,
        power: true,
        whiteboard: true,
        screen: true,
        features: ['Accesibilidad Universal ♿', 'Tomas de Corriente 🔌', 'Pizarra 🖊️', 'Pantalla Proyección 🖥️'],
      },
      {
        id: 2,
        code: 'SALA-2',
        name: 'Sala de estudio 2',
        capacity: 6,
        accessible: true,
        power: true,
        whiteboard: true,
        screen: false,
        features: ['Accesibilidad Universal ♿', 'Tomas de Corriente 🔌', 'Pizarra 🖊️'],
      },
      {
        id: 3,
        code: 'SALA-3',
        name: 'Sala de estudio 3',
        capacity: 6,
        accessible: true,
        power: true,
        whiteboard: true,
        screen: false,
        features: ['Accesibilidad Universal ♿', 'Tomas de Corriente 🔌', 'Pizarra 🖊️'],
      },
      {
        id: 4,
        code: 'SALA-4',
        name: 'Sala de estudio 4',
        capacity: 6,
        accessible: true,
        power: true,
        whiteboard: true,
        screen: false,
        features: ['Accesibilidad Universal ♿', 'Tomas de Corriente 🔌', 'Pizarra 🖊️'],
      },
    ],
  },
  {
    id: 'lentes-vr',
    gid: 52104, // GID oficial de Lentes VR - Alameda
    name: 'Lentes VR - Alameda',
    shortName: 'Lentes VR',
    type: 'vr-headset',
    description: 'Equipamiento de Realidad Virtual para proyectos de innovación, simulación y aprendizaje inmersivo.',
    capacityLabel: '1 a 2 personas por kit',
    maxCapacity: 2,
    equipmentSummary: 'Visores Meta Quest con software educativo y tutorial de inducción',
    spaces: [
      {
        id: 101,
        code: 'VR-KIT-1',
        name: 'Kit Lentes VR 1',
        capacity: 2,
        accessible: true,
        power: true,
        whiteboard: false,
        screen: true,
        features: ['Visor VR Meta Quest 🥽', 'Mandos táctiles 🎮', 'Estación de carga ⚡', 'Inducción inicial 📖'],
      },
      {
        id: 102,
        code: 'VR-KIT-2',
        name: 'Kit Lentes VR 2',
        capacity: 2,
        accessible: true,
        power: true,
        whiteboard: false,
        screen: true,
        features: ['Visor VR Meta Quest 🥽', 'Mandos táctiles 🎮', 'Estación de carga ⚡', 'Inducción inicial 📖'],
      },
    ],
  },
];

/**
 * Bloques horarios oficiales de reserva (60 minutos por bloque)
 */
export const BIBLIOTECA_TIME_SLOTS = [
  '09:00 - 09:50',
  '10:00 - 10:50',
  '11:00 - 11:50',
  '12:00 - 12:50',
  '13:00 - 13:50',
  '14:00 - 14:50',
  '15:00 - 15:50',
  '16:00 - 16:50',
  '17:00 - 17:50',
  '18:00 - 18:50',
];

/**
 * Ocupaciones predeterminadas de demostración
 */
export const INITIAL_OCCUPIED_SLOTS = {
  '1-10:00 - 10:50': true,
  '1-11:00 - 11:50': true,
  '1-12:00 - 12:50': true,
  '2-14:00 - 14:50': true,
  '3-16:00 - 16:50': true,
  '101-11:00 - 11:50': true,
  '102-15:00 - 15:50': true,
};

/**
 * Genera un código de reserva realista estilo LibCal (ej. "2VF", "7KM", "9AX")
 * @returns {string} Código alfanumérico corto en mayúsculas
 */
export function generateRealisticLibcalCode() {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 3; i += 1) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * Texto de locución para el lector de voz en pasos de biblioteca
 */
export const BIBLIOTECA_VOICE_GUIDE_TEXT =
  'Instrucciones para reserva en Biblioteca Duoc UC Sede Alameda. ' +
  'Paso 1: Elige Salas de estudio o Lentes VR según lo que requieras. ' +
  'Paso 2: En la grilla selecciona tu sala o visor y el bloque horario disponible. ' +
  'Paso 3: Confirma con tu correo institucional. Recibirás tu código alfanumérico como 2VF. ' +
  'Paso 4: Al llegar a Biblioteca Alameda, ingresa a la pantalla de Check-in antes de 15 minutos para activar tu espacio.';
