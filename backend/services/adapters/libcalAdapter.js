/**
 * ADAPTADOR DE INTEGRACIÓN SPRINGSHARE LIBCAL (BIBLIOTECA DUOC UC & ESPACIOS VR)
 * Gestiona reserva de cubículos de estudio, salas multimedia y visores VR.
 */

class LibCalAdapter {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || process.env.LIBCAL_BASE_URL || 'https://duoc.libcal.com/1.1';
    this.clientId = options.clientId || process.env.LIBCAL_CLIENT_ID || '';
    this.clientSecret = options.clientSecret || process.env.LIBCAL_CLIENT_SECRET || '';
    this.timeoutMs = options.timeoutMs || 8000;
  }

  isConfigured() {
    return Boolean(this.baseUrl && this.clientId && this.clientSecret && this.clientSecret.length > 5);
  }

  /**
   * Consulta disponibilidad de espacios o visores de realidad virtual en una sede.
   */
  async getAvailability({ locationId = 'alameda', categoryId = 'vr_headsets', date } = {}) {
    const queryDate = date || new Date().toISOString().split('T')[0];

    if (!this.isConfigured()) {
      return {
        source: 'sandbox_local',
        isSimulated: true,
        locationId,
        categoryId,
        date: queryDate,
        spaces: [
          { id: 'vr-01', name: 'Meta Quest 3 - Estación 1', available: true, capacity: 1 },
          { id: 'vr-02', name: 'Meta Quest 3 - Estación 2', available: true, capacity: 1 },
          { id: 'cub-01', name: 'CUB-01 Cubículo Inclusivo PAEDIS', available: true, capacity: 4 },
        ],
        notice: 'LibCal en modo simulación local. Para reservas reales configure LIBCAL_CLIENT_ID y LIBCAL_CLIENT_SECRET.',
      };
    }

    const response = await fetch(`${this.baseUrl}/space/availability/${locationId}?date=${queryDate}&category=${categoryId}`, {
      headers: {
        'Authorization': `Bearer ${await this.getOAuthToken()}`,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`LibCal API HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * Reserva un espacio o visor.
   */
  async reserveSpace({ spaceId, studentEmail, startTime, endTime }) {
    if (!this.isConfigured()) {
      return {
        success: true,
        mode: 'simulated',
        bookingId: `sim_booking_${Date.now()}`,
        spaceId,
        studentEmail,
        startTime,
        endTime,
        confirmationCode: 'DUOC-VR-2026',
        message: 'Reserva simulada exitosamente en entorno de prueba.',
      };
    }

    const response = await fetch(`${this.baseUrl}/space/reserve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getOAuthToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ spaceId, email: studentEmail, start: startTime, end: endTime }),
      signal: AbortSignal.timeout(this.timeoutMs),
    });

    if (!response.ok) {
      throw new Error(`Error reservando espacio en LibCal: HTTP ${response.status}`);
    }

    return response.json();
  }

  async getOAuthToken() {
    return 'libcal_token_placeholder';
  }
}

module.exports = new LibCalAdapter();
