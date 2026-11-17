const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserProfile = require('../models/UserProfile');
const ActivityLog = require('../models/ActivityLog');
const authService = require('../services/authService');
const satAlertService = require('../services/satAlertService');

const Career = require('../models/Career');
const Sede = require('../models/Sede');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]{1,64}@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/i;

const INITIAL_CAREERS = [
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

const INITIAL_SEDES = [
  'Campus Arauco',
  'Campus Nacimiento',
  'Campus Villarrica',
  'Duoc UC Online',
  'Sede Alameda',
  'Sede Antonio Varas',
  'Sede Maipú',
  'Sede Melipilla',
  'Sede Padre Alonso de Ovalle',
  'Sede Plaza Norte',
  'Sede Plaza Oeste',
  'Sede Plaza Vespucio',
  'Sede Puente Alto',
  'Sede Puerto Montt',
  'Sede San Andrés de Concepción',
  'Sede San Bernardo',
  'Sede San Carlos de Apoquindo',
  'Sede San Joaquín',
  'Sede Valparaíso',
  'Sede Viña del Mar',
].sort((a, b) => a.localeCompare(b, 'es'));

// Estado en memoria dinámico para soporte local y respaldo
let inMemoryCareers = INITIAL_CAREERS.map((name, i) => ({
  _id: `career_${i + 1}`,
  id: `career_${i + 1}`,
  name,
  code: `CARR-${i + 1}`,
  school: 'Escuela Duoc UC',
}));

let inMemorySedes = INITIAL_SEDES.map((name, i) => ({
  _id: `sede_${i + 1}`,
  id: `sede_${i + 1}`,
  name,
  city: 'Región Metropolitana',
}));

/**
 * Función que calcula el Semáforo Predictivo de Retención vs. Deserción
 * según la Normativa Académica Oficial Duoc UC:
 * - Asistencia < 70%: Reprobado por Inasistencia [RI] / Alto Riesgo (Rojo)
 * - Asistencia 70% - 75%: Riesgo Moderado / Alerta Preventiva (Amarillo)
 * - Asistencia > 75%: Bajo Riesgo / Progreso Favorable (Verde)
 * Se alimenta de las asignaturas inscritas y porcentajes de asistencia por curso.
 */
const calculatePredictiveRisk = (user) => {
  const status = user.academicStatus || 'activo';
  const isPaedis = Boolean(user.isPaedis);
  const hasUsedSim = Boolean(user.hasUsedSimulator);
  const tutor = user.tutorParAsignado || '';
  const ajustesCount = Array.isArray(user.ajustesAprobados) ? user.ajustesAprobados.length : 0;

  // Cálculo de asistencia a partir de asignaturas cursadas (scraped courses)
  let effectiveAttendance = user.attendanceRate !== undefined ? Number(user.attendanceRate) : 88.9;
  const courseDetails = [];
  const coursesInRI = [];
  const coursesInAlert = [];

  if (Array.isArray(user.enrolledCourses) && user.enrolledCourses.length > 0) {
    const coursesWithAttendance = user.enrolledCourses.filter(
      (c) =>
        c &&
        (c.attendanceRate !== undefined ||
          c.porcentajeAsistencia !== undefined ||
          c.asistenciaPorcentaje !== undefined)
    );

    if (coursesWithAttendance.length > 0) {
      const sum = coursesWithAttendance.reduce((acc, c) => {
        const rate = Number(c.attendanceRate ?? c.porcentajeAsistencia ?? c.asistenciaPorcentaje ?? 100);
        return acc + rate;
      }, 0);
      effectiveAttendance = Math.round((sum / coursesWithAttendance.length) * 10) / 10;
    }

    user.enrolledCourses.forEach((c) => {
      const rate = Number(c.attendanceRate ?? c.porcentajeAsistencia ?? c.asistenciaPorcentaje ?? 100);
      const isRI = rate < 70;
      const isAlert = rate >= 70 && rate <= 75;
      courseDetails.push({
        nombre: c.nombre || c.sigla || 'Asignatura',
        sigla: c.sigla || '',
        seccion: c.seccion || '',
        attendanceRate: rate,
        clasesRegistradas: c.clasesRegistradas || 0,
        asistencias: c.asistencias || 0,
        profesor: c.profesor || '',
        sala: c.sala || '',
        isRI,
        isAlert,
      });

      if (isRI) coursesInRI.push(c.nombre || c.sigla);
      else if (isAlert) coursesInAlert.push(c.nombre || c.sigla);
    });
  }

  if (status === 'desercion') {
    return {
      score: 100,
      riskLevel: 'DESERTOR',
      predictionLabel: 'Deserción Registrada',
      color: 'red',
      trafficLight: 'red',
      factors: ['Estudiante actualmente en deserción / retiro académico'],
      graduationProbability: 0,
      effectiveAttendance,
      coursesInRI,
      coursesInAlert,
      courseDetails,
    };
  }

  if (status === 'titulado') {
    return {
      score: 0,
      riskLevel: 'TITULADO',
      predictionLabel: 'Titulado / Egresado',
      color: 'emerald',
      trafficLight: 'green',
      factors: ['Plan de estudios completado con éxito'],
      graduationProbability: 100,
      effectiveAttendance,
      coursesInRI,
      coursesInAlert,
      courseDetails,
    };
  }

  // Estudiante Activo: Cálculo de Alerta Temprana Duoc UC (< 70% RI, 70-75% Moderado, > 75% Bajo)
  let score = 25;
  const factors = [];

  if (effectiveAttendance < 70 || coursesInRI.length > 0) {
    score = Math.max(70, Math.round(75 + (70 - Math.min(effectiveAttendance, 69)) * 0.8));
    if (coursesInRI.length > 0) {
      factors.push(`Reprobación por Inasistencia (RI < 70%) en: ${coursesInRI.join(', ')}`);
    } else {
      factors.push(`Asistencia crítica (${effectiveAttendance}% < 70%): En causal de Reprobación por Inasistencia (RI)`);
    }
  } else if (effectiveAttendance <= 75 || coursesInAlert.length > 0) {
    score = Math.round(40 + (75 - effectiveAttendance) * 3);
    factors.push(`Asistencia al límite (${effectiveAttendance}%): Riesgo moderado en zona de peligro (70% - 75%)`);
    if (coursesInAlert.length > 0) {
      factors.push(`Asignaturas en observación (70-75%): ${coursesInAlert.join(', ')}`);
    }
  } else {
    score = Math.max(5, Math.round(25 - (effectiveAttendance - 75) * 0.6));
    factors.push(`Asistencia favorable (${effectiveAttendance}% > 75%): Cumple normativa académica Duoc UC`);
  }

  // Factor PAEDIS y Ajustes Razonables
  if (isPaedis) {
    if (!tutor || tutor.toLowerCase().includes('sin tutor')) {
      score += 15;
      factors.push('Estudiante PAEDIS sin tutor par asignado: Requiere asignación de apoyo');
    } else if (ajustesCount > 0) {
      score -= 10;
      factors.push(`Acompañamiento PAEDIS activo con ${ajustesCount} ajuste(s) razonable(s)`);
    }
  }

  // Factor Uso de Simulador de Toma de Ramos
  if (hasUsedSim) {
    score -= 8;
    factors.push('Uso activo del Simulador de Toma de Ramos: Planificación horaria confirmada');
  } else {
    score += 8;
    factors.push('No ha planificado horario en el simulador: Riesgo de sobrecarga o choques de horario');
  }

  score = Math.max(5, Math.min(95, Math.round(score)));
  const graduationProbability = Math.max(5, 100 - score);

  let riskLevel = 'BAJO';
  let predictionLabel = 'Bajo Riesgo • Retención Favorable (> 75%)';
  let color = 'emerald';
  let trafficLight = 'green';

  if (effectiveAttendance < 70 || coursesInRI.length > 0 || score >= 60) {
    riskLevel = 'ALTO';
    predictionLabel = 'Alerta Temprana: Alto Riesgo • Reprobado por Inasistencia (RI < 70%)';
    color = 'red';
    trafficLight = 'red';
  } else if (effectiveAttendance <= 75 || score >= 35) {
    riskLevel = 'MEDIO';
    predictionLabel = 'Riesgo Moderado • Alerta Preventiva de Asistencia (70% - 75%)';
    color = 'amber';
    trafficLight = 'yellow';
  }

  return {
    score,
    riskLevel,
    predictionLabel,
    color,
    trafficLight,
    factors,
    graduationProbability,
    effectiveAttendance,
    coursesInRI,
    coursesInAlert,
    courseDetails,
  };
};

/**
 * GET /api/admin/metrics
 * Métricas globales del sistema, uso de simuladores, desglose PAEDIS y predicción
 */
exports.getMetrics = async (req, res) => {
  try {
    const allUsers = await authService.getAllUsers();

    const totalUsers = allUsers.length;
    const students = allUsers.filter(
      (u) =>
        u.role.startsWith('estudiante') ||
        u.role === 'tutor_par' ||
        u.email === 'c.guzman@duocuc.cl'
    );
    const totalStudents = students.length || 1;

    // Métricas PAEDIS: contabiliza todos los estudiantes registrados con condición PAEDIS en la BD
    const paedisStudents = students.filter(
      (s) => s.isPaedis === true || s.role === 'estudiante_paedis'
    );
    const paedisCount = paedisStudents.length;
    const paedisPercentage = Math.round((paedisCount / totalStudents) * 100);

    // Métricas de Simuladores
    const simulatorUsersCount = students.filter((s) => s.hasUsedSimulator).length;
    const simulatorUsagePercentage = Math.round((simulatorUsersCount / totalStudents) * 100);
    const totalSimulatorInteractions = allUsers.reduce(
      (acc, u) => acc + (u.simulatorUsageCount || 0),
      0
    );

    // Desglose de Estados Académicos
    const statusDistribution = {
      activo: students.filter((s) => s.academicStatus === 'activo').length,
      desercion: students.filter((s) => s.academicStatus === 'desercion').length,
      titulado: students.filter((s) => s.academicStatus === 'titulado').length,
    };

    // Resumen Predictivo
    let altoRiesgo = 0;
    let medioRiesgo = 0;
    let bajoRiesgo = 0;

    students.forEach((s) => {
      const pred = calculatePredictiveRisk(s);
      if (pred.riskLevel === 'ALTO' || pred.riskLevel === 'DESERTOR') altoRiesgo++;
      else if (pred.riskLevel === 'MEDIO') medioRiesgo++;
      else bajoRiesgo++;
    });

    // Preferencias de Accesibilidad
    const a11yPreferencesStats = {
      highContrastUsers: allUsers.filter((u) => u.accessibilityPreferences?.highContrast).length,
      dyslexicFontUsers: allUsers.filter((u) => u.accessibilityPreferences?.dyslexicFont).length,
      screenReaderOptimized: allUsers.filter((u) => u.accessibilityPreferences?.screenReaderOptimized).length,
    };

    // Actividad reciente (MongoDB con respaldo en memoria)
    let recentActivity = [];
    if (mongoose.connection.readyState === 1) {
      recentActivity = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(10).lean();
    }
    if (!recentActivity || recentActivity.length === 0) {
      recentActivity = authService.getRecentLogs(10);
    }

    return res.status(200).json({
      success: true,
      metrics: {
        totalUsers,
        totalStudents,
        totalFaculty: totalUsers - totalStudents,
        paedisCount,
        paedisPercentage,
        simulatorUsersCount,
        simulatorUsagePercentage,
        totalSimulatorInteractions,
        statusDistribution,
        riskSummary: {
          altoRiesgo,
          medioRiesgo,
          bajoRiesgo,
        },
        a11yPreferencesStats,
        recentActivity,
      },
    });
  } catch (error) {
    console.error('[AdminController] Error al obtener métricas:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al compilar las métricas del panel de administración.',
    });
  }
};

