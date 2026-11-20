const toCount = (value) => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
};

const toList = (value) => (Array.isArray(value) ? value : []);

/**
 * Normaliza (con tolerancia a campos faltantes) el `preview` de
 * POST /api/admin/courses/import?dryRun=true. Devuelve null si no hay preview.
 */
export const normalizeImportPreview = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const sections = raw.sections && typeof raw.sections === 'object' ? raw.sections : {};
  const errors = toList(raw.errors).map((e) => ({
    row: e?.row ?? '—',
    message: String(e?.message ?? (typeof e === 'string' ? e : 'Error sin detalle')),
  }));
  const ambiguousRows = toList(raw.ambiguousRows).map((r) => ({
    row: r?.row ?? '—',
    sigla: r?.sigla ?? '',
    seccion: r?.seccion ?? '',
  }));

  const validCount = toCount(raw.validCount);
  const invalidCount = raw.invalidCount == null ? errors.length : toCount(raw.invalidCount);
  const ambiguous = Math.max(toCount(sections.ambiguous), ambiguousRows.length);

  return {
    totalDetected: raw.totalDetected == null ? validCount + invalidCount : toCount(raw.totalDetected),
    validCount,
    invalidCount,
    errors,
    sections: { D: toCount(sections.D), V: toCount(sections.V), ambiguous },
    mixedSections: raw.mixedSections === true,
    ambiguousRows,
    warnings: toList(raw.warnings).map(String),
    sample: toList(raw.sample).filter((s) => s && typeof s === 'object'),
  };
};

/** Mezcla D/V o secciones ambiguas: exige confirmación explícita. */
export const requiresSectionAck = (preview) =>
  Boolean(preview && (preview.mixedSections || preview.sections.ambiguous > 0));

/** Se puede guardar solo con filas válidas y, si aplica, tras reconocer el aviso. */
export const canConfirmImport = (preview, acknowledged) =>
  Boolean(preview) && preview.validCount > 0 && (!requiresSectionAck(preview) || acknowledged);
