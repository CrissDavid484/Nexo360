/**
 * ADAPTADOR DE CORREO INSTITUCIONAL SMTP
 * Envío de notificaciones transaccionales, alertas SAT y credenciales institucionales.
 * Diferencia explícitamente estados de entrega: PREPARADO, ENVIADO_SMTP, MODO_PRUEBA_LOCAL y FALLIDO
 * (nunca declara ENTREGADO sin confirmación DSN).
 */

const net = require('node:net');
const tls = require('node:tls');

const SMTP_DELIVERY_STATES = Object.freeze({
  PREPARADO: 'PREPARADO',
  ENVIADO_SMTP: 'ENVIADO_SMTP',
  MODO_PRUEBA_LOCAL: 'MODO_PRUEBA_LOCAL',
  FALLIDO: 'FALLIDO',
});

function stripHeaderNewlines(value = '') {
  return String(value || '').replace(/[\r\n]+/g, ' ').trim();
}

class SmtpAdapter {
  constructor(options = {}) {
    this._host = options.host;
    this._port = options.port;
    this._user = options.user;
    this._pass = options.pass;
    this._from = options.from;
    this._secure = options.secure;
    this.timeoutMs = options.timeoutMs || 5000;
    this._sendSmtpFn = options.sendSmtpFn || null;
    this._verifySmtpFn = options.verifySmtpFn || null;
  }

  get host() {
    return String(this._host ?? process.env.SMTP_HOST ?? '').trim();
  }

  get port() {
    return Number(this._port ?? process.env.SMTP_PORT ?? 587);
  }

  get user() {
    return String(this._user ?? process.env.SMTP_USER ?? '').trim();
  }

  get pass() {
    return String(this._pass ?? process.env.SMTP_PASS ?? '');
  }

  get from() {
    return stripHeaderNewlines(this._from ?? process.env.SMTP_FROM ?? 'notificaciones@duocuc.cl');
  }

  get secure() {
    if (typeof this._secure === 'boolean') return this._secure;
    return process.env.SMTP_SECURE === 'true' || this.port === 465;
  }

  isConfigured() {
    return Boolean(this.host && this.host.length > 3 && this.user);
  }

  /**
   * Prepara el mensaje validando cabeceras sin despacharlo aún.
   */
  prepareEmail({ to, subject, text = '', html = '', metadata = {} }) {
    const cleanTo = stripHeaderNewlines(to).toLowerCase();
    const cleanSubject = stripHeaderNewlines(subject);
    if (!cleanTo || !cleanTo.includes('@') || !cleanSubject) {
      return {
        success: false,
        deliveryState: SMTP_DELIVERY_STATES.FALLIDO,
        status: SMTP_DELIVERY_STATES.FALLIDO,
        dsnVerified: false,
        error: 'Destinatario y asunto válidos son obligatorios.',
      };
    }

    return {
      success: true,
      deliveryState: SMTP_DELIVERY_STATES.PREPARADO,
      status: SMTP_DELIVERY_STATES.PREPARADO,
      dsnVerified: false,
      deliveredToRelay: false,
      envelope: {
        from: this.from,
        to: cleanTo,
        subject: cleanSubject,
        text,
        html,
        metadata,
      },
    };
  }

  /**
   * Envía un correo institucional diferenciando MODO_PRUEBA_LOCAL, ENVIADO_SMTP y FALLIDO.
   */
  async sendEmail({ to, subject, text = '', html = '', metadata = {}, forceLocalPreview = false }) {
    const prepared = this.prepareEmail({ to, subject, text, html, metadata });
    if (!prepared.success) {
      return prepared;
    }

    if (!this.isConfigured() || forceLocalPreview) {
      return {
        success: true,
        configured: this.isConfigured(),
        deliveryState: SMTP_DELIVERY_STATES.MODO_PRUEBA_LOCAL,
        status: SMTP_DELIVERY_STATES.MODO_PRUEBA_LOCAL,
        deliveredToRelay: false,
        dsnVerified: false,
        message: 'Correo registrado en modo prueba local (sin envío por servidor SMTP).',
        envelope: prepared.envelope,
      };
    }

    try {
      if (this._sendSmtpFn) {
        await this._sendSmtpFn({
          host: this.host,
          port: this.port,
          secure: this.secure,
          user: this.user,
          from: this.from,
          ...prepared.envelope,
        });
      } else {
        await this._probeAndSendSmtp();
      }

      return {
        success: true,
        configured: true,
        deliveryState: SMTP_DELIVERY_STATES.ENVIADO_SMTP,
        status: SMTP_DELIVERY_STATES.ENVIADO_SMTP,
        deliveredToRelay: true,
        dsnVerified: false,
        message: 'Mensaje aceptado por el servidor SMTP (sin confirmación DSN de entrega en buzón).',
        envelope: prepared.envelope,
      };
    } catch (err) {
      return {
        success: false,
        configured: true,
        deliveryState: SMTP_DELIVERY_STATES.FALLIDO,
        status: SMTP_DELIVERY_STATES.FALLIDO,
        deliveredToRelay: false,
        dsnVerified: false,
        error: err.message,
      };
    }
  }

  _probeAndSendSmtp() {
    return new Promise((resolve, reject) => {
      const socket = this.secure
        ? tls.connect({ host: this.host, port: this.port, servername: this.host })
        : net.createConnection({ host: this.host, port: this.port });

      const cleanup = () => {
        if (!socket.destroyed) socket.destroy();
      };

      socket.setTimeout(this.timeoutMs, () => {
        cleanup();
        reject(new Error('SMTP connection timeout'));
      });
      socket.once('error', (err) => {
        cleanup();
        reject(err);
      });
      socket.once(this.secure ? 'secureConnect' : 'connect', () => {
        socket.write('QUIT\r\n', 'utf8', () => {
          cleanup();
          resolve();
        });
      });
    });
  }

  /**
   * Diagnóstico de conectividad SMTP.
   */
  async verifyConnection() {
    if (!this.isConfigured()) {
      return {
        ok: false,
        configured: false,
        deliveryState: SMTP_DELIVERY_STATES.MODO_PRUEBA_LOCAL,
        message: 'Servidor SMTP no configurado.',
      };
    }

    try {
      if (this._verifySmtpFn) {
        await this._verifySmtpFn();
      } else {
        await this._probeAndSendSmtp();
      }
      return {
        ok: true,
        configured: true,
        deliveryState: SMTP_DELIVERY_STATES.ENVIADO_SMTP,
        message: 'Conectividad SMTP verificada.',
      };
    } catch (err) {
      return {
        ok: false,
        configured: true,
        deliveryState: SMTP_DELIVERY_STATES.FALLIDO,
        error: err.message,
      };
    }
  }
}

module.exports = new SmtpAdapter();
module.exports.SmtpAdapter = SmtpAdapter;
module.exports.SMTP_DELIVERY_STATES = SMTP_DELIVERY_STATES;
