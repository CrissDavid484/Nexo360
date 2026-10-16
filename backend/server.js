require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Importación de rutas
const authRoutes = require('./routes/authRoutes');
const moduleRoutes = require('./routes/moduleRoutes');

// Conexión a Base de Datos MongoDB
connectDB();

const app = express();

// Middlewares globales
app.use(cors({
  origin: '*', // Permitir conexión desde Vite Frontend (usualmente puerto 5173)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);

// Healthcheck
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'Nexo360 Backend API - Duoc UC PAEDIS',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    zeroKnowledgeCredentials: true,
    wcagTarget: 'WCAG 2.2 AA',
  });
});

// Middleware para manejo de rutas inexistentes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.originalUrl}`,
  });
});

// Middleware global para manejo de errores
app.use((err, req, res, next) => {
  console.error('[Error de Servidor]', err.stack);
  res.status(500).json({
    success: false,
    message: 'Ocurrió un error interno en el servidor Nexo360.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 Nexo360 Backend corriendo en el puerto ${PORT}`);
  console.log(`🔒 Zero-Knowledge Authentication Proxy activo`);
  console.log(`♿ Arquitectura orientada a Accesibilidad WCAG 2.2 AA`);
  console.log(`=======================================================`);
});