/**
 * GET /api/admin/students
 * Lista de estudiantes con cálculo predictivo enriquecido
 */
exports.getStudents = async (req, res) => {
  try {
    const { search, status, role, isPaedis } = req.query || {};
    let users = await authService.getAllUsers();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      const cleanQ = q.replace(/[^0-9kK]/g, '');
      users = users.filter((u) => {
        const studentRut = u.rut || '';
        const cleanRut = studentRut.replace(/[^0-9kK]/g, '').toLowerCase();
        const matchesRut =
          (studentRut && studentRut.toLowerCase().includes(q)) ||
          (cleanQ.length > 0 && cleanRut.includes(cleanQ));

        return (
          (u.fullName || '').toLowerCase().includes(q) ||
          (u.nombre || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q) ||
          matchesRut ||
          (u.career || '').toLowerCase().includes(q) ||
          (u.carrera || '').toLowerCase().includes(q) ||
          (u.campus || '').toLowerCase().includes(q) ||
          (u.sede || '').toLowerCase().includes(q)
        );
      });
    }

    if (status && status !== 'all') {
      users = users.filter((u) => u.academicStatus === status);
    }

    if (role && role !== 'all') {
      users = users.filter((u) => u.role === role);
    }

    if (isPaedis === 'true') {
      users = users.filter((u) => u.isPaedis === true || u.role === 'estudiante_paedis');
    }

    // Orden alfabético estricto de A a Z por nombre completo
    users.sort((a, b) => {
      const nameA = (a.fullName || a.nombre || a.email || '').trim();
      const nameB = (b.fullName || b.nombre || b.email || '').trim();
      const cmp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
      if (cmp !== 0) return cmp;
      return (a.rut || '').localeCompare(b.rut || '');
    });

    // Enriquecer cada estudiante con su cálculo predictivo
    const enriched = users.map((u) => {
      const prediction = calculatePredictiveRisk(u);
      return {
        ...u,
        prediction,
      };
    });

    return res.status(200).json({
      success: true,
      count: enriched.length,
      students: enriched,
    });
  } catch (error) {
    console.error('[AdminController] Error al listar estudiantes:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el directorio de estudiantes.',
    });
  }
};

