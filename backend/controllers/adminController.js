const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserProfile = require('../models/UserProfile');
const ActivityLog = require('../models/ActivityLog');
const authService = require('../services/authService');
const courseService = require('../services/courseService');
const satAlertService = require('../services/satAlertService');
const { calculatePredictiveRisk } = require('../services/predictiveRiskService');
const { careerCatalog, sedeCatalog } = require('../services/catalogService');
const {
  EMAIL_REGEX,
  DEFAULT_SEDE,
  sanitizeString,
  normalizeRutSearch,
  sanitizeAccessibilityPreferences,
} = require('../utils/validationUtils');

const ROLE_LABELS = Object.freeze({
  admin: 'Administrador de la Plataforma TI',
  administrador: 'Administrador de la Plataforma TI',
  estudiante_paedis: 'Estudiante Regular • PAEDIS',
  estudiante: 'Estudiante Regular Duoc UC',
  coordinador_paedis: 'Coordinador/a PAEDIS e Inclusión',
});

const ALLOWED_ROLES = Object.freeze([
  'estudiante',
  'estudiante_paedis',
  'coordinador_paedis',
  'admin',
  'administrador',
]);

/**
 * Crea handlers CRUD uniformes (DRY) para catálogos dinámicos (Carreras / Sedes).
 */
function createCatalogHandlers({ manager, listKey, itemKey, entityPlural, entitySingular }) {
  return {
    list: async (req, res) => {
      try {
        const items = await manager.list();
        return res.status(200).json({
          success: true,
          count: items.length,
          [listKey]: items,
        });
      } catch {
        console.error(`[AdminController] Error interno al listar ${entityPlural}.`);
        return res.status(500).json({
          success: false,
          message: `Error al consultar la lista de ${entityPlural}.`,
        });
      }
    },

    create: async (req, res) => {
      try {
        const created = await manager.create(req.body || {});
        return res.status(201).json({
          success: true,
          message: `${entitySingular} "${created.name}" agregada exitosamente.`,
          [itemKey]: created,
        });
      } catch (error) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({
            success: false,
            message: error.message,
          });
        }
        console.error(`[AdminController] Error interno al crear ${entitySingular.toLowerCase()}.`);
        return res.status(500).json({
          success: false,
          message: `Error al registrar la nueva ${entitySingular.toLowerCase()}.`,
        });
      }
    },

    remove: async (req, res) => {
      try {
        await manager.remove(req.params.id);
        return res.status(200).json({
          success: true,
          message: `${entitySingular} eliminada exitosamente.`,
        });
      } catch (error) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({
            success: false,
            message: error.message,
          });
        }
        console.error(`[AdminController] Error interno al eliminar ${entitySingular.toLowerCase()}.`);
        return res.status(500).json({
          success: false,
          message: `Error al eliminar la ${entitySingular.toLowerCase()}.`,
        });
      }
    },
  };
}

const careerHandlers = createCatalogHandlers({
  manager: careerCatalog,
  listKey: 'careers',
  itemKey: 'career',
  entityPlural: 'carreras',
  entitySingular: 'Carrera',
});

const sedeHandlers = createCatalogHandlers({
  manager: sedeCatalog,
  listKey: 'sedes',
  itemKey: 'sede',
  entityPlural: 'sedes',
  entitySingular: 'Sede',
});

