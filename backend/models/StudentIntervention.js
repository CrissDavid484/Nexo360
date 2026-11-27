const mongoose = require('mongoose');

const INTERVENTION_STATUSES = Object.freeze([
  'REGISTRADA',
  'EN_SEGUIMIENTO',
  'COMPLETADA',
  'CANCELADA',
]);

const InterventionHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: INTERVENTION_STATUSES,
      required: true,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    actorEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      default: '',
    },
    at: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/**
 * Esquema de Intervención Estudiantil Persistente (Bitácora Interna SAT/PAEDIS)
 * Registra acciones de seguimiento sin afirmar derivaciones externas automáticas.
 */
const StudentInterventionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile',
      index: true,
    },
    studentEmail: {
      type: String,
      required: true,
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
    actionTitle: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    actionCategory: {
      type: String,
      trim: true,
      maxlength: 80,
      default: 'SEGUIMIENTO_SAT',
    },
    responsibleEmail: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
      default: '',
    },
    responsibleName: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    status: {
      type: String,
      enum: INTERVENTION_STATUSES,
      default: 'REGISTRADA',
    },
    evidence: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: '',
    },
    externalDerivationPerformed: {
      type: Boolean,
      default: false,
    },
    history: {
      type: [InterventionHistorySchema],
      default: [],
    },
  },
  {
    timestamps: true,
    collection: 'student_interventions',
  }
);

module.exports = mongoose.model('StudentIntervention', StudentInterventionSchema);
module.exports.INTERVENTION_STATUSES = INTERVENTION_STATUSES;
module.exports.InterventionHistorySchema = InterventionHistorySchema;
