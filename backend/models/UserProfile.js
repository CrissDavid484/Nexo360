const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const {
  EMAIL_REGEX,
  DEFAULT_SEDE,
  VALID_DISABILITY_PROFILES,
  VALID_COLOR_BLIND_MODES,
} = require('../utils/validationUtils');

const ScheduleBlockSchema = new mongoose.Schema(
  {
    dia: { type: String, required: true, trim: true, maxlength: 20 },
    bloqueId: { type: String, required: true, trim: true, maxlength: 10 },
    texto: { type: String, trim: true, maxlength: 40, default: '' },
    sala: { type: String, trim: true, maxlength: 60, default: '' },
    salaCorta: { type: String, trim: true, maxlength: 30, default: '' },
  },
  { _id: false }
);

const EnrolledCourseSchema = new mongoose.Schema(
  {
    sigla: { type: String, required: true, trim: true, maxlength: 20 },
    siglaEq: { type: String, trim: true, maxlength: 20, default: '' },
    nombre: { type: String, required: true, trim: true, maxlength: 120 },
    seccion: { type: String, required: true, trim: true, maxlength: 20 },
    creditos: { type: Number, min: 0, max: 50, default: 0 },
    sala: { type: String, trim: true, maxlength: 100, default: '' },
    profesor: { type: String, trim: true, maxlength: 100, default: '' },
    bloques: { type: [ScheduleBlockSchema], default: [] },
    curso: { type: String, trim: true, maxlength: 120 },
    attendanceRate: { type: Number, min: 0, max: 100, default: 100 },
    porcentajeAsistencia: { type: Number, min: 0, max: 100, default: 100 },
    porcentajeAsistenciaActual: { type: String, trim: true, maxlength: 20, default: '100%' },
    asistenciaPorcentaje: { type: Number, min: 0, max: 100, default: 100 },
    clasesRegistradas: { type: Number, min: 0, default: 0 },
    asistencia: { type: Number, min: 0, default: 0 },
    asistencias: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);

const { ReasonableAdjustmentSchema, TeacherAcknowledgmentSchema } = require('./PaedisRecord');

/**
 * Esquema de Asistencia por Asignatura - Sistema de Alerta Temprana (SAT)
 * Cumple con el estándar Duoc UC (mínimo 75% por asignatura) y justificaciones PAEDIS.
 */
const CourseAttendanceSchema = new mongoose.Schema(
  {
    courseCode: { type: String, required: true, trim: true, maxlength: 30 },
    courseName: { type: String, required: true, trim: true, maxlength: 120 },
    totalSessions: { type: Number, min: 0, default: 20 },
    completedSessions: { type: Number, min: 0 },
    scheduledSessions: { type: Number, min: 0 },
    pendingSessions: { type: Number, min: 0 },
    attendedSessions: { type: Number, min: 0, default: 20 },
    attendancePercentage: { type: Number, min: 0, max: 100, default: 100 },
    minAttendanceRequired: { type: Number, min: 0, max: 100, default: 70 },
    activityType: { type: String, enum: ['TEORICA', 'PRACTICA'], default: 'TEORICA' },
    consecutiveAbsences: { type: Number, min: 0, default: 0 },
    lateCount: { type: Number, min: 0, default: 0 },
    missedKeySession: { type: Boolean, default: false },
    paedisJustified: { type: Boolean, default: false },
    officialExceptionAuthorized: { type: Boolean, default: false },
  },
  { _id: false }
);

/**
 * Esquema de Intervención Ficha 360 - Acompañamiento SAT / PAEDIS
 */
const SatInterventionSchema = new mongoose.Schema(
  {
    riskLevel: {
      type: String,
      enum: ['NONE', 'LEVEL_1_PREVENTIVE', 'LEVEL_2_CRITICAL', 'PAEDIS_JUSTIFIED'],
      default: 'NONE',
    },
    assignedTo: { type: String, trim: true, maxlength: 120, default: 'Coordinación PAEDIS' },
    slaDeadline: { type: Date, default: null },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'AGREEMENT', 'RESOLVED'],
      default: 'PENDING',
    },
    tutorPaedisAsignado: {
      type: String,
      enum: ['Sí', 'No'],
      default: 'No',
    },
    notes: { type: String, trim: true, maxlength: 500, default: '' },
    lastUpdated: { type: Date, default: Date.now },
  },
  { _id: false }
);