/**
 * Helper interno para localizar estudiante por ObjectId o por Email institucional.
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
 * GET /api/admin/metrics
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

    const paedisStudents = students.filter(
      (s) => s.isPaedis === true || s.role === 'estudiante_paedis'
    );
    const paedisCount = paedisStudents.length;
    const paedisPercentage = Math.round((paedisCount / totalStudents) * 100);

    const simulatorUsersCount = students.filter((s) => s.hasUsedSimulator).length;
    const simulatorUsagePercentage = Math.round((simulatorUsersCount / totalStudents) * 100);
    const totalSimulatorInteractions = allUsers.reduce(
      (acc, u) => acc + (u.simulatorUsageCount || 0),
      0
    );

    const statusDistribution = {
      activo: students.filter((s) => s.academicStatus === 'activo').length,
      desercion: students.filter((s) => s.academicStatus === 'desercion').length,
      titulado: students.filter((s) => s.academicStatus === 'titulado').length,
    };

    let altoRiesgo = 0;
    let medioRiesgo = 0;
    let bajoRiesgo = 0;

    students.forEach((s) => {
      const pred = calculatePredictiveRisk(s);
      if (pred.riskLevel === 'ALTO' || pred.riskLevel === 'DESERTOR') altoRiesgo++;
      else if (pred.riskLevel === 'MEDIO') medioRiesgo++;
      else bajoRiesgo++;
    });

    const a11yPreferencesStats = {
      highContrastUsers: allUsers.filter((u) => u.accessibilityPreferences?.highContrast).length,
      dyslexicFontUsers: allUsers.filter((u) => u.accessibilityPreferences?.dyslexicFont).length,
      readingGuideUsers: allUsers.filter((u) => u.accessibilityPreferences?.readingGuide).length,
      voiceReaderUsers: allUsers.filter((u) => u.accessibilityPreferences?.voiceReader).length,
      screenReaderOptimized: allUsers.filter(
        (u) => u.accessibilityPreferences?.screenReaderOptimized
      ).length,
    };

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
        riskSummary: { altoRiesgo, medioRiesgo, bajoRiesgo },
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

function matchesStudentSearch(user, rawSearch) {
  const q = rawSearch.toLowerCase().trim();
  const cleanQ = normalizeRutSearch(q);
  const studentRut = user.rut || '';
  const cleanRut = normalizeRutSearch(studentRut);
  const matchesRut =
    (studentRut && studentRut.toLowerCase().includes(q)) ||
    (cleanQ.length > 0 && cleanRut.includes(cleanQ));

  return (
    matchesRut ||
    (user.fullName || '').toLowerCase().includes(q) ||
    (user.nombre || '').toLowerCase().includes(q) ||
    (user.email || '').toLowerCase().includes(q) ||
    (user.career || '').toLowerCase().includes(q) ||
    (user.carrera || '').toLowerCase().includes(q) ||
    (user.campus || '').toLowerCase().includes(q) ||
    (user.sede || '').toLowerCase().includes(q)
  );
}

/**
 * GET /api/admin/students
 */
