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
    photo: {
      type: String,
      default: '',
    },
    role: {
      type: String,
      trim: true,
      enum: [
        'admin',
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
      default: '19.276.735-0',
    },
    career: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Ingeniería en Informática',
    },
    campus: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Sede Alameda',
    },
    address: {
      type: String,
      trim: true,
      maxlength: 200,
      default: 'Las Moreras 12196',
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
      default: '+56 9 3016 6745',
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

module.exports = mongoose.model('UserProfile', UserProfileSchema);
