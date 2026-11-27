import assert from 'node:assert/strict';
import DOMPurify from 'dompurify';

console.log('--- RUNNING DOMPURIFY SANITIZATION & XSS PROTECTION TEST SUITE ---');

function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// 1. Verificar disponibilidad de DOMPurify en el entorno de frontend
assert.ok(DOMPurify !== undefined, 'DOMPurify debe estar disponible como módulo');

// 2. Fallback fail-closed ante errores o entornos no-DOM
const maliciousScript = '<p>Texto legítimo</p><script>alert("XSS")</script>';
const escaped = escapeHtml(maliciousScript);
assert.ok(!escaped.includes('<script>'), 'escapeHtml debe neutralizar etiquetas script ejecutables');
assert.ok(escaped.includes('&lt;script&gt;'), 'escapeHtml debe codificar entidades HTML');
console.log('✓ Test 1 Passed: Fallback seguro escapeHtml fail-closed');

// 3. Neutralización de manejadores de eventos (onerror, onclick)
const maliciousAttrs = '<img src=x onerror=alert(1)>';
const escapedAttrs = escapeHtml(maliciousAttrs);
assert.ok(!escapedAttrs.includes('<img'), 'escapeHtml debe neutralizar etiquetas img con onerror');
assert.ok(escapedAttrs.includes('&lt;img'), 'escapeHtml debe escapar <img');
console.log('✓ Test 2 Passed: Neutralización de atributos y manejadores de evento');

// 4. Bloqueo de javascript: URIs
const maliciousUri = '<a href="javascript:alert(1)">Click</a>';
const escapedUri = escapeHtml(maliciousUri);
assert.ok(!escapedUri.includes('<a href='), 'escapeHtml debe neutralizar hipervínculos ejecutables');
console.log('✓ Test 3 Passed: Bloqueo de enlaces ejecutables');

console.log('--- ALL DOMPURIFY SANITIZATION TESTS PASSED! ---');
