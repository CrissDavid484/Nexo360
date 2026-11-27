import assert from 'node:assert/strict';

console.log('--- RUNNING ACCOUNT ACTIVATION CONTRACT TEST SUITE ---');

// 1. Password policy verification
function validateActivationPassword(pwd) {
  if (!pwd || typeof pwd !== 'string') return false;
  const hasMinLength = pwd.length >= 8;
  const hasUpper = /[A-Z]/.test(pwd);
  const hasLower = /[a-z]/.test(pwd);
  const hasNumber = /[0-9]/.test(pwd);
  return hasMinLength && hasUpper && hasLower && hasNumber;
}

assert.equal(validateActivationPassword('short'), false, 'Rechaza contraseñas menores a 8 caracteres');
assert.equal(validateActivationPassword('alllowercase1'), false, 'Rechaza contraseñas sin mayúsculas');
assert.equal(validateActivationPassword('ALLUPPERCASE1'), false, 'Rechaza contraseñas sin minúsculas');
assert.equal(validateActivationPassword('NoNumbersHere'), false, 'Rechaza contraseñas sin números');
assert.equal(validateActivationPassword('Duoc2026!Seguro'), true, 'Acepta contraseñas robustas institucionales');
console.log('✓ Test 1 Passed: Validación estricta de política de contraseñas');

// 2. Consent structure Ley 21.719 validation
function buildActivationPayload(token, password, consentAccepted) {
  if (!token || !validateActivationPassword(password) || !consentAccepted) {
    throw new Error('Formulario inválido o consentimiento no otorgado');
  }
  return {
    token,
    password,
    consentimiento: {
      aceptado: true,
      fechaAceptacion: new Date().toISOString(),
      finalidadTratamiento: 'Gestión académica, alertas tempranas SAT y acompañamiento PAEDIS según Ley N° 21.719',
    },
  };
}

assert.throws(() => buildActivationPayload('', 'Duoc2026!Seguro', true), /Formulario inválido/);
assert.throws(() => buildActivationPayload('valid-token-123', 'Duoc2026!Seguro', false), /consentimiento no otorgado/);

const validPayload = buildActivationPayload('valid-token-123', 'Duoc2026!Seguro', true);
assert.equal(validPayload.token, 'valid-token-123');
assert.equal(validPayload.consentimiento.aceptado, true);
assert.ok(validPayload.consentimiento.finalidadTratamiento.includes('Ley N° 21.719'));
console.log('✓ Test 2 Passed: Estructura de carga útil y consentimiento explícito Ley N° 21.719');

// 3. Fallback en caso de token ausente en URL
function parseActivationTokenFromUrl(searchString) {
  const params = new URLSearchParams(searchString);
  const token = (params.get('token') || '').trim();
  return token || null;
}

assert.equal(parseActivationTokenFromUrl(''), null);
assert.equal(parseActivationTokenFromUrl('?other=123'), null);
assert.equal(parseActivationTokenFromUrl('?token=abc-123-xyz'), 'abc-123-xyz');
console.log('✓ Test 3 Passed: Extracción segura de token desde searchParams');

console.log('--- ALL ACCOUNT ACTIVATION TESTS PASSED! ---');