/**
 * POST /api/admin/students
 * Registrar un nuevo usuario institucional desde el panel de administración
 * Cumple con Ley N° 21.719 de Protección de Datos Personales y verificación RBAC estricta
 */
exports.createStudent = async (req, res) => {
  try {
    const body = req.body || {};
    const email = (body.email || '').trim().toLowerCase();
    const fullName = (body.fullName || body.nombre || '').trim();

    // Contraseña inicial dinámica por año institucional: 'Duoc' + año + '!' (Ej: Duoc2026!)
    const currentYear = new Date().getFullYear();
    const dynamicInitialPassword = `Duoc${currentYear}!`;
    const password = (body.password || '').trim() || dynamicInitialPassword;

    // Roles institucionales estrictamente limitados a 4 opciones
    const requestedRole = (body.role || 'estudiante').trim().toLowerCase();
    const allowedRoles = ['estudiante', 'estudiante_paedis', 'coordinador_paedis', 'admin', 'administrador'];

    if (!allowedRoles.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message:
          'Rol no válido. Los roles institucionales permitidos son: Estudiante, Estudiante PAEDIS, Coordinador PAEDIS y Administrador.',
      });
    }

    // RESTRICCIÓN EXCLUSIVA RBAC: ÚNICAMENTE un Administrador puede crear o asignar el rol de Administrador
    const isTargetAdmin = requestedRole === 'admin' || requestedRole === 'administrador';
    const actorRole = (req.user?.role || '').toLowerCase();
    const isActorAdmin = actorRole === 'admin' || actorRole === 'administrador';

    if (isTargetAdmin && !isActorAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Acceso restringido: Solo un Administrador puede crear o asignar usuarios con el rol Administrador.',
      });
    }

    const role = requestedRole === 'administrador' ? 'admin' : requestedRole;
    const isPaedis = role === 'estudiante_paedis' ? true : Boolean(body.isPaedis);

    // Campos removidos del formulario se inicializan con valores seguros por defecto
    const academicStatus = 'activo';
    const statusReason = 'Registrado por Administrador en Nexo360';
    const attendanceRate = 88.9;
    const tutorParAsignado = isPaedis ? 'Coordinación PAEDIS Duoc UC' : 'Sin tutor asignado';

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Debe ingresar un correo institucional Duoc UC válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).',
      });
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre completo es obligatorio.',
      });
    }

    // Verificar si ya existe en la base de datos o memoria
    let existing = null;
    if (mongoose.connection.readyState === 1) {
      existing = await UserProfile.findOne({ email });
    } else {
      const allUsers = await authService.getAllUsers();
      existing = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `El correo ${email} ya se encuentra registrado en la base de datos de Nexo360.`,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const roleLabels = {
      admin: 'Administrador de la Plataforma TI',
      administrador: 'Administrador de la Plataforma TI',
      estudiante_paedis: 'Estudiante Regular • PAEDIS',
      estudiante: 'Estudiante Regular Duoc UC',
      coordinador_paedis: 'Coordinador/a PAEDIS e Inclusión',
    };

    // Metadatos de consentimiento y finalidad conforme a Ley N° 21.719 de Protección de Datos Personales
    const consentimientoLey21719 = {
      aceptado: body.consentimientoLey21719?.aceptado !== false,
      fechaAceptacion: body.consentimientoLey21719?.fechaAceptacion || new Date(),
      finalidadTratamiento:
        body.consentimientoLey21719?.finalidadTratamiento ||
        'Gestión académica, registro curricular, acompañamiento PAEDIS y prevención de deserción estudiantil según Ley N° 21.719 de Chile',
    };

    const newUserData = {
      email,
      password: hashedPassword,
      fullName,
      nombre: fullName,
      photo: body.photo || '',
      rut: body.rut || 'Sin RUT',
      role,
      roleLabel: body.roleLabel || roleLabels[role] || 'Estudiante Duoc UC',
      isPaedis,
      academicStatus,
      statusReason,
      attendanceRate,
      career: body.career || 'Ingeniería en Informática',
      carrera: body.career || 'Ingeniería en Informática',
      campus: body.campus || body.sede || 'Sede Alameda',
      sede: body.campus || body.sede || 'Sede Alameda',
      address: body.address || 'Por actualizar',
      personalEmail: body.personalEmail || email,
      phone: body.phone || '+56 9 0000 0000',
      emergencyContact: body.emergencyContact || 'Contacto Familiar',
      emergencyPhone: body.emergencyPhone || '+56 9 0000 0000',
      tutorParAsignado,
      diagnosticoDeclarado: body.diagnosticoDeclarado || '',
      ajustesAprobados: Array.isArray(body.ajustesAprobados) ? body.ajustesAprobados : [],
      accessibilityPreferences: body.accessibilityPreferences || {
        fontSize: 'normal',
        highContrast: false,
        dyslexicFont: false,
        reducedMotion: false,
        screenReaderOptimized: true,
      },
      enrolledCourses: Array.isArray(body.enrolledCourses) ? body.enrolledCourses : [],
      consentimientoLey21719,
    };

    let createdUser;
    if (mongoose.connection.readyState === 1) {
      createdUser = await UserProfile.create(newUserData);
    } else {
      createdUser = { _id: `local_${Date.now()}`, ...newUserData };
      if (typeof authService.registerUser === 'function') {
        authService.registerUser(createdUser);
      }
    }

    await authService.logActivity({
      userId: req.user._id || req.user.id,
      userEmail: req.user.email,
      userName: req.user.fullName || 'Administrador',
      userRole: req.user.role || 'admin',
      action: 'student_registered_by_admin',
      details: `Usuario ${fullName} (${email}) registrado con rol ${roleLabels[role] || role}. Cumplimiento Ley 21.719 verificado.`,
    });

    return res.status(201).json({
      success: true,
      message: `Usuario ${fullName} registrado exitosamente en la base de datos de Nexo360.`,
      user: authService.formatUserResponse(createdUser),
    });
  } catch (error) {
    console.error('[AdminController] Error al crear usuario:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar usuario en la base de datos.',
    });
  }
};

