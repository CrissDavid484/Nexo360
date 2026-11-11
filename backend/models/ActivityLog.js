const mongoose = require('mongoose');

const ActivityLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: false,
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    userName: {
      type: String,
      trim: true,
      default: '',
    },
    userRole: {
      type: String,
      default: 'estudiante',
    },
    action: {
      type: String,
      required: true,
      enum: [
        'login',
        'used_simulator_toma_ramos',
        'saved_toma_ramos',
        'viewed_module',
        'viewed_biblioteca',
        'created_ticket',
        'updated_accessibility',
        'status_changed_by_admin',
        'student_registered_by_admin',
        'student_updated_by_admin',
      ],
    },
    details: {
      type: String,
      trim: true,
      default: '',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Índice para consultas rápidas por acción y tiempo
ActivityLogSchema.index({ action: 1, createdAt: -1 });
ActivityLogSchema.index({ userEmail: 1 });

module.exports = mongoose.model('ActivityLog', ActivityLogSchema);
