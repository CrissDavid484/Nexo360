/**
 * Utilidades de Identidad Estudiantil Duoc UC para Nexo360
 * - Algoritmo Módulo 11 para Dígito Verificador de RUT
 * - Generación de RUT simulado determinista (evita suplantación de datos personales)
 * - Conversión de correos institucionales a nombres humanos legibles
 * - Catálogo completo de Sedes y Carreras Oficiales Duoc UC
 */

export const DEFAULT_CAMPUS = 'Sede Alameda';

export const SEDES_DUOC = [DEFAULT_CAMPUS];

export const CARRERAS_DUOC_LIST = [
  'Actuación',
  'Administración de Empresas',
  'Administración Pública',
  'Administración Turística Internacional',
  'Analista Programador Computacional',
  'Animación Digital',
  'Artes Culinarias',
  'Auditoría y Análisis de Negocios',
  'Comunicación Audiovisual',
  'Construcción Civil',
  'Desarrollo y Diseño Web',
  'Dibujo y Modelamiento Arquitectónico y Estructural',
  'Diseño de Ambientes',
  'Diseño de Vestuario',
  'Diseño Gráfico',
  'Diseño Industrial e Innovación en Productos',
  'Ecoturismo',
  'Gastronomía Internacional',
  'Ilustración para Contextos Globales',
  'Informática Biomédica',
  'Ingeniería Agrícola',
  'Ingeniería en Administración',
  'Ingeniería en Automatización y Control Industrial',
  'Ingeniería en Ciberseguridad',
  'Ingeniería en Ciencia de Datos',
  'Ingeniería en Comercio Exterior',
  'Ingeniería en Conectividad y Redes',
  'Ingeniería en Construcción',
  'Ingeniería en Control de Gestión',
  'Ingeniería en Desarrollo de Software',
  'Ingeniería en Electricidad y Automatización Industrial',
  'Ingeniería en Gestión Logística',
  'Ingeniería en Informática',
  'Ingeniería en Infraestructura Tecnológica',
  'Ingeniería en Mantenimiento Industrial',
  'Ingeniería en Maquinaria y Vehículos Pesados',
  'Ingeniería en Marketing Digital',
  'Ingeniería en Mecánica Automotriz y Autotrónica',
  'Ingeniería en Medio Ambiente',
  'Ingeniería en Minas',
  'Ingeniería en Prevención de Riesgos',
  'Ingeniería en Recursos Naturales y Sostenibilidad',
  'Ingeniería en Redes y Telecomunicaciones',
  'Ingeniería en Sonido',
  'Ingeniería Industrial',
  'Periodismo Digital',
  'Preparador Físico',
  'Publicidad',
  'Relaciones Públicas y Comunicación Organizacional',
  'Restauración de Bienes Patrimoniales',
  'Técnico Audiovisual',
  'Técnico en Administración',
  'Técnico en Calidad de Alimentos',
  'Técnico en Comercio Exterior',
  'Técnico en Conectividad y Redes',
  'Técnico en Construcción',
  'Técnico en Control y Monitoreo Remoto de Procesos Mineros',
  'Técnico en Desabolladura y Pintura Automotriz',
  'Técnico en Diseño Gráfico',
  'Técnico en Electricidad y Automatización Industrial',
  'Técnico en Electricidad y Energías Renovables',
  'Técnico en Enfermería',
  'Técnico en Gastronomía',
  'Técnico en Geología',
  'Técnico en Gestión de Personas',
  'Técnico en Gestión Logística',
  'Técnico en Infraestructura Tecnológica',
  'Técnico en Laboratorio Clínico, Banco de Sangre e Imagenología',
  'Técnico en Mantenimiento Electromecánico',
  'Técnico en Mantenimiento Industrial',
  'Técnico en Maquinaria y Vehículos Pesados',
  'Técnico en Mecánica Automotriz y Autotrónica',
  'Técnico en Odontología',
  'Técnico en Operación y Supervisión de Procesos Mineros',
  'Técnico en Operaciones Logísticas',
  'Técnico en Prevención de Riesgos Laborales',
  'Técnico en Química y Farmacia',
  'Técnico en Radiodiagnóstico y Radioterapia',
  'Técnico en Topografía y Geomática',
  'Técnico en Turismo y Hotelería',
  'Técnico Modelador Proyectista',
  'Técnico Veterinario y Pecuario',
  'Tecnología en Sonido e Iluminación',
  'Telecomunicaciones y Conectividad',
].sort((a, b) => a.localeCompare(b, 'es'));

