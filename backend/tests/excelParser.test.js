const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const excelParser = require('../services/excelParserService');

describe('Excel & Markdown Parser Service (excelParserService)', () => {
  test('1. Bloques horarios estándar de Duoc UC (parseDuocSchedule)', () => {
    // Horario diurno de 2 bloques (08:31 a 09:50)
    const blocksDiurno = excelParser.parseDuocSchedule('Lu 8:31:00 - 9:50:00', 'AL-LAB');
    assert.strictEqual(blocksDiurno.length, 2, 'Debe identificar 2 bloques (b1 y b2)');
    assert.strictEqual(blocksDiurno[0].dia, 'Lunes');
    assert.strictEqual(blocksDiurno[0].bloqueId, 'b1');
    assert.strictEqual(blocksDiurno[1].bloqueId, 'b2');
    assert.strictEqual(blocksDiurno[0].salaCorta, 'AL-LAB');

    // Horario vespertino tardío con b17 y b18 (21:11 a 22:30)
    const blocksVesp = excelParser.parseDuocSchedule('Mi 21:11:00 - 22:30:00', 'ONLINE');
    assert.strictEqual(blocksVesp.length, 2, 'Debe identificar 2 bloques vespertinos (b17 y b18)');
    assert.strictEqual(blocksVesp[0].dia, 'Miércoles');
    assert.strictEqual(blocksVesp[0].bloqueId, 'b17');
    assert.strictEqual(blocksVesp[1].bloqueId, 'b18');

    // Asignatura virtual asincrónica o sin horario
    const blocksVirtual = excelParser.parseDuocSchedule('0:00:00 - 0:00:00');
    assert.strictEqual(blocksVirtual.length, 0, 'Asignatura sin bloque fijo debe retornar arreglo vacío');
  });

  test('2. Normalización de cabeceras flexibles (normalizeHeaderKey)', () => {
    assert.strictEqual(excelParser.normalizeHeaderKey('Sede'), 'sede');
    assert.strictEqual(excelParser.normalizeHeaderKey('**Carrera**'), 'carrera');
    assert.strictEqual(excelParser.normalizeHeaderKey('Sigla Asignatura'), 'sigla');
    assert.strictEqual(excelParser.normalizeHeaderKey('Nombre Asignatura'), 'nombre');
    assert.strictEqual(excelParser.normalizeHeaderKey('Sección'), 'seccion');
    assert.strictEqual(excelParser.normalizeHeaderKey('Horario'), 'horario');
    assert.strictEqual(excelParser.normalizeHeaderKey('Docente'), 'docente');
    assert.strictEqual(excelParser.normalizeHeaderKey('ASIGNATURA VIRTUAL SINCRONICA'), 'modalidad');
  });

  test('3. Conversión de XLSX a Markdown (xlsxToMarkdown)', () => {
    const ws = XLSX.utils.json_to_sheet([
      { Sede: 'ALAMEDA', Carrera: 'INGENIERÍA EN INFORMÁTICA', Sigla: 'ASY4131', Nombre: 'ARQUITECTURA DE SISTEMAS', Seccion: 'ASY4131-001D', Horario: 'Lu 8:31:00 - 9:50:00', Docente: 'PROFESOR DUOC' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Horarios');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const md = excelParser.xlsxToMarkdown(buffer);
    assert.ok(typeof md === 'string', 'Debe retornar un string');
    assert.ok(md.includes('| Sede | Carrera | Sigla | Nombre | Seccion | Horario | Docente |'), 'Debe contener cabecera Markdown');
    assert.ok(md.includes('ASY4131'), 'Debe contener los datos de la fila');
  });

  test('4. Parseo directo de XLSX Buffer (parseXlsxBuffer)', () => {
    const ws = XLSX.utils.json_to_sheet([
      { Sede: 'ALAMEDA', Carrera: 'INGENIERÍA EN INFORMÁTICA', Sigla: 'ASY4131', Nombre: 'ARQUITECTURA DE SISTEMAS', Seccion: 'ASY4131-001D', Horario: 'Lu 8:31:00 - 9:50:00', Docente: 'PROFESOR DUOC' },
      { Sede: 'ALAMEDA', Carrera: 'INGENIERÍA EN INFORMÁTICA', Sigla: 'ASY4131', Nombre: 'ARQUITECTURA DE SISTEMAS', Seccion: 'ASY4131-001D', Horario: 'Ju 8:31:00 - 9:50:00', Docente: 'PROFESOR DUOC' }
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test');
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const result = excelParser.parseXlsxBuffer(buffer);
    assert.strictEqual(result.totalRows, 2, 'Debe contener 2 filas de oferta');
    assert.strictEqual(result.consolidated.length, 1, 'Debe consolidar en 1 sección única');
    assert.strictEqual(result.consolidated[0].bloques.length, 4, 'Debe acumular 4 bloques (2 de Lunes + 2 de Jueves)');
  });

  test('5. Parseo de Tabla Markdown estándar (parseMarkdownTable)', () => {
    const md = `
| Sede | Carrera | Sigla | Nombre | Seccion | Horario | Docente |
| :-: | :-: | :-: | :-: | :-: | :-: | :-: |
| ALAMEDA | INGENIERÍA EN INFORMÁTICA | DSY2131 | DESARROLLO DE SOFTWARE | DSY2131-001D | Vi 8:31:00 - 9:50:00 | DOCENTE DUOC |
    `;
    const result = excelParser.parseMarkdownTable(md);
    assert.strictEqual(result.totalRows, 1);
    assert.strictEqual(result.offerings[0].sigla, 'DSY2131');
    assert.strictEqual(result.offerings[0].bloques.length, 2);
  });

  test('6. Verificación del Catálogo Semilla Oficial generado (alameda2026Seed.json)', () => {
    const seedPath = path.join(__dirname, '../data/alameda2026Seed.json');
    assert.ok(fs.existsSync(seedPath), 'El archivo alameda2026Seed.json debe existir');

    const seedData = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    assert.ok(Array.isArray(seedData), 'El catálogo debe ser un arreglo');
    assert.ok(seedData.length >= 7000, `Debe contener al menos 7000 filas (contiene ${seedData.length})`);

    // Comprobar carreras clave
    const carreras = new Set(seedData.map((s) => s.carrera));
    assert.ok(carreras.has('INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA'), 'Debe incluir Infraestructura Tecnológica');
    assert.ok(carreras.has('INGENIERÍA EN INFORMÁTICA'), 'Debe incluir Ingeniería en Informática');
    assert.ok(carreras.has('ANALISTA PROGRAMADOR'), 'Debe incluir Analista Programador');
    assert.ok(carreras.has('INGENIERÍA EN CONSTRUCCIÓN'), 'Debe incluir Ingeniería en Construcción');
    assert.ok(carreras.has('INGENIERÍA EN PREVENCIÓN DE RIESGOS'), 'Debe incluir Prevención de Riesgos');

    // Validar estructura de un elemento al azar
    const sample = seedData[100];
    assert.ok(sample.sede, 'Debe tener sede');
    assert.ok(sample.carrera, 'Debe tener carrera');
    assert.ok(sample.sigla, 'Debe tener sigla');
    assert.ok(sample.nombre, 'Debe tener nombre');
    assert.ok(sample.seccion, 'Debe tener seccion');
    assert.ok(sample.periodo === '2026 - 002', 'El periodo debe ser 2026 - 002');
    assert.ok(Array.isArray(sample.bloques), 'Bloques debe ser un arreglo');
  });
});