/**
 * PUT /api/admin/students/:id/status
 * Cambiar el estado académico del estudiante: 'activo', 'desercion', 'titulado'
 */
exports.updateStudentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { academicStatus, statusReason } = req.body || {};

    if (!['activo', 'desercion', 'titulado'].includes(academicStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Estado académico no válido. Debe ser "activo", "desercion" o "titulado".',
      });
    }

    let updatedUser;
    if (mongoose.connection.readyState === 1) {
      updatedUser = await UserProfile.findByIdAndUpdate(
        id,
        {
          $set: {
            academicStatus,
            statusReason: statusReason || `Estado actualizado a ${academicStatus}`,
            statusUpdatedAt: new Date(),
          },
        },
        { new: true }
      );
    }

    await authService.logActivity({
      userId: req.user._id || req.user.id,
      userEmail: req.user.email,
      userName: req.user.fullName || 'Administrador',
      userRole: 'admin',
      action: 'status_changed_by_admin',
      details: `El administrador cambió el estado del usuario a "${academicStatus}". Motivo: ${statusReason || 'Sin motivo especificado'}`,
    });

    return res.status(200).json({
      success: true,
      message: `Estado académico actualizado a "${academicStatus.toUpperCase()}" correctamente.`,
      user: updatedUser ? authService.formatUserResponse(updatedUser) : null,
    });
  } catch (error) {
    console.error('[AdminController] Error al actualizar estado:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del estudiante.',
    });
  }
};

