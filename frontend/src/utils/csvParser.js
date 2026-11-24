/**
 * Utilidad ligera para parsear CSV en el navegador (sin dependencias externas).
 * Soporta comillas, campos con comas internas y saltos de línea en celdas.
 */

/**
 * Parsea una cadena CSV y devuelve un array de objetos.
 * @param {string} csvText - Texto CSV crudo
 * @returns {Array<Object>} Array de filas como objetos { header: value }
 */
export const parseCSV = (csvText) => {
  if (!csvText || typeof csvText !== 'string') return [];

  const lines = csvText.split(/\r?\n/);
  if (lines.length < 2) return [];

  // Encontrar la primera línea no vacía como header
  let headerLineIdx = 0;
  while (headerLineIdx < lines.length && !lines[headerLineIdx].trim()) {
    headerLineIdx++;
  }
  if (headerLineIdx >= lines.length) return [];

  const headers = parseCSVLine(lines[headerLineIdx]);
  if (!headers.length) return [];

  const rows = [];
  for (let i = headerLineIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const cells = parseCSVLine(line);
    if (!cells.length) continue;

    const row = {};
    headers.forEach((header, idx) => {
      const cleanHeader = header.trim().toLowerCase().replace(/[\s_.-]/g, '');
      row[cleanHeader] = cells[idx] !== undefined ? cells[idx].trim() : '';
    });

    // Solo agregar si tiene al menos un campo con datos
    if (Object.values(row).some(v => v !== '')) {
      rows.push(row);
    }
  }

  return rows;
};

/**
 * Parsea una sola línea CSV respetando comillas y escapes.
 * @param {string} line - Línea CSV
 * @returns {Array<string>} Array de celdas
 */
const parseCSVLine = (line) => {
  const cells = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Comilla escapada ("")
        current += '"';
        i++;
      } else {
        // Inicio/fin de campo entre comillas
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // Separador de campos
      cells.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  // Último campo
  cells.push(current);

  return cells;
};

/**
 * Normaliza las filas parseadas al formato esperado por el backend (importAdminCourses).
 * Mapea nombres de columnas comunes a los campos esperados.
 * @param {Array<Object>} rawRows - Filas parseadas del CSV
 * @returns {Array<Object>} Filas normalizadas
 */
export const normalizeCourseRows = (rawRows) => {
  if (!Array.isArray(rawRows)) return [];

  return rawRows.map((row) => {
    const getVal = (possibleKeys) => {
      for (const key of possibleKeys) {
        const normalizedKey = key.toLowerCase().replace(/[\s_.-]/g, '');
        if (row[normalizedKey] !== undefined && row[normalizedKey] !== '') {
          return row[normalizedKey];
        }
      }
      return '';
    };

    return {
      sede: getVal(['sede']) || 'ALAMEDA',
      carrera: getVal(['carrera', 'nombrecarrera']) || 'INGENIERÍA DUOC UC',
      plan: getVal(['plan']) || '',
      jornada: getVal(['jornada']) || 'Diurno',
      sigla: getVal(['sigla', 'siglaasignatura', 'codigo']),
      nombre: getVal(['nombre', 'nombreasignatura', 'asignatura']),
      nivel: getVal(['nivel', 'semestre']) || 'Optativos',
      seccion: getVal(['seccion', 'sección']) || '',
      horario: getVal(['horario', 'bloquehorario']) || '',
      docente: getVal(['docente', 'profesor']) || 'DOCENTE ASIGNADO',
      modalidad: getVal(['modalidad', 'tipologia', 'asignaturavirtualsincronica', 'tipo']) || 'PRESENCIAL',
    };
  }).filter(r => r.sigla); // Solo filas con sigla válida
};

export default { parseCSV, normalizeCourseRows };