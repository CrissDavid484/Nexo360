const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const UserProfile = require('../models/UserProfile');
const ActivityLog = require('../models/ActivityLog');
const authScraperService = require('../services/authScraperService');

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]{1,64}@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/i;

/**
 * Función que calcula el Score Predictivo de Deserción vs Titulación (0 - 100)
 * Basado en Asistencia, Factor PAEDIS, Carga Académica y Uso de Simuladores
 */
const calculatePredictiveRisk = (user) => {
  const status = user.academicStatus || 'activo';
  const attendance = Number(user.attendanceRate ?? 88.9);
  const isPaedis = Boolean(user.isPaedis);
  const hasUsedSim = Boolean(user.hasUsedSimulator);
  const tutor = user.tutorParAsignado || '';
  const ajustesCount = Array.isArray(user.ajustesAprobados) ? user.ajustesAprobados.length : 0;

  if (status === 'desercion') {
    return {
      score: 100,
      riskLevel: 'DESERTOR',
      predictionLabel: 'Deserción Registrada',
      color: 'red',
      factors: ['Estudiante actualmente en deserción / retiro académico'],
      graduationProbability: 0,
    };
  }

  if (status === 'titulado') {
    return {
      score: 0,
      riskLevel: 'TITULADO',
      predictionLabel: 'Titulado / Egresado',
      color: 'emerald',
      factors: ['Plan de estudios completado con éxito'],
      graduationProbability: 100,
    };
  }

  // Estudiante Activo: Cálculo de Alerta Temprana
  let score = 25; // Base
  const factors = [];

  // 1. Factor Asistencia (Mínimo Duoc UC: 70%)
  if (attendance < 70) {
    score += 45;
    factors.push(`Asistencia crítica (${attendance}%): Alto riesgo de Reprobación por Inasistencia (RI)`);
  } else if (attendance < 75) {
    score += 25;
    factors.push(`Asistencia al límite (${attendance}%): En zona de peligro de RI (<75%)`);
  } else if (attendance >= 90) {
    score -= 15;
    factors.push(`Excelente asistencia (${attendance}%): Factor protector clave`);
  }

  // 2. Factor PAEDIS y Tutor Par
  if (isPaedis) {
    if (!tutor || tutor.toLowerCase().includes('sin tutor')) {
      score += 20;
      factors.push('Estudiante PAEDIS sin tutor par asignado: Requiere asignación de apoyo');
    } else if (ajustesCount > 0) {
      score -= 15;
      factors.push(`Acompañamiento PAEDIS activo con ${ajustesCount} ajuste(s) razonable(s)`);
    }
  }

  // 3. Factor Uso de Simulador de Toma de Ramos
  if (hasUsedSim) {
    score -= 10;
    factors.push('Uso activo del Simulador de Toma de Ramos: Planificación de horario confirmada');
  } else {
    score += 10;
    factors.push('No ha planificado su horario en el simulador: Riesgo de choques o carga incompleta');
  }

  // Clamping entre 5 y 95
  score = Math.max(5, Math.min(95, Math.round(score)));
  const graduationProbability = Math.max(5, 100 - score);

  let riskLevel = 'BAJO';
  let predictionLabel = 'Bajo Riesgo • Alta Probabilidad de Titulación';
  let color = 'emerald';

  if (score >= 60) {
    riskLevel = 'ALTO';
    predictionLabel = 'Alerta Temprana: Alto Riesgo de Deserción';
    color = 'red';
  } else if (score >= 35) {
    riskLevel = 'MEDIO';
    predictionLabel = 'Riesgo Moderado • Requiere Seguimiento Preventivo';
    color = 'amber';
  }

  return {
    score,
    riskLevel,
    predictionLabel,
    color,
    factors,
    graduationProbability,
  };
};

/**
 * GET /api/admin/metrics
 * Métricas globales del sistema, uso de simuladores, desglose PAEDIS y predicción
 */