/**
 * DELETE /api/admin/students/:id
 * Eliminar un usuario (evita auto-eliminación del admin en sesión)
 */
exports.deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    if (String(req.user._id || req.user.id) === String(id)) {
      return res.status(400).json({
        success: false,
        message: 'No puede eliminar su propia cuenta de administrador mientras está en sesión.',
      });
    }

    if (mongoose.connection.readyState === 1) {
      await UserProfile.findByIdAndDelete(id);
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente de la base de datos.',
    });
  } catch (error) {
    console.error('[AdminController] Error al eliminar usuario:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar el usuario de la base de datos.',
    });
  }
};

const courseService = require('../services/courseService');

/**
 * GET /api/admin/courses/summary
 * Resumen de oferta académica y estado de la base de datos de asignaturas
 */
exports.getCoursesSummary = async (req, res) => {
  try {
    const careers = await courseService.getCareersSummary();
    const totalSecciones = careers.reduce((acc, c) => acc + c.totalSecciones, 0);
    const totalAsignaturas = careers.reduce((acc, c) => acc + c.totalAsignaturas, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalSecciones,
        totalAsignaturas,
        totalCarreras: careers.length,
        periodoActivo: '2026 - 002',
        careers,
      },
    });
  } catch (error) {
    console.error('[AdminController] Error al obtener resumen de cursos:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el resumen de asignaturas.',
      error: error.message,
    });
  }
};

/**
 * POST /api/admin/courses/import
 * Importación masiva de asignaturas y secciones desde Excel (.xlsx/.xls), Markdown (.md) o JSON
 * Soporta 'replace: true' para sobreescribir el catálogo anterior y limpiar períodos previos.
 */
