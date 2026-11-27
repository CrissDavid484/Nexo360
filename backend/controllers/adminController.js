const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserProfile = require('../models/UserProfile');
const PaedisRecord = require('../models/PaedisRecord');
const ActivityLog = require('../models/ActivityLog');
const authService = require('../services/authService');
const emailService = require('../services/emailService');
const courseService = require('../services/courseService');
const satAlertService = require('../services/satAlertService');
const simulatorSnapshotService = require('../services/simulatorSnapshotService');
const academicCalendarService = require('../services/academicCalendarService');
const { calculatePredictiveRisk } = require('../services/predictiveRiskService');
const { careerCatalog, sedeCatalog } = require('../services/catalogService');
const {
  EMAIL_REGEX,
  STUDENT_DOMAINS,
  STAFF_DOMAINS,
  VALID_DISABILITY_PROFILES,
  DEFAULT_SEDE,
  sanitizeString,
  normalizeRutSearch,
  sanitizeAccessibilityPreferences,
  generateInitialPassword,
  getBarrierForDisability,
  getDefaultAccessibilityForDisability,
} = require('../utils/validationUtils');

const ROLE_LABELS = Object.freeze({
  admin: 'Administrador de la Plataforma TI',
  administrador: 'Administrador de la Plataforma TI',
  estudiante_paedis: 'Estudiante Regular • PAEDIS',
  estudiante: 'Estudiante Regular Duoc UC',
  coordinador_paedis: 'Coordinador/a PAEDIS e Inclusión',
  profesor: 'Docente Duoc UC',
  director: 'Directivo Institucional',
  subdirector: 'Subdirectivo Institucional',
  administrativo: 'Personal Administrativo',
  tutor_par: 'Tutor Par',
});

const ALLOWED_ROLES = Object.freeze([
  'estudiante',
  'estudiante_paedis',
  'coordinador_paedis',
  'admin',
  'administrador',
  'profesor',
  'director',
  'subdirector',
  'administrativo',
]);

const STAFF_ROLE_META = Object.freeze({
  admin: {
    label: 'Administrador Nexo360',
    permissions: ['full_access', 'manage_users', 'manage_catalogs', 'audit_logs', 'system_config', 'paedis_read', 'paedis_write'],
    badges: ['TI', 'SuperAdmin', 'Seguridad'],
  },
  administrador: {
    label: 'Administrador Nexo360',
    permissions: ['full_access', 'manage_users', 'manage_catalogs', 'audit_logs', 'system_config', 'paedis_read', 'paedis_write'],
    badges: ['TI', 'SuperAdmin', 'Seguridad'],
  },
  coordinador_paedis: {
    label: 'Coordinador PAEDIS',
    permissions: ['paedis_read', 'paedis_write', 'manage_students', 'sat_monitoring'],
    badges: ['PAEDIS', 'Inclusión', 'UAP'],
  },
  profesor: {
    label: 'Docente Duoc UC',
    permissions: ['paedis_read_students', 'class_management'],
    badges: ['Docencia', 'Aula'],
  },
  director: {
    label: 'Directivo Institucional',
    permissions: ['institutional_overview', 'continuity_exceptions', 'titration_equity'],
    badges: ['Directivo', 'Gestión'],
  },
  subdirector: {
    label: 'Subdirectivo',
    permissions: ['institutional_overview', 'continuity_exceptions'],
    badges: ['Subdirección', 'Gestión'],
  },
  administrativo: {
    label: 'Personal Administrativo',
    permissions: ['operational_support', 'benefits_management'],
    badges: ['Operaciones', 'Atención'],
  },
});

const ALL_SYSTEM_PERMISSIONS = Object.freeze([
  'full_access',
  'manage_users',
  'manage_catalogs',
  'audit_logs',
  'system_config',
  'paedis_read',
  'paedis_write',
  'manage_students',
  'sat_monitoring',
  'paedis_read_students',
  'class_management',
  'institutional_overview',
  'continuity_exceptions',
  'titration_equity',
  'operational_support',
  'benefits_management',
]);

/**
 * Crea handlers CRUD uniformes (DRY) para catálogos dinámicos (Carreras / Sedes).
 */
/**
 * Registra una acción administrativa atribuida al usuario autenticado (actor).
 * Nunca incluir contraseñas, tokens ni datos clínicos en details/metadata (Ley N° 21.719).
 */
function logAdminAction(actor, { action, details, metadata, fallbackName = 'Administrador' }) {
  return authService.logActivity({
    userId: actor?._id || actor?.id || 'admin',
    userEmail: actor?.email || 'admin@duocuc.cl',
    userName: actor?.fullName || actor?.nombre || fallbackName,
    userRole: actor?.role || 'admin',
    action,
    details,
    metadata,
  });
}

function createCatalogHandlers({
  manager,
  listKey,
  itemKey,
  entityPlural,
  entitySingular,
  createAction,
  removeAction,
}) {
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
        await logAdminAction(req.user, {
          action: createAction,
          details: `${entitySingular} "${created.name}" creada.`,
          metadata: { entity: itemKey, name: created.name },
        });
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
        await logAdminAction(req.user, {
          action: removeAction,
          details: `${entitySingular} eliminada.`,
          metadata: { entity: itemKey, targetId: String(req.params.id).slice(0, 100) },
        });
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
  createAction: 'career_created',
  removeAction: 'career_deleted',
});

const sedeHandlers = createCatalogHandlers({
  manager: sedeCatalog,
  listKey: 'sedes',
  itemKey: 'sede',
  entityPlural: 'sedes',
  entitySingular: 'Sede',
  createAction: 'sede_created',
  removeAction: 'sede_deleted',
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
    const [allUsers, latestSnapshot] = await Promise.all([
      authService.getAllUsers(),
      simulatorSnapshotService.getLatestSnapshot(),
    ]);
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

    const statusDistribution = {
      activo: students.filter((s) => s.academicStatus === 'activo').length,
      desercion: students.filter((s) => s.academicStatus === 'desercion').length,
      titulado: students.filter((s) => s.academicStatus === 'titulado').length,
    };

    const careerDistribution = {};
    students.forEach((s) => {
      const career = s.career || s.carrera || 'Sin carrera';
      careerDistribution[career] = (careerDistribution[career] || 0) + 1;
    });

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
      try {
        recentActivity = await ActivityLog.find({})
          .sort({ createdAt: -1 })
          .limit(10)
          .select('action userName userEmail details createdAt')
          .lean();
      } catch (logErr) {
        console.warn('[AdminController] Fallback logs en memoria:', logErr.message);
      }
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
        simulatorUsersCount: latestSnapshot.simulatorUsersCount ?? 0,
        simulatorUsagePercentage: latestSnapshot.simulatorUsagePercentage ?? 0,
        totalSimulatorInteractions: latestSnapshot.totalSimulatorInteractions ?? 0,
        statusDistribution,
        riskSummary: { altoRiesgo, medioRiesgo, bajoRiesgo },
        a11yPreferencesStats,
        recentActivity,
        careerDistribution,
        careerBreakdown: latestSnapshot.careerBreakdown || [],
        topDemandedSections: latestSnapshot.topDemandedSections || [],
        simulatorWeeklyUsage: latestSnapshot.simulatorWeeklyUsage || {},
        simulatorAdoption: latestSnapshot.simulatorAdoption || {
          startedOnlyTotal: 0,
          completedTotal: 0,
          startedOnlyWeekly: [],
          completedWeekly: [],
        },
        paedisTrendYear: latestSnapshot.paedisTrendYear || new Date().getFullYear(),
        paedisMonthlyTrend: latestSnapshot.paedisMonthlyTrend || {},
        paedisMonthlySeries: latestSnapshot.paedisMonthlySeries || [],
        simulatorSnapshotMeta: {
          id: latestSnapshot._id || latestSnapshot.slotDateKey,
          slot: latestSnapshot.slot,
          slotDateKey: latestSnapshot.slotDateKey,
          capturedAt: latestSnapshot.capturedAt,
          timezone: latestSnapshot.timezone || simulatorSnapshotService.CHILE_TIMEZONE,
          nextScheduledCut: simulatorSnapshotService.getNextScheduledCut(),
        },
      },
    });
  } catch {
    console.error('[AdminController] Error al obtener métricas.');
    return res.status(500).json({
      success: false,
      message: 'Error al compilar las métricas del panel de administración.',
    });
  }
};

