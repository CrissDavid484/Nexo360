const mongoose = require('mongoose');

const SimulatorChartSnapshotSchema = new mongoose.Schema(
  {
    slot: {
      type: String,
      enum: ['03:00', '15:00', 'bootstrap'],
      required: true,
    },
    slotDateKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    capturedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    timezone: {
      type: String,
      default: 'America/Santiago',
    },
    simulatorUsersCount: {
      type: Number,
      default: 0,
    },
    simulatorUsagePercentage: {
      type: Number,
      default: 0,
    },
    totalSimulatorInteractions: {
      type: Number,
      default: 0,
    },
    simulatorAdoption: {
      startedOnlyTotal: { type: Number, default: 0 },
      completedTotal: { type: Number, default: 0 },
      startedOnlyWeekly: [{ label: String, value: Number }],
      completedWeekly: [{ label: String, value: Number }],
      bySemester: { type: mongoose.Schema.Types.Mixed, default: {} },
      historicalAdoption: { type: [mongoose.Schema.Types.Mixed], default: [] },
    },
    careerBreakdown: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    topDemandedSections: {
      type: [
        {
          sigla: String,
          nombre: String,
          seccion: String,
          demandCount: Number,
          carrera: String,
        },
      ],
      default: [],
    },
    simulatorWeeklyUsage: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paedisTrendYear: {
      type: Number,
      default: () => new Date().getFullYear(),
    },
    paedisMonthlyTrend: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    paedisMonthlySeries: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SimulatorChartSnapshot', SimulatorChartSnapshotSchema);
