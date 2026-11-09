/**
 * Middleware de Limitación de Tasa (Rate Limiting) en Memoria (OWASP A04:2021 / CWE-770)
 * Protege los endpoints de autenticación y scraping contra ataques de fuerza bruta y DoS.
 */
const createRateLimiter = ({
  windowMs = 15 * 60 * 1000,
  max = 20,
  message = 'Demasiadas solicitudes desde esta dirección IP. Por favor intente nuevamente más tarde.',
} = {}) => {
  const hits = new Map();

  // Limpieza periódica de entradas expiradas para evitar fugas de memoria
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of hits.entries()) {
      if (now >= record.resetTime) {
        hits.delete(key);
      }
    }
  }, Math.min(windowMs, 60000));

  if (typeof cleanupInterval.unref === 'function') {
    cleanupInterval.unref();
  }

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let record = hits.get(ip);

    if (!record || now >= record.resetTime) {
      record = { count: 0, resetTime: now + windowMs };
      hits.set(ip, record);
    }

    record.count += 1;

    const remaining = Math.max(0, max - record.count);
    const retryAfterSeconds = Math.ceil((record.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', String(max));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

    if (record.count > max) {
      res.setHeader('Retry-After', String(retryAfterSeconds));
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
};

module.exports = { createRateLimiter };
