const mongoose = require('mongoose');

const ReasonableAdjustmentSchema = new mongoose.Schema(
  {
    tipo: { type: String, required: true, trim: true, maxlength: 80 },
    descripcion: { type: String, required: true, trim: true, maxlength: 300 },
    fechaAprobacion: { type: Date, default: Date.now },
    semestreVigencia: { type: String, trim: true, maxlength: 20, default: '2026-1' },
  },
  { _id: false }
);

const TeacherAcknowledgmentSchema = new mongoose.Schema(
  {
    sigla: { type: String, required: true, trim: true, maxlength: 30 },
    nombre: { type: String, required: true, trim: true, maxlength: 140 },
    profesor: { type: String, trim: true, maxlength: 120, default: 'Docente Titular' },
    confirmado: { type: Boolean, default: false },
    fechaAcuse: { type: Date, default: null },
  },
  { _id: false }
);

/**
 * Esquema de Expediente Confidencial PAEDIS (Ley N° 21.719)
 * Almacena datos clínicos, diagnósticos y ajustes razonables segregados del perfil general.
 */
const PaedisRecordSchema = new mongoose.Schema(
  {
    userEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    studentEmail: {
      type: String,
      lowercase: true,
      trim: true,
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile',
      index: true,
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
    barreraPaedis: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'Visual / Sensorial',
    },
    disabilityProfile: {
      type: String,
      trim: true,
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
    },
    tutorPaedisAsignado: {
      type: String,
      enum: ['Sí', 'No'],
      default: 'No',
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
  },
  {
    timestamps: true,
    collection: 'paedis_records',
  }
);

PaedisRecordSchema.pre('validate', function (next) {
  if (this.userEmail && !this.studentEmail) {
    this.studentEmail = this.userEmail.toLowerCase();
  } else if (this.studentEmail && !this.userEmail) {
    this.userEmail = this.studentEmail.toLowerCase();
  }
  next();
});

module.exports = mongoose.model('PaedisRecord', PaedisRecordSchema);
module.exports.ReasonableAdjustmentSchema = ReasonableAdjustmentSchema;
module.exports.TeacherAcknowledgmentSchema = TeacherAcknowledgmentSchema;