/**
 * Cálculo del Dígito Verificador Módulo 11
 */
export function calculateRutDv(rutNumber) {
  let sum = 0;
  let multiplier = 2;
  let num = Math.floor(rutNumber);
  while (num > 0) {
    sum += (num % 10) * multiplier;
    num = Math.floor(num / 10);
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  if (remainder === 11) return '0';
  if (remainder === 10) return 'K';
  return remainder.toString();
}

/**
 * Generador determinista de RUT estudiantil en rango 20.xxx.xxx a 22.xxx.xxx
 */
export function generateSimulatedRut(email = '') {
  let hash = 0;
  const str = (email || '').toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = Math.trunc(hash);
  }
  const positiveHash = Math.abs(hash);
  const minNumber = 20000000;
  const maxNumber = 22500000;
  const rutNum = minNumber + (positiveHash % (maxNumber - minNumber));
  const dv = calculateRutDv(rutNum);
  const numStr = rutNum.toString();
  return `${numStr.slice(0, 2)}.${numStr.slice(2, 5)}.${numStr.slice(5, 8)}-${dv}`;
}

/**
 * Convierte un correo institucional Duoc UC en un nombre y apellido humanos
 */
export function parseDuocEmailToName(email = '') {
  const clean = (email || '').toLowerCase().trim();
  if (!clean || !clean.includes('@')) return 'Estudiante Duoc UC';
  const local = clean.split('@')[0];
  if (local === 'c.guzman' || local === 'cri.guzmang') return 'Cristian Guzmán';
  if (local === 'an.ordenesd') return 'Angelo Órdenes';

  const parts = local.split('.');
  if (parts.length >= 2) {
    let firstName = parts[0];
    let lastName = parts.slice(1).join(' ');

    const mapFirst = {
      an: 'Andrés',
      cr: 'Cristian',
      cri: 'Cristian',
      da: 'Daniela',
      ma: 'Matías',
      matias: 'Matías',
      va: 'Valentina',
      fe: 'Felipe',
      ju: 'Juan',
      ca: 'Carlos',
      ro: 'Roberto',
      pa: 'Patricia',
      c: 'Carlos',
      m: 'Manuel',
      d: 'David',
      f: 'Francisco',
      j: 'José',
      p: 'Pedro',
      v: 'Vicente',
    };

    if (mapFirst[firstName]) {
      firstName = mapFirst[firstName];
    } else {
      firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
    }

    if (lastName.length > 3 && /[a-z]$/i.test(lastName)) {
      const baseLastName = lastName.slice(0, -1);
      const secondInitial = lastName.slice(-1).toUpperCase();
      const capBase = baseLastName.charAt(0).toUpperCase() + baseLastName.slice(1);
      return `${firstName} ${capBase} ${secondInitial}.`;
    }

    const capLast = lastName.charAt(0).toUpperCase() + lastName.slice(1);
    return `${firstName} ${capLast}`;
  }

  return local.charAt(0).toUpperCase() + local.slice(1);
}

/**
 * Obtiene el nombre completo del estudiante directamente desde la base de datos
 */
export function getStudentDisplayName(user = {}) {
  if (!user) return 'Estudiante Duoc UC';
  const email = (user.email || user.emailDuoc || '').toLowerCase();
  const rawName = user.fullName || user.nombre;

  // Si el usuario tiene su nombre guardado en la BD (distinto a email o default), usarlo directamente
  if (rawName && !rawName.includes('@') && rawName !== 'Estudiante Duoc UC') {
    return rawName;
  }

  if (email) {
    return parseDuocEmailToName(email);
  }

  return 'Estudiante Duoc UC';
}

/**
 * Separa nombre de pila y apellido(s) para formularios oficiales
 */