exports.importCourses = async (req, res) => {
  try {
    const { rows, markdown, md, fileBase64, base64, textContent, replace, periodo } = req.body || {};
    const payload = rows || markdown || md || fileBase64 || base64 || textContent || req.body;

    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar una lista de filas válida, texto Markdown o archivo codificado en el cuerpo de la solicitud.',
      });
    }

    const result = await courseService.bulkImport(req.body, {
      replace: Boolean(replace),
      periodo: periodo || '2026 - 002',
    });

    await authService.logActivity({
      userId: req.user?._id || req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@duocuc.cl',
      userName: req.user?.fullName || req.user?.nombre || 'Administrador',
      userRole: req.user?.role || 'admin',
      action: 'IMPORT',
      details: `Importación masiva (${result.sourceFormat || 'XLSX/MD/JSON'}): ${result.seccionesImportadas} secciones para ${result.carrerasDetectadas.length} carreras. Sobreescritura previa: ${Boolean(replace)}.`,
      metadata: {
        replace: Boolean(replace),
        sourceFormat: result.sourceFormat,
        seccionesImportadas: result.seccionesImportadas,
        carreras: result.carrerasDetectadas,
        totalFilas: result.totalFilas,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Se importaron ${result.seccionesImportadas} secciones exitosamente (${result.carrerasDetectadas.length} carreras).`,
      result,
    });
  } catch (error) {
    console.error('[AdminController] Error en importación masiva de cursos:', error.message);
    return res.status(500).json({
      success: false,
      message: error.message || 'Error al procesar e importar las asignaturas en la base de datos.',
      error: error.message,
    });
  }
};

/**
 * POST /api/admin/courses/seed
 * Restablece y siembra el catálogo de ramos oficial Alameda 2026-002
 */
exports.seedCourses = async (req, res) => {
  try {
    const result = await courseService.seedInitialCourses({ force: true });

    await authService.logActivity({
      userId: req.user?._id || req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@duocuc.cl',
      userName: req.user?.fullName || req.user?.nombre || 'Administrador',
      userRole: req.user?.role || 'admin',
      action: 'SEED',
      details: `Restablecimiento de Catálogo Oficial Alameda 2026-002: ${result.count} secciones cargadas exitosamente.`,
      metadata: {
        count: result.count,
        source: result.source,
        periodo: '2026 - 002',
      },
    });

    return res.status(200).json({
      success: true,
      message: `Catálogo oficial de asignaturas Alameda 2026-002 restaurado exitosamente (${result.count} secciones).`,
      result,
    });
  } catch (error) {
    console.error('[AdminController] Error al sembrar cursos:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al sembrar el catálogo de cursos.',
      error: error.message,
    });
  }
};

/**
 * DELETE /api/admin/courses
 * Limpia todas las asignaturas registradas
 */
exports.clearCourses = async (req, res) => {
  try {
    await courseService.clearAll();

    await authService.logActivity({
      userId: req.user?._id || req.user?.id || 'admin',
      userEmail: req.user?.email || 'admin@duocuc.cl',
      userName: req.user?.fullName || req.user?.nombre || 'Administrador',
      userRole: req.user?.role || 'admin',
      action: 'CLEAR',
      details: 'Vaciado completo del catálogo de asignaturas y secciones.',
      metadata: {
        timestamp: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Base de datos de asignaturas vaciada correctamente.',
    });
  } catch (error) {
    console.error('[AdminController] Error al vaciar cursos:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al limpiar la base de datos de asignaturas.',
      error: error.message,
    });
  }
};

/**
 * =========================================================================
 * GESTIÓN DINÁMICA DE CARRERAS DUOC UC (CRUD)
 * =========================================================================
 */

/**
 * GET /api/admin/careers
 * Obtener lista alfabética de todas las carreras registradas
 */
exports.getCareers = async (req, res) => {
  try {
    let careers = [];
    if (mongoose.connection.readyState === 1) {
      try {
        let dbCareers = await Career.find({}).sort({ name: 1 }).lean();
        if (!dbCareers || dbCareers.length === 0) {
          // Pre-sembrar carreras oficiales en MongoDB
          const docs = inMemoryCareers.map((c) => ({
            name: c.name,
            code: c.code || '',
            school: c.school || 'Escuela Duoc UC',
          }));
          await Career.insertMany(docs, { ordered: false }).catch(() => {});
          dbCareers = await Career.find({}).sort({ name: 1 }).lean();
        }
        if (dbCareers && dbCareers.length > 0) {
          careers = dbCareers;
        }
      } catch (err) {
        console.warn('[AdminController] Fallback a memoria para carreras:', err.message);
      }
    }

    if (careers.length === 0) {
      careers = inMemoryCareers;
    }

    // Orden alfabético estricto
    careers.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

    return res.status(200).json({
      success: true,
      count: careers.length,
      careers,
    });
  } catch (error) {
    console.error('[AdminController] Error al obtener carreras:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar la lista de carreras.',
    });
  }
};

/**
 * POST /api/admin/careers
 * Agregar una nueva carrera al catálogo institucional
 */
exports.createCareer = async (req, res) => {
  try {
    const { name, code, school } = req.body || {};
    const cleanName = (name || '').trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la carrera es obligatorio.',
      });
    }

    // Comprobar existencia previa (case-insensitive)
    const existsInMemory = inMemoryCareers.some(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase()
    );

    let createdCareer = null;
    if (mongoose.connection.readyState === 1) {
      const existing = await Career.findOne({
        name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `La carrera "${cleanName}" ya se encuentra registrada en el sistema.`,
        });
      }

      createdCareer = await Career.create({
        name: cleanName,
        code: (code || '').trim(),
        school: (school || 'Escuela Duoc UC').trim(),
      });
    }

    if (!createdCareer) {
      if (existsInMemory) {
        return res.status(409).json({
          success: false,
          message: `La carrera "${cleanName}" ya se encuentra registrada en el sistema.`,
        });
      }
      createdCareer = {
        _id: `career_${Date.now()}`,
        id: `career_${Date.now()}`,
        name: cleanName,
        code: (code || '').trim(),
        school: (school || 'Escuela Duoc UC').trim(),
      };
    }

    inMemoryCareers.push(createdCareer);
    inMemoryCareers.sort((a, b) => a.name.localeCompare(b.name, 'es'));

    return res.status(201).json({
      success: true,
      message: `Carrera "${cleanName}" agregada exitosamente.`,
      career: createdCareer,
    });
  } catch (error) {
    console.error('[AdminController] Error al crear carrera:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la nueva carrera.',
    });
  }
};

/**
 * DELETE /api/admin/careers/:id
 * Eliminar una carrera (por ID o por nombre)
 */
exports.deleteCareer = async (req, res) => {
  try {
    const { id } = req.params;
    const target = decodeURIComponent(id || '').trim();

    if (!target) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de la carrera no proporcionado.',
      });
    }

    let deleted = false;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(target)) {
        const resDb = await Career.findByIdAndDelete(target);
        if (resDb) deleted = true;
      } else {
        const resDb = await Career.findOneAndDelete({
          name: { $regex: new RegExp(`^${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (resDb) deleted = true;
      }
    }

    const prevLen = inMemoryCareers.length;
    inMemoryCareers = inMemoryCareers.filter(
      (c) => c._id !== target && c.id !== target && c.name.toLowerCase() !== target.toLowerCase()
    );
    if (inMemoryCareers.length < prevLen) deleted = true;

    return res.status(200).json({
      success: true,
      message: `Carrera eliminada exitosamente.`,
    });
  } catch (error) {
    console.error('[AdminController] Error al eliminar carrera:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la carrera.',
    });
  }
};

/**
 * =========================================================================
 * GESTIÓN DINÁMICA DE SEDES DUOC UC (CRUD)
 * =========================================================================
 */

/**
 * GET /api/admin/sedes
 * Obtener lista alfabética de todas las sedes registradas
 */
exports.getSedes = async (req, res) => {
  try {
    let sedes = [];
    if (mongoose.connection.readyState === 1) {
      try {
        let dbSedes = await Sede.find({}).sort({ name: 1 }).lean();
        if (!dbSedes || dbSedes.length === 0) {
          // Pre-sembrar sedes oficiales en MongoDB
          const docs = inMemorySedes.map((s) => ({
            name: s.name,
            city: s.city || 'Región Metropolitana',
          }));
          await Sede.insertMany(docs, { ordered: false }).catch(() => {});
          dbSedes = await Sede.find({}).sort({ name: 1 }).lean();
        }
        if (dbSedes && dbSedes.length > 0) {
          sedes = dbSedes;
        }
      } catch (err) {
        console.warn('[AdminController] Fallback a memoria para sedes:', err.message);
      }
    }

    if (sedes.length === 0) {
      sedes = inMemorySedes;
    }

    // Orden alfabético estricto
    sedes.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'es'));

    return res.status(200).json({
      success: true,
      count: sedes.length,
      sedes,
    });
  } catch (error) {
    console.error('[AdminController] Error al obtener sedes:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar la lista de sedes.',
    });
  }
};

