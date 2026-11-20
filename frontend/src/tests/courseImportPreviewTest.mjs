import assert from 'node:assert/strict';
import {
  normalizeImportPreview,
  requiresSectionAck,
  canConfirmImport,
} from '../services/courseImportPreview.js';

assert.equal(normalizeImportPreview(null), null);

const empty = normalizeImportPreview({});
assert.equal(empty.validCount, 0);
assert.equal(canConfirmImport(empty, true), false, 'sin filas válidas no se confirma');

const clean = normalizeImportPreview({ validCount: 3, sections: { D: 3, V: 0 } });
assert.equal(requiresSectionAck(clean), false);
assert.equal(canConfirmImport(clean, false), true);
assert.equal(clean.totalDetected, 3);

const mixed = normalizeImportPreview({ validCount: 4, mixedSections: true, sections: { D: 2, V: 2 } });
assert.equal(canConfirmImport(mixed, false), false);
assert.equal(canConfirmImport(mixed, true), true);

const ambiguous = normalizeImportPreview({
  validCount: 1,
  ambiguousRows: [{ row: 2, sigla: 'X', seccion: '001' }],
});
assert.equal(ambiguous.sections.ambiguous, 1);
assert.equal(canConfirmImport(ambiguous, false), false);

console.log('courseImportPreviewTest: OK');
