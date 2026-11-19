import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../../');

console.log('--- RUNNING NEXO360 DASHBOARD-SIMULATOR VERIFICATION SUITE ---');

// 1. BibliotecaView.jsx test
const biblioPath = path.join(rootDir, 'frontend/src/components/views/BibliotecaView.jsx');
const biblioContent = fs.readFileSync(biblioPath, 'utf-8');
assert.ok(biblioContent.includes('21.987.654-3'), 'BibliotecaView must include RUT 21.987.654-3');
assert.ok(!biblioContent.includes('19.276.735-0'), 'BibliotecaView must not include old RUT 19.276.735-0');
console.log('✓ Test 1: BibliotecaView default student RUT updated to 21.987.654-3');

// 2. duocModulesData.js test
const modulesPath = path.join(rootDir, 'frontend/src/data/duocModulesData.js');
const modulesContent = fs.readFileSync(modulesPath, 'utf-8');
assert.ok(
  modulesContent.includes('https://experienciavivo.duoc.cl/alumnos/certificados'),
  'duocModulesData must include certificados URL'
);
assert.ok(
  modulesContent.includes('certificados de notas') || modulesContent.includes('certificado de notas'),
  'duocModulesData must include certificados intent keywords'
);
console.log('✓ Test 2: duocModulesData intentionality search for certificados de notas and direct Vivo Duoc link verified');

// 3. DashboardPage.jsx test
const dashboardPath = path.join(rootDir, 'frontend/src/pages/DashboardPage.jsx');
const dashboardContent = fs.readFileSync(dashboardPath, 'utf-8');
assert.ok(
  dashboardContent.includes('Para acceder al Simulador de Toma de Ramos debes acercarte a coordinación o administración para registrar tu cuenta oficial en Nexo360.'),
  'DashboardPage must show required access control message for unregistered users'
);
assert.ok(
  dashboardContent.includes('Hola,') && (dashboardContent.includes('user?.name') || dashboardContent.includes('userName') || dashboardContent.includes('displayGreetingName')),
  'DashboardPage must have dynamic student greeting'
);
assert.ok(
  dashboardContent.includes('GraduationCap'),
  'DashboardPage must properly import and use GraduationCap'
);
console.log('✓ Test 3: Dashboard greeting and simulator access control modal verified');

// 4. tomaRamosData.js imports and functions test
const {
  DIFFICULTY_LEVELS,
  getBoletinSemesterTitle,
  formatStudentNameForBoletin,
  generateTargetPackages,
  getRandomCoursesForCareer,
  TOMA_RAMOS_ESTUDIANTE,
} = await import('../data/tomaRamosData.js');

// 4.1 Difficulty levels
assert.strictEqual(DIFFICULTY_LEVELS.length, 4, 'Must have 4 difficulty levels');
const facil = DIFFICULTY_LEVELS.find((d) => d.id === 'facil');
const intermedio = DIFFICULTY_LEVELS.find((d) => d.id === 'intermedio');
const dificil = DIFFICULTY_LEVELS.find((d) => d.id === 'dificil');
const muyDificil = DIFFICULTY_LEVELS.find((d) => d.id === 'muy-dificil');

assert.strictEqual(facil.regularCount, 3, 'Fácil has 3 regular courses');
assert.strictEqual(intermedio.regularCount, 4, 'Intermedio has 4 regular courses');
assert.strictEqual(intermedio.hasPracticaLaboral, true, 'Intermedio has práctica laboral');
assert.strictEqual(dificil.regularCount, 8, 'Difícil has 8 regular courses');
assert.strictEqual(muyDificil.regularCount, 8, 'Muy Difícil has 8 regular courses');
assert.strictEqual(muyDificil.hasPracticaLaboral, true, 'Muy Difícil has práctica laboral');
assert.strictEqual(muyDificil.hasPracticaProfesional, true, 'Muy Difícil has práctica profesional');
console.log('✓ Test 4.1: DIFFICULTY_LEVELS definitions verified');

// 4.2 Boletin dynamic semester title
const date1er = new Date(2026, 2, 10); // March 10
assert.ok(getBoletinSemesterTitle(date1er).includes('1er Sem.'), 'March should be 1er Sem.');
const date1erLimit = new Date(2026, 6, 15); // July 15 (month index 6)
assert.ok(getBoletinSemesterTitle(date1erLimit).includes('1er Sem.'), 'July 15 should be 1er Sem.');
const date2do = new Date(2026, 6, 16); // July 16 (month index 6)
assert.ok(getBoletinSemesterTitle(date2do).includes('2do Sem.'), 'July 16 should be 2do Sem.');
const date2doLimit = new Date(2026, 11, 21); // Dec 21 (month index 11)
assert.ok(getBoletinSemesterTitle(date2doLimit).includes('2do Sem.'), 'Dec 21 should be 2do Sem.');
console.log('✓ Test 4.2: getBoletinSemesterTitle date ranges verified');

