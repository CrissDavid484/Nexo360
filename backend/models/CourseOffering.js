const mongoose = require('mongoose');

const BlockScheduleSchema = new mongoose.Schema(
  {
    dia: {
      type: String,
      required: true,
      enum: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
    },
    bloqueId: {
      type: String,
      required: true, // b1, b2, ..., b18
    },
    horaInicio: {
      type: String,
      default: '',
    },
    horaFin: {
      type: String,
      default: '',
    },
    salaCorta: {
      type: String,
      default: 'ONLINE',
    },
  },
  { _id: false }
);

const CourseOfferingSchema = new mongoose.Schema(
  {
    sede: {
      type: String,
      default: 'ALAMEDA',
      trim: true,
      uppercase: true,
    },
    carrera: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    plan: {
      type: String,
      default: '1446815',
      trim: true,
    },
    jornada: {
      type: String,
      enum: ['Diurno', 'Vespertino', 'DIURNO', 'VESPERTINO'],
      default: 'Diurno',
    },
    periodo: {
      type: String,
      default: '2026 - 002',
      index: true,
    },
    sigla: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    siglaEq: {
      type: String,
      default: '',
      trim: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    nivel: {
      type: String,
      default: 'Optativos',
      trim: true,
    },
    creditos: {
      type: Number,
      default: 10,
    },
    tipo: {
      type: String,
      enum: ['obligatorio', 'optativo', 'deportivo', 'electivo'],
      default: 'optativo',
    },
    seccion: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    horarioRaw: {
      type: String,
      default: '',
      trim: true,
    },
    docente: {
      type: String,
      default: 'DOCENTE ASIGNADO',
      trim: true,
      uppercase: true,
    },
    modalidad: {
      type: String,
      default: 'ONLINE SINCRONA',
      trim: true,
      uppercase: true,
    },
    cuposTotales: {
      type: Number,
      default: 30,
    },
    cuposDisponibles: {
      type: Number,
      default: 15,
    },
    bloques: [BlockScheduleSchema],
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas rápidas por carrera y período
CourseOfferingSchema.index({ carrera: 1, periodo: 1, sigla: 1, seccion: 1 });

module.exports = mongoose.model('CourseOffering', CourseOfferingSchema);
