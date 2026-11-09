const mongoose = require('mongoose');

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
  },
  { _id: false }
);

/**
 * Esquema de Perfil de Estudiante para Nexo360
 * REGLA DE SEGURIDAD (Zero-Knowledge Credentials):
 * Jamás se almacena la contraseña institucional de Duoc UC en la base de datos.
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
        'Por favor ingrese un correo institucional Duoc UC válido',
      ],
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: 'Cristian Guzmán',
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
      default: true,
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
      default: 'cristian.david.g123@gmail.com',
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
      default: 'María Guzmán (Madre)',
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
      default: 'Tania Montes (Tutor PAR)',
    },
    ajustesAprobados: {
      type: [ReasonableAdjustmentSchema],
      default: [
        {
          tipo: 'Tiempo Adicional',
          descripcion: '50% de tiempo adicional en certámenes y evaluaciones teóricas',
        },
        {
          tipo: 'Material Digital Accesible',
          descripcion: 'Entrega de material en formatos compatibles con lectores de pantalla',
        },
        {
          tipo: 'Mobiliario y Aula',
          descripcion: 'Ubicación preferencial en primera fila y salas de estudio adaptadas',
        },
      ],
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
      default: [
        {
          sigla: 'PTY4614',
          siglaEq: '',
          nombre: 'PROYECTO CAPSTONE',
          seccion: '001D',
          creditos: 10,
          sala: 'AL-503A / AL-LAB-IP4',
          profesor: 'Mauricio Gómez Arratia',
          bloques: [
            { dia: 'Miércoles', bloqueId: 'b1', texto: 'PTY4614-001D', sala: 'AL-503A' },
            { dia: 'Miércoles', bloqueId: 'b2', texto: 'PTY4614-001D', sala: 'AL-503A' },
            { dia: 'Viernes', bloqueId: 'b1', texto: 'PTY4614-001D', sala: 'AL-LAB-IP4' },
            { dia: 'Viernes', bloqueId: 'b2', texto: 'PTY4614-001D', sala: 'AL-LAB-IP4' },
            { dia: 'Viernes', bloqueId: 'b3', texto: 'PTY4614-001D', sala: 'AL-LAB-IP4' },
          ],
        },
      ],
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

const FORBIDDEN_CREDENTIAL_FIELDS = ['password', 'passwd', 'passwordHash', 'hash', 'secret', 'clave'];

// Hook Zero-Knowledge en guardado de documentos
UserProfileSchema.pre('save', function (next) {
  for (const field of FORBIDDEN_CREDENTIAL_FIELDS) {
    if (this[field] !== undefined) {
      this.set(field, undefined, { strict: false });
      delete this._doc?.[field];
    }
  }
  next();
});

// Hook Zero-Knowledge en actualizaciones por query
UserProfileSchema.pre(['findOneAndUpdate', 'updateOne', 'updateMany'], function (next) {
  const update = this.getUpdate();
  if (update && typeof update === 'object') {
    for (const field of FORBIDDEN_CREDENTIAL_FIELDS) {
      delete update[field];
      if (update.$set) delete update.$set[field];
      if (update.$setOnInsert) delete update.$setOnInsert[field];
    }
  }
  next();
});

module.exports = mongoose.model('UserProfile', UserProfileSchema);
