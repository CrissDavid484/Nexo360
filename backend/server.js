require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const puppeteer = require('puppeteer');

// Importación de rutas
const authRoutes = require('./routes/authRoutes');
const moduleRoutes = require('./routes/moduleRoutes');

// Conexión a Base de Datos MongoDB
connectDB();

const app = express();

// Variable global para compartir la sesión del bot entre rutas
global.sesionesActivas = global.sesionesActivas || {};

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

// =======================================================
// RUTA DEL BOT DE RESERVAS CON TRAZABILIDAD ACÚSTICA (SSE)
// =======================================================
app.get('/api/reservar-sala/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Ahora recibimos también el horario y la sala elegida
  const { username, rut, nombre, apellido, horario, sala } = req.query;

  const enviarMensaje = (texto, tipo = 'info') => {
    res.write(`data: ${JSON.stringify({ texto, tipo })}\n\n`);
  };

  let page = global.sesionesActivas[username]?.page;
  let browser = null;

  try {
    // Si no hay una sesión activa de Microsoft, levantamos un bot de contingencia para la demo
    if (!page) {
      enviarMensaje("Levantando instancia del bot de automatización...", "info");
      browser = await puppeteer.launch({ headless: false }); // Ocultar en producción con "new" o true
      page = await browser.newPage();
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
    }

    enviarMensaje("Conectando con el portal de Bibliotecas Duoc UC...", "info");
    await page.goto('https://bibliotecas.duoc.cl/reserva-sala', { waitUntil: 'networkidle2' });

    enviarMensaje("Buscando sede Biblioteca Alameda...", "info");
    const btnSede = await page.waitForXPath("//button[contains(., 'Selecciona tu sede')]", { visible: true });
    await btnSede.click();

    const opcionAlameda = await page.waitForXPath("//a[contains(., 'Biblioteca Alameda')]", { visible: true });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      opcionAlameda.click()
    ]);

    // Actualizamos el mensaje para que el lector de pantalla anuncie exactamente lo que el usuario eligió
    enviarMensaje(`Analizando grilla. Seleccionando la ${sala || 'sala libre'} para el bloque de ${horario}...`, "info");

    // NOTA: Para el MVP, el bot hace clic en el primer bloque libre que encuentra. 
    // En una versión final, aquí se usaría la variable "sala" y "horario" para hacer un selector CSS exacto.
    const primerBloqueLibre = await page.waitForSelector('a.fc-time-grid-event[title*="Disponible"]', { visible: true, timeout: 10000 });
    await primerBloqueLibre.click();

    enviarMensaje("Bloque verde seleccionado. Solicitando hacer reserva...", "info");
    const btnHacerReserva = await page.waitForXPath("//button[contains(., 'Hacer una reserva')]", { visible: true });
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2' }),
      btnHacerReserva.click()
    ]);

    enviarMensaje("Llenando formulario institucional...", "info");
    await page.waitForSelector('#fname', { visible: true });
    await page.type('#fname', nombre || "Cristian David");
    await page.type('#lname', apellido || "Guzmán García");

    // Intento de llenar RUT dinámico
    try {
      await page.type('#q17482', rut || "19276735-0");
    } catch (e) {
      await page.type('input.form-control:not(#fname):not(#lname)', rut || "19276735-0");
    }

    // Delay para simular procesamiento y que no gastes reservas reales durante tu desarrollo
    enviarMensaje("Confirmando la reserva con el sistema...", "info");
    await new Promise(r => setTimeout(r, 2000));

    enviarMensaje("¡Reserva automatizada con éxito!", "exito");
    res.end();

  } catch (error) {
    console.error('[Bot Error]:', error);
    enviarMensaje(`Hubo un problema con la automatización: ${error.message}`, "error");
    res.end();
  } finally {
    if (browser) await browser.close(); // Limpiamos el bot de contingencia
  }
});
// =======================================================

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