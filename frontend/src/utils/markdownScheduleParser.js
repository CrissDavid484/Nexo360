/**
 * Utilidades para parseo de horarios académicos en formato Markdown (.md)
 * Extraído de CoursesAdminSection para modularidad, reutilización y cero duplicación.
 */

/**
 * Utilidad para limpiar celdas de Markdown (elimina asteriscos negrita y espacios)
 */
export const cleanMdCell = (cell) => {
  if (!cell) return '';
  return String(cell).replace(/^\*\*|\*\*$/g, '').trim();
};

/**
 * Helper reutilizable para extraer filas limpias de cualquier sección de tabla Markdown
 */
export const extractRowCells = (lines, startIdx, endIdx) => {
  const result = [];
  for (let j = startIdx; j < endIdx; j++) {
    const l = lines[j];
    if (l && l.startsWith('|') && !l.includes(':-') && !l.includes('**') && !l.includes('![')) {
      const cells = l.split('|').slice(1, -1).map(cleanMdCell);
      if (cells.length > 0) {
        result.push(cells);
      }
    }
  }
  return result;
};

/**
 * Parser de horarios en formato Markdown:
 * Soporta tanto tablas segmentadas horizontalmente (como 'ALAMEDA 2026 002.md')
 * como tablas Markdown unificadas tradicionales con todas las columnas juntas.
 */
export const parseMarkdownSchedule = (mdText) => {
  if (!mdText || typeof mdText !== 'string') return [];
  const lines = mdText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const isChunked = lines.some(
    (l) => l.includes('**Nombre Asignatura**') || l.includes('Nombre Asignatura')
  );

  // 1. Tabla Markdown unificada estándar
  if (!isChunked) {
    const tableLines = lines.filter(
      (l) => l.startsWith('|') && l.endsWith('|') && !l.includes(':-')
    );
    if (tableLines.length < 2) return [];

    const headerCells = tableLines[0].split('|').slice(1, -1).map(cleanMdCell);

    const rows = [];
    for (let i = 1; i < tableLines.length; i++) {
      const cells = tableLines[i].split('|').slice(1, -1).map(cleanMdCell);
      if (cells.length < 2) continue;

      const getVal = (possibleNames) => {
        const foundIdx = headerCells.findIndex((h) =>
          possibleNames.some(
            (p) => h.toLowerCase().replace(/[\s_.-]/g, '') === p.toLowerCase()
          )
        );
        return foundIdx !== -1 && cells[foundIdx] !== undefined ? cells[foundIdx] : '';
      };

      const sigla = getVal(['siglaasignatura', 'sigla', 'codigo']);
      const nombre = getVal(['nombreasignatura', 'nombre', 'asignatura']);
      const seccion = getVal(['seccion', 'sección']) || `${sigla}-001D`;

      if (sigla) {
        rows.push({
          sede: getVal(['sede']) || 'ALAMEDA',
          carrera: getVal(['carrera', 'nombrecarrera']) || 'INGENIERÍA DUOC UC',
          plan: getVal(['plan']) || '',
          jornada: getVal(['jornada']) || 'Diurno',
          sigla,
          nombre: nombre || sigla,
          nivel: getVal(['nivel', 'semestre']) || 'Optativos',
          seccion,
          horario: getVal(['horario', 'bloquehorario']) || '',
          docente: getVal(['docente', 'profesor']) || 'DOCENTE ASIGNADO',
          modalidad:
            getVal(['asignaturavirtualsincronica', 'modalidad', 'tipo']) || 'PRESENCIAL',
        });
      }
    }
    return rows;
  }

  // 2. Parser para tablas Markdown segmentadas horizontalmente (Duoc Alameda)
  const rows = [];
  const headerIndices = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('Sigla Asignatura') || l.includes('**Sigla**')) {
      headerIndices.push({ type: 'c1', idx: i });
    } else if (l.includes('Nombre Asignatura') && l.includes('Sección')) {
      headerIndices.push({ type: 'c2', idx: i });
    } else if (
      l.includes('Horario') &&
      (l.includes('Docente') || l.includes('VIRTUAL') || l.includes('SINCRONICA'))
    ) {
      headerIndices.push({ type: 'c3', idx: i });
    } else if (l.includes('Sección') && l.includes('Horario')) {
      headerIndices.push({ type: 'c23', idx: i });
    }
  }

  let p = 0;
  while (p < headerIndices.length) {
    const h1 = headerIndices[p];
    if (h1 && h1.type === 'c1') {
      const h2 = headerIndices[p + 1];
      const h3 = headerIndices[p + 2];

      if (h2 && h2.type === 'c2' && h3 && h3.type === 'c3') {
        const c1Rows = extractRowCells(lines, h1.idx + 1, h2.idx).map((cells) => ({
          sede: cells[0] || 'ALAMEDA',
          carrera: cells[1] || 'INGENIERÍA DUOC UC',
          plan: cells[2] || '',
          jornada: cells[3] || 'Diurno',
          sigla: cells[4] || '',
        }));

        const c2Rows = extractRowCells(lines, h2.idx + 1, h3.idx).map((cells) => ({
          nombre: cells[0] || '',
          nivel: cells[1] || 'Optativos',
          seccion: cells[2] || '',
        }));

        const endIdx = p + 3 < headerIndices.length ? headerIndices[p + 3].idx : lines.length;
        const c3Rows = extractRowCells(lines, h3.idx + 1, endIdx).map((cells) => ({
          horario: cells[0] || '',
          docente: cells[1] || 'DOCENTE ASIGNADO',
          modalidad: cells[2] || 'ONLINE SINCRONA',
        }));

        const minLen = Math.min(c1Rows.length, c2Rows.length, c3Rows.length);
        for (let k = 0; k < minLen; k++) {
          if (c1Rows[k].sigla) {
            rows.push({
              ...c1Rows[k],
              ...c2Rows[k],
              ...c3Rows[k],
            });
          }
        }
        p += 3;
        continue;
      } else if (h2 && h2.type === 'c23') {
        const c1Rows = extractRowCells(lines, h1.idx + 1, h2.idx).map((cells) => ({
          sede: cells[0] || 'ALAMEDA',
          carrera: cells[1] || 'INGENIERÍA DUOC UC',
          plan: cells[2] || '',
          jornada: cells[3] || 'Diurno',
          sigla: cells[4] || '',
        }));

        const endIdx = p + 2 < headerIndices.length ? headerIndices[p + 2].idx : lines.length;
        const c23Rows = extractRowCells(lines, h2.idx + 1, endIdx).map((cells) => ({
          seccion: cells[0] || '',
          horario: cells[1] || '',
          docente: cells[2] || 'DOCENTE ASIGNADO',
          nombre: cells[0] || '',
          nivel: 'Optativo',
          modalidad: 'PRESENCIAL',
        }));

        const minLen = Math.min(c1Rows.length, c23Rows.length);
        for (let k = 0; k < minLen; k++) {
          if (c1Rows[k].sigla) {
            rows.push({
              ...c1Rows[k],
              ...c23Rows[k],
            });
          }
        }
        p += 2;
        continue;
      }
    }
    p++;
  }

  return rows.filter((r) => r.sigla);
};

export default parseMarkdownSchedule;