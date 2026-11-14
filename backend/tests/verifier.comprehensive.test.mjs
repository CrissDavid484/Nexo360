import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const projectRootDir = path.resolve(backendDir, '..');

test('AUDITORÍA INTEGRAL VERIFIER: Nexo360 - Ingesta Alameda 2026, Backend, Frontend & Simulador', async (t) => {
  await t.test('1. [DATA INTEGRITY] Catálogo Alameda 2026 parseado sin pérdida de datos', () => {
    const seedPath = path.resolve(backendDir, 'data/alameda2026Seed.json');
    assert.ok(fs.existsSync(seedPath), 'El archivo alameda2026Seed.json debe existir');

    const seed = JSON.parse(fs.readFileSync(seedPath, 'utf8'));
    assert.strictEqual(seed.length, 7174, 'Debe contener exactamente 7,174 ofertas de cursos');

    // Comprobar campos obligatorios en cada fila
    let sinSigla = 0, sinNombre = 0, sinSeccion = 0, sinHorario = 0, sinCarrera = 0;
    const carreras = new Set();
    const siglas = new Set();
    const secciones = new Set();
    const carreraSecciones = new Set();

    for (const item of seed) {
      if (!item.sigla) sinSigla++;
      if (!item.nombre) sinNombre++;
      if (!item.seccion) sinSeccion++;
      if (!item.horarioRaw) sinHorario++;
      if (!item.carrera) sinCarrera++;
      carreras.add(item.carrera);
      siglas.add(item.sigla);
      secciones.add(item.seccion);
      carreraSecciones.add(`${item.carrera}||${item.sigla}||${item.seccion}`);
    }

    assert.strictEqual(sinSigla, 0, 'No debe haber filas sin sigla');
    assert.strictEqual(sinNombre, 0, 'No debe haber filas sin nombre de asignatura');
    assert.strictEqual(sinSeccion, 0, 'No debe haber filas sin sección');
    assert.strictEqual(sinHorario, 0, 'No debe haber filas sin horario');
    assert.strictEqual(sinCarrera, 0, 'No debe haber filas sin carrera');

    assert.ok(carreras.size >= 20, `Debe haber al menos 20 carreras detectadas (actual: ${carreras.size})`);
    assert.strictEqual(secciones.size, 1100, 'Debe haber exactamente 1,100 códigos de sección únicos globales');
    assert.strictEqual(carreraSecciones.size, 2389, 'Debe haber exactamente 2,389 secciones consolidadas por carrera');

    // Validar carreras críticas
    const carrerasList = Array.from(carreras);
    assert.ok(carrerasList.some(c => c.includes('INFRAESTRUCTURA TECNOLÓGICA')), 'Debe incluir Infraestructura Tecnológica');
    assert.ok(carrerasList.some(c => c.includes('INFORMÁTICA')), 'Debe incluir Informática');
    assert.ok(carrerasList.some(c => c.includes('CONSTRUCCIÓN')), 'Debe incluir Construcción');
    assert.ok(carrerasList.some(c => c.includes('ANALISTA PROGRAMADOR')), 'Debe incluir Analista Programador');
  });

  await t.test('2. [SIMULATOR DATA] Estructura de tomaRamosData.js y bloques horarios oficiales', async () => {
    const tomaRamosPath = path.resolve(projectRootDir, 'frontend/src/data/tomaRamosData.js');
    assert.ok(fs.existsSync(tomaRamosPath), 'frontend/src/data/tomaRamosData.js debe existir');

    const content = fs.readFileSync(tomaRamosPath, 'utf8');
    assert.ok(content.includes('CARRERAS_DUOC'), 'Debe exportar CARRERAS_DUOC');
    assert.ok(content.includes('BLOQUES_HORARIOS_TOMA'), 'Debe exportar BLOQUES_HORARIOS_TOMA');
    assert.ok(content.includes('CATALOGO_INFRAESTRUCTURA_TECNOLOGICA'), 'Debe exportar CATALOGO_INFRAESTRUCTURA_TECNOLOGICA');
    assert.ok(content.includes('getRandomCoursesForCareer'), 'Debe exportar getRandomCoursesForCareer');
    assert.ok(content.includes('b17'), 'Debe contener bloques horarios hasta b17');
  });

  await t.test('3. [SERVICE & API] courseService y endpoints para simulación', async () => {
    const courseService = (await import('../services/courseService.js')).default || (await import('../services/courseService.js'));
    const simulationCourses = await courseService.getCoursesForSimulation({
      carrera: 'INGENIERÍA EN INFORMÁTICA',
      random: true,
      limit: 7,
    });

    assert.ok(Array.isArray(simulationCourses), 'Debe retornar un array');
    assert.ok(simulationCourses.length >= 5 && simulationCourses.length <= 8, `Debe retornar entre 5 y 8 cursos (actual: ${simulationCourses.length})`);

    const sample = simulationCourses[0];
    assert.ok(sample.sigla, 'El curso debe tener sigla');
    assert.ok(sample.nombre, 'El curso debe tener nombre');
    assert.ok(Array.isArray(sample.secciones), 'El curso debe tener array de secciones');
    assert.ok(sample.secciones.length > 0, 'Debe tener al menos una sección');
    assert.ok(sample.secciones[0].bloques, 'La sección debe tener bloques horarios asignados');
    assert.ok(sample.yaInscrito === true, 'El primer curso debe estar marcado como yaInscrito para realismo');
  });

  await t.test('4. [FRONTEND ADMIN] Accesibilidad WCAG 2.2 AAA y componentes en CoursesAdminSection.jsx', () => {
    const adminCompPath = path.resolve(projectRootDir, 'frontend/src/components/admin/CoursesAdminSection.jsx');
    assert.ok(fs.existsSync(adminCompPath), 'CoursesAdminSection.jsx debe existir');

    const code = fs.readFileSync(adminCompPath, 'utf8');
    // Chequear accesibilidad
    assert.ok(code.includes('focus-visible:ring-4'), 'Debe contener anillos de foco visibles ring-4');
    assert.ok(code.includes('aria-label'), 'Debe contener etiquetas ARIA');
    assert.ok(code.includes('replaceCatalog'), 'Debe contener estado replaceCatalog');
    assert.ok(code.includes('Sobreescribir catálogo anterior'), 'Debe contener texto para reemplazar datos');
    assert.ok(code.includes('.xlsx'), 'Debe soportar .xlsx');
    assert.ok(code.includes('.md'), 'Debe soportar .md');
    assert.ok(code.includes('Descargar .md'), 'Debe ofrecer descarga de Markdown');
  });
});
