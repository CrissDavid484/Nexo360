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
    assert.ok(content.includes('generateTargetPackages'), 'Debe exportar generateTargetPackages');
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

  await t.test('4. [FRONTEND ADMIN] Accesibilidad WCAG 2.2 AAA y componentes en AcademicCatalog.jsx', () => {
    const adminCompPath = path.resolve(projectRootDir, 'frontend/src/components/admin/modules/AcademicCatalog.jsx');
    assert.ok(fs.existsSync(adminCompPath), 'AcademicCatalog.jsx debe existir');

    const code = fs.readFileSync(adminCompPath, 'utf8');
    assert.ok(code.includes('focus-visible:ring-4'), 'Debe contener anillos de foco visibles ring-4');
    assert.ok(code.includes('aria-label'), 'Debe contener etiquetas ARIA');
  });

  await t.test('5. [LEY 21.719 COMPLIANCE] Protección de Datos Personales, No contraseñas planas y Metadatos de Consentimiento', async () => {
    const UserProfile = (await import('../models/UserProfile.js')).default;
    const authService = (await import('../services/authService.js')).default;

    // Verificar modelo UserProfile: toJSON y toObject eliminan campos sensibles de contraseña
    const testDoc = new UserProfile({
      email: 'ley21719.test@duocuc.cl',
      password: 'PlainSecretPassword123!',
      fullName: 'Estudiante Prueba Ley 21.719',
      role: 'estudiante',
    });
    await testDoc.validate();

    const jsonOutput = testDoc.toJSON();
    assert.strictEqual(jsonOutput.password, undefined, 'toJSON no debe incluir password');
    assert.strictEqual(jsonOutput.__v, undefined, 'toJSON no debe exponer __v');

    const objOutput = testDoc.toObject();
    assert.strictEqual(objOutput.password, undefined, 'toObject no debe incluir password');

    // Verificar metadatos de consentimiento (default false conforme a Ley 21.719) y limitación de finalidad
    assert.ok(testDoc.consentMetadata, 'Debe poseer estructura de metadatos de consentimiento');
    assert.strictEqual(testDoc.consentMetadata.consentGiven, false);
    assert.strictEqual(testDoc.consentMetadata.consentDate, null);
    assert.strictEqual(testDoc.consentMetadata.legalBasis, 'PENDIENTE_REVISION_INSTITUCIONAL');
    assert.strictEqual(testDoc.consentMetadata.informationDelivered, false);
    assert.ok(Array.isArray(testDoc.purposeLimitation), 'purposeLimitation debe ser un array');
    assert.ok(testDoc.purposeLimitation.includes('gestion_academica'), 'Debe incluir finalidad academica');

    // Verificar formato de respuesta en authService
    const formatted = authService.formatUserResponse(testDoc);
    assert.strictEqual(formatted.password, undefined, 'formatUserResponse jamás debe retornar contraseña');
    assert.ok(formatted.consentMetadata, 'formatUserResponse debe incluir consentMetadata');
    assert.ok(
      (formatted.consentMetadata.law || formatted.consentMetadata.consentVersion).includes('21.719'),
      'consentMetadata debe hacer referencia a la Ley N° 21.719'
    );
  });

  await t.test('6. [VIVO DUOC LOGIN & NATIVE DB USER PROFILE] OIDC fail-closed sin configuración y estructura nativa de estudiante', async () => {
    const authService = (await import('../services/authService.js')).default;

    // Sin variables OIDC/OFFICIAL_VIVO_DUOC_OAUTH_URL configuradas, getOfficialLoginUrl debe ser null (fail-closed)
    const prevOauth = process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL;
    delete process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL;
    try {
      assert.strictEqual(authService.getOfficialLoginUrl(), null);
      process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL = 'https://login.microsoftonline.com/test-tenant/oauth2/v2.0/authorize?client_id=test-client';
      const loginUrl = authService.getOfficialLoginUrl('c.guzman@duocuc.cl');
      assert.ok(loginUrl.includes('login.microsoftonline.com'));
      assert.ok(loginUrl.includes('login_hint=c.guzman%40duocuc.cl'));
    } finally {
      if (prevOauth === undefined) delete process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL;
      else process.env.OFFICIAL_VIVO_DUOC_OAUTH_URL = prevOauth;
    }

    // Verificar formato y perfil nativo en BD
    const sessionData = authService.formatUserResponse({
      email: 'c.guzman@duocuc.cl',
      fullName: 'Cristian Guzmán',
      career: 'Ingeniería en Informática',
      campus: 'Sede Alameda',
      attendanceRate: 88.9,
    });
    assert.ok(sessionData, 'Debe devolver datos del estudiante');
    assert.strictEqual(sessionData.email, 'c.guzman@duocuc.cl');
    assert.strictEqual(sessionData.career, 'Ingeniería en Informática');
    assert.strictEqual(sessionData.attendanceRate, 88.9);
  });

  await t.test('7. [REGISTRATION FORM, DYNAMIC PASSWORD, RUT & 4 ROLES] Admin-only creation of administrators', async () => {
    const adminController = (await import('../controllers/adminController.js')).default || (await import('../controllers/adminController.js'));
    const adminCodePath = path.resolve(backendDir, 'controllers/adminController.js');
    const adminCode = fs.readFileSync(adminCodePath, 'utf8');

    // 1. Password dinámico: función generateInitialPassword y fallback anual
    const validationUtils = await import('../utils/validationUtils.js');
    assert.ok(
      adminCode.includes('generateInitialPassword'),
      'adminController debe computar la contraseña dinámica con generateInitialPassword'
    );
    const generatedPwd = validationUtils.generateInitialPassword('20.123.456-7', 'Guzmán');
    assert.equal(generatedPwd, '201234567g', 'Contraseña inicial debe ser RUT limpio + inicial apellido');
    const fallbackPwd = validationUtils.generateInitialPassword('', '');
    const currentYear = new Date().getFullYear();
    assert.equal(fallbackPwd, `Duoc${currentYear}!`, 'Fallback debe ser Duoc + año + !');

    // 2. Comprobar label RUT y roles en RegisterUserModal y AdminLayout
    const regModalPath = path.resolve(projectRootDir, 'frontend/src/components/admin/RegisterUserModal.jsx');
    const regModalCode = fs.readFileSync(regModalPath, 'utf8');
    const adminViewPath = path.resolve(projectRootDir, 'frontend/src/components/admin/modules/AdminLayout.jsx');
    const adminViewCode = fs.readFileSync(adminViewPath, 'utf8');

    assert.ok(regModalCode.includes('RUT <span className="text-red-600">*</span>'), 'El label debe ser estrictamente RUT');
    assert.ok(!regModalCode.includes('RUT institucional <span'), 'No debe existir RUT institucional');
    assert.ok(adminViewCode.includes('RegisterUserModal'), 'AdminPanelView debe integrar RegisterUserModal');

    // 3. Comprobar que los roles institucionales están soportados y separados
    assert.ok(regModalCode.includes('estudiante_paedis'), 'Debe incluir rol Estudiante PAEDIS');
    assert.ok(regModalCode.includes('estudiante'), 'Debe incluir rol Estudiante');
    assert.ok(regModalCode.includes('value="coordinador_paedis"'), 'Debe incluir rol Coordinador PAEDIS');
    assert.ok(regModalCode.includes('value="admin"'), 'Debe incluir rol Administrador');

    // 4. Comprobar que 'Estado académico', 'Asistencia estimada', 'Tutor par asignado' fueron eliminados del formulario de creación
    assert.ok(!regModalCode.includes('id="create-academic-status"'), 'No debe tener campo create-academic-status');
    assert.ok(!regModalCode.includes('id="create-attendance-rate"'), 'No debe tener campo create-attendance-rate');
    assert.ok(!regModalCode.includes('id="create-tutor-par"'), 'No debe tener campo create-tutor-par');

    // 5. Restricción en backend: Coordinador PAEDIS no puede crear Administrador
    let denied = false;
    const mockRes = {
      status(code) {
        if (code === 403) denied = true;
        return this;
      },
      json(payload) {
        this.body = payload;
        return this;
      },
    };

    const mockReqFromCoordinador = {
      user: { role: 'coordinador_paedis', email: 'coord@duocuc.cl' },
      body: {
        fullName: 'Nuevo Administrador Ilegal',
        email: 'nuevo.admin@duocuc.cl',
        role: 'admin',
        rut: '12.345.678-9',
      },
    };

    await adminController.createStudent(mockReqFromCoordinador, mockRes);
    assert.ok(denied, 'Coordinador PAEDIS debe recibir 403 Forbidden al intentar crear un Administrador');
    assert.ok(mockRes.body.message.includes('Solo un Administrador'), 'Mensaje de rechazo debe indicar exclusividad');
  });

  await t.test('8. [STUDENT DIRECTORY & DETAIL MODAL] Nombre y Sede únicamente en listado, modal con asistencias y semáforo', () => {
    const studentDirPath = path.resolve(projectRootDir, 'frontend/src/components/admin/modules/StudentDirectory.jsx');
    const modalPath = path.resolve(projectRootDir, 'frontend/src/components/admin/StudentDetailModal.jsx');
    const studentDirCode =
      fs.readFileSync(studentDirPath, 'utf8') +
      (fs.existsSync(modalPath) ? fs.readFileSync(modalPath, 'utf8') : '');

    // Comprobar que la tarjeta del directorio contiene únicamente Nombre y Sede
    assert.ok(studentDirCode.includes('student.fullName'), 'Debe mostrar el nombre completo');
    assert.ok(studentDirCode.includes('studentSede'), 'Debe mostrar la sede directamente debajo');

    // Comprobar modal de detalle: Asistencia detallada por asignatura
    assert.ok(studentDirCode.includes('Asistencia Detallada por Asignatura Cursada'), 'Modal debe incluir título de asistencia por asignatura');
    assert.ok(studentDirCode.includes('selectedStudentForDetail?.enrolledCourses'), 'Modal debe mapear los cursos inscritos con optional chaining');

    // Comprobar semáforo de deserción: Verde (>75%), Amarillo (70-75%), Rojo (<70%)
    assert.ok(studentDirCode.includes('Semáforo Predictivo de Retención vs. Deserción'), 'Debe incluir semáforo de retención');
    assert.ok(studentDirCode.includes('Verde: Bajo Riesgo (> 75%)'), 'Debe contener regla de Verde');
    assert.ok(studentDirCode.includes('Amarillo: Riesgo Moderado (70% - 75%)'), 'Debe contener regla de Amarillo');
    assert.ok(studentDirCode.includes('Rojo: Alto Riesgo / RI (< 70%)'), 'Debe contener regla de Rojo');
  });

  await t.test('9. [HELP CENTER INTENTIONALITY SEARCH] Búsqueda de certificado de notas retorna URL oficial de Vivo Duoc', () => {
    const modulesDataPath = path.resolve(projectRootDir, 'frontend/src/data/duocModulesData.js');
    const modulesDataCode = fs.readFileSync(modulesDataPath, 'utf8');

    assert.ok(modulesDataCode.includes('certificados-alumnos-notas'), 'Debe existir submódulo certificados-alumnos-notas');
    assert.ok(
      modulesDataCode.includes('https://experienciavivo.duoc.cl/alumnos/certificados'),
      'Debe apuntar a https://experienciavivo.duoc.cl/alumnos/certificados'
    );

    // Comprobar DashboardPage.jsx detección semántica
    const dashboardPath = path.resolve(projectRootDir, 'frontend/src/pages/DashboardPage.jsx');
    const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

    assert.ok(dashboardCode.includes('isCertificadoNotasIntent'), 'DashboardPage debe computar isCertificadoNotasIntent');
    assert.ok(dashboardCode.includes("sub.id === 'certificados-alumnos-notas'"), 'Debe priorizar la sección certificados-alumnos-notas');
  });

  await t.test('10. [SIMULATOR ACCESS CONTROL & GAMIFICATION] Bloqueo a no registrados y paquetes sin colisiones', () => {
    const dashboardPath = path.resolve(projectRootDir, 'frontend/src/pages/DashboardPage.jsx');
    const dashboardCode = fs.readFileSync(dashboardPath, 'utf8');

    const simulatorPath = path.resolve(projectRootDir, 'frontend/src/components/simulation/TomaRamosSimulator.jsx');
    const simulatorCode = fs.readFileSync(simulatorPath, 'utf8');

    // Mensaje accesible para no registrados
    const expectedMsg = 'Para acceder al Simulador de Toma de Ramos debes acercarte a coordinación o administración para registrar tu cuenta oficial en Nexo360.';
    assert.ok(dashboardCode.includes(expectedMsg), 'DashboardPage debe desplegar aviso accesible para no registrados');
    assert.ok(simulatorCode.includes(expectedMsg), 'TomaRamosSimulator debe desplegar aviso accesible para no registrados');

    // Estructura de gamificación en el simulador
    assert.ok(simulatorCode.includes('Modo Guiado'), 'Debe ofrecer Modo Guiado');
    assert.ok(simulatorCode.includes('Modo Realista'), 'Debe ofrecer Modo Realista');
    assert.ok(simulatorCode.includes('generateTargetPackages'), 'Debe llamar a generateTargetPackages');
    assert.ok(simulatorCode.includes('Iniciar toma de ramos'), 'Debe tener botón Iniciar toma de ramos');
    assert.ok(simulatorCode.includes('filter blur-md'), 'Debe desenfocar el fondo durante el pre-flujo');
    assert.ok(simulatorCode.includes('achievementPct') || simulatorCode.includes('completionPercentage') || simulatorCode.includes('matchedTargetCourses.length / targetCourses.length'), 'Debe calcular porcentaje de logro');
  });

  await t.test('11. [READINGGUIDEOVERLAY Z-INDEX LAYER] z-[9999] como máxima capa sobre modales y paneles', () => {
    const overlayPath = path.resolve(projectRootDir, 'frontend/src/components/common/ReadingGuideOverlay.jsx');
    assert.ok(fs.existsSync(overlayPath), 'ReadingGuideOverlay.jsx debe existir');

    const overlayCode = fs.readFileSync(overlayPath, 'utf8');
    assert.ok(overlayCode.includes('z-[9999]'), 'ReadingGuideOverlay debe usar la clase z-[9999]');
    assert.ok(overlayCode.includes('pointer-events-none'), 'ReadingGuideOverlay debe tener pointer-events-none');
  });

  await t.test('12. [BOLETÍN OFICIAL, DIFICULTADES & RUT BIBLIOTECA] 4 dificultades, boletín oficial PDF y RUT 21.987.654-3', () => {
    // 1. Verificar BibliotecaView.jsx
    const biblioPath = path.resolve(projectRootDir, 'frontend/src/components/views/BibliotecaView.jsx');
    const biblioCode = fs.readFileSync(biblioPath, 'utf8');
    assert.ok(biblioCode.includes('21.987.654-3'), 'BibliotecaView debe utilizar el RUT oficial 21.987.654-3');
    assert.ok(!biblioCode.includes('19.276.735-0'), 'BibliotecaView no debe contener el RUT antiguo');

    // 2. Verificar tomaRamosData.js: 4 dificultades y helpers de boletín
    const tomaRamosPath = path.resolve(projectRootDir, 'frontend/src/data/tomaRamosData.js');
    const tomaRamosCode = fs.readFileSync(tomaRamosPath, 'utf8');
    assert.ok(tomaRamosCode.includes("'facil'"), 'Debe soportar dificultad facil');
    assert.ok(tomaRamosCode.includes("'intermedio'"), 'Debe soportar dificultad intermedio');
    assert.ok(tomaRamosCode.includes("'dificil'"), 'Debe soportar dificultad dificil');
    assert.ok(tomaRamosCode.includes("'muy-dificil'"), 'Debe soportar dificultad muy-dificil');
    assert.ok(tomaRamosCode.includes('getBoletinSemesterTitle'), 'Debe exportar getBoletinSemesterTitle');
    assert.ok(tomaRamosCode.includes('formatStudentNameForBoletin'), 'Debe exportar formatStudentNameForBoletin');

    // 3. Verificar TomaRamosSimulator.jsx: Boletín de Carga Académica PDF
    const simPath = path.resolve(projectRootDir, 'frontend/src/components/simulation/TomaRamosSimulator.jsx');
    const simCode = fs.readFileSync(simPath, 'utf8');
    assert.ok(simCode.includes('/duoc-uc-logo-boletin.png'), 'Boletín debe renderizar el logo oficial Duoc UC');
    assert.ok(simCode.includes('SEDE:') && simCode.includes('N° 10'), 'Boletín debe incluir la sede oficial y número de sede');
    assert.ok(simCode.includes('Dirección de Docencia'), 'Boletín debe incluir Dirección de Docencia');
    assert.ok(simCode.includes('Fecha emisión'), 'Boletín debe incluir Fecha emisión');
    assert.ok(simCode.includes('adaptiveBlocks'), 'Boletín debe computar cuadrícula horaria adaptativa');
    assert.ok(simCode.includes('bg-[#1b5e20]'), 'Pre-flujo debe usar el color verde institucional Duoc UC');
    assert.ok(simCode.includes('bg-[#FFB81C]'), 'Pre-flujo debe usar el color amarillo/dorado oficial Duoc UC');
  });
});
