/**
 * Utilidades compartidas para adaptadores de integración (Sicol, Vivo Duoc, etc.)
 * Centraliza retry HTTP, normalización de URLs y validación de seguridad (OWASP ASVS / Sonar S5144).
 */

const RETRYABLE_HTTP_STATUSES = new Set([502, 503, 504]);

/**
 * Elimina barras inclinadas finales de una URL base.
 * @param {string} url
 * @returns {string}
 */
function stripTrailingSlashes(url = '') {
  let clean = String(url || '').trim();
  while (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }
  return clean;
}

/**
 * Valida y sanitiza una URL para prevenir CSRF/SSRF (Sonar S5144).
 * @param {string} urlString
 * @param {string[]} allowedHostnames
 * @returns {URL}
 */
function validateSafeHttpUrl(urlString, allowedHostnames = []) {
  const parsed = new URL(urlString);
  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error(`[AdapterUtils] Protocolo no seguro: ${parsed.protocol}`);
  }

  // HTTPS obligatorio en producción para integraciones institucionales externas
  if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
    throw new Error(`[AdapterUtils] HTTPS obligatorio en producción para destinos externos: ${parsed.protocol}`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Prevención de SSRF contra redes privadas o metadatos de nube en producción
  if (process.env.NODE_ENV === 'production') {
    const isPrivateOrLoopback =
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1' ||
      hostname === '169.254.169.254' ||
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);

    if (isPrivateOrLoopback) {
      throw new Error(`[AdapterUtils] Destino privado o loopback no permitido en producción: ${parsed.hostname}`);
    }
  }

  if (allowedHostnames && allowedHostnames.length > 0) {
    const isAllowed = allowedHostnames.some(
      (h) => hostname === h.toLowerCase() || hostname.endsWith(`.${h.toLowerCase()}`)
    );
    if (!isAllowed) {
      throw new Error(`[AdapterUtils] Host no autorizado: ${parsed.hostname}`);
    }
  }

  return parsed;
}

/**
 * Ejecuta peticiones fetch con reintento ante errores de pasarela (502, 503, 504).
 * @param {Function} fetchFn
 * @param {string|URL} url
 * @param {object} options
 * @param {number} timeoutMs
 * @param {string[]} [allowedHostnames]
 * @returns {Promise<Response>}
 */
async function fetchWithRetry(fetchFn, url, options = {}, timeoutMs = 8000, allowedHostnames = []) {
  const validatedUrl = validateSafeHttpUrl(typeof url === 'string' ? url : url.href, allowedHostnames);
  const targetHref = validatedUrl.href;
  const fn = fetchFn || fetch;
  let lastResponse = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fn(targetHref, {
      ...options,
      signal: AbortSignal.timeout(timeoutMs),
    });
    lastResponse = response;
    if (response.ok || !RETRYABLE_HTTP_STATUSES.has(response.status) || attempt === 1) {
      return response;
    }
  }
  return lastResponse;
}

module.exports = {
  RETRYABLE_HTTP_STATUSES,
  stripTrailingSlashes,
  validateSafeHttpUrl,
  fetchWithRetry,
};
