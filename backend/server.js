require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const moduleRoutes = require('./routes/moduleRoutes');
const adminRoutes = require('./routes/adminRoutes');
const courseRoutes = require('./routes/courseRoutes');
const calendarRoutes = require('./routes/calendarRoutes');
const simulatorSnapshotService = require('./services/simulatorSnapshotService');
const academicCalendarService = require('./services/academicCalendarService');

const app = express();
const PORT = process.env.PORT || 5000;

// Seguridad: Ocultar cabecera de tecnología del servidor
app.disable('x-powered-by');

// Seguridad: Cabeceras HTTP de protección integral (OWASP Best Practices)
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; frame-ancestors 'self'; form-action 'self'; base-uri 'self'"
  );
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  next();
});

// Configuración CORS estricta para desarrollo local y contenedores Docker
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_CONTAINER_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones same-origin o herramientas internas sin cabecera Origin
      if (
        !origin ||
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && origin.endsWith(':5173'))
      ) {
        return callback(null, true);
      }
      const corsError = new Error('Origen no permitido por la política CORS de Nexo360');
      corsError.status = 403;
      return callback(corsError, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Health check de la API y estado de MongoDB (usado por Docker Healthcheck)
app.get('/api/health', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  const mongoState = dbStates[mongoose.connection.readyState] || 'unknown';
  const isProd = process.env.NODE_ENV === 'production';

  res.status(200).json({
    status: 'OK',
    service: 'Nexo360 Backend API • Duoc UC - Sede Alameda (Plataforma Oficial)',
    campus: 'Duoc UC - Sede Alameda',
    database: {
      engine: 'MongoDB',
      status: mongoState,
      ...(isProd ? {} : { host: mongoose.connection.host || 'localhost', name: mongoose.connection.name || 'nexo360' }),
    },
    accessibilityStandard: 'WCAG 2.2 AA / AAA',
    timestamp: new Date().toISOString(),
  });
});

// Rutas principales de la API
app.use('/api/auth', authRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/calendar', calendarRoutes);

// Manejador de rutas no encontradas (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Correo no registrado o servicio no disponible en este momento.',
  });
});

// Manejador global de errores (incluyendo rechazos CORS y JSON malformado)
app.use((err, req, res, next) => {
  if (err.status === 403 || err.message?.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message || 'Acceso denegado por política CORS.',
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'Cuerpo JSON de la petición malformado.',
    });
  }

  console.error('[Server Error]:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: 'Error interno del servidor en Nexo360',
  });
});

async function startServer() {
  try {
    await connectDB();
    await academicCalendarService.ensureSeedCalendars();
    simulatorSnapshotService.startSnapshotScheduler();
  } catch (err) {
    console.error('[MongoDB Error] Fallo al conectar en inicio:', err.message);
  }

  return app.listen(PORT, '0.0.0.0', () => {
    console.log(`=========================================================`);
    console.log(`🚀 Nexo360 Backend (Duoc UC - Sede Alameda) en http://0.0.0.0:${PORT}`);
    console.log(`🔒 Autenticación Cifrada Ley N° 21.719 & WCAG 2.2 AA/AAA`);
    console.log(`=========================================================`);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    console.error('[Server Fatal]:', err.message);
    process.exitCode = 1;
  });
}

module.exports = app;
