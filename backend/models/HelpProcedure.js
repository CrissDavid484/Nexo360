const mongoose = require('mongoose');

/**
 * Esquema de Trámites y Contenidos Editoriales del Centro de Ayuda (Épica E-005)
 * Soporta ciclo de vida editorial: borrador (draft), publicado (published), archivado (archived),
 * control de versiones inmutable, requisitos, pasos ordenados y auditoría de revisiones.
 */
const StepSchema = new mongoose.Schema(
  {
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    instruction: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const ArticleExternalLinkSchema = new mongoose.Schema(
  {
    text: { type: String, trim: true },
    url: { type: String, trim: true },
  },
  { _id: false }
);

const ArticleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true },
    url: { type: String, trim: true },
    summary: { type: String, trim: true },
    body: { type: String },
    externalLinks: [ArticleExternalLinkSchema],
  },
  { _id: false }
);

const FaqItemSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
    tags: [{ type: String, trim: true }],
  },
  { _id: false }
);

const VersionSnapshotSchema = new mongoose.Schema(
  {
    version: { type: Number, required: true },
    title: { type: String, required: true },
    status: { type: String, required: true },
    updatedByEmail: { type: String, required: true },
    updatedAt: { type: Date, default: Date.now },
    changeSummary: { type: String, default: 'Actualización editorial' },
    snapshotData: { type: mongoose.Schema.Types.Mixed },
  },
  { _id: false }
);

const HelpProcedureSchema = new mongoose.Schema(
  {
    procedureId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    categoryKey: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    categoryTitle: {
      type: String,
      required: true,
      trim: true,
    },
    categoryIcon: {
      type: String,
      trim: true,
      default: 'HelpCircle',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'published',
      index: true,
    },
    purpose: {
      type: String,
      trim: true,
      default: '',
    },
    requirements: [
      {
        type: String,
        trim: true,
      },
    ],
    documents: [
      {
        type: String,
        trim: true,
      },
    ],
    steps: [StepSchema],
    officialUrl: {
      type: String,
      trim: true,
      default: '',
    },
    destinationPortal: {
      type: String,
      trim: true,
      default: 'Portal Institucional Duoc UC',
    },
    paedisTip: {
      type: String,
      trim: true,
      default: '',
    },
    isInstitutionalService: {
      type: Boolean,
      default: false,
    },
    estimatedDays: {
      type: Number,
      default: 3,
      min: 0,
    },
    intentGoal: {
      type: String,
      trim: true,
      default: '',
    },
    intentTags: [
      {
        type: String,
        trim: true,
      },
    ],
    actionLabel: {
      type: String,
      trim: true,
      default: '',
    },
    zendeskSectionId: {
      type: Number,
    },
    zendeskCategoryId: {
      type: Number,
    },
    officialCategoryUrl: {
      type: String,
      trim: true,
    },
    highlight: {
      type: Boolean,
      default: false,
    },
    badge: {
      type: String,
      trim: true,
    },
    articles: [ArticleSchema],
    faqs: [FaqItemSchema],
    keywords: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [VersionSnapshotSchema],
    lastReviewedBy: {
      userId: { type: String },
      email: { type: String, lowercase: true, trim: true },
      name: { type: String, trim: true },
    },
    lastReviewedAt: {
      type: Date,
      default: Date.now,
    },
    publishedAt: {
      type: Date,
    },
    archivedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    collection: 'help_procedures',
  }
);

HelpProcedureSchema.index({ categoryKey: 1, status: 1 });
HelpProcedureSchema.index({ title: 'text', description: 'text', keywords: 'text' });

module.exports = mongoose.model('HelpProcedure', HelpProcedureSchema);