/**
 * Esquema de Usuario Institucional Nexo360 - Duoc UC
 * Base de Datos Nativa con Autenticación Cifrada (bcryptjs),
 * Estados Académicos (Activo, Deserción, Titulado), Métricas y PAEDIS.
 */
const UserProfileSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'El correo institucional es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        EMAIL_REGEX,
        'Por favor ingrese un correo institucional Duoc UC válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl)',
      ],
    },
    password: {
      type: String,
      required: false, // Opcional al crear pero autogenerado si no se provee
      select: true,
    },
    tokenVersion: {
      type: Number,
      default: 0,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    mustChangePassword: {
      type: Boolean,
      default: false,
    },
    isActivated: {
      type: Boolean,
      default: true,
    },
    activationTokenHash: {
      type: String,
      select: false,
      default: null,
    },
    activationTokenExpiresAt: {
      type: Date,
      default: null,
    },
    passwordResetTokenHash: {
      type: String,
      default: '',
      select: false,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
    paternalLastName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
    maternalLastName: {
      type: String,
      trim: true,
      maxlength: 60,
      default: '',
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Estudiante Duoc UC',
    },
    nombre: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    photo: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      trim: true,
      enum: [
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
      ],
      default: 'estudiante_paedis',
    },
    roleLabel: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Estudiante Regular • PAEDIS',
    },
    isPaedis: {
      type: Boolean,
      default: false,
    },
    academicStatus: {
      type: String,
      enum: ['activo', 'desercion', 'titulado'],
      default: 'activo',
    },
    statusReason: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'Estudiante regular activo',
    },
    statusUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    attendanceRate: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },
    hasUsedSimulator: {
      type: Boolean,
      default: false,
    },
    simulatorUsageCount: {
      type: Number,
      default: 0,
    },
    lastSimulatorUsage: {
      type: Date,
    },
    rut: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    career: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Ingeniería en Informática',
    },
    carrera: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    campus: {
      type: String,
      trim: true,
      maxlength: 80,
      default: DEFAULT_SEDE,
    },
    sede: {
      type: String,
      trim: true,
      maxlength: 80,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'Por actualizar',
    },
    personalEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '+56 9 0000 0000',
    },
    emergencyContact: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Contacto Familiar',
    },
    emergencyPhone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: '+56 9 1234 5678',
    },
    tutorParAsignado: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Inclusión y Bienestar Duoc UC',
    },
    tutorPaedisAsignado: {
      type: String,
      enum: ['Sí', 'No'],
      default: 'No',
    },
    diagnosticoDeclarado: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
      select: false,
    },
    ajustesAprobados: {
      type: [ReasonableAdjustmentSchema],
      default: [],
    },
    barreraPaedis: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Visual / Sensorial',
    },
    disabilityProfile: {
      type: String,
      trim: true,
      enum: VALID_DISABILITY_PROFILES,
      default: 'ninguna',
    },
    acreditacionPaedis: {
      type: String,
      trim: true,
      maxlength: 100,
      default: 'Credencial RND SENADIS',
    },
    notasConfidencialesPaedis: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
      select: false,
    },
    fichaDocenteNotificada: {
      type: Boolean,
      default: false,
    },
    fechaNotificacionDocente: {
      type: Date,
      default: null,
    },
    acusesDocentes: {
      type: [TeacherAcknowledgmentSchema],
      default: [],
    },
    vigenciaSemestrePaedis: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '2026-1',
    },
    fechaRenovacionSemestral: {
      type: Date,
      default: null,
    },
    accessibilityPreferences: {
      fontSize: {
        type: String,
        enum: ['normal', 'large', 'xlarge'],
        default: 'normal',
      },
      highContrast: {
        type: Boolean,
        default: false,
      },
      dyslexicFont: {
        type: Boolean,
        default: false,
      },
      reducedMotion: {
        type: Boolean,
        default: false,
      },
      readingGuide: {
        type: Boolean,
        default: false,
      },
      voiceReader: {
        type: Boolean,
        default: false,
      },
      screenReaderOptimized: {
        type: Boolean,
        default: true,
      },
      colorBlindMode: {
        type: String,
        enum: VALID_COLOR_BLIND_MODES,
        default: 'none',
      },
      clearReadingMode: {
        type: Boolean,
        default: false,
      },
    },
    enrolledCourses: {
      type: [EnrolledCourseSchema],
      default: [],
    },
    courseAttendance: {
      type: [CourseAttendanceSchema],
      default: [],
    },
    satIntervention: {
      type: SatInterventionSchema,
      default: () => ({}),
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
    consentimientoLey21719: {
      aceptado: { type: Boolean, default: false },
      fechaAceptacion: { type: Date, default: null },
      finalidadTratamiento: {
        type: String,
        default: 'Tratamiento de datos para fines académicos, registro curricular y acompañamiento institucional conforme a la Ley N° 21.719',
      },
    },
    isRegisteredInDb: {
      type: Boolean,
      default: true,
    },
    permissions: {
      type: [String],
      default: undefined,
    },
    badges: {
      type: [String],
      default: undefined,
    },
    purposeLimitation: {
      type: [String],
      default: [
        'gestion_academica',
        'apoyo_paedis_inclusion',
        'simulador_toma_ramos',
        'seguimiento_asistencia',
      ],
    },
    consentMetadata: {
      consentGiven: { type: Boolean, default: false },
      consentDate: { type: Date, default: null },
      consentVersion: { type: String, default: '1.0 - Ley N° 21.719' },
      law: { type: String, default: 'Ley N° 21.719 de Protección de Datos Personales de Chile' },
      legalBasis: { type: String, default: 'PENDIENTE_REVISION_INSTITUCIONAL' },
      informationDelivered: { type: Boolean, default: false },
      purpose: {
        type: [String],
        default: [
          'gestion_academica',
          'apoyo_paedis_inclusion',
          'simulador_toma_ramos',
          'seguimiento_asistencia',
        ],
      },
      dataRetentionPolicy: {
        type: String,
        default: 'Conservación durante el periodo académico activo conforme al Art. 12 de la Ley N° 21.719',
      },
      arcoRightsNotice: {
        type: String,
        default: 'Derechos ARCO (Acceso, Rectificación, Cancelación y Oposición) garantizados por Duoc UC',
      },
    },
  },
  {
    timestamps: true,
    strict: true,
  }
);