/**
 * GET /api/admin/simulator-snapshots
 * Lista el último snapshot e historial reciente de cortes programados (03:00 / 15:00 America/Santiago).
 */
exports.getSimulatorSnapshots = async (req, res) => {
  try {
    const limit = Number.parseInt(String(req.query?.limit || 20), 10);
    const latest = await simulatorSnapshotService.getLatestSnapshot();
    const history = await simulatorSnapshotService.listSnapshots(limit);
    return res.status(200).json({
      success: true,
      latest,
      history,
      schedule: {
        slots: simulatorSnapshotService.SCHEDULED_SLOTS,
        timezone: simulatorSnapshotService.CHILE_TIMEZONE,
        nextScheduledCut: simulatorSnapshotService.getNextScheduledCut(),
      },
    });
  } catch {
    console.error('[AdminController] Error al consultar snapshots del simulador.');
    return res.status(500).json({
      success: false,
      message: 'Error al consultar snapshots programados del simulador.',
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

    const actorRole = (req.user?.role || '').toLowerCase();
    const isCoordinator = actorRole === 'coordinador_paedis';

    const enriched = users.map((u) => {
      const pred = calculatePredictiveRisk(u);
      const studentData = { ...u, prediction: pred };

      // Ley N° 21.719: Si el solicitante no es Coordinador PAEDIS (ej. Admin TI),
      // se omiten campos clínicos y confidenciales detallados del expediente
      if (!isCoordinator) {
        delete studentData.diagnosticoDeclarado;
        delete studentData.notasConfidencialesPaedis;
        delete studentData.acreditacionPaedis;
        studentData.isPaedis = Boolean(u.isPaedis || u.role === 'estudiante_paedis');
        studentData.hasAdjustments =
          Array.isArray(u.ajustesAprobados) && u.ajustesAprobados.length > 0;
      }

      return studentData;
    });

    if (isCoordinator && isPaedis === 'true') {
      try {
        await authService.logActivity({
          userId: req.user?._id || req.user?.id,
          userEmail: req.user?.email || 'coordinacion.paedis@duoc.cl',
          userName: req.user?.fullName || 'Coordinación PAEDIS',
          userRole: req.user?.role || 'coordinador_paedis',
          action: 'paedis_records_consulted',
          details: `Consulta de expedientes confidenciales PAEDIS (${enriched.length} registros). Trazabilidad Ley N° 21.719.`,
          metadata: { count: enriched.length, filter: 'isPaedis=true' },
        });
      } catch (logErr) {
        console.warn('[AdminController] Error al registrar auditoría de acceso PAEDIS:', logErr?.message);
      }
    }

    return res.status(200).json({
      success: true,
      count: enriched.length,
      students: enriched,
    });
  } catch {
    console.error('[AdminController] Error al listar estudiantes.');
    return res.status(500).json({
      success: false,
      message: 'Error al obtener el directorio de estudiantes.',
    });
  }
};

function resolveIdentityFields(body) {
  const firstName = sanitizeString(body.firstName, 60) || '';
  const paternalLastName = sanitizeString(body.paternalLastName, 60) || '';
  const maternalLastName = sanitizeString(body.maternalLastName, 60) || '';

  if (firstName || paternalLastName || maternalLastName) {
    const composed = [firstName, paternalLastName, maternalLastName].filter(Boolean).join(' ');
    return {
      firstName,
      paternalLastName,
      maternalLastName,
      fullName: composed || sanitizeString(body.fullName || body.nombre, 120) || '',
    };
  }

  const legacyFullName = sanitizeString(body.fullName || body.nombre, 120) || '';
  const parts = legacyFullName.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    paternalLastName: parts.length >= 2 ? parts[1] : '',
    maternalLastName: parts.length >= 3 ? parts.slice(2).join(' ') : '',
    fullName: legacyFullName,
  };
}

function validateDomainForRole(email, role) {
  const domain = email.split('@')[1] || '';
  const isStaffRole =
    role === 'admin' ||
    role === 'administrador' ||
    role === 'coordinador_paedis' ||
    role === 'profesor' ||
    role === 'director' ||
    role === 'subdirector' ||
    role === 'administrativo';

  if (isStaffRole && !STAFF_DOMAINS.includes(domain)) {
    return 'Los roles de colaboradores y personal institucional requieren un correo de colaborador (@profesor.duoc.cl o @duoc.cl).';
  }
  if (!isStaffRole && !STUDENT_DOMAINS.includes(domain)) {
    return 'Los roles de Estudiante y Estudiante PAEDIS requieren un correo institucional estudiantil (@duocuc.cl).';
  }
  return null;
}

function resolveDisabilityAndAccessibility(body, isPaedis, isStaffRole) {
  const rawProfile = sanitizeString(body.disabilityProfile, 40)?.toLowerCase() || '';
  if (rawProfile && !VALID_DISABILITY_PROFILES.includes(rawProfile)) {
    return { error: 'El perfil de discapacidad PAEDIS especificado no es válido.' };
  }

  const disabilityProfile = isStaffRole ? 'ninguna' : rawProfile || 'ninguna';
  const explicitPrefs =
    body.accessibilityPreferences &&
    typeof body.accessibilityPreferences === 'object' &&
    !Array.isArray(body.accessibilityPreferences)
      ? body.accessibilityPreferences
      : {};
  const colorBlindSubtype =
    sanitizeString(body.colorBlindMode || explicitPrefs.colorBlindMode, 30)?.toLowerCase() ||
    'deuteranopia';

  const basePrefs =
    isPaedis && disabilityProfile !== 'ninguna'
      ? getDefaultAccessibilityForDisability(disabilityProfile, colorBlindSubtype)
      : {};

  const accessibilityPreferences = sanitizeAccessibilityPreferences({
    ...basePrefs,
    ...explicitPrefs,
  });

  const explicitBarrier = sanitizeString(body.barreraPaedis, 80);
  let barreraPaedis = '';
  if (explicitBarrier) {
    barreraPaedis = explicitBarrier;
  } else if (isPaedis && disabilityProfile !== 'ninguna') {
    barreraPaedis = getBarrierForDisability(disabilityProfile) || 'Visual / Sensorial';
  } else if (isPaedis) {
    barreraPaedis = 'Visual / Sensorial';
  }

  return { disabilityProfile, barreraPaedis, accessibilityPreferences };
}

async function checkUserEmailExists(email) {
  if (mongoose.connection.readyState === 1) {
    const existing = await UserProfile.findOne({ email });
    return Boolean(existing);
  }
  const allUsers = await authService.getAllUsers();
  return allUsers.some((u) => (u.email || '').toLowerCase() === email.toLowerCase());
}

function resolveCareerForRole(body, isStaffRole) {
  const rawCareer = sanitizeString(body.career || body.carrera, 120);
  if (rawCareer) return rawCareer;
  return isStaffRole ? '' : 'Ingeniería en Informática';
}

function validateCreateStudentRequest(body, reqUser) {
  const requestedRole = sanitizeString(body.role || 'estudiante', 40)?.toLowerCase() || 'estudiante';
  if (!ALLOWED_ROLES.includes(requestedRole)) {
    return {
      errorStatus: 400,
      errorMessage:
        'Rol no válido. Los roles institucionales permitidos son: Estudiante, Estudiante PAEDIS, Coordinador PAEDIS, Docente, Directivo, Subdirectivo, Administrativo y Administrador.',
    };
  }

  const isTargetAdmin = requestedRole === 'admin' || requestedRole === 'administrador';
  const actorRole = (reqUser?.role || '').toLowerCase();
  const isActorAdmin = actorRole === 'admin' || actorRole === 'administrador';
  if (isTargetAdmin && !isActorAdmin) {
    return {
      errorStatus: 403,
      errorMessage:
        'Acceso restringido: Solo un Administrador puede crear o asignar usuarios con el rol Administrador.',
    };
  }

  const rawEmail =
    body.email ||
    (body.emailLocal && body.emailDomain ? `${body.emailLocal}@${body.emailDomain}` : '');
  const email = sanitizeString(rawEmail, 120)?.toLowerCase() || '';
  if (!email || !EMAIL_REGEX.test(email)) {
    return {
      errorStatus: 400,
      errorMessage:
        'Debe ingresar un correo institucional Duoc UC válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl).',
    };
  }

  const role = requestedRole === 'administrador' ? 'admin' : requestedRole;
  const isStaffRole =
    role === 'admin' ||
    role === 'coordinador_paedis' ||
    role === 'profesor' ||
    role === 'director' ||
    role === 'subdirector' ||
    role === 'administrativo';

  // Regla RBAC: Coordinador PAEDIS solo puede registrar estudiantes (@duocuc.cl / rol estudiante)
  if (actorRole === 'coordinador_paedis') {
    const isStudentTarget = role === 'estudiante' || role === 'estudiante_paedis';
    const domain = email.split('@')[1] || '';
    if (!isStudentTarget || !STUDENT_DOMAINS.includes(domain)) {
      return {
        errorStatus: 403,
        errorMessage:
          'Acceso restringido: El rol Coordinador PAEDIS solo tiene autorización para registrar cuentas de estudiantes (@duocuc.cl).',
      };
    }
  }

  const domainError = validateDomainForRole(email, role);
  if (domainError) {
    return { errorStatus: 400, errorMessage: domainError };
  }

  if (body.consentimientoLey21719?.aceptado === false) {
    return {
      errorStatus: 400,
      errorMessage:
        'El tratamiento de datos bajo la Ley N° 21.719 es obligatorio para registrar cuentas institucionales.',
    };
  }

  const identity = resolveIdentityFields(body);
  if (!identity.fullName) {
    return { errorStatus: 400, errorMessage: 'El nombre completo es obligatorio.' };
  }

  const isPaedis = !isStaffRole && (role === 'estudiante_paedis' || Boolean(body.isPaedis));
  const profileSetup = resolveDisabilityAndAccessibility(body, isPaedis, isStaffRole);
  if (profileSetup.error) {
    return { errorStatus: 400, errorMessage: profileSetup.error };
  }

  return { email, role, isStaffRole, isPaedis, identity, profileSetup };
}

function generateSimulatedStudentCourses(career = '', inputRate = null) {
  const cLower = String(career).toLowerCase();
  let courseTemplates;

  if (cLower.includes('informática') || cLower.includes('analista') || cLower.includes('software')) {
    courseTemplates = [
      { sigla: 'ASY1101', nombre: 'Fundamentos de Arquitectura de Sistemas', seccion: '001D', creditos: 10, total: 24, prof: 'Rodrigo Silva', sala: 'Laboratorio TI 201' },
      { sigla: 'PRY1102', nombre: 'Taller de Programación Orientada a Objetos', seccion: '002D', creditos: 10, total: 28, prof: 'Claudia Muñoz', sala: 'Laboratorio TI 202' },
      { sigla: 'MAT1101', nombre: 'Nivelación Matemática', seccion: '001D', creditos: 8, total: 32, prof: 'Patricio Morales', sala: 'Aula Magna 301' },
      { sigla: 'INU5101', nombre: 'Inglés Intermedio I', seccion: '003D', creditos: 10, total: 20, prof: 'Jennifer Adams', sala: 'Laboratorio Idiomas 1' },
      { sigla: 'BDY2101', nombre: 'Bases de Datos Relacionales', seccion: '001D', creditos: 10, total: 24, prof: 'Mauricio Castro', sala: 'Laboratorio TI 204' },
    ];
  } else if (cLower.includes('telecom') || cLower.includes('red') || cLower.includes('infraestructura')) {
    courseTemplates = [
      { sigla: 'RED1101', nombre: 'Fundamentos de Redes y Conectividad', seccion: '001D', creditos: 10, total: 24, prof: 'Yasser Guerra', sala: 'Laboratorio Redes 101' },
      { sigla: 'TEL1102', nombre: 'Introducción a Telecomunicaciones', seccion: '002D', creditos: 10, total: 24, prof: 'Gonzalo Oyarzún', sala: 'Laboratorio Telecom' },
      { sigla: 'OCY1104', nombre: 'Ciberseguridad Ofensiva', seccion: '001D', creditos: 10, total: 20, prof: 'José Erasmo Matus', sala: 'Laboratorio Seguridad' },
      { sigla: 'MAT1101', nombre: 'Nivelación Matemática', seccion: '001D', creditos: 8, total: 32, prof: 'Patricio Morales', sala: 'Aula Magna 301' },
      { sigla: 'INU5101', nombre: 'Inglés Intermedio I', seccion: '003D', creditos: 10, total: 20, prof: 'Jennifer Adams', sala: 'Laboratorio Idiomas 1' },
    ];
  } else if (cLower.includes('construc') || cLower.includes('obra') || cLower.includes('dibujo')) {
    courseTemplates = [
      { sigla: 'DBO1101', nombre: 'Dibujo Arquitectónico y Planimetría', seccion: '001D', creditos: 10, total: 28, prof: 'Marcelo Fernández', sala: 'Taller Planos 102' },
      { sigla: 'TEC1102', nombre: 'Tecnología y Resistencia de Materiales', seccion: '002D', creditos: 10, total: 24, prof: 'Andrea Valenzuela', sala: 'Laboratorio Estructuras' },
      { sigla: 'MAT1101', nombre: 'Nivelación Matemática', seccion: '001D', creditos: 8, total: 32, prof: 'Patricio Morales', sala: 'Aula Magna 301' },
      { sigla: 'OBR1103', nombre: 'Gestión y Seguridad en Obras', seccion: '001D', creditos: 10, total: 22, prof: 'Esteban Reyes', sala: 'Aula 205' },
    ];
  } else if (cLower.includes('admin') || cLower.includes('gestión') || cLower.includes('comercial')) {
    courseTemplates = [
      { sigla: 'ADM1101', nombre: 'Fundamentos de Administración Moderna', seccion: '001D', creditos: 10, total: 24, prof: 'Carlos Henríquez', sala: 'Aula 304' },
      { sigla: 'CON1102', nombre: 'Contabilidad General y Financiera', seccion: '002D', creditos: 10, total: 28, prof: 'Loreto Sanhueza', sala: 'Laboratorio Contable' },
      { sigla: 'MAT1101', nombre: 'Nivelación Matemática', seccion: '001D', creditos: 8, total: 32, prof: 'Patricio Morales', sala: 'Aula Magna 301' },
      { sigla: 'INU5101', nombre: 'Inglés Intermedio I', seccion: '003D', creditos: 10, total: 20, prof: 'Jennifer Adams', sala: 'Laboratorio Idiomas 1' },
    ];
  } else {
    courseTemplates = [
      { sigla: 'INI1101', nombre: 'Introducción al Área de Especialidad', seccion: '001D', creditos: 10, total: 24, prof: 'Docente Titular', sala: 'Aula Central 201' },
      { sigla: 'HER1102', nombre: 'Herramientas Digitales y Productividad', seccion: '002D', creditos: 10, total: 24, prof: 'Coordinador Académico', sala: 'Laboratorio General' },
      { sigla: 'MAT1101', nombre: 'Nivelación Matemática', seccion: '001D', creditos: 8, total: 32, prof: 'Patricio Morales', sala: 'Aula Magna 301' },
      { sigla: 'INU5101', nombre: 'Inglés Intermedio I', seccion: '003D', creditos: 10, total: 20, prof: 'Jennifer Adams', sala: 'Laboratorio Idiomas 1' },
    ];
  }

  const targetRate = typeof inputRate === 'number' && !Number.isNaN(inputRate) && inputRate >= 0 && inputRate <= 100
    ? inputRate
    : 88.9;

  let totalAttended = 0;
  let totalClasses = 0;

  const enrolledCourses = courseTemplates.map((t, idx) => {
    const variance = (idx % 2 === 0 ? 1 : -1) * (2.5 + (idx * 0.8));
    const coursePct = Math.min(100, Math.max(50, Math.round((targetRate + variance) * 10) / 10));
    const attended = Math.min(t.total, Math.round((t.total * coursePct) / 100));
    const exactPct = Math.round((attended / t.total) * 1000) / 10;

    totalAttended += attended;
    totalClasses += t.total;

    return {
      sigla: t.sigla,
      nombre: t.nombre,
      seccion: t.seccion,
      creditos: t.creditos,
      attendanceRate: exactPct,
      porcentajeAsistencia: exactPct,
      clasesRegistradas: t.total,
      asistencias: attended,
      profesor: t.prof,
      sala: t.sala,
    };
  });

  const courseAttendance = enrolledCourses.map((c) => ({
    courseCode: c.sigla,
    courseName: c.nombre,
    totalSessions: c.clasesRegistradas,
    attendedSessions: c.asistencias,
    attendancePercentage: c.porcentajeAsistencia,
    consecutiveAbsences: c.porcentajeAsistencia < 70 ? 3 : 0,
    lateCount: c.porcentajeAsistencia < 80 ? 2 : 1,
    missedKeySession: false,
    paedisJustified: false,
  }));

  const globalRate = totalClasses > 0
    ? Math.round((totalAttended / totalClasses) * 1000) / 10
    : targetRate;

  return { enrolledCourses, courseAttendance, attendanceRate: globalRate };
}

function buildNewUserDocument({
  body,
  email,
  role,
  isStaffRole,
  isPaedis,
  identity,
  profileSetup,
  cleanRut,
  hashedPassword,
  mustChangePassword,
}) {
  const selectedCareer = resolveCareerForRole(body, isStaffRole);
  const selectedCampus = sanitizeString(body.campus || body.sede, 80) || DEFAULT_SEDE;
  const roleLabel =
    sanitizeString(body.roleLabel, 120) || ROLE_LABELS[role] || 'Estudiante Duoc UC';

  const isStudentRole = role === 'estudiante' || role === 'estudiante_paedis';
  let initialCourses = Array.isArray(body.enrolledCourses) && body.enrolledCourses.length > 0
    ? body.enrolledCourses
    : [];
  let initialCourseAttendance = Array.isArray(body.courseAttendance) && body.courseAttendance.length > 0
    ? body.courseAttendance
    : [];
  let calculatedAttendance = typeof body.attendanceRate === 'number'
    ? body.attendanceRate
    : (Number.parseFloat(body.attendanceRate) || 88.9);

  if (isStudentRole && initialCourses.length === 0) {
    const generated = generateSimulatedStudentCourses(selectedCareer, calculatedAttendance);
    initialCourses = generated.enrolledCourses;
    initialCourseAttendance = generated.courseAttendance;
    calculatedAttendance = generated.attendanceRate;
  }

  return {
    email,
    password: hashedPassword,
    mustChangePassword,
    firstName: identity.firstName,
    paternalLastName: identity.paternalLastName,
    maternalLastName: identity.maternalLastName,
    fullName: identity.fullName,
    nombre: identity.fullName,
    photo: typeof body.photo === 'string' ? body.photo.trim() : '',
    rut: cleanRut,
    role,
    roleLabel,
    isPaedis,
    disabilityProfile: profileSetup.disabilityProfile,
    barreraPaedis: profileSetup.barreraPaedis,
    academicStatus: 'activo',
    statusReason: 'Registrado por Administrador en Nexo360',
    attendanceRate: calculatedAttendance,
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
    accessibilityPreferences: profileSetup.accessibilityPreferences,
    enrolledCourses: initialCourses,
    courseAttendance: initialCourseAttendance,
    permissions: Array.isArray(body.permissions)
      ? body.permissions.map((p) => sanitizeString(p, 50)).filter((p) => p && ALL_SYSTEM_PERMISSIONS.includes(p))
      : (STAFF_ROLE_META[role]?.permissions || []),
    badges: Array.isArray(body.badges)
      ? body.badges.map((b) => sanitizeString(b, 40)).filter(Boolean).slice(0, 10)
      : (STAFF_ROLE_META[role]?.badges || []),
    consentimientoLey21719: {
      aceptado: true,
      fechaAceptacion: body.consentimientoLey21719?.fechaAceptacion || new Date(),
      finalidadTratamiento:
        sanitizeString(body.consentimientoLey21719?.finalidadTratamiento, 300) ||
        'Gestión académica, registro curricular, acompañamiento PAEDIS y prevención de deserción estudiantil según Ley N° 21.719 de Chile',
    },
  };
}

async function dispatchWelcomeAndLogs({
  reqUser,
  createdUser,
  email,
  fullName,
  role,
  roleLabel,
  initialPassword,
}) {
  let emailResult = { delivered: false, deliveryMode: 'fallback', devPreview: null };
  try {
    const resetToken = await authService.createPasswordResetToken(email);
    emailResult = await emailService.sendWelcomeEmail({
      to: email,
      fullName,
      initialPassword,
      resetToken,
      roleLabel,
    });
  } catch {
    console.warn('[AdminController] No se pudo enviar el correo de bienvenida.');
  }

  await logAdminAction(reqUser, {
    action: 'student_registered_by_admin',
    details: `Usuario ${fullName} (${email}) registrado con rol ${roleLabel}. Cumplimiento Ley 21.719 verificado.`,
    metadata: { targetEmail: email, targetRole: role },
  });

  if (emailResult.delivered) {
    await authService.logActivity({
      userId: createdUser._id || createdUser.id,
      userEmail: email,
      userName: fullName,
      userRole: role,
      action: 'welcome_email_sent',
      details: `Correo de bienvenida enviado (${emailResult.deliveryMode}).`,
      metadata: { deliveryMode: emailResult.deliveryMode },
    });
  }

  return emailResult;
}

/**
 * POST /api/admin/students
 */
exports.createStudent = async (req, res) => {
  try {
    const body = req.body || {};
    const validated = validateCreateStudentRequest(body, req.user);
    if (validated.errorStatus) {
      return res.status(validated.errorStatus).json({
        success: false,
        message: validated.errorMessage,
      });
    }

    const { email, role, isStaffRole, isPaedis, identity, profileSetup } = validated;
    if (await checkUserEmailExists(email)) {
      return res.status(409).json({
        success: false,
        message: `El correo ${email} ya se encuentra registrado en la base de datos de Nexo360.`,
      });
    }

    const cleanRut = sanitizeString(body.rut, 20) || 'Sin RUT';
    const explicitPassword = sanitizeString(body.password, 256);
    const password =
      explicitPassword ||
      generateInitialPassword(cleanRut, identity.paternalLastName, identity.fullName);
    const mustChangePassword =
      body.mustChangePassword !== undefined ? Boolean(body.mustChangePassword) : !explicitPassword;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUserData = buildNewUserDocument({
      body,
      email,
      role,
      isStaffRole,
      isPaedis,
      identity,
      profileSetup,
      cleanRut,
      hashedPassword,
      mustChangePassword,
    });

    let createdUser;
    if (mongoose.connection.readyState === 1) {
      createdUser = await UserProfile.create(newUserData);
    } else {
      createdUser = { _id: `local_${Date.now()}`, ...newUserData };
      authService.registerUser(createdUser);
    }

    const emailResult = await dispatchWelcomeAndLogs({
      reqUser: req.user,
      createdUser,
      email,
      fullName: identity.fullName,
      role,
      roleLabel: newUserData.roleLabel,
      initialPassword: password,
    });

    return res.status(201).json({
      success: true,
      message: `Usuario ${identity.fullName} registrado exitosamente en la base de datos de Nexo360.`,
      user: authService.formatUserResponse(createdUser),
      emailSent: Boolean(emailResult.delivered),
      ...(process.env.NODE_ENV !== 'production' && emailResult.devPreview
        ? { emailPreview: emailResult.devPreview }
        : {}),
    });
  } catch {
    console.error('[AdminController] Error al crear usuario.');
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

    const targetUser = await findUserByIdOrEmail(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Estudiante no encontrado para actualización de estado.',
      });
    }

    const actorRole = (req.user?.role || '').toLowerCase();

    // Regla RBAC: Coordinador PAEDIS solo puede modificar estado de estudiantes, nunca de personal o administradores
    if (actorRole === 'coordinador_paedis') {
      const targetRole = (targetUser.role || '').toLowerCase();
      const isTargetStaffOrAdmin = [
        'admin',
        'administrador',
        'coordinador_paedis',
        'profesor',
        'docente',
        'director',
      ].includes(targetRole);
      if (isTargetStaffOrAdmin) {
        return res.status(403).json({
          success: false,
          message:
            'Acceso restringido: El Coordinador PAEDIS solo puede modificar el estado académico de estudiantes, no de personal o administradores.',
        });
      }
    }

    const cleanReason =
      sanitizeString(statusReason, 200) || `Estado actualizado a ${academicStatus}`;
    let updatedUser = null;
    const targetDocId = targetUser._id || targetUser.id || id;

    if (mongoose.connection.readyState === 1) {
      updatedUser = await UserProfile.findByIdAndUpdate(
        targetDocId,
        {
          $set: {
            academicStatus,
            statusReason: cleanReason,
            statusUpdatedAt: new Date(),
          },
        },
        { returnDocument: 'after' }
      );
    } else {
      targetUser.academicStatus = academicStatus;
      targetUser.statusReason = cleanReason;
      targetUser.statusUpdatedAt = new Date();
      updatedUser = targetUser;
    }

    await logAdminAction(req.user, {
      action: 'status_changed_by_admin',
      fallbackName: actorRole === 'coordinador_paedis' ? 'Coordinador PAEDIS' : 'Administrador',
      details: `Estado del usuario ${targetUser.fullName || targetUser.email} actualizado a "${academicStatus}". Motivo: ${cleanReason}`,
      metadata: { targetEmail: targetUser.email, academicStatus },
    });

    return res.status(200).json({
      success: true,
      message: `Estado académico actualizado a "${academicStatus.toUpperCase()}" correctamente.`,
      user: updatedUser ? authService.formatUserResponse(updatedUser) : null,
    });
  } catch {
    console.error('[AdminController] Error al actualizar estado.');
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado del estudiante.',
    });
  }
};

