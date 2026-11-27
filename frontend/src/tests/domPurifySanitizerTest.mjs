import assert from 'node:assert/strict';
import { escapeHtml, sanitizeArticleHtml } from '../utils/sanitizeHtml.js';

console.log('--- RUNNING SANITIZATION & XSS PROTECTION TEST SUITE (WCAG 2.2 / OWASP) ---');

// 1. Fallback fail-closed ante errores o entornos no-DOM
const maliciousScript = '<p>Texto legítimo</p><script>alert("XSS")</script>';
const escaped = escapeHtml(maliciousScript);
assert.ok(!escaped.includes('<script>'), 'escapeHtml debe neutralizar etiquetas script ejecutables');
assert.ok(escaped.includes('&lt;script&gt;'), 'escapeHtml debe codificar entidades HTML');
console.log('✓ Test 1 Passed: Fallback seguro escapeHtml fail-closed');

// 2. Neutralización de manejadores de eventos (onerror, onclick)
const maliciousAttrs = '<img src=x onerror=alert(1)>';
const escapedAttrs = escapeHtml(maliciousAttrs);
assert.ok(!escapedAttrs.includes('<img'), 'escapeHtml debe neutralizar etiquetas img con onerror');
assert.ok(escapedAttrs.includes('&lt;img'), 'escapeHtml debe escapar <img');
console.log('✓ Test 2 Passed: Neutralización de atributos y manejadores de evento');

// 3. Bloqueo de javascript: URIs
const maliciousUri = '<a href="javascript:alert(1)">Click</a>';
const escapedUri = escapeHtml(maliciousUri);
assert.ok(!escapedUri.includes('<a href='), 'escapeHtml debe neutralizar hipervínculos ejecutables');
console.log('✓ Test 3 Passed: Bloqueo de enlaces ejecutables');

// 4. Sanitización fail-closed de sanitizeArticleHtml en entorno node (sin DOMParser global)
const sanitizedInNode = sanitizeArticleHtml(maliciousScript);
assert.ok(!sanitizedInNode.includes('<script>'), 'sanitizeArticleHtml debe devolver HTML neutralizado en node');
console.log('✓ Test 4 Passed: sanitizeArticleHtml fail-closed en entorno sin DOM');

console.log('--- ALL SANITIZATION TESTS PASSED! ---');