// Hash de contraseña automático con bcrypt antes de guardar si fue modificada
UserProfileSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
});

// Método para verificar contraseñas (solo bcrypt $2a$/$2b$, sin fallback en texto plano)
UserProfileSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password || !candidatePassword) return false;
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return bcrypt.compare(candidatePassword, this.password);
  }
  return false;
};

// Métodos de transformación para cumplir con la Ley N° 21.719 (Cero almacenamiento o exposición de contraseñas y tokens)
function sanitizeSerializedUser(_doc, ret) {
  delete ret.password;
  delete ret.passwordResetTokenHash;
  delete ret.passwordResetExpires;
  delete ret.__v;
  if (ret.fullName && /Tania Montes/i.test(ret.fullName)) {
    ret.fullName = 'Coordinación PAEDIS';
  }
  if (ret.nombre && /Tania Montes/i.test(ret.nombre)) {
    ret.nombre = 'Coordinación PAEDIS';
  }
  if (ret.tutorParAsignado && /Tania Montes/i.test(ret.tutorParAsignado)) {
    ret.tutorParAsignado = 'Coordinación PAEDIS Duoc UC';
  }
  if (ret.email && /t\.montes/i.test(ret.email)) {
    ret.email = 'coord.paedis@duoc.cl';
  }
  return ret;
}

UserProfileSchema.set('toJSON', {
  transform: sanitizeSerializedUser,
});

UserProfileSchema.set('toObject', {
  transform: sanitizeSerializedUser,
});

// Índices de alto rendimiento para búsquedas y filtros en Admin Panel y Auth
UserProfileSchema.index({ rut: 1 });
UserProfileSchema.index({ role: 1, academicStatus: 1 });
UserProfileSchema.index({ carrera: 1, sede: 1 });

module.exports = mongoose.model('UserProfile', UserProfileSchema);
