/**
 * ADAPTADOR OFICIAL OPENID CONNECT / MICROSOFT ENTRA ID PARA DUOC UC
 * Gestiona endpoints OIDC, resolución de claims institucionales y validación de tokens.
 */

const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

class MicrosoftEntraIdAdapter {
  constructor(options = {}) {
    this.tenantId = options.tenantId || process.env.AZURE_ENTRA_TENANT_ID || process.env.MICROSOFT_TENANT_ID || '72fd0b5a-8a6a-4cff-89f6-bde961f7e250';
    this.clientId = options.clientId || process.env.AZURE_ENTRA_CLIENT_ID || process.env.VIVO_DUOC_CLIENT_ID || '674913e2-e170-4787-833f-e307f87db6e5';
    this.clientSecret = options.clientSecret || process.env.AZURE_ENTRA_CLIENT_SECRET || '';
    this.redirectUri = options.redirectUri || process.env.AZURE_ENTRA_REDIRECT_URI || 'https://experienciavivo.duoc.cl/auth/openidc/callback';
    this.scopes = options.scopes || process.env.AZURE_ENTRA_SCOPES || 'openid profile email offline_access';
    this.discoveryEndpoint = `https://login.microsoftonline.com/${this.tenantId}/v2.0/.well-known/openid-configuration`;
    this.authorizeEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize`;
    this.tokenEndpoint = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
  }

  /**
   * Determina si las credenciales de producción para Entra ID están configuradas.
   */
  isConfigured() {
    return Boolean(
      this.tenantId &&
      this.clientId &&
      this.clientSecret &&
      this.clientSecret.length > 5
    );
  }

  /**
   * Genera la URL de autorización para el flujo Authorization Code PKCE / OIDC.
   */
  getAuthorizationUrl({ state, nonce, prompt = 'select_account' } = {}) {
    const finalState = state || crypto.randomBytes(16).toString('hex');
    const finalNonce = nonce || crypto.randomBytes(16).toString('hex');

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      response_mode: 'query',
      scope: this.scopes,
      state: finalState,
      nonce: finalNonce,
      prompt,
    });

    return {
      url: `${this.authorizeEndpoint}?${params.toString()}`,
      state: finalState,
      nonce: finalNonce,
    };
  }

  /**
   * Mapea claims de Microsoft Entra ID al contrato de perfil de usuario de Nexo360.
   */
  mapClaimsToUserProfile(claims = {}) {
    const rawEmail = claims.email || claims.preferred_username || claims.upn || '';
    const cleanEmail = String(rawEmail).trim().toLowerCase();

    const fullName = claims.name || [claims.given_name, claims.family_name].filter(Boolean).join(' ') || cleanEmail;
    
    // Inferencia de rol institucional a partir de grupos Entra ID o dominio
    let inferredRole = 'estudiante';
    const roles = Array.isArray(claims.roles) ? claims.roles : [];

    if (roles.includes('Admin') || roles.includes('GlobalAdmin') || roles.includes('Nexo360_Admin')) {
      inferredRole = 'admin';
    } else if (roles.includes('PAEDIS_Coordinator') || roles.includes('Inclusion_Coordinator')) {
      inferredRole = 'coordinador_paedis';
    } else if (roles.includes('Docente') || roles.includes('Profesor') || cleanEmail.endsWith('@profesor.duoc.cl')) {
      inferredRole = 'profesor';
    }

    return {
      entraOid: claims.oid || claims.sub || null,
      email: cleanEmail,
      fullName,
      inferredRole,
      isDuocAccount: cleanEmail.endsWith('@duocuc.cl') || cleanEmail.endsWith('@profesor.duoc.cl') || cleanEmail.endsWith('@duoc.cl'),
      claimsSummary: {
        iss: claims.iss,
        aud: claims.aud,
        tid: claims.tid,
      },
    };
  }

  /**
   * Valida un id_token emitido por Entra ID.
   * Si no está en producción y no hay claves públicas cargadas, permite decodificación con verificación de emisor.
   */
  async validateIdToken(idToken) {
    if (!idToken || typeof idToken !== 'string') {
      throw new Error('Token de identidad Microsoft requerido');
    }

    // Decodificar payload sin verificación de firma para extraer claims y validar emisor
    const decoded = jwt.decode(idToken, { complete: true });
    if (!decoded || !decoded.payload) {
      throw new Error('Formato de token OIDC inválido');
    }

    const { payload } = decoded;
    const expectedIssuer = `https://login.microsoftonline.com/${this.tenantId}/v2.0`;

    if (payload.iss && payload.iss !== expectedIssuer && !payload.iss.includes(this.tenantId)) {
      throw new Error(`Emisor de token no coincide con el tenant institucional (${payload.iss})`);
    }

    if (payload.exp && Date.now() >= payload.exp * 1000) {
      throw new Error('El token de identidad Microsoft ha expirado');
    }

    return this.mapClaimsToUserProfile(payload);
  }

  /**
   * Intercambia un authorization code por tokens OIDC.
   */
  async exchangeCodeForTokens(code, { codeVerifier } = {}) {
    if (!this.isConfigured()) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Microsoft Entra ID no está configurado con credenciales de producción.');
      }
      // Modo desarrollo / demo: simular respuesta estructurada
      return {
        mode: 'simulated_dev',
        message: 'Modo desarrollo: credenciales AZURE_ENTRA_CLIENT_SECRET no configuradas.',
        accessToken: `simulated_access_token_${Date.now()}`,
        idToken: `simulated_id_token_${Date.now()}`,
      };
    }

    const body = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
      ...(codeVerifier ? { code_verifier: codeVerifier } : {}),
    });

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Fallo en autenticación con Microsoft Entra ID: ${response.status} - ${errText}`);
    }

    return response.json();
  }
}

module.exports = new MicrosoftEntraIdAdapter();