/**
 * POST /api/admin/sedes
 * Agregar una nueva sede al catálogo institucional
 */
exports.createSede = async (req, res) => {
  try {
    const { name, city } = req.body || {};
    const cleanName = (name || '').trim();

    if (!cleanName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la sede es obligatorio.',
      });
    }

    // Comprobar existencia previa (case-insensitive)
    const existsInMemory = inMemorySedes.some(
      (s) => s.name.toLowerCase() === cleanName.toLowerCase()
    );

    let createdSede = null;
    if (mongoose.connection.readyState === 1) {
      const existing = await Sede.findOne({
        name: { $regex: new RegExp(`^${cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      });
      if (existing) {
        return res.status(409).json({
          success: false,
          message: `La sede "${cleanName}" ya se encuentra registrada en el sistema.`,
        });
      }

      createdSede = await Sede.create({
        name: cleanName,
        city: (city || 'Región Metropolitana').trim(),
      });
    }

    if (!createdSede) {
      if (existsInMemory) {
        return res.status(409).json({
          success: false,
          message: `La sede "${cleanName}" ya se encuentra registrada en el sistema.`,
        });
      }
      createdSede = {
        _id: `sede_${Date.now()}`,
        id: `sede_${Date.now()}`,
        name: cleanName,
        city: (city || 'Región Metropolitana').trim(),
      };
    }

    inMemorySedes.push(createdSede);
    inMemorySedes.sort((a, b) => a.name.localeCompare(b.name, 'es'));

    return res.status(201).json({
      success: true,
      message: `Sede "${cleanName}" agregada exitosamente.`,
      sede: createdSede,
    });
  } catch (error) {
    console.error('[AdminController] Error al crear sede:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la nueva sede.',
    });
  }
};

/**
 * DELETE /api/admin/sedes/:id
 * Eliminar una sede (por ID o por nombre)
 */
exports.deleteSede = async (req, res) => {
  try {
    const { id } = req.params;
    const target = decodeURIComponent(id || '').trim();

    if (!target) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de la sede no proporcionado.',
      });
    }

    let deleted = false;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.Types.ObjectId.isValid(target)) {
        const resDb = await Sede.findByIdAndDelete(target);
        if (resDb) deleted = true;
      } else {
        const resDb = await Sede.findOneAndDelete({
          name: { $regex: new RegExp(`^${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
        });
        if (resDb) deleted = true;
      }
    }

    const prevLen = inMemorySedes.length;
    inMemorySedes = inMemorySedes.filter(
      (s) => s._id !== target && s.id !== target && s.name.toLowerCase() !== target.toLowerCase()
    );
    if (inMemorySedes.length < prevLen) deleted = true;

    return res.status(200).json({
      success: true,
      message: `Sede eliminada exitosamente.`,
    });
  } catch (error) {
    console.error('[AdminController] Error al eliminar sede:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al eliminar la sede.',
    });
  }
};

/**
 * Helper interno para localizar estudiante por ObjectId o por Email institucional
 */
async function findUserByIdOrEmail(rawIdentifier) {
  const cleanId = String(rawIdentifier || '').trim();
  if (!cleanId) return null;

  if (mongoose.connection.readyState === 1) {
    if (mongoose.Types.ObjectId.isValid(cleanId)) {
      const doc = await UserProfile.findById(cleanId);
      if (doc) return doc;
    }
    const cleanEmail = cleanId.toLowerCase().replace(/[^a-zA-Z0-9._%+-@]/g, '');
    const docByEmail = await UserProfile.findOne({ email: cleanEmail });
    if (docByEmail) return docByEmail;
  }

  const all = await authService.getAllUsers();
  return (
    all.find(
      (u) =>
        String(u.id) === cleanId ||
        String(u._id) === cleanId ||
        (u.email || '').toLowerCase() === cleanId.toLowerCase()
    ) || null
  );
}

/**
 * GET /api/admin/sat-alerts
 * Retorna estudiantes con desglose de asistencia por asignatura, nivel SAT y métricas globales
 */
exports.getSatAlerts = async (req, res) => {
  try {
    const rawUsers = await authService.getAllUsers();
    const studentUsers = rawUsers.filter(
      (u) =>
        u.role === 'estudiante' ||
        u.role === 'estudiante_paedis' ||
        u.role === 'tutor_par' ||
        (Array.isArray(u.courseAttendance) && u.courseAttendance.length > 0)
    );

    const evaluatedStudents = studentUsers.map((student) => {
      const satEvaluation = satAlertService.evaluateStudentSat(student);
      return {
        ...student,
        satEvaluation,
      };
    });

    const riskPriority = {
      LEVEL_2_CRITICAL: 1,
      LEVEL_1_PREVENTIVE: 2,
      PAEDIS_JUSTIFIED: 3,
      NONE: 4,
    };

    evaluatedStudents.sort((a, b) => {
      const pA = riskPriority[a.satEvaluation.riskLevel] || 5;
      const pB = riskPriority[b.satEvaluation.riskLevel] || 5;
      if (pA !== pB) return pA - pB;
      const nameA = (a.fullName || a.nombre || a.email || '').trim();
      const nameB = (b.fullName || b.nombre || b.email || '').trim();
      return nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
    });

    const metrics = satAlertService.calculateGlobalMetrics(evaluatedStudents);

    return res.status(200).json({
      success: true,
      count: evaluatedStudents.length,
      metrics,
      students: evaluatedStudents,
    });
  } catch (error) {
    console.error('[AdminController] Error al obtener alertas SAT:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el Sistema de Alerta Temprana (SAT).',
    });
  }
};

