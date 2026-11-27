const mongoose = require('mongoose');

const PAEDIS_CASE_STATES = Object.freeze([
  'INGRESO',
  'EVALUACION',
  'APROBADO',
  'RENOVACION',
  'CERRADO',
]);

const TEACHER_SHEET_STATES = Object.freeze([
  'BORRADOR',
  'APROBADA',
  'PREPARADA',
  'PENDIENTE_ENVIO',
  'ENVIADA',
  'ENTREGADA',
  'ACUSADA',
]);

const NOTIFIED_SHEET_STATES = Object.freeze(['ENVIADA', 'ENTREGADA', 'ACUSADA']);

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

const TeacherSheetHistorySchema = new mongoose.Schema(
  {
    estado: {
      type: String,
      enum: TEACHER_SHEET_STATES,
      required: true,
    },
    fecha: { type: Date, default: Date.now },
    actorEmail: { type: String, trim: true, lowercase: true, maxlength: 120, default: '' },
    medioEntrega: { type: String, trim: true, maxlength: 80, default: '' },
    evidencia: { type: String, trim: true, maxlength: 500, default: '' },
  },
  { _id: false }
);

/**
 * Esquema Canónico de Expediente Confidencial PAEDIS (Ley N° 21.719)
 * Almacena datos clínicos, diagnósticos, ajustes razonables y trazabilidad de ficha docente
 * segregados del perfil general.
 */
const PaedisRecordSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile',
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile',
      index: true,
    },
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
    studentName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    estadoCaso: {
      type: String,
      enum: PAEDIS_CASE_STATES,
      default: 'INGRESO',
    },
    diagnosticoDeclarado: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
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
    notasConfidenciales: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    // Alias legacy mantenido por compatibilidad de lectura/migración
    notasConfidencialesPaedis: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    ajustesAprobados: {
      type: [ReasonableAdjustmentSchema],
      default: [],
    },
    tutorPaedisAsignado: {
      type: String,
      enum: ['Sí', 'No'],
      default: 'No',
    },
    acusesDocentes: {
      type: [TeacherAcknowledgmentSchema],
      default: [],
    },
    fichaDocenteEstado: {
      type: String,
      enum: TEACHER_SHEET_STATES,
      default: 'BORRADOR',
    },
    fichaDocenteHistorial: {
      type: [TeacherSheetHistorySchema],
      default: [],
    },
    fichaDocenteNotificada: {
      type: Boolean,
      default: false,
    },
    fechaNotificacionDocente: {
      type: Date,
      default: null,
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
    updatedBy: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      default: '',
    },
  },
  {
    timestamps: true,
    collection: 'paedis_records',
  }
);

PaedisRecordSchema.pre('validate', function () {
  if (this.userId && !this.studentId) {
    this.studentId = this.userId;
  } else if (this.studentId && !this.userId) {
    this.userId = this.studentId;
  }

  if (this.userEmail && !this.studentEmail) {
    this.studentEmail = this.userEmail.toLowerCase();
  } else if (this.studentEmail && !this.userEmail) {
    this.userEmail = this.studentEmail.toLowerCase();
  }

  if (this.notasConfidenciales && !this.notasConfidencialesPaedis) {
    this.notasConfidencialesPaedis = this.notasConfidenciales;
  } else if (this.notasConfidencialesPaedis && !this.notasConfidenciales) {
    this.notasConfidenciales = this.notasConfidencialesPaedis;
  }

  // Solo los estados con entrega/acuse efectivo marcan fichaDocenteNotificada en true
  if (NOTIFIED_SHEET_STATES.includes(this.fichaDocenteEstado)) {
    this.fichaDocenteNotificada = true;
    if (!this.fechaNotificacionDocente) {
      this.fechaNotificacionDocente = new Date();
    }
  } else {
    this.fichaDocenteNotificada = false;
  }
});

module.exports = mongoose.model('PaedisRecord', PaedisRecordSchema);
module.exports.ReasonableAdjustmentSchema = ReasonableAdjustmentSchema;
module.exports.TeacherAcknowledgmentSchema = TeacherAcknowledgmentSchema;
module.exports.TeacherSheetHistorySchema = TeacherSheetHistorySchema;
module.exports.PAEDIS_CASE_STATES = PAEDIS_CASE_STATES;
module.exports.TEACHER_SHEET_STATES = TEACHER_SHEET_STATES;
module.exports.NOTIFIED_SHEET_STATES = NOTIFIED_SHEET_STATES;