/**
 * PATCH /api/admin/users/:id/role
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const rawRole = sanitizeString(req.body?.role, 40)?.toLowerCase() || '';
    const validRoles = UserProfile.schema.path('role').enumValues || [
      'admin',
      'administrador',
      'estudiante_paedis',
      'estudiante',
      'tutor_par',
      'profesor',
      'director',
      'subdirector',
      'coordinador_paedis',
      'administrativo',
    ];

    if (!validRoles.includes(rawRole)) {
      return res.status(400).json({
        success: false,
        message: 'Rol institucional no válido.',
      });
    }

    const targetUser = await findUserByIdOrEmail(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado para actualización de rol.',
      });
    }

    const actorId = String(req.user?._id || req.user?.id || '');
    const targetDocId = targetUser._id || targetUser.id || id;
    if (
      (actorId && String(targetDocId) === actorId) ||
      (req.user?.email && targetUser.email && req.user.email.toLowerCase() === targetUser.email.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: 'No puede modificar su propio rol mientras está en sesión.',
      });
    }

    const roleLabel = ROLE_LABELS[rawRole] || 'Personal Administrativo';
    const isPaedis = rawRole === 'estudiante_paedis';
    let updatedUser = null;

    const updateFields = {
      role: rawRole,
      roleLabel,
      isPaedis,
    };

    if (Array.isArray(req.body?.permissions)) {
      updateFields.permissions = req.body.permissions
        .map((p) => sanitizeString(p, 50))
        .filter((p) => p && ALL_SYSTEM_PERMISSIONS.includes(p));
    }
    if (Array.isArray(req.body?.badges)) {
      updateFields.badges = req.body.badges
        .map((b) => sanitizeString(b, 40))
        .filter(Boolean)
        .slice(0, 10);
    }

    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(String(targetDocId))) {
      updatedUser = await UserProfile.findByIdAndUpdate(
        targetDocId,
        {
          $set: updateFields,
        },
        { returnDocument: 'after', runValidators: true }
      );
    } else {
      authService.updateUserFieldsInMemory(targetUser.email, updateFields);
      updatedUser = { ...targetUser, ...updateFields };
    }

    await logAdminAction(req.user, {
      action: 'student_updated_by_admin',
      details: `Rol de ${targetUser.fullName || targetUser.email} actualizado a "${roleLabel}".`,
      metadata: { targetEmail: targetUser.email, role: rawRole, ...updateFields },
    });

    return res.status(200).json({
      success: true,
      message: `Rol actualizado a "${roleLabel}" correctamente.`,
      user: updatedUser ? authService.formatUserResponse(updatedUser) : null,
    });
  } catch {
    console.error('[AdminController] Error al actualizar rol de usuario.');
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar el rol del usuario.',
    });
  }
};

/**
 * PATCH /api/admin/users/:id/permissions
 */
