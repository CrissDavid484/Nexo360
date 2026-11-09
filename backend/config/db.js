const mongoose = require('mongoose');
const dataScraperService = require('../services/dataScraperService');
const authScraperService = require('../services/authScraperService');

/**
 * Conexión segura a MongoDB con reintento automático y sembrado inicial (Seeding)
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/nexo360';

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Conectado exitosamente: ${conn.connection.host}`);

    // Sembrar los 10 perfiles institucionales de la BD (Admin, PAEDIS, Estudiante, Profesor, Director, Subdirector, etc.) y módulos en MongoDB
    await authScraperService.seedInstitutionalUsers();
    await dataScraperService.seedDefaultData();
  } catch (error) {
    console.warn(
      `[MongoDB Advertencia] No se pudo conectar a MongoDB en (${mongoURI}): ${error.message}`
    );
    console.warn(
      '[MongoDB Fallback] El servidor operará en modo memoria local hasta que la instancia de MongoDB esté disponible.'
    );
  }
};

module.exports = connectDB;
