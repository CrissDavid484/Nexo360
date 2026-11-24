const mongoose = require('mongoose');

const SemesterCalendarSchema = new mongoose.Schema(
  {
    semester: { type: Number, enum: [1, 2], required: true },
    code: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    weekZeroStart: { type: String, default: null },
    weekZeroEnd: { type: String, default: null },
    prepStart: { type: String, default: null },
    prepEnd: { type: String, default: null },
    classesStart: { type: String, required: true },
    classesEnd: { type: String, required: true },
    examsStart: { type: String, default: null },
    examsEnd: { type: String, default: null },
    closeDate: { type: String, default: null },
    withdrawalStart: { type: String, default: null },
    withdrawalEnd: { type: String, default: null },
    surveyStart: { type: String, default: null },
    surveyEnd: { type: String, default: null },
    riDate: { type: String, default: null },
    totalWeeks: { type: Number, default: 18 },
  },
  { _id: false }
);

const AcademicCalendarSchema = new mongoose.Schema(
  {
    year: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    resolution: {
      type: String,
      trim: true,
      default: 'Calendario Académico Oficial Duoc UC',
    },
    sourceFileName: {
      type: String,
      trim: true,
      default: '',
    },
    tav: {
      start: { type: String, default: null },
      end: { type: String, default: null },
      close: { type: String, default: null },
    },
    winterRecess: {
      start: { type: String, default: null },
      end: { type: String, default: null },
    },
    semesters: {
      type: [SemesterCalendarSchema],
      default: [],
    },
    updatedBy: {
      type: String,
      trim: true,
      default: 'system',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AcademicCalendar', AcademicCalendarSchema);
