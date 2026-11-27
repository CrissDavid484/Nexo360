/**
 * ADAPTADOR DE INTEGRACIÓN SPRINGSHARE LIBCAL (BIBLIOTECA DUOC UC & ESPACIOS VR)
 * Gestiona reserva de cubículos de estudio, salas multimedia y visores VR.
 */

function stripTrailingSlashes(url = '') {
  let clean = String(url || '').trim();
  while (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

class LibCalAdapter {
  constructor(options = {}) {
    this._baseUrl = options.baseUrl;
    this._clientId = options.clientId;
    this._clientSecret = options.clientSecret;
    this.timeoutMs = options.timeoutMs || 8000;
    this.fetchImpl = options.fetchImpl || null;
    this._tokenCache = null;
  }

  get baseUrl() {
    return stripTrailingSlashes(
      this._baseUrl ?? process.env.LIBCAL_BASE_URL ?? 'https://duoc.libcal.com/1.1'
    );
  }

  get clientId() {
    return String(this._clientId ?? process.env.LIBCAL_CLIENT_ID ?? '').trim();
  }

  get clientSecret() {
    return String(this._clientSecret ?? process.env.LIBCAL_CLIENT_SECRET ?? '').trim();
  }

  isConfigured() {
    return Boolean(this.baseUrl && this.clientId && this.clientSecret && this.clientSecret.length > 5);
  }

  clearTokenCache() {
    this._tokenCache = null;
  }

  /**
   * Intercambia client_credentials contra ${baseUrl}/oauth/token con caché por expiración.
   */
  async getOAuthToken() {
    if (!this.isConfigured()) {
      throw new Error('LIBCAL_NOT_CONFIGURED');
    }

    const now = Date.now();
    if (this._tokenCache && this._tokenCache.accessToken && now < this._tokenCache.expiresAtMs - 30000) {
      return this._tokenCache.accessToken;
    }

    const fetchFn = this.fetchImpl || fetch;
    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret,
    }).toString();

    const response = await fetchFn(`${this.baseUrl}/oauth/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`LibCal OAuth HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!payload?.access_token) {
      throw new Error('LibCal OAuth response missing access_token');
    }

    const expiresInSec = Number(payload.expires_in) > 0 ? Number(payload.expires_in) : 3600;
    this._tokenCache = {
      accessToken: payload.access_token,
      expiresAtMs: now + expiresInSec * 1000,
    };

    return payload.access_token;
  }

  /**
   * Consulta disponibilidad de espacios o visores de realidad virtual en una sede.
   */
  async getAvailability({ locationId = 'alameda', categoryId = 'vr_headsets', date } = {}) {
    const queryDate = date || new Date().toISOString().split('T')[0];

    if (!this.isConfigured()) {
      return {
        configured: false,
        isOfficialAvailability: false,
        source: 'practice_simulation',
        isSimulated: true,
        mode: 'PRACTICE_SIMULATION',
        locationId,
        categoryId,
        date: queryDate,
        spaces: [
          { id: 'vr-01', name: 'Meta Quest 3 - Estación 1', available: true, capacity: 1 },
          { id: 'vr-02', name: 'Meta Quest 3 - Estación 2', available: true, capacity: 1 },
          { id: 'cub-01', name: 'CUB-01 Cubículo Inclusivo PAEDIS', available: true, capacity: 4 },
        ],
        notice: 'Simulación formativa local: disponibilidad referencial de práctica sin conexión oficial a LibCal.',
      };
    }

    const fetchFn = this.fetchImpl || fetch;
    const token = await this.getOAuthToken();
    const response = await fetchFn(
      `${this.baseUrl}/space/availability/${encodeURIComponent(locationId)}?date=${encodeURIComponent(queryDate)}&category=${encodeURIComponent(categoryId)}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      }
    );

    if (!response.ok) {
      throw new Error(`LibCal API HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      configured: true,
      isOfficialAvailability: true,
      ...data,
    };
  }

  /**
   * Reserva un espacio o visor.
   */
  async reserveSpace({ spaceId, studentEmail, startTime, endTime }) {
    if (!this.isConfigured()) {
      return {
        success: true,
        configured: false,
        isOfficialBooking: false,
        bookingId: null,
        mode: 'PRACTICE_SIMULATION',
        spaceId,
        studentEmail,
        startTime,
        endTime,
        message: 'Simulación formativa local: no genera reserva oficial en LibCal.',
      };
    }

    const fetchFn = this.fetchImpl || fetch;
    const token = await this.getOAuthToken();
    const response = await fetchFn(`${this.baseUrl}/space/reserve`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spaceId, email: studentEmail, start: startTime, end: endTime }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Error reservando espacio en LibCal: HTTP ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      configured: true,
      isOfficialBooking: true,
      mode: 'OFFICIAL',
      ...data,
    };
  }
}

module.exports = new LibCalAdapter();
module.exports.LibCalAdapter = LibCalAdapter;
