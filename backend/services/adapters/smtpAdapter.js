/**
 * ADAPTADOR DE CORREO INSTITUCIONAL SMTP
 * Envío de notificaciones transaccionales, alertas SAT y credenciales institucionales.
 */

const emailService = require('../emailService');

class SmtpAdapter {
  constructor() {
    this.host = process.env.SMTP_HOST || '';
    this.port = Number(process.env.SMTP_PORT || 587);
    this.user = process.env.SMTP_USER || '';
    this.from = process.env.SMTP_FROM || 'notificaciones@duocuc.cl';
  }

  isConfigured() {
    return Boolean(this.host && this.host.length > 3 && this.user);
  }

  /**
   * Envía un correo institucional delegando en emailService con sanitización estricta.
   */
  async sendEmail({ to, subject, text, html, metadata = {} }) {
    return emailService.sendGenericEmail({
      to,
      subject,
      text,
      html,
      metadata,
    });
  }

  /**
   * Diagnóstico de conectividad SMTP.
   */
  async verifyConnection() {
    return emailService.testSmtpConnection();
  }
}

module.exports = new SmtpAdapter();