exports.updateUserPermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await findUserByIdOrEmail(id);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado para actualización de permisos.',
      });
    }

    const actorId = String(req.user?._id || req.user?.id || '');
    const targetDocId = targetUser._id || targetUser.id || id;
    if (
      (actorId && String(targetDocId) === actorId) ||
      (req.user?.email && targetUser.email && req.user.email.toLowerCase() === targetUser.email.toLowerCase())
    ) {
      return res.status(400).json({
        success: false,
        message: 'No puede modificar sus propios permisos o rol mientras está en sesión.',
      });
    }

    const updateFields = {};
    const validRoles = UserProfile.schema.path('role').enumValues || [
      'admin',
      'administrador',
      'estudiante_paedis',
      'estudiante',
      'tutor_par',
      'profesor',
      'director',
      'subdirector',
      'coordinador_paedis',
      'administrativo',
    ];

    if (req.body?.role) {
      const rawRole = sanitizeString(req.body.role, 40)?.toLowerCase() || '';
      if (!validRoles.includes(rawRole)) {
        return res.status(400).json({
          success: false,
          message: 'Rol institucional no válido.',
        });
      }
      updateFields.role = rawRole;
      updateFields.roleLabel = ROLE_LABELS[rawRole] || 'Personal Administrativo';
      updateFields.isPaedis = rawRole === 'estudiante_paedis';
    }

    if (Array.isArray(req.body?.permissions)) {
      updateFields.permissions = req.body.permissions
        .map((p) => sanitizeString(p, 50))
        .filter((p) => p && ALL_SYSTEM_PERMISSIONS.includes(p));
    }

    if (Array.isArray(req.body?.badges)) {
      updateFields.badges = req.body.badges
        .map((b) => sanitizeString(b, 40))
        .filter(Boolean)
        .slice(0, 10);
    }

    let updatedUser = null;
    if (mongoose.connection.readyState === 1 && mongoose.Types.ObjectId.isValid(String(targetDocId))) {
      updatedUser = await UserProfile.findByIdAndUpdate(
        targetDocId,
        { $set: updateFields },
        { returnDocument: 'after', runValidators: true }
      );
    } else {
      authService.updateUserFieldsInMemory(targetUser.email, updateFields);
      updatedUser = { ...targetUser, ...updateFields };
    }

    await logAdminAction(req.user, {
      action: 'staff_permissions_updated',
      details: `Permisos y badges de ${targetUser.fullName || targetUser.email} actualizados (${updateFields.permissions?.length ?? 0} permisos, ${updateFields.badges?.length ?? 0} badges).`,
      metadata: { targetEmail: targetUser.email, ...updateFields },
    });

    return res.status(200).json({
      success: true,
      message: `Permisos y badges de ${targetUser.fullName || targetUser.email} actualizados correctamente.`,
      user: updatedUser ? authService.formatUserResponse(updatedUser) : null,
    });
  } catch (error) {
    console.error('[AdminController] Error al actualizar permisos de usuario:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al actualizar permisos y badges en la base de datos.',
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

    const targetUser = await findUserByIdOrEmail(id);
    if (mongoose.connection.readyState === 1) {
      await UserProfile.findByIdAndDelete(id);
    }

    await logAdminAction(req.user, {
      action: 'student_deleted_by_admin',
      details: `Usuario ${targetUser?.email || String(id).slice(0, 100)} eliminado.`,
      metadata: { targetId: String(id).slice(0, 100), targetEmail: targetUser?.email },
    });

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado correctamente de la base de datos.',
    });
  } catch {
    console.error('[AdminController] Error al eliminar usuario.');
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
    const [careers, sections] = await Promise.all([
      courseService.getCareersSummary(),
      courseService.getCatalogSectionCounts(),
    ]);
    const totalSecciones = careers.reduce((acc, c) => acc + c.totalSecciones, 0);
    const totalAsignaturas = careers.reduce((acc, c) => acc + c.totalAsignaturas, 0);

    return res.status(200).json({
      success: true,
      summary: {
        totalSecciones,
        totalAsignaturas,
        totalCarreras: careers.length,
        totalCourses: totalSecciones,
        diurnas: sections?.D ?? 0,
        vespertinas: sections?.V ?? 0,
        ambiguas: sections?.ambiguous ?? 0,
        periodoActivo: '2026 - 002',
        careers,
      },
    });
  } catch (error) {
    console.error('[AdminController] Error al obtener resumen de cursos.');
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
    const {
      rows,
      markdown,
      md,
      rawMarkdown,
      xml,
      rawXml,
      fileBase64,
      base64,
      textContent,
      replace,
      periodo,
    } = req.body || {};
    const payload = rows || markdown || md || rawMarkdown || xml || rawXml || fileBase64 || base64 || textContent || req.body;

    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      return res.status(400).json({
        success: false,
        message:
          'Debe proporcionar una lista de filas válida, texto Markdown o archivo codificado en el cuerpo de la solicitud.',
      });
    }

    const importOptions = { replace: Boolean(replace), periodo: periodo || '2026 - 002' };

    // Dry-run: valida y previsualiza sin escribir nada en memoria, MongoDB ni ActivityLog
    if (['true', '1'].includes(String(req.query?.dryRun).toLowerCase())) {
      const preview = await courseService.previewImport(req.body, importOptions);
      return res.status(200).json({ success: true, dryRun: true, preview });
    }

    const result = await courseService.bulkImport(req.body, importOptions);

    await logAdminAction(req.user, {
      action: 'IMPORT',
      details: `Importación masiva (${result.sourceFormat || 'XLSX/MD/JSON'}): ${result.seccionesImportadas} secciones para ${result.carrerasDetectadas.length} carreras. Sobreescritura previa: ${Boolean(replace)}.`,
      metadata: {
        replace: Boolean(replace),
        sourceFormat: result.sourceFormat,
        seccionesImportadas: result.seccionesImportadas,
        seccionesDiurnas: result.sections.D,
        seccionesVespertinas: result.sections.V,
        seccionesAmbiguas: result.sections.ambiguous,
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
    console.error('[AdminController] Error en importación masiva de cursos.');
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

    await logAdminAction(req.user, {
      action: 'SEED',
      details: `Restablecimiento de Catálogo Oficial Alameda 2026-002: ${result.count} secciones cargadas exitosamente.`,
      metadata: {
        count: result.count,
        seccionesDiurnas: result.sections.D,
        seccionesVespertinas: result.sections.V,
        seccionesAmbiguas: result.sections.ambiguous,
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
    console.error('[AdminController] Error al sembrar cursos.');
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
    const { removedCount } = await courseService.clearAll();

    await logAdminAction(req.user, {
      action: 'CLEAR',
      details: `Vaciado completo del catálogo de asignaturas y secciones (${removedCount} secciones).`,
      metadata: { removedCount },
    });

    return res.status(200).json({
      success: true,
      message: 'Base de datos de asignaturas vaciada correctamente.',
    });
  } catch (error) {
    console.error('[AdminController] Error al vaciar cursos.');
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

      const getMinAttendance = (student) => {
        const list = Array.isArray(student.courseAttendance) ? student.courseAttendance : [];
        if (list.length === 0) return 100;
        return Math.min(...list.map((c) => Number(c.attendancePercentage ?? 100)));
      };
      const minA = getMinAttendance(a);
      const minB = getMinAttendance(b);
      if (minA !== minB) return minA - minB;

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
  } catch {
    console.error('[AdminController] Error al obtener alertas SAT.');
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

    // Simulación en memoria: no mutar user.courseAttendance en MongoDB ni llamar a user.save()
    const simulatedStudent = {
      ...(user.toObject ? user.toObject() : user),
      courseAttendance: updatedCourses,
    };
    const satEval = satAlertService.evaluateStudentSat(simulatedStudent);

    // Persistir escenario volátil en AttendanceSimulation con TTL de 7 días (si la BD está conectada)
    if (mongoose.connection.readyState === 1) {
      try {
        const AttendanceSimulation = require('../models/AttendanceSimulation');
        const origCourse = currentAttendance.find((c) => c.courseCode === rawCourseCode);
        const simCourse = updatedCourses.find((c) => c.courseCode === rawCourseCode);
        const basePct = origCourse ? (origCourse.attendancePercentage ?? origCourse.asistencia ?? 0) : 0;
        const simPct = simCourse ? (simCourse.attendancePercentage ?? simCourse.asistencia ?? 0) : 0;

        const rawDocId = user._id || user.id;
        const validObjectId =
          rawDocId && mongoose.Types.ObjectId.isValid(rawDocId)
            ? new mongoose.Types.ObjectId(rawDocId)
            : undefined;

        await AttendanceSimulation.create({
          userId: validObjectId,
          userEmail: user.email,
          courseCode: rawCourseCode,
          actionApplied: rawAction.toUpperCase().includes('PAEDIS')
            ? 'CUSTOM_STEPPER'
            : (rawAction.toUpperCase() || 'CUSTOM_STEPPER'),
          baselinePercentage: basePct,
          simulatedPercentage: simPct,
          deltaPercentage: Math.round((simPct - basePct) * 10) / 10,
        });
      } catch (simErr) {
        console.warn('[AdminController] Escenario de simulación no registrado en BD:', simErr.message);
      }
    }

    await authService.logActivity({
      userId: user.id || user._id,
      userEmail: user.email,
      userName: user.fullName || user.nombre,
      userRole: user.role,
      action: 'sat_weekly_cut_simulated',
      details: `Simulación SAP aplicada a ramo ${rawCourseCode}: acción '${rawAction || 'personalizada'}'. Nuevo estado SAT: ${satEval.riskLevel}`,
      metadata: {
        actorEmail: req.user?.email || '',
        actorRole: req.user?.role || 'admin',
        targetEmail: user.email,
        courseCode: rawCourseCode,
        simulatedAction: rawAction || 'personalizada',
        riskLevel: satEval.riskLevel,
      },
    });

    const formatted = authService.formatUserResponse(simulatedStudent);

    return res.status(200).json({
      success: true,
      message: 'Simulación de corte semanal SAP aplicada exitosamente (no destructiva).',
      student: {
        ...formatted,
        satEvaluation: satEval,
      },
    });
  } catch {
    console.error('[AdminController] Error al simular alerta SAT.');
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

    const allowedStatuses = ['PENDING', 'IN_PROGRESS', 'AGREEMENT', 'RESOLVED'];
    const statusMap = {
      PENDING: 'PENDING',
      PENDIENTE: 'PENDING',
      IN_PROGRESS: 'IN_PROGRESS',
      EN_GESTION: 'IN_PROGRESS',
      CONTACTADO: 'IN_PROGRESS',
      AGREEMENT: 'AGREEMENT',
      ACUERDO: 'AGREEMENT',
      DERIVACION: 'AGREEMENT',
      RESOLVED: 'RESOLVED',
      RESUELTA: 'RESOLVED',
    };
    const rawStatus = String(req.body.status || 'IN_PROGRESS').trim().toUpperCase();
    const cleanStatus = statusMap[rawStatus] || (allowedStatuses.includes(rawStatus) ? rawStatus : 'IN_PROGRESS');

    const cleanAssignedTo = sanitizeString(req.body.assignedTo, 120) || 'Coordinación PAEDIS';
    const cleanNotes = sanitizeString(req.body.notes, 500) || '';
    const rawSla = req.body.slaDeadline ? new Date(req.body.slaDeadline) : null;
    const cleanSla =
      rawSla && !Number.isNaN(rawSla.getTime())
        ? rawSla
        : new Date(Date.now() + 48 * 3600 * 1000);

    const cleanRiskLevel = String(req.body.riskLevel || '').trim().toUpperCase();
    const validRiskLevels = ['NONE', 'LEVEL_1_PREVENTIVE', 'LEVEL_2_CRITICAL', 'PAEDIS_JUSTIFIED'];

    const rawTutorPaedis = req.body.tutorPaedisAsignado;
    const cleanTutorPaedis =
      rawTutorPaedis === 'Sí' || rawTutorPaedis === true || rawTutorPaedis === 'Si'
        ? 'Sí'
        : 'No';

    user.tutorPaedisAsignado = cleanTutorPaedis;
    user.satIntervention = {
      riskLevel: validRiskLevels.includes(cleanRiskLevel)
        ? cleanRiskLevel
        : user.satIntervention?.riskLevel || 'NONE',
      assignedTo: cleanAssignedTo,
      slaDeadline: cleanSla,
      status: cleanStatus,
      tutorPaedisAsignado: cleanTutorPaedis,
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
      metadata: {
        actorEmail: req.user?.email || '',
        actorRole: req.user?.role || 'admin',
        targetEmail: user.email,
        assignedTo: cleanAssignedTo,
        status: cleanStatus,
        riskLevel: user.satIntervention.riskLevel,
      },
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
  } catch {
    console.error('[AdminController] Error al registrar intervención SAT.');
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

function sanitizeReasonableAdjustments(rawList, defaultSemester = '2026-1') {
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
        semestreVigencia: sanitizeString(item?.semestreVigencia, 20) || defaultSemester,
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

function buildPaedisCaseUpdates(body, existingUser = null) {
  const updates = {};
  const stringFields = [
    ['diagnosticoDeclarado', 160],
    ['barreraPaedis', 80],
    ['acreditacionPaedis', 100],
    ['notasConfidencialesPaedis', 1000],
    ['tutorParAsignado', 120],
    ['vigenciaSemestrePaedis', 20],
  ];

  for (const [key, maxLen] of stringFields) {
    if (body[key] !== undefined) {
      updates[key] = sanitizeString(body[key], maxLen) || '';
    }
  }

  if (body.tutorPaedisAsignado !== undefined) {
    const isYes = body.tutorPaedisAsignado === 'Sí' || body.tutorPaedisAsignado === true || body.tutorPaedisAsignado === 'Si';
    updates.tutorPaedisAsignado = isYes ? 'Sí' : 'No';
  }

  // Renovación semestral con un clic
  if (body.renewForSemester) {
    const nextSem = sanitizeString(body.renewForSemester, 20) || '2026-2';
    updates.vigenciaSemestrePaedis = nextSem;
    updates.fechaRenovacionSemestral = new Date();
    updates.acusesDocentes = [];
    if (!Array.isArray(body.ajustesAprobados) && existingUser && Array.isArray(existingUser.ajustesAprobados)) {
      updates.ajustesAprobados = existingUser.ajustesAprobados.map((a) => {
        const item = typeof a.toObject === 'function' ? a.toObject() : { ...a };
        item.semestreVigencia = nextSem;
        return item;
      });
    }
  }

  const effectiveSemester = updates.vigenciaSemestrePaedis || (existingUser?.vigenciaSemestrePaedis || '2026-1');

  if (Array.isArray(body.ajustesAprobados)) {
    updates.ajustesAprobados = sanitizeReasonableAdjustments(body.ajustesAprobados, effectiveSemester);
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

  if (body.accessibilityPreferences && typeof body.accessibilityPreferences === 'object') {
    updates.accessibilityPreferences = sanitizeAccessibilityPreferences(body.accessibilityPreferences);
  } else if (/visual|ciego|no vidente|baja visi[oó]n/i.test(updates.barreraPaedis || '')) {
    updates.accessibilityPreferences = sanitizeAccessibilityPreferences({
      voiceReader: true,
      screenReaderOptimized: true,
    });
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
    const updates = buildPaedisCaseUpdates(body, user);
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Debe proporcionar al menos un campo de expediente PAEDIS para actualizar.',
      });
    }

    const syncResult = await authService.updateProfileFields(user.email, updates);
    const updatedUser = syncResult.user || { ...user, ...updates };

    // Sincronización segregada del expediente confidencial en PaedisRecord (Ley N° 21.719)
    try {
      if (mongoose.connection?.readyState === 1) {
        await PaedisRecord.findOneAndUpdate(
          { studentEmail: user.email.toLowerCase() },
          {
            $set: {
              studentId: user._id,
              studentEmail: user.email.toLowerCase(),
              studentName: user.fullName || user.email,
              estadoCaso: updates.estadoCasoPaedis || user.estadoCasoPaedis || 'EVALUACION',
              barreraPaedis: updates.barreraPaedis || user.barreraPaedis,
              diagnosticoDeclarado: updates.diagnosticoDeclarado || user.diagnosticoDeclarado,
              acreditacionPaedis: updates.acreditacionPaedis || user.acreditacionPaedis,
              ajustesAprobados: updates.ajustesAprobados || user.ajustesAprobados || [],
              notasConfidenciales: updates.notasConfidencialesPaedis || user.notasConfidencialesPaedis,
              acusesDocentes: updates.acusesDocentes || user.acusesDocentes || [],
              fichaDocenteNotificada: updates.fichaDocenteNotificada ?? user.fichaDocenteNotificada ?? false,
              updatedBy: req.user?.email || 'coordinacion.paedis@duoc.cl',
            },
          },
          { upsert: true, new: true }
        );
      }
    } catch (errSync) {
      console.warn('[AdminController] Advertencia al sincronizar PaedisRecord:', errSync?.message);
    }

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
  } catch {
    console.error('[AdminController] Error al actualizar expediente PAEDIS.');
    return res.status(500).json({
      success: false,
      message: 'Error al guardar el expediente PAEDIS.',
    });
  }
};

/**
 * GET /api/admin/academic-calendar
 * Lista los calendarios académicos almacenados en MongoDB y la semana actual calculada.
 */
exports.getAcademicCalendars = async (req, res) => {
  try {
    const calendars = await academicCalendarService.getAllCalendars();
    const current = academicCalendarService.resolveAcademicWeekStatus(new Date(), calendars);
    return res.status(200).json({
      success: true,
      current,
      calendars,
    });
  } catch {
    console.error('[AdminController] Error al obtener calendarios académicos.');
    return res.status(500).json({
      success: false,
      message: 'Error al consultar el calendario académico.',
    });
  }
};

/**
 * POST /api/admin/academic-calendar/import
 * Procesa un PDF oficial o JSON de programación académica (soporta ?dryRun=true) y actualiza MongoDB.
 */
exports.importAcademicCalendar = async (req, res) => {
  try {
    const { fileBase64, base64, fileName, textContent, calendar } = req.body || {};
    const isDryRun = ['true', '1'].includes(String(req.query?.dryRun).toLowerCase());

    let parsedResult;
    if (calendar && typeof calendar === 'object' && calendar.year) {
      parsedResult = {
        calendar,
        detectedFields: ['Calendario estructurado'],
        warnings: [],
      };
    } else if (fileBase64 || base64 || textContent) {
      const rawB64 = String(fileBase64 || base64 || '').replace(/^data:[^;]+;base64,/i, '').trim();
      const buf = rawB64 ? Buffer.from(rawB64, 'base64') : null;
      if (rawB64 && (!buf || buf.length === 0)) {
        return res.status(400).json({
          success: false,
          message: 'El archivo PDF adjunto está vacío o mal codificado.',
        });
      }
      parsedResult = academicCalendarService.parseAcademicCalendarPdf({
        buffer: buf,
        textContent: textContent || '',
        fileName: fileName || 'calendario-academico.pdf',
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Debe adjuntar un archivo PDF de Programación Académica válido.',
      });
    }

    if (isDryRun) {
      return res.status(200).json({
        success: true,
        dryRun: true,
        preview: parsedResult,
      });
    }

    const saved = await academicCalendarService.saveAcademicCalendar(
      parsedResult.calendar,
      req.user?.email || 'admin'
    );
    const calendars = await academicCalendarService.getAllCalendars();
    const current = academicCalendarService.resolveAcademicWeekStatus(new Date(), calendars);

    await logAdminAction(req.user, {
      action: 'IMPORT',
      details: `Calendario Académico ${saved.year} actualizado desde ${saved.sourceFileName || 'PDF'}.`,
      metadata: {
        year: saved.year,
        sourceFileName: saved.sourceFileName,
      },
    });

    return res.status(200).json({
      success: true,
      message: `Calendario Académico ${saved.year} actualizado en MongoDB correctamente.`,
      calendar: saved,
      current,
    });
  } catch (err) {
    console.error('[AdminController] Error al importar calendario académico:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'No se pudo procesar el PDF de programación académica.',
    });
  }
};

/**
 * GET /api/admin/activity-logs
 * Consulta paginada y filtrada de auditoría ActivityLog (exclusivo para Administrador, Ley N° 21.719).
 */
exports.getActivityLogs = async (req, res) => {
  try {
    const { action, q, page, limit } = req.query || {};
    const result = await authService.queryActivityLogs({ action, q, page, limit });
    return res.status(200).json({
      success: true,
      ...result,
    });
  } catch {
    console.error('[AdminController] Error al consultar registros de auditoría.');
    return res.status(500).json({
      success: false,
      message: 'Error al consultar la bitácora de auditoría.',
    });
  }
};
