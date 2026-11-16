const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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

const ReasonableAdjustmentSchema = new mongoose.Schema(
  {
    tipo: { type: String, required: true, trim: true, maxlength: 80 },
    descripcion: { type: String, required: true, trim: true, maxlength: 300 },
    fechaAprobacion: { type: Date, default: Date.now },
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
        /^[a-zA-Z0-9._%+-]+@(duocuc\.cl|profesor\.duoc\.cl|duoc\.cl)$/,
        'Por favor ingrese un correo institucional Duoc UC válido (@duocuc.cl, @profesor.duoc.cl o @duoc.cl)',
      ],
    },
    password: {
      type: String,
      required: false, // Opcional al crear pero autogenerado si no se provee
      select: true,
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
      default: 88.9,
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
      default: 'Sede Alameda',
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
    diagnosticoDeclarado: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    ajustesAprobados: {
      type: [ReasonableAdjustmentSchema],
      default: [],
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
      screenReaderOptimized: {
        type: Boolean,
        default: true,
      },
    },
    enrolledCourses: {
      type: [EnrolledCourseSchema],
      default: [],
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
      consentGiven: { type: Boolean, default: true },
      consentDate: { type: Date, default: Date.now },
      consentVersion: { type: String, default: '1.0 - Ley N° 21.719' },
      law: { type: String, default: 'Ley N° 21.719 de Protección de Datos Personales de Chile' },
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
UserProfileSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    if (this.password && !this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// Método para verificar contraseñas
UserProfileSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password || !candidatePassword) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Métodos de transformación para cumplir con la Ley N° 21.719 (Cero almacenamiento o exposición de contraseñas)
UserProfileSchema.set('toJSON', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

UserProfileSchema.set('toObject', {
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

// Índices de alto rendimiento para búsquedas y filtros en Admin Panel y Auth
UserProfileSchema.index({ rut: 1 });
UserProfileSchema.index({ role: 1, academicStatus: 1 });
UserProfileSchema.index({ carrera: 1, sede: 1 });

module.exports = mongoose.model('UserProfile', UserProfileSchema);
