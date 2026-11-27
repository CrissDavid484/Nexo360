const net = require('node:net');
const tls = require('node:tls');

const MAX_OUTBOX_ITEMS = 50;
const SMTP_TIMEOUT_MS = 5000;
const outbox = [];

/**
 * Escapa caracteres especiales HTML para evitar inyección en plantillas de correo.
 */
function escapeHtml(value = '') {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Elimina saltos de línea para prevenir inyección de cabeceras SMTP (CRLF).
 */
function stripHeaderNewlines(value = '') {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

/**
 * Enmascara una dirección de correo para almacenamiento seguro en outbox y previews.
 */
function maskEmail(email = '') {
  const clean = String(email || '').trim().toLowerCase();
  const atIndex = clean.indexOf('@');
  if (atIndex <= 0) return '***';
  const local = clean.slice(0, atIndex);
  const domain = clean.slice(atIndex + 1);
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

function getAppPublicUrl() {
  const raw = process.env.APP_PUBLIC_URL || process.env.FRONTEND_URL || 'http://localhost:5173';
  let clean = String(raw).trim();
  while (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

function buildResetUrl(email, resetToken) {
  const baseUrl = getAppPublicUrl();
  const params = new URLSearchParams({
    mode: 'reset',
    token: String(resetToken || ''),
    email: String(email || '').trim().toLowerCase(),
  });
  return `${baseUrl}/reset-password?${params.toString()}`;
}

function maskSecretInPreview(text = '', secret = '') {
  if (!secret) return text;
  return String(text || '').split(String(secret)).join('***');
}

function recordOutboxEntry({
  to,
  subject,
  text,
  html,
  resetUrl,
  resetToken,
  deliveryMode,
  secretToMask = '',
}) {
  const isProd = process.env.NODE_ENV === 'production';
  const safeText = maskSecretInPreview(text, secretToMask).slice(0, 400);
  const safeHtml = maskSecretInPreview(html, secretToMask).slice(0, 600);

  const entry = {
    recipient: maskEmail(to),
    subject: stripHeaderNewlines(subject),
    textPreview: safeText,
    htmlPreview: safeHtml,
    ...(isProd ? {} : { resetUrl, resetToken }),
    timestamp: new Date().toISOString(),
    deliveryMode,
  };

  outbox.unshift(entry);
  if (outbox.length > MAX_OUTBOX_ITEMS) {
    outbox.pop();
  }
  return entry;
}

function buildSmtpConfig() {
  const host = String(process.env.SMTP_HOST || '').trim();
  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || port === 465;
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '');
  const from = stripHeaderNewlines(
    process.env.SMTP_FROM || 'Nexo360 Duoc UC <no-reply@nexo360.duoc.cl>'
  );
  return { host, port, secure, user, pass, from };
}

function extractAddressOnly(mailbox = '') {
  const str = String(mailbox || '');
  const start = str.indexOf('<');
  const end = str.indexOf('>', start);
  const addr = start !== -1 && end > start ? str.slice(start + 1, end) : str;
  return stripHeaderNewlines(addr);
}

function popSmtpReply(state) {
  const lines = state.buffer.split('\r\n');
  const completeLines = lines.slice(0, -1);
  const lastCompleteIdx = completeLines.findLastIndex((line) => /^\d{3} /.test(line));
  if (lastCompleteIdx === -1) return null;

  const replyLines = completeLines.slice(0, lastCompleteIdx + 1);
  state.buffer = lines.slice(lastCompleteIdx + 1).join('\r\n');
  const lastLine = replyLines[replyLines.length - 1];
  return { code: Number(lastLine.slice(0, 3)), raw: replyLines.join('\n') };
}

function createSmtpReader(socket) {
  const state = { buffer: '', waiters: [] };

  socket.on('data', (chunk) => {
    state.buffer += chunk.toString('utf8');
    while (state.waiters.length > 0) {
      const reply = popSmtpReply(state);
      if (!reply) break;
      const waiter = state.waiters.shift();
      waiter.resolve(reply);
    }
  });

  return () =>
    new Promise((resolve, reject) => {
      const immediate = popSmtpReply(state);
      if (immediate) {
        resolve(immediate);
        return;
      }

      const onError = () => {
        socket.off('error', onError);
        reject(new Error('SMTP connection closed'));
      };
      socket.once('error', onError);
      state.waiters.push({
        resolve: (res) => {
          socket.off('error', onError);
          resolve(res);
        },
      });
    });
}

function writeSmtpCommand(socket, command, nextReply, expectedCodes) {
  return new Promise((resolve, reject) => {
    socket.write(`${command}\r\n`, 'utf8', () => {
      nextReply()
        .then((reply) => {
          if (!expectedCodes.includes(reply.code)) {
            reject(new Error('Unexpected SMTP status'));
            return;
          }
          resolve(reply);
        })
        .catch(reject);
    });
  });
}

function connectSmtpSocket(config) {
  return new Promise((resolve, reject) => {
    const socket = config.secure
      ? tls.connect({ host: config.host, port: config.port, servername: config.host })
      : net.createConnection({ host: config.host, port: config.port });
    const eventName = config.secure ? 'secureConnect' : 'connect';
    socket.once(eventName, () => resolve(socket));
    socket.setTimeout(SMTP_TIMEOUT_MS, () => {
      socket.destroy(new Error('SMTP timeout'));
    });
    socket.once('error', reject);
  });
}

function upgradeToStartTls(socket, host) {
  return new Promise((resolve, reject) => {
    const tlsSocket = tls.connect({ socket, servername: host });
    tlsSocket.once('secureConnect', () => resolve(tlsSocket));
    tlsSocket.setTimeout(SMTP_TIMEOUT_MS, () => {
      tlsSocket.destroy(new Error('SMTP TLS timeout'));
    });
    tlsSocket.once('error', reject);
  });
}

function buildMimeMessage({ from, to, subject, text, html }) {
  const boundary = `nexo360_${Date.now().toString(36)}`;
  const safeFrom = stripHeaderNewlines(from);
  const safeTo = stripHeaderNewlines(to);
  const safeSubject = stripHeaderNewlines(subject);
  const dotStuff = (body) =>
    String(body || '')
      .replace(/\r?\n/g, '\r\n')
      .replace(/^\./gm, '..');

  return [
    `From: ${safeFrom}`,
    `To: ${safeTo}`,
    `Subject: ${safeSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    dotStuff(text),
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    dotStuff(html),
    '',
    `--${boundary}--`,
  ].join('\r\n');
}

async function negotiateStartTls(socket, config, nextReply, ehloRaw) {
  if (config.secure || !ehloRaw.toUpperCase().includes('STARTTLS')) {
    return { activeSocket: socket, activeNextReply: nextReply };
  }
  await writeSmtpCommand(socket, 'STARTTLS', nextReply, [220]);
  const tlsSocket = await upgradeToStartTls(socket, config.host);
  const tlsReader = createSmtpReader(tlsSocket);
  await writeSmtpCommand(tlsSocket, 'EHLO nexo360.local', tlsReader, [250]);
  return { activeSocket: tlsSocket, activeNextReply: tlsReader };
}

async function sendViaSmtp(config, mail) {
  let socket = await connectSmtpSocket(config);
  try {
    const initialReader = createSmtpReader(socket);
    const greeting = await initialReader();
    if (greeting.code !== 220) throw new Error('SMTP greeting rejected');

    const ehlo = await writeSmtpCommand(socket, 'EHLO nexo360.local', initialReader, [250]);
    const { activeSocket, activeNextReply } = await negotiateStartTls(
      socket,
      config,
      initialReader,
      ehlo.raw
    );
    socket = activeSocket;

    if (config.user && config.pass) {
      const token = Buffer.from(`\0${config.user}\0${config.pass}`, 'utf8').toString('base64');
      await writeSmtpCommand(socket, `AUTH PLAIN ${token}`, activeNextReply, [235]);
    }

    const fromAddr = extractAddressOnly(config.from);
    const toAddr = extractAddressOnly(mail.to);
    await writeSmtpCommand(socket, `MAIL FROM:<${fromAddr}>`, activeNextReply, [250]);
    await writeSmtpCommand(socket, `RCPT TO:<${toAddr}>`, activeNextReply, [250, 251]);
    await writeSmtpCommand(socket, 'DATA', activeNextReply, [354]);
    const payload = buildMimeMessage({ from: config.from, ...mail });
    await writeSmtpCommand(socket, `${payload}\r\n.`, activeNextReply, [250]);
    await writeSmtpCommand(socket, 'QUIT', activeNextReply, [221, 250]).catch(() => {});
  } finally {
    if (!socket.destroyed) socket.destroy();
  }
}

async function sendViaWebhook(webhookUrl, mail) {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(mail),
    signal: AbortSignal.timeout(SMTP_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error('Webhook delivery rejected');
  }
}

async function tryExternalDelivery(smtpConfig, webhookUrl, mail) {
  if (smtpConfig.host) {
    try {
      await sendViaSmtp(smtpConfig, mail);
      return 'smtp';
    } catch {
      console.warn('[EmailService] Entrega SMTP no disponible; aplicando respaldo local.');
      return 'fallback';
    }
  }

  if (webhookUrl) {
    try {
      await sendViaWebhook(webhookUrl, { from: smtpConfig.from, ...mail });
      return 'smtp';
    } catch {
      console.warn('[EmailService] Webhook de correo no disponible; aplicando respaldo local.');
      return 'fallback';
    }
  }

  return 'fallback';
}

async function dispatchEmail({ to, subject, text, html, resetToken, resetUrl, secretToMask = '' }) {
  const cleanTo = stripHeaderNewlines(to).toLowerCase();
  if (!cleanTo) {
    return { delivered: false, deliveryMode: 'fallback', devPreview: null };
  }

  const smtpConfig = buildSmtpConfig();
  const webhookUrl = String(process.env.EMAIL_WEBHOOK_URL || '').trim();
  const deliveryMode = await tryExternalDelivery(smtpConfig, webhookUrl, {
    to: cleanTo,
    subject,
    text,
    html,
  });

  const entry = recordOutboxEntry({
    to: cleanTo,
    subject,
    text,
    html,
    resetUrl,
    resetToken,
    deliveryMode,
    secretToMask,
  });

  const isProd = process.env.NODE_ENV === 'production';
  const delivered = deliveryMode === 'smtp' || (!isProd && deliveryMode === 'fallback');
  return {
    delivered,
    deliveryMode: deliveryMode === 'fallback' && isProd ? 'unconfigured_smtp' : deliveryMode,
    devPreview:
      !isProd && deliveryMode === 'fallback'
        ? {
            recipient: entry.recipient,
            subject: entry.subject,
            token: resetToken,
            resetUrl,
          }
        : null,
  };
}

/**
 * Envía el correo de bienvenida institucional con enlace de activación seguro (sin contraseñas predecibles).
 */
async function sendWelcomeEmail({ to, fullName, activationUrl, activationToken, resetToken, roleLabel, initialPassword }) {
  const targetUrl = activationUrl || (resetToken ? buildResetUrl(to, resetToken) : '');
  const safeName = escapeHtml(fullName || 'Usuario Duoc UC');
  const safeRole = escapeHtml(roleLabel || 'Miembro Institucional');
  const safeUrl = escapeHtml(targetUrl);
  const subject = 'Bienvenido/a a Nexo360 Duoc UC — Activación de cuenta';

  const text = [
    `Hola ${fullName || 'Usuario Duoc UC'},`,
    '',
    `Tu cuenta institucional en Nexo360 ha sido creada con el perfil: ${roleLabel || 'Miembro Institucional'}.`,
    `Correo de acceso: ${to}`,
    '',
    'Para completar el registro y activar tu acceso conforme a la Ley N° 21.719, por favor define tu contraseña personal mediante el siguiente enlace seguro (vigente por 48 horas):',
    targetUrl,
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
      <h2 style="color: #002855;">Bienvenido/a a Nexo360 — Duoc UC</h2>
      <p>Hola <strong>${safeName}</strong>,</p>
      <p>Tu cuenta institucional ha sido registrada con el rol: <strong>${safeRole}</strong>.</p>
      <ul>
        <li><strong>Correo institucional:</strong> ${escapeHtml(to)}</li>
      </ul>
      <p>Por seguridad y para proteger tus datos personales, debes activar tu cuenta y definir tu propia contraseña institucional en el siguiente enlace seguro (vigente por 48 horas):</p>
      <p><a href="${safeUrl}" style="color: #0055a5; font-weight: bold;">Activar mi cuenta y definir contraseña en Nexo360</a></p>
      <p style="font-size: 12px; color: #64748b;">Tratamiento de datos protegido conforme a la Ley N° 21.719 de Protección de Datos Personales.</p>
    </div>
  `.trim();

  return dispatchEmail({
    to,
    subject,
    text,
    html,
    resetToken: activationToken || resetToken,
    resetUrl: targetUrl,
    secretToMask: initialPassword || '',
  });
}

/**
 * Envía un correo de recuperación de contraseña con token criptográfico de un solo uso.
 */
async function sendPasswordResetEmail({ to, fullName, resetToken }) {
  const resetUrl = buildResetUrl(to, resetToken);
  const safeName = escapeHtml(fullName || 'Usuario Duoc UC');
  const safeToken = escapeHtml(resetToken || '');
  const safeUrl = escapeHtml(resetUrl);
  const subject = 'Recuperación de contraseña — Nexo360 Duoc UC';

  const text = [
    `Hola ${fullName || 'Usuario Duoc UC'},`,
    '',
    'Recibimos una solicitud para restablecer tu contraseña en Nexo360.',
    `Código de recuperación (válido por 30 minutos): ${resetToken}`,
    `Enlace directo: ${resetUrl}`,
    '',
    'Si no realizaste esta solicitud, puedes ignorar este mensaje.',
  ].join('\n');

  const html = `
    <div style="font-family: Arial, sans-serif; color: #1e293b; line-height: 1.6;">
      <h2 style="color: #002855;">Recuperación de contraseña — Nexo360</h2>
      <p>Hola <strong>${safeName}</strong>,</p>
      <p>Usa el siguiente código de verificación (vigente por 30 minutos) o ingresa mediante el enlace directo:</p>
      <p><strong>Código:</strong> <code>${safeToken}</code></p>
      <p><a href="${safeUrl}" style="color: #0055a5; font-weight: bold;">Restablecer contraseña en Nexo360</a></p>
      <p style="font-size: 12px; color: #64748b;">Si no solicitaste este cambio, ignora este correo.</p>
    </div>
  `.trim();

  return dispatchEmail({
    to,
    subject,
    text,
    html,
    resetToken,
    resetUrl,
  });
}

function getOutbox() {
  return outbox.map((entry) => ({ ...entry }));
}

function clearOutbox() {
  outbox.length = 0;
}

module.exports = {
  sendWelcomeEmail,
  sendPasswordResetEmail,
  getOutbox,
  clearOutbox,
};