/**
 * PATCH /api/admin/sat-alerts/:userId/simulate
 * Permite simular un corte semanal SAP modificando la asistencia de un ramo específico
 */
exports.simulateSatCourse = async (req, res) => {
  try {
    const rawUserId = String(req.params.userId || '').trim();
    const rawCourseCode = String(req.body.courseCode || '').trim();
    const rawAction = String(req.body.action || '').trim().toLowerCase();

    if (!rawUserId || !rawCourseCode) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de usuario y código de asignatura son obligatorios.',
      });
    }

    const user = await findUserByIdOrEmail(rawUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado para simulación SAT.',
      });
    }

    const currentAttendance = Array.isArray(user.courseAttendance) ? user.courseAttendance : [];
    const updatedCourses = satAlertService.applySimulatedCourseUpdate(currentAttendance, {
      courseCode: rawCourseCode,
      action: rawAction,
      attendedSessions:
        typeof req.body.attendedSessions === 'number'
          ? Math.trunc(req.body.attendedSessions)
          : undefined,
      consecutiveAbsences:
        typeof req.body.consecutiveAbsences === 'number'
          ? Math.trunc(req.body.consecutiveAbsences)
          : undefined,
      missedKeySession:
        typeof req.body.missedKeySession === 'boolean' ? req.body.missedKeySession : undefined,
      paedisJustified:
        typeof req.body.paedisJustified === 'boolean' ? req.body.paedisJustified : undefined,
    });

    user.courseAttendance = updatedCourses;
    const satEval = satAlertService.evaluateStudentSat(user);

    if (typeof user.save === 'function') {
      await user.save();
    }

    await authService.logActivity({
      userId: user.id || user._id,
      userEmail: user.email,
      userName: user.fullName || user.nombre,
      userRole: user.role,
      action: 'sat_weekly_cut_simulated',
      details: `Simulación SAP aplicada a ramo ${rawCourseCode}: acción '${rawAction || 'personalizada'}'. Nuevo estado SAT: ${satEval.riskLevel}`,
    });

    const formatted = authService.formatUserResponse(user);

    return res.status(200).json({
      success: true,
      message: 'Simulación de corte semanal SAP aplicada exitosamente.',
      student: {
        ...formatted,
        satEvaluation: satEval,
      },
    });
  } catch (error) {
    console.error('[AdminController] Error al simular alerta SAT:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al simular corte semanal de asistencia.',
    });
  }
};

/**
 * PATCH /api/admin/sat-alerts/:userId/intervention
 * Registra o actualiza la gestión en la Ficha 360 de acompañamiento SAT
 */
exports.updateSatIntervention = async (req, res) => {
  try {
    const rawUserId = String(req.params.userId || '').trim();
    if (!rawUserId) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de estudiante no proporcionado.',
      });
    }

    const user = await findUserByIdOrEmail(rawUserId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado para registrar intervención.',
      });
    }

    const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'RESOLVED'];
    const rawStatus = String(req.body.status || 'IN_PROGRESS').trim().toUpperCase();
    const cleanStatus = allowedStatuses.includes(rawStatus) ? rawStatus : 'IN_PROGRESS';

    const cleanAssignedTo = String(req.body.assignedTo || 'Coordinación PAEDIS')
      .slice(0, 120)
      .trim();
    const cleanNotes = String(req.body.notes || '').slice(0, 500).trim();
    const rawSla = req.body.slaDeadline ? new Date(req.body.slaDeadline) : null;
    const cleanSla =
      rawSla && !isNaN(rawSla.getTime())
        ? rawSla
        : new Date(Date.now() + 48 * 3600 * 1000);

    const cleanRiskLevel = String(req.body.riskLevel || '').trim().toUpperCase();
    const validRiskLevels = ['NONE', 'LEVEL_1_PREVENTIVE', 'LEVEL_2_CRITICAL', 'PAEDIS_JUSTIFIED'];

    user.satIntervention = {
      riskLevel: validRiskLevels.includes(cleanRiskLevel)
        ? cleanRiskLevel
        : user.satIntervention?.riskLevel || 'NONE',
      assignedTo: cleanAssignedTo,
      slaDeadline: cleanSla,
      status: cleanStatus,
      notes: cleanNotes,
      lastUpdated: new Date(),
    };

    if (typeof user.save === 'function') {
      await user.save();
    }

    await authService.logActivity({
      userId: user.id || user._id,
      userEmail: user.email,
      userName: user.fullName || user.nombre,
      userRole: user.role,
      action: 'sat_intervention_updated',
      details: `Ficha 360 de intervención SAT actualizada. Responsable: ${cleanAssignedTo}, Estado: ${cleanStatus}`,
    });

    const satEval = satAlertService.evaluateStudentSat(user);
    const formatted = authService.formatUserResponse(user);

    return res.status(200).json({
      success: true,
      message: 'Ficha 360 de intervención registrada exitosamente.',
      student: {
        ...formatted,
        satEvaluation: satEval,
      },
    });
  } catch (error) {
    console.error('[AdminController] Error al registrar intervención SAT:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al registrar la intervención en la Ficha 360.',
    });
  }
};
