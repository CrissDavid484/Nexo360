const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/nexo360', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Conectado exitosamente: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Error] No se pudo conectar a MongoDB: ${error.message}`);
    console.warn('[MongoDB Aviso] La aplicación continuará funcionando en modo memoria/fallback para desarrollo.');
  }
};

module.exports = connectDB;