export function splitStudentName(user = {}) {
  const fullName = getStudentDisplayName(user);
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
      fullName,
    };
  }
  return {
    firstName: parts[0] || 'Estudiante',
    lastName: '',
    fullName,
  };
}

/**
 * Obtiene el RUT del estudiante directamente desde la base de datos
 */
export function getStudentRut(user = {}) {
  if (user?.rut && typeof user.rut === 'string' && user.rut.trim()) {
    return user.rut.trim();
  }

  const email = (user?.email || user?.emailDuoc || '').toLowerCase();
  return email ? generateSimulatedRut(email) : '21.987.654-3';
}

function normalizeRutToken(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^0-9k]/g, '');
}

/**
 * Normaliza un perfil estudiantil para consumo homogéneo bajo piloto Sede Alameda.
 */
export function normalizeStudentProfile(raw = {}) {
  if (!raw || typeof raw !== 'object') {
    return {
      id: '',
      name: 'Estudiante Duoc UC',
      email: '',
      rut: '21.987.654-3',
      campus: DEFAULT_CAMPUS,
      sede: DEFAULT_CAMPUS,
      career: CARRERAS_DUOC_LIST[0] || '',
      photo: '',
    };
  }

  const email = String(raw.email || raw.emailDuoc || '').trim();
  const career = String(raw.career || raw.carrera || CARRERAS_DUOC_LIST[0] || '').trim();

  return {
    ...raw,
    id: raw.id || raw._id || '',
    email,
    name: getStudentDisplayName(raw),
    rut: getStudentRut(raw),
    campus: DEFAULT_CAMPUS,
    sede: DEFAULT_CAMPUS,
    career,
    photo: raw.photo || '',
  };
}

/**
 * Compara un RUT con una búsqueda ignorando puntos, guiones y mayúsculas.
 */
export function matchesRutQuery(rut, query) {
  const normalizedQuery = normalizeRutToken(query);
  if (!normalizedQuery) return true;
  return normalizeRutToken(rut).includes(normalizedQuery);
}

function readFileWithReader(file, mode, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No se proporcionó un archivo válido.'));
      return;
    }

    if (signal?.aborted) {
      reject(new DOMException('Lectura de archivo cancelada', 'AbortError'));
      return;
    }

    const reader = new FileReader();

    const cleanup = () => {
      signal?.removeEventListener('abort', handleAbort);
    };

    const handleAbort = () => {
      cleanup();
      try {
        reader.abort();
      } catch {
        // Ignorar abort en lectores ya finalizados
      }
      reject(new DOMException('Lectura de archivo cancelada', 'AbortError'));
    };

    reader.onload = () => {
      cleanup();
      resolve(reader.result);
    };

    reader.onerror = () => {
      cleanup();
      reject(reader.error || new Error('Error al leer el archivo.'));
    };

    if (signal) {
      signal.addEventListener('abort', handleAbort, { once: true });
    }

    if (mode === 'dataUrl') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  });
}

/**
 * Lee un File como Data URL con soporte de cancelación vía AbortSignal.
 */
export function readFileAsDataUrl(file, options = {}) {
  return readFileWithReader(file, 'dataUrl', options);
}

/**
 * Lee un File como texto plano con soporte de cancelación vía AbortSignal.
 */
export function readFileAsText(file, options = {}) {
  return readFileWithReader(file, 'text', options);
}

/**
 * Dispara la descarga segura de un Blob y libera la URL temporal en memoria.
 */
export function triggerBlobDownload(content, filename, mimeType = 'text/plain;charset=utf-8') {
  if (typeof document === 'undefined' || typeof URL === 'undefined') return;

  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  try {
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Copia texto al portapapeles de forma segura con fallback sin promesas colgadas.
 */
export async function copyTextSafely(text) {
  const value = String(text ?? '');
  if (!value) return false;

  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch (err) {
    console.warn('[studentUtils] Fallback de portapapeles activado:', err);
  }

  if (typeof document === 'undefined') return false;

  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);

  try {
    textarea.select();
    return document.execCommand('copy');
  } catch (err) {
    console.warn('[studentUtils] No se pudo copiar texto al portapapeles:', err);
    return false;
  } finally {
    textarea.remove();
  }
}
