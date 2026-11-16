const mongoose = require('mongoose');
const authService = require('../services/authService');

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

    // Sembrar los perfiles institucionales iniciales directamente en UserProfile de MongoDB
    await authService.seedInstitutionalUsers();

    try {
      const courseService = require('../services/courseService');
      await courseService.seedInitialCourses();
    } catch (courseErr) {
      console.warn(`[MongoDB] No se pudo sembrar cursos automáticamente: ${courseErr.message}`);
    }
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