exports.getMetrics = async (req, res) => {
  try {
    const allUsers = await authScraperService.getAllUsers();

    const totalUsers = allUsers.length;
    const students = allUsers.filter(
      (u) => u.role.startsWith('estudiante') || u.role === 'tutor_par'
    );
    const totalStudents = students.length || 1;

    // Métricas PAEDIS
    const paedisCount = students.filter((s) => s.isPaedis).length;
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

    // Actividad reciente
    let recentActivity = [];
    if (mongoose.connection.readyState === 1) {
      recentActivity = await ActivityLog.find({}).sort({ createdAt: -1 }).limit(10).lean();
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
    let users = await authScraperService.getAllUsers();

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      users = users.filter(
        (u) =>
          u.fullName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          (u.rut || '').toLowerCase().includes(q) ||
          (u.career || '').toLowerCase().includes(q)
      );
    }

    if (status && status !== 'all') {
      users = users.filter((u) => u.academicStatus === status);
    }

    if (role && role !== 'all') {
      users = users.filter((u) => u.role === role);
    }

    if (isPaedis === 'true') {
      users = users.filter((u) => u.isPaedis === true);
    }

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
 */
exports.createStudent = async (req, res) => {
  try {
    const body = req.body || {};
    const email = (body.email || '').trim().toLowerCase();
    const fullName = (body.fullName || body.nombre || '').trim();
    const password = body.password || 'Duoc2026!';
    const role = body.role || 'estudiante_paedis';
    const academicStatus = body.academicStatus || 'activo';
    const statusReason = body.statusReason || 'Registrado por Administrador en Nexo360';
    const isPaedis = Boolean(body.isPaedis);

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

    // Verificar si ya existe
    const existing = await UserProfile.findOne({ email });
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
      estudiante_paedis: 'Estudiante Regular • PAEDIS',
      estudiante: 'Estudiante Regular Duoc UC',
      tutor_par: 'Estudiante • Tutor Par & Ley 21.790',
      profesor: 'Profesor / Docente Duoc UC',
      director: 'Director/a de Carrera',
      subdirector: 'Subdirector/a Académico',
      coordinador_paedis: 'Coordinador/a PAEDIS e Inclusión',
      administrativo: 'Funcionario / Gestión Duoc UC',
    };

    const newUserData = {
      email,
      password: hashedPassword,
      fullName,
      photo: body.photo || '',
      rut: body.rut || 'Sin RUT',
      role,
      roleLabel: body.roleLabel || roleLabels[role] || 'Estudiante Duoc UC',
      isPaedis,
      academicStatus,
      statusReason,
      attendanceRate: Number(body.attendanceRate) || 88.9,
      career: body.career || 'Ingeniería en Informática',
      campus: body.campus || 'Sede Alameda',
      address: body.address || 'Por actualizar',
      personalEmail: body.personalEmail || email,
      phone: body.phone || '+56 9 0000 0000',
      emergencyContact: body.emergencyContact || 'Contacto Familiar',
      emergencyPhone: body.emergencyPhone || '+56 9 0000 0000',
      tutorParAsignado: body.tutorParAsignado || (isPaedis ? 'Inclusión Duoc UC' : 'Sin tutor asignado'),
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
    };

    let createdUser;
    if (mongoose.connection.readyState === 1) {
      createdUser = await UserProfile.create(newUserData);
    } else {
      createdUser = { _id: `local_${Date.now()}`, ...newUserData };
    }

    await authScraperService.logActivity({
      userId: req.user._id || req.user.id,
      userEmail: req.user.email,
      userName: req.user.fullName || 'Administrador',
      userRole: 'admin',
      action: 'student_registered_by_admin',
      details: `El administrador registró a ${fullName} (${email}) con rol ${roleLabels[role]} y estado ${academicStatus}.`,
    });

    return res.status(201).json({
      success: true,
      message: `Usuario ${fullName} registrado exitosamente en la base de datos de Nexo360.`,
      user: authScraperService.formatUserResponse(createdUser),
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

    await authScraperService.logActivity({
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
      user: updatedUser ? authScraperService.formatUserResponse(updatedUser) : null,
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
