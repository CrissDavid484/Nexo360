const mongoose = require('mongoose');

/**
 * Modelo genérico para almacenar en caché las FAQs, trámites, enlaces y datos
 * scrapeados del portal Duoc UC para evitar sobrecargar los servidores y reducir la latencia.
 */
const ScrapedDataCacheSchema = new mongoose.Schema(
  {
    categoryKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      // Ej: 'admision-matricula', 'orientacion-nuevos', 'vida-academica', etc.
    },
    categoryTitle: {
      type: String,
      required: true,
    },
    portalUrl: {
      type: String,
      required: true,
    },
    faqs: [
      {
        question: {
          type: String,
          required: true,
        },
        answer: {
          type: String,
          required: true,
        },
        tags: [String],
        relevanceScore: {
          type: Number,
          default: 1,
        },
      },
    ],
    submodules: [
      {
        id: String,
        title: String,
        description: String,
        directUrl: String,
        requirements: [String],
        steps: [String],
        paedisTip: String, // Ajustes o consideraciones especiales para discapacidad
      },
    ],
    last_updated: {
      type: Date,
      default: Date.now,
    },
    ttlHours: {
      type: Number,
      default: 24, // Validez del caché antes de requerir un nuevo scraping
    },
  },
  {
    timestamps: true,
  }
);

// Método para verificar si el caché ha expirado
ScrapedDataCacheSchema.methods.isExpired = function () {
  const now = new Date();
  const diffHours = (now - this.last_updated) / (1000 * 60 * 60);
  return diffHours > this.ttlHours;
};

module.exports = mongoose.model('ScrapedDataCache', ScrapedDataCacheSchema);