exports.getStudents = async (req, res) => {
  try {
    const { search, status, role, isPaedis } = req.query || {};
    let users = await authService.getAllUsers();

    if (search && typeof search === 'string' && search.trim()) {
      users = users.filter((u) => matchesStudentSearch(u, search));
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

    users.sort((a, b) => {
      const nameA = (a.fullName || a.nombre || a.email || '').trim();
      const nameB = (b.fullName || b.nombre || b.email || '').trim();
      const cmp = nameA.localeCompare(nameB, 'es', { sensitivity: 'base' });
      return cmp !== 0 ? cmp : (a.rut || '').localeCompare(b.rut || '');
    });

    const enriched = users.map((u) => ({
      ...u,
      prediction: calculatePredictiveRisk(u),
    }));

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
 */
exports.createStudent = async (req, res) => {
  try {
    const body = req.body || {};
    const email = sanitizeString(body.email, 120)?.toLowerCase() || '';
    const fullName = sanitizeString(body.fullName || body.nombre, 120) || '';

    // Contraseña inicial dinámica por año institucional: 'Duoc' + año + '!' (Ej: Duoc2026!)
    const currentYear = new Date().getFullYear();
    const dynamicInitialPassword = `Duoc${currentYear}!`;
    const password = sanitizeString(body.password, 256) || dynamicInitialPassword;

    const requestedRole = sanitizeString(body.role || 'estudiante', 40)?.toLowerCase() || 'estudiante';
    if (!ALLOWED_ROLES.includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message:
          'Rol no válido. Los roles institucionales permitidos son: Estudiante, Estudiante PAEDIS, Coordinador PAEDIS y Administrador.',
      });
    }

    const isTargetAdmin = requestedRole === 'admin' || requestedRole === 'administrador';
    const actorRole = (req.user?.role || '').toLowerCase();
    const isActorAdmin = actorRole === 'admin' || actorRole === 'administrador';

    if (isTargetAdmin && !isActorAdmin) {
      return res.status(403).json({
        success: false,
        message:
          'Acceso restringido: Solo un Administrador puede crear o asignar usuarios con el rol Administrador.',
      });
    }

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({
        success: false,
        message:
          'Debe ingresar un correo institucional Duoc UC válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).',
      });
    }

    if (!fullName) {
      return res.status(400).json({
        success: false,
        message: 'El nombre completo es obligatorio.',
      });
    }

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

    const role = requestedRole === 'administrador' ? 'admin' : requestedRole;
    const isPaedis = role === 'estudiante_paedis' ? true : Boolean(body.isPaedis);
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const selectedCareer =
      sanitizeString(body.career || body.carrera, 120) || 'Ingeniería en Informática';
    const selectedCampus = sanitizeString(body.campus || body.sede, 80) || DEFAULT_SEDE;

    const consentimientoLey21719 = {
      aceptado: body.consentimientoLey21719?.aceptado !== false,
      fechaAceptacion: body.consentimientoLey21719?.fechaAceptacion || new Date(),
      finalidadTratamiento:
        sanitizeString(body.consentimientoLey21719?.finalidadTratamiento, 300) ||
        'Gestión académica, registro curricular, acompañamiento PAEDIS y prevención de deserción estudiantil según Ley N° 21.719 de Chile',
    };

    const newUserData = {
      email,
      password: hashedPassword,
      fullName,
      nombre: fullName,
      photo: typeof body.photo === 'string' ? body.photo.trim() : '',
      rut: sanitizeString(body.rut, 20) || 'Sin RUT',
      role,
      roleLabel: sanitizeString(body.roleLabel, 120) || ROLE_LABELS[role] || 'Estudiante Duoc UC',
      isPaedis,
      academicStatus: 'activo',
      statusReason: 'Registrado por Administrador en Nexo360',
      attendanceRate: 88.9,
      career: selectedCareer,
      carrera: selectedCareer,
      campus: selectedCampus,
      sede: selectedCampus,
      address: sanitizeString(body.address, 200) || 'Por actualizar',
      personalEmail: sanitizeString(body.personalEmail, 120)?.toLowerCase() || email,
      phone: sanitizeString(body.phone, 30) || '+56 9 0000 0000',
      emergencyContact: sanitizeString(body.emergencyContact, 120) || 'Contacto Familiar',
      emergencyPhone: sanitizeString(body.emergencyPhone, 30) || '+56 9 0000 0000',
      tutorParAsignado: isPaedis ? 'Coordinación PAEDIS Duoc UC' : 'Sin tutor asignado',
      diagnosticoDeclarado: sanitizeString(body.diagnosticoDeclarado, 160) || '',
      ajustesAprobados: Array.isArray(body.ajustesAprobados) ? body.ajustesAprobados : [],
      accessibilityPreferences: sanitizeAccessibilityPreferences(body.accessibilityPreferences),
      enrolledCourses: Array.isArray(body.enrolledCourses) ? body.enrolledCourses : [],
      consentimientoLey21719,
    };

    let createdUser;
    if (mongoose.connection.readyState === 1) {
      createdUser = await UserProfile.create(newUserData);
    } else {
      createdUser = { _id: `local_${Date.now()}`, ...newUserData };
      authService.registerUser(createdUser);
    }

    await authService.logActivity({
      userId: req.user._id || req.user.id,
      userEmail: req.user.email,
      userName: req.user.fullName || 'Administrador',
      userRole: req.user.role || 'admin',
      action: 'student_registered_by_admin',
      details: `Usuario ${fullName} (${email}) registrado con rol ${ROLE_LABELS[role] || role}. Cumplimiento Ley 21.719 verificado.`,
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

    const cleanReason = sanitizeString(statusReason, 200) || `Estado actualizado a ${academicStatus}`;
    let updatedUser = null;
    if (mongoose.connection.readyState === 1) {
      updatedUser = await UserProfile.findByIdAndUpdate(
        id,
        {
          $set: {
            academicStatus,
            statusReason: cleanReason,
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
      userRole: req.user.role || 'admin',
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

/**
 * GET /api/admin/courses/summary
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
 */
exports.importCourses = async (req, res) => {
  try {
    const { rows, markdown, md, fileBase64, base64, textContent, replace, periodo } = req.body || {};
    const payload = rows || markdown || md || fileBase64 || base64 || textContent || req.body;

    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      return res.status(400).json({
        success: false,
        message:
          'Debe proporcionar una lista de filas válida, texto Markdown o archivo codificado en el cuerpo de la solicitud.',
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
      metadata: { timestamp: new Date().toISOString() },
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

// Gestión dinámica de Carreras y Sedes Duoc UC (CRUD DRY vía catalogService)
exports.getCareers = careerHandlers.list;
exports.createCareer = careerHandlers.create;
exports.deleteCareer = careerHandlers.remove;

exports.getSedes = sedeHandlers.list;
exports.createSede = sedeHandlers.create;
exports.deleteSede = sedeHandlers.remove;

/**
 * GET /api/admin/sat-alerts
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

    const evaluatedStudents = studentUsers.map((student) => ({
      ...student,
      satEvaluation: satAlertService.evaluateStudentSat(student),
    }));

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

    const cleanAssignedTo = sanitizeString(req.body.assignedTo, 120) || 'Coordinación PAEDIS';
    const cleanNotes = sanitizeString(req.body.notes, 500) || '';
    const rawSla = req.body.slaDeadline ? new Date(req.body.slaDeadline) : null;
    const cleanSla =
      rawSla && !Number.isNaN(rawSla.getTime())
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

function parseValidDate(rawDate, fallbackDate = null) {
  if (!rawDate) return fallbackDate;
  const parsed = new Date(rawDate);
  return Number.isNaN(parsed.getTime()) ? fallbackDate : parsed;
}

function sanitizeReasonableAdjustments(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .slice(0, 30)
    .map((item) => {
      const tipo = sanitizeString(item?.tipo, 80);
      const descripcion = sanitizeString(item?.descripcion, 300);
      if (!tipo || !descripcion) return null;
      return {
        tipo,
        descripcion,
        fechaAprobacion: parseValidDate(item?.fechaAprobacion, new Date()),
      };
    })
    .filter(Boolean);
}

function sanitizeTeacherAcknowledgments(rawList) {
  if (!Array.isArray(rawList)) return [];
  return rawList
    .slice(0, 20)
    .map((item) => {
      const sigla = sanitizeString(item?.sigla, 30);
      const nombre = sanitizeString(item?.nombre, 140);
      if (!sigla || !nombre) return null;
      const confirmado = Boolean(item?.confirmado);
      return {
        sigla,
        nombre,
        profesor: sanitizeString(item?.profesor, 120) || 'Docente Titular',
        confirmado,
        fechaAcuse: confirmado ? parseValidDate(item?.fechaAcuse, new Date()) : null,
      };
    })
    .filter(Boolean);
}

function buildPaedisCaseUpdates(body) {
  const updates = {};
  const stringFields = [
    ['diagnosticoDeclarado', 160],
    ['barreraPaedis', 80],
    ['acreditacionPaedis', 100],
    ['notasConfidencialesPaedis', 1000],
    ['tutorParAsignado', 120],
  ];

  for (const [key, maxLen] of stringFields) {
    if (body[key] !== undefined) {
      updates[key] = sanitizeString(body[key], maxLen) || '';
    }
  }

  if (Array.isArray(body.ajustesAprobados)) {
    updates.ajustesAprobados = sanitizeReasonableAdjustments(body.ajustesAprobados);
  }

  if (Array.isArray(body.acusesDocentes)) {
    updates.acusesDocentes = sanitizeTeacherAcknowledgments(body.acusesDocentes);
  }

  if (typeof body.fichaDocenteNotificada === 'boolean') {
    updates.fichaDocenteNotificada = body.fichaDocenteNotificada;
    updates.fechaNotificacionDocente = body.fichaDocenteNotificada
      ? parseValidDate(body.fechaNotificacionDocente, new Date())
      : null;
  }

  return updates;
}

/**
 * PATCH /api/admin/paedis/:id/case
 * Gestión del ciclo de vida de ajustes razonables PAEDIS, asignación de apoyos
 * y emisión de Ficha Docente Confidencial (Ley N° 21.719).
 */
exports.updatePaedisCase = async (req, res) => {
  try {
    const rawId = String(req.params.id || '').trim();
    if (!rawId) {
      return res.status(400).json({
        success: false,
        message: 'Identificador de estudiante no proporcionado.',
      });
    }

    const user = await findUserByIdOrEmail(rawId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado para gestión de expediente PAEDIS.',
      });
    }

    const body = req.body || {};
    const updates = buildPaedisCaseUpdates(body);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo de expediente PAEDIS para actualizar.',
      });
    }

    const syncResult = await authService.updateProfileFields(user.email, updates);
    const updatedUser = syncResult.user || { ...user, ...updates };
    const isNotifyAction = body.fichaDocenteNotificada === true;

    await authService.logActivity({
      userId: req.user?._id || req.user?.id,
      userEmail: req.user?.email || 'coordinacion.paedis@duoc.cl',
      userName: req.user?.fullName || 'Coordinación PAEDIS',
      userRole: req.user?.role || 'coordinador_paedis',
      action: isNotifyAction ? 'paedis_docente_notified' : 'paedis_case_updated',
      details: `${isNotifyAction ? 'Ficha Docente Confidencial emitida' : 'Expediente PAEDIS actualizado'} para ${user.fullName || user.email} (${updates.ajustesAprobados?.length ?? user.ajustesAprobados?.length ?? 0} ajustes). Trazabilidad Ley N° 21.719.`,
      metadata: {
        targetEmail: user.email,
        adjustmentsCount: updates.ajustesAprobados?.length ?? user.ajustesAprobados?.length ?? 0,
        fichaDocenteNotificada: updates.fichaDocenteNotificada ?? user.fichaDocenteNotificada,
      },
    });

    return res.status(200).json({
      success: true,
      message: isNotifyAction
        ? 'Ficha Docente Confidencial emitida y registrada conforme a la Ley N° 21.719.'
        : 'Expediente PAEDIS y ajustes razonables actualizados exitosamente.',
      student: authService.formatUserResponse(updatedUser),
    });
  } catch (error) {
    console.error('[AdminController] Error al actualizar expediente PAEDIS:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Error al guardar el expediente PAEDIS.',
    });
  }
};
