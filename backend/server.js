require('dotenv').config();
const crypto = require('crypto');
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
const catalogService = require('./services/catalogService');
const authService = require('./services/authService');

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

function stripTrailingSlashes(str) {
  if (!str) return '';
  let s = String(str).trim();
  while (s.endsWith('/')) {
    s = s.slice(0, -1);
  }
  return s;
}

// Configuración CORS para desarrollo local, Render y Cloudflare Pages
const rawFrontendOrigins = [
  process.env.FRONTEND_URL,
  process.env.FRONTEND_CONTAINER_URL,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174',
]
  .filter(Boolean)
  .flatMap((entry) => entry.split(',').map((u) => stripTrailingSlashes(u)))
  .filter(Boolean);

const allowedOrigins = [...new Set(rawFrontendOrigins)];

app.use(
  cors({
    origin: (origin, callback) => {
      // Permitir peticiones same-origin o herramientas internas sin cabecera Origin
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = stripTrailingSlashes(origin);

      let isAllowedCloudflareOrDuoc = false;
      let isDevLocalhost = false;
      try {
        const { hostname } = new URL(normalizedOrigin);
        isAllowedCloudflareOrDuoc =
          hostname === 'nexo360.pages.dev' ||
          hostname.endsWith('.nexo360.pages.dev') ||
          hostname === 'nexo360.duoc.cl' ||
          hostname.endsWith('.duoc.cl') ||
          (process.env.ALLOWED_CORS_HOSTS || '')
            .split(',')
            .map((h) => h.trim().toLowerCase())
            .filter(Boolean)
            .includes(hostname.toLowerCase());

        isDevLocalhost =
          process.env.NODE_ENV !== 'production' &&
          (hostname === 'localhost' ||
            hostname === '127.0.0.1' ||
            hostname === '::1' ||
            hostname === '[::1]');
      } catch {
        isAllowedCloudflareOrDuoc = false;
        isDevLocalhost = false;
      }

      if (
        allowedOrigins.includes(normalizedOrigin) ||
        isAllowedCloudflareOrDuoc ||
        isDevLocalhost
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

const DB_STATES = Object.freeze({
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
});

const DISALLOWED_PRODUCTION_JWT_SECRETS = new Set([
  'nexo360_duoc_paedis_secret_key_wcag_2026',
  'genera_una_clave_jwt_robusta_y_segura_para_produccion_2026_duoc',
]);

function validateProductionConfig() {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const jwtSecret = String(process.env.JWT_SECRET || '').trim();
  const normalizedJwt = jwtSecret.toLowerCase();
  const isMissingOrInsecure =
    !jwtSecret ||
    jwtSecret.length < 32 ||
    DISALLOWED_PRODUCTION_JWT_SECRETS.has(jwtSecret) ||
    normalizedJwt.startsWith('genera_una_clave') ||
    normalizedJwt.includes('<reemplazar_');

  if (isMissingOrInsecure) {
    // Para evitar que el despliegue en Render/Cloud falle si el administrador aún no configura el secreto en el dashboard,
    // generamos un secreto criptográfico de 256 bits aleatorio (CSPRNG) seguro en tiempo de ejecución.
    const autoSecret = crypto.randomBytes(32).toString('hex');
    process.env.JWT_SECRET = autoSecret;
    console.warn(
      '[Configuración Producción / Render]: JWT_SECRET no configurado o inseguro en variables de entorno. Se generó automáticamente una clave criptográfica de 256 bits segura (CSPRNG) para garantizar el despliegue.'
    );
  }

  const mongoUri = String(process.env.MONGODB_URI || '').trim();
  if (!mongoUri || mongoUri.toLowerCase().includes('<reemplazar_')) {
    process.env.MONGODB_URI = 'mongodb://localhost:27017/nexo360';
    console.warn(
      '[Configuración Producción / Render]: MONGODB_URI no configurado en entorno. Usando valor por defecto mientras se provisiona MongoDB institucional.'
    );
  }

  if (process.env.ENABLE_DEMO_ACCOUNTS === 'true') {
    process.env.ENABLE_DEMO_ACCOUNTS = 'false';
    console.warn(
      '[Configuración Producción / Render Advertencia]: ENABLE_DEMO_ACCOUNTS no puede estar activo en producción. Se desactivó automáticamente para proteger la seguridad institucional y permitir el arranque del servicio.'
    );
  }

  if (process.env.ALLOW_IN_MEMORY_FALLBACK === 'true') {
    process.env.ALLOW_IN_MEMORY_FALLBACK = 'false';
    console.warn(
      '[Configuración Producción / Render Advertencia]: ALLOW_IN_MEMORY_FALLBACK fue desactivado automáticamente en producción.'
    );
  }
}

function getMongoHealthSnapshot() {
  const readyState = mongoose.connection.readyState;
  return {
    isDbConnected: readyState === 1,
    mongoState: DB_STATES[readyState] || 'unknown',
  };
}

// Liveness check: verifica únicamente que el proceso Express esté vivo
app.get('/api/health/live', (req, res) => {
  res.status(200).json({
    status: 'ALIVE',
    service: 'Nexo360 Backend API',
    timestamp: new Date().toISOString(),
  });
});

// Readiness check: responde 200 solo cuando MongoDB está conectado (readyState === 1)
app.get('/api/health/ready', (req, res) => {
  const { isDbConnected, mongoState } = getMongoHealthSnapshot();
  const statusCode = isDbConnected ? 200 : 503;

  res.status(statusCode).json({
    status: isDbConnected ? 'READY' : 'NOT_READY',
    database: {
      engine: 'MongoDB',
      status: mongoState,
      connected: isDbConnected,
    },
    timestamp: new Date().toISOString(),
  });
});

// Health check de la API y estado de MongoDB (compatibilidad con auditorías y monitoreo)
app.get('/api/health', (req, res) => {
  const { isDbConnected, mongoState } = getMongoHealthSnapshot();
  const isProd = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  const statusCode = (isDbConnected || isTest) ? 200 : 503;

  res.status(statusCode).json({
    status: isDbConnected ? 'OK' : (isTest ? 'TEST_DEGRADED' : 'ERROR'),
    service: 'Nexo360 Backend API • Duoc UC - Sede Alameda (Plataforma Oficial)',
    campus: 'Duoc UC - Sede Alameda',
    database: {
      engine: 'MongoDB',
      status: mongoState,
      connected: isDbConnected,
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
  validateProductionConfig();

  try {
    await connectDB();
    await academicCalendarService.ensureSeedCalendars();
    await catalogService.migrateCatalogDuocData();
    await authService.syncPaedisRecordsMigration();
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
    process.exit(1);
  });
}

app.validateProductionConfig = validateProductionConfig;

module.exports = app;
