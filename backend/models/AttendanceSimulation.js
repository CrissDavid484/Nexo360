const mongoose = require('mongoose');

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
      enum: ['POSITIVE_ATTENDANCE', 'NEGATIVE_ABSENCE', 'RESET_BASE', 'CUSTOM_STEPPER'],
      required: true,
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