// 4.3 Student name formatting
assert.strictEqual(formatStudentNameForBoletin('CRISTIAN GUZMAN'), 'GUZMAN, CRISTIAN');
assert.strictEqual(formatStudentNameForBoletin('CRISTIAN DAVID GUZMAN GARCIA'), 'GUZMAN GARCIA, CRISTIAN DAVID');
console.log('✓ Test 4.3: formatStudentNameForBoletin verified');

// 4.4 RUT
assert.strictEqual(TOMA_RAMOS_ESTUDIANTE.rutFormateado, '21.987.654-3', 'TOMA_RAMOS_ESTUDIANTE rutFormateado must be 21.987.654-3');
console.log('✓ Test 4.4: TOMA_RAMOS_ESTUDIANTE RUT verified');

// 4.5 Package generation across all 4 levels
for (const diff of ['facil', 'intermedio', 'dificil', 'muy-dificil']) {
  const courses = getRandomCoursesForCareer('Ingeniería en Informática', 8, diff);
  const packages = generateTargetPackages(courses, diff);
  assert.ok(packages.length > 0, `Must generate packages for difficulty ${diff}`);
  for (const pkg of packages) {
    assert.ok(pkg.targetCourses.length >= 3, `Package ${pkg.id} must have courses`);
    // Ensure no internal schedule collisions
    const occupied = new Set();
    for (const c of pkg.targetCourses) {
      for (const b of c.bloques || []) {
        const slot = `${b.dia}-${b.bloqueId}`;
        assert.ok(!occupied.has(slot), `Package ${pkg.id} has block collision on slot ${slot}`);
        occupied.add(slot);
      }
    }
  }
}
console.log('✓ Test 4.5: generateTargetPackages collision-free across all 4 difficulties verified');

// 5. TomaRamosSimulator.jsx code checks
const simPath = path.join(rootDir, 'frontend/src/components/simulation/TomaRamosSimulator.jsx');
const simContent = fs.readFileSync(simPath, 'utf-8');
assert.ok(simContent.includes('duoc-uc-logo-boletin.png'), 'TomaRamosSimulator must reference duoc-uc-logo-boletin.png');
assert.ok(simContent.includes('getBoletinSemesterTitle'), 'TomaRamosSimulator must use getBoletinSemesterTitle');
assert.ok(simContent.includes('formatStudentNameForBoletin'), 'TomaRamosSimulator must use formatStudentNameForBoletin');
assert.ok(simContent.includes('Nom. Asignatura:'), 'TomaRamosSimulator must display Nom. Asignatura: in pre-flow header');
assert.ok(simContent.includes('Sección:'), 'TomaRamosSimulator must display Sección: in pre-flow header');
assert.ok(simContent.includes('bg-[#1b5e20]'), 'TomaRamosSimulator must have green header band');
assert.ok(simContent.includes('bg-[#FFB81C]'), 'TomaRamosSimulator must have yellow accent badge');
assert.ok(simContent.includes('adaptiveBlocks'), 'TomaRamosSimulator must calculate adaptive schedule blocks');
assert.ok(simContent.includes('selectedDifficulty'), 'TomaRamosSimulator must handle selectedDifficulty');
assert.ok(!simContent.includes('Detalle de Asignaturas Inscritas'), 'TomaRamosSimulator must not include redundant Detalle de Asignaturas Inscritas table in Boletín');
assert.ok(simContent.includes('asignaturasParaTomar'), 'TomaRamosSimulator must limit selectable courses to package courses and pre-enrolled course');
console.log('✓ Test 5: TomaRamosSimulator UI components, institutional logo, headers and adaptive grid verified');

// 6. ServiciosDigitalesTicketsView.jsx ticket link check
const ticketsPath = path.join(rootDir, 'frontend/src/components/views/ServiciosDigitalesTicketsView.jsx');
const ticketsContent = fs.readFileSync(ticketsPath, 'utf-8');
assert.ok(
  ticketsContent.includes('https://centroayuda.duoc.cl/hc/es-419/requests/new?ticket_form_id='),
  'ServiciosDigitalesTicketsView must have exact ticket URL requested'
);
console.log('✓ Test 6: ServiciosDigitalesTicketsView ticket button link verified');

console.log('\n--- ALL VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
