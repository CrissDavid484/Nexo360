/**
 * ADAPTADOR OFICIAL OPENID CONNECT / MICROSOFT ENTRA ID PARA DUOC UC
 * Gestiona PKCE (S256), estado temporal de un solo uso y validación criptográfica RS256 (JWKS).
 */

const crypto = require('node:crypto');
const jwt = require('jsonwebtoken');

const AUTH_STATE_TTL_MS = 10 * 60 * 1000;
const JWKS_CACHE_TTL_MS = 60 * 60 * 1000;
const DEFAULT_ALLOWED_DOMAINS = 'duocuc.cl,profesor.duoc.cl,duoc.cl';

function createOidcError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

function timingSafeEqualStr(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const bufA = Buffer.from(a, 'utf8');
  const bufB = Buffer.from(b, 'utf8');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

class MicrosoftEntraIdAdapter {
  constructor(options = {}) {
    this._overrides = {
      tenantId: options.tenantId,
      clientId: options.clientId,
      clientSecret: options.clientSecret,
      redirectUri: options.redirectUri,
      scopes: options.scopes,
      allowedDomains: options.allowedDomains,
    };
    this._authStateStore = new Map();
    this._jwksCache = null;
  }

  get tenantId() {
    return String(this._overrides.tenantId ?? process.env.AZURE_ENTRA_TENANT_ID ?? '').trim();
  }

  get clientId() {
    return String(this._overrides.clientId ?? process.env.AZURE_ENTRA_CLIENT_ID ?? '').trim();
  }

  get clientSecret() {
    return String(this._overrides.clientSecret ?? process.env.AZURE_ENTRA_CLIENT_SECRET ?? '').trim();
  }

  get redirectUri() {
    return String(this._overrides.redirectUri ?? process.env.AZURE_ENTRA_REDIRECT_URI ?? '').trim();
  }

  get scopes() {
    return String(
      this._overrides.scopes ?? process.env.AZURE_ENTRA_SCOPES ?? 'openid profile email offline_access'
    ).trim();
  }

  get allowedDomains() {
    const raw =
      this._overrides.allowedDomains ??
      process.env.AZURE_ENTRA_ALLOWED_DOMAINS ??
      DEFAULT_ALLOWED_DOMAINS;
    if (Array.isArray(raw)) {
      return raw.map((d) => String(d).trim().toLowerCase()).filter(Boolean);
    }
    return String(raw)
      .split(',')
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean);
  }

  get discoveryEndpoint() {
    return this.tenantId
      ? `https://login.microsoftonline.com/${this.tenantId}/v2.0/.well-known/openid-configuration`
      : '';
  }

  get authorizeEndpoint() {
    return this.tenantId
      ? `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize`
      : '';
  }

  get tokenEndpoint() {
    return this.tenantId
      ? `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`
      : '';
  }

  get jwksUri() {
    return this.tenantId
      ? `https://login.microsoftonline.com/${this.tenantId}/discovery/v2.0/keys`
      : '';
  }

  /**
   * Retorna true SOLO si tenantId, clientId y redirectUri están configurados.
   */
  isConfigured() {
    return Boolean(this.tenantId && this.clientId && this.redirectUri);
  }

  _pruneExpiredAuthStates(now = Date.now()) {
    for (const [key, entry] of this._authStateStore.entries()) {
      if (!entry || now > entry.expiresAt) {
        this._authStateStore.delete(key);
      }
    }
  }

  /**
   * Crea una solicitud de autorización PKCE (S256) y almacena {state, nonce, codeVerifier, expiresAt} por 10 minutos.
   */
  createAuthorizationRequest({ prompt = 'select_account', loginHint = '' } = {}) {
    if (!this.isConfigured()) {
      throw createOidcError(
        503,
        'OIDC_NOT_CONFIGURED',
        'Microsoft Entra ID OIDC no está configurado en el servidor.'
      );
    }

    this._pruneExpiredAuthStates();

    const state = crypto.randomBytes(32).toString('base64url');
    const nonce = crypto.randomBytes(32).toString('base64url');
    const codeVerifier = crypto.randomBytes(32).toString('base64url');
    const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
    const expiresAt = Date.now() + AUTH_STATE_TTL_MS;

    this._authStateStore.set(state, {
      state,
      nonce,
      codeVerifier,
      expiresAt,
    });

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: this.redirectUri,
      response_mode: 'query',
      scope: this.scopes,
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      prompt,
    });

    if (loginHint && typeof loginHint === 'string' && loginHint.trim()) {
      params.set('login_hint', loginHint.trim());
    }

    return {
      url: `${this.authorizeEndpoint}?${params.toString()}`,
      state,
      nonce,
      codeChallenge,
      codeChallengeMethod: 'S256',
      expiresAt,
    };
  }

  /**
   * Consume de forma atómica (un solo uso) el estado OIDC almacenado y verifica expiración.
   */
  consumeAuthorizationState(state) {
    if (!state || typeof state !== 'string') {
      throw createOidcError(400, 'OIDC_STATE_INVALID', 'Parámetro state OIDC requerido.');
    }

    const entry = this._authStateStore.get(state);
    this._authStateStore.delete(state);

    if (!entry) {
      throw createOidcError(
        401,
        'OIDC_STATE_INVALID',
        'El estado de autorización OIDC es inválido o ya fue utilizado.'
      );
    }

    if (Date.now() > entry.expiresAt) {
      throw createOidcError(
        401,
        'OIDC_STATE_EXPIRED',
        'La solicitud de autorización OIDC ha expirado.'
      );
    }

    return {
      state: entry.state,
      nonce: entry.nonce,
      codeVerifier: entry.codeVerifier,
      expiresAt: entry.expiresAt,
    };
  }

  getAuthorizationUrl(options = {}) {
    const reqData = this.createAuthorizationRequest(options);
    return {
      url: reqData.url,
      state: reqData.state,
      nonce: reqData.nonce,
      expiresAt: reqData.expiresAt,
    };
  }

  /**
   * Mapea claims verificados de Microsoft Entra ID al contrato de perfil de usuario de Nexo360.
   */
  mapClaimsToUserProfile(claims = {}) {
    const rawEmail = claims.email || claims.preferred_username || claims.upn || '';
    const cleanEmail = String(rawEmail).trim().toLowerCase();
    const fullName =
      claims.name ||
      [claims.given_name, claims.family_name].filter(Boolean).join(' ') ||
      cleanEmail;

    let inferredRole = 'estudiante';
    const roles = Array.isArray(claims.roles) ? claims.roles : [];

    if (roles.includes('Admin') || roles.includes('GlobalAdmin') || roles.includes('Nexo360_Admin')) {
      inferredRole = 'admin';
    } else if (roles.includes('PAEDIS_Coordinator') || roles.includes('Inclusion_Coordinator')) {
      inferredRole = 'coordinador_paedis';
    } else if (roles.includes('Docente') || roles.includes('Profesor') || cleanEmail.endsWith('@profesor.duoc.cl')) {
      inferredRole = 'profesor';
    }

    const domain = cleanEmail.split('@')[1] || '';

    return {
      entraOid: claims.oid || claims.sub || null,
      email: cleanEmail,
      fullName,
      inferredRole,
      isDuocAccount: this.allowedDomains.includes(domain),
      claimsSummary: {
        iss: claims.iss,
        aud: claims.aud,
        tid: claims.tid,
      },
    };
  }

  /**
   * Obtiene y cachea por 1 hora las claves públicas JWKS de Microsoft Entra ID.
   */
  async fetchJwks(forceRefresh = false) {
    if (!this.isConfigured()) {
      throw createOidcError(
        503,
        'OIDC_NOT_CONFIGURED',
        'Microsoft Entra ID OIDC no está configurado.'
      );
    }

    const now = Date.now();
    if (
      !forceRefresh &&
      this._jwksCache &&
      this._jwksCache.tenantId === this.tenantId &&
      now - this._jwksCache.fetchedAt < JWKS_CACHE_TTL_MS
    ) {
      return this._jwksCache.keys;
    }

    const response = await fetch(this.jwksUri, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined,
    });

    if (!response.ok) {
      throw createOidcError(
        503,
        'OIDC_JWKS_UNAVAILABLE',
        `No se pudo obtener JWKS de Microsoft Entra ID (${response.status}).`
      );
    }

    const data = await response.json();
    if (!data || !Array.isArray(data.keys) || data.keys.length === 0) {
      throw createOidcError(
        503,
        'OIDC_JWKS_INVALID',
        'Respuesta JWKS de Microsoft Entra ID sin claves públicas válidas.'
      );
    }

    this._jwksCache = {
      tenantId: this.tenantId,
      keys: data.keys,
      fetchedAt: now,
    };

    return data.keys;
  }

  _selectMatchingJwk(keys, kid) {
    const rsaKeys = keys.filter((k) => k && k.kty === 'RSA' && (!k.use || k.use === 'sig'));
    if (kid) {
      return rsaKeys.find((k) => k.kid === kid) || null;
    }
    return rsaKeys.length === 1 ? rsaKeys[0] : rsaKeys[0] || null;
  }

  /**
   * Valida criptográficamente (RS256) un id_token emitido por Microsoft Entra ID.
   */
  async validateIdToken(idToken, { expectedNonce, jwksOverride } = {}) {
    if (!this.isConfigured()) {
      throw createOidcError(
        503,
        'OIDC_NOT_CONFIGURED',
        'Microsoft Entra ID OIDC no está configurado.'
      );
    }

    if (!idToken || typeof idToken !== 'string') {
      throw createOidcError(401, 'OIDC_TOKEN_INVALID', 'Token de identidad Microsoft requerido.');
    }

    const parts = idToken.split('.');
    if (parts.length !== 3 || !parts[0] || !parts[1] || !parts[2]) {
      throw createOidcError(401, 'OIDC_TOKEN_INVALID', 'Formato de token OIDC inválido.');
    }

    let header;
    try {
      header = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch {
      throw createOidcError(401, 'OIDC_TOKEN_INVALID', 'Cabecera de token OIDC malformada.');
    }

    if (!header || typeof header !== 'object' || header.alg !== 'RS256') {
      throw createOidcError(401, 'OIDC_ALG_INVALID', 'Algoritmo de token OIDC no permitido (se requiere RS256).');
    }

    let keys = jwksOverride
      ? (Array.isArray(jwksOverride) ? jwksOverride : jwksOverride.keys || [])
      : await this.fetchJwks(false);

    let matchedJwk = this._selectMatchingJwk(keys, header.kid);
    if (!matchedJwk && !jwksOverride) {
      keys = await this.fetchJwks(true);
      matchedJwk = this._selectMatchingJwk(keys, header.kid);
    }

    if (!matchedJwk) {
      throw createOidcError(
        401,
        'OIDC_KEY_NOT_FOUND',
        'No se encontró clave pública JWKS coincidente para verificar el id_token.'
      );
    }

    let publicKey;
    try {
      publicKey = crypto.createPublicKey({ key: matchedJwk, format: 'jwk' });
    } catch {
      throw createOidcError(401, 'OIDC_KEY_INVALID', 'Clave pública JWK inválida.');
    }

    const expectedIssuer = `https://login.microsoftonline.com/${this.tenantId}/v2.0`;
    let payload;
    try {
      payload = jwt.verify(idToken, publicKey, {
        algorithms: ['RS256'],
        issuer: expectedIssuer,
        audience: this.clientId,
        clockTolerance: 60,
      });
    } catch (verifyErr) {
      throw createOidcError(
        401,
        'OIDC_SIGNATURE_INVALID',
        `Fallo en verificación criptográfica del id_token: ${verifyErr.message}`
      );
    }

    if (!payload || typeof payload !== 'object' || typeof payload.exp !== 'number') {
      throw createOidcError(401, 'OIDC_CLAIMS_INVALID', 'El id_token debe incluir claim exp numérico.');
    }

    if (payload.nbf !== undefined && typeof payload.nbf !== 'number') {
      throw createOidcError(401, 'OIDC_CLAIMS_INVALID', 'Claim nbf inválido en id_token.');
    }

    if (!payload.tid || payload.tid !== this.tenantId) {
      throw createOidcError(
        401,
        'OIDC_TENANT_MISMATCH',
        'El tenant (tid) del token OIDC no coincide con el configurado.'
      );
    }

    if (expectedNonce !== undefined) {
      if (
        typeof expectedNonce !== 'string' ||
        !expectedNonce ||
        typeof payload.nonce !== 'string' ||
        !timingSafeEqualStr(payload.nonce, expectedNonce)
      ) {
        throw createOidcError(401, 'OIDC_NONCE_MISMATCH', 'Nonce OIDC inválido o faltante.');
      }
    }

    const profile = this.mapClaimsToUserProfile(payload);
    const emailDomain = profile.email.split('@')[1] || '';
    if (!profile.email || !profile.email.includes('@') || !this.allowedDomains.includes(emailDomain)) {
      throw createOidcError(
        403,
        'OIDC_DOMAIN_FORBIDDEN',
        'El correo verificado en Entra ID no pertenece a un dominio institucional autorizado.'
      );
    }

    return profile;
  }

  /**
   * Intercambia un authorization code por tokens OIDC reales en Microsoft Entra ID.
   */
  async exchangeCodeForTokens(code, { codeVerifier } = {}) {
    if (!this.isConfigured()) {
      throw createOidcError(
        503,
        'OIDC_NOT_CONFIGURED',
        'Microsoft Entra ID OIDC no está configurado.'
      );
    }

    if (!code || typeof code !== 'string') {
      throw createOidcError(400, 'OIDC_CODE_REQUIRED', 'Código de autorización OIDC requerido.');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: this.redirectUri,
    });

    if (this.clientSecret) {
      params.set('client_secret', this.clientSecret);
    }
    if (codeVerifier) {
      params.set('code_verifier', codeVerifier);
    }

    const response = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw createOidcError(
        401,
        'OIDC_TOKEN_EXCHANGE_FAILED',
        `Fallo al intercambiar código en Microsoft Entra ID: ${response.status} - ${errText}`
      );
    }

    return response.json();
  }
}

const instance = new MicrosoftEntraIdAdapter();
instance.MicrosoftEntraIdAdapter = MicrosoftEntraIdAdapter;

module.exports = instance;
