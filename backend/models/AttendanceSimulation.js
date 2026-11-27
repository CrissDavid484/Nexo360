const mongoose = require('mongoose');

const SIMULATION_ACTIONS = Object.freeze([
  'POSITIVE_ATTENDANCE',
  'NEGATIVE_ABSENCE',
  'FUTURE_CLASS_ATTEND',
  'FUTURE_CLASS_MISS',
  'CORRECT_PAST_ATTENDANCE',
  'HYPOTHETICAL_EXCEPTION',
  'RESET_BASE',
  'CUSTOM_STEPPER',
]);

/**
 * Esquema de Escenarios Simulados de Asistencia (SAT)
 * Aislado estrictamente de los registros de asistencia académica real.
 * No genera efectos secundarios ni muta la base de datos oficial.
 */
const AttendanceSimulationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserProfile',
      index: true,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    courseCode: {
      type: String,
      required: true,
      trim: true,
    },
    actionApplied: {
      type: String,
      enum: SIMULATION_ACTIONS,
      required: true,
    },
    baselineAttended: {
      type: Number,
      min: 0,
    },
    baselineTotal: {
      type: Number,
      min: 0,
    },
    simulatedAttended: {
      type: Number,
      min: 0,
    },
    simulatedTotal: {
      type: Number,
      min: 0,
    },
    recoveryPossible: {
      type: Boolean,
      default: true,
    },
    minRequiredThreshold: {
      type: Number,
      min: 0,
      max: 100,
      default: 70,
    },
    baselinePercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    simulatedPercentage: {
      type: Number,
      min: 0,
      max: 100,
    },
    deltaPercentage: {
      type: Number,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 7, // Limpieza automática TTL tras 7 días
    },
  },
  {
    timestamps: true,
    collection: 'attendance_simulations',
  }
);

module.exports = mongoose.model('AttendanceSimulation', AttendanceSimulationSchema);
module.exports.SIMULATION_ACTIONS = SIMULATION_ACTIONS;
