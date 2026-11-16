const http = require('node:http');

let defaultBaseUrl = '';

function setBaseUrl(url) {
  defaultBaseUrl = url;
}

function getBaseUrl() {
  return defaultBaseUrl;
}

/**
 * Helper ligero para peticiones HTTP de prueba sin dependencias externas
 */
function request(path, { method = 'GET', headers = {}, body = null, baseUrl = null } = {}) {
  return new Promise((resolve, reject) => {
    const activeBase = baseUrl || defaultBaseUrl;
    if (!activeBase) {
      return reject(new Error('testHelper: baseUrl no ha sido configurada. Llame a setBaseUrl(url) o pase baseUrl en options.'));
    }

    const url = new URL(path, activeBase);
    const payload = body !== null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;

    const reqHeaders = { ...headers };
    if (payload && !reqHeaders['Content-Type']) {
      reqHeaders['Content-Type'] = 'application/json';
    }
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      url,
      {
        method,
        headers: reqHeaders,
      },
      (res) => {
        let raw = '';
        res.setEncoding('utf8');
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: parsed,
            raw,
          });
        });
      }
    );

    req.on('error', reject);
    if (payload) {
      req.write(payload);
    }
    req.end();
  });
}

request.setBaseUrl = setBaseUrl;
Object.defineProperty(request, 'baseUrl', {
  get: () => defaultBaseUrl,
  set: (val) => {
    defaultBaseUrl = val;
  },
});

module.exports = {
  request,
  setBaseUrl,
  getBaseUrl,
};
