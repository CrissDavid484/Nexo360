import React from 'react';
import { AlertTriangle, Check, Moon, Sun, X, RefreshCw, HelpCircle } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { canConfirmImport, requiresSectionAck } from '../../services/courseImportPreview';

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2';

const ACK_LABEL =
  'Entiendo que el archivo mezcla secciones D y V / contiene secciones ambiguas';

const StatBox = ({ label, value, voiceProps }) => (
  <div {...voiceProps} className="p-3 bg-white rounded-xl border border-slate-300">
    <span className="text-[11px] uppercase font-bold text-slate-700 block">{label}</span>
    <span className="text-xl font-black text-slate-950">{value.toLocaleString('es-CL')}</span>
  </div>
);

const SectionCard = ({ icon: Icon, title, value, tone, voiceProps }) => (
  <div {...voiceProps} className={`p-4 rounded-2xl border-2 ${tone}`}>
    <div className="flex items-center gap-2 text-sm font-black">
      <Icon className="w-5 h-5" aria-hidden="true" />
      <span>{title}</span>
    </div>
    <p className="mt-1 text-3xl font-black">{value.toLocaleString('es-CL')}</p>
    <p className="text-xs font-semibold">filas</p>
  </div>
);

/** Tabla con scroll horizontal controlado, reutilizada para errores, ambiguas y muestra. */
const PreviewTable = ({ caption, columns, rows }) => (
  <div className="overflow-x-auto max-h-64 overflow-y-auto rounded-xl border border-slate-300 bg-white">
    <table className="w-full text-left text-xs">
      <caption className="sr-only">{caption}</caption>
      <thead className="bg-slate-100 text-slate-900 font-bold border-b border-slate-300 sticky top-0">
        <tr>
          {columns.map((c) => (
            <th key={c.key} scope="col" className="p-2.5 whitespace-nowrap">
              {c.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-200 text-slate-900">
        {rows.map((row, idx) => (
          <tr key={`${caption}-${idx}`}>
            {columns.map((c) => (
              <td key={c.key} className="p-2.5 align-top break-words">
                {row[c.key] === undefined || row[c.key] === '' ? '—' : String(row[c.key])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const ERROR_COLUMNS = [
  { key: 'row', label: 'Fila' },
  { key: 'message', label: 'Problema detectado' },
];
const AMBIGUOUS_COLUMNS = [
  { key: 'row', label: 'Fila' },
  { key: 'sigla', label: 'Sigla' },
  { key: 'seccion', label: 'Sección' },
];
const SAMPLE_COLUMNS = [
  { key: 'sigla', label: 'Sigla' },
  { key: 'nombre', label: 'Asignatura' },
  { key: 'seccion', label: 'Sección' },
  { key: 'jornada', label: 'Jornada' },
];

/**
 * Panel de validación previa (dry-run) antes de importar o sobreescribir el catálogo.
 * `preview` debe venir normalizado con normalizeImportPreview.
 */
export const ImportDryRunPreview = ({
  preview,
  fileName,
  replaceCatalog,
  acknowledged,
  onAcknowledgeChange,
  onConfirm,
  onCancel,
  isSubmitting,
}) => {
  const { getVoiceProps } = useAccessibility();
  const { sections } = preview;
  const needsAck = requiresSectionAck(preview);
  const canConfirm = canConfirmImport(preview, acknowledged) && !isSubmitting;

  let blockedHint = null;
  if (preview.validCount === 0) {
    blockedHint = 'No se puede guardar: el archivo no tiene filas válidas.';
  } else if (needsAck && !acknowledged) {
    blockedHint = 'Para guardar, marca la casilla de confirmación de secciones.';
  }

  return (
    <section
      aria-labelledby="dryrun-heading"
      className="p-4 sm:p-5 rounded-2xl bg-slate-50 border-2 border-[#002B49] space-y-5"
    >
      <header>
        <h3 id="dryrun-heading" className="text-base sm:text-lg font-black text-slate-950">
          Revisión antes de guardar: {fileName}
        </h3>
        <p className="text-xs sm:text-sm text-slate-800 mt-1 leading-relaxed">
          Todavía no se guardó nada. Revisa este resumen y luego confirma o cancela.
          {replaceCatalog && ' Al confirmar se reemplazará el catálogo actual.'}
        </p>
      </header>

      {needsAck && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-100 border-2 border-amber-700 text-amber-950 flex items-start gap-3"
        >
          <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm space-y-1">
            <p className="font-black">Atención: revisa las secciones antes de guardar</p>
            <p>
              {preview.mixedSections
                ? 'Este archivo mezcla secciones Diurnas (D) y Vespertinas (V). '
                : ''}
              {sections.ambiguous > 0
                ? `Hay ${sections.ambiguous} fila(s) con sección ambigua que no se pudo clasificar como D ni V.`
                : ''}
            </p>
          </div>
        </div>
      )}

      {preview.validCount === 0 && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-red-100 border-2 border-red-800 text-red-950 flex items-start gap-3"
        >
          <X className="w-6 h-6 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm font-black">
            Error: ninguna fila es válida. Corrige el archivo y vuelve a cargarlo.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatBox
          label="Filas detectadas"
          value={preview.totalDetected}
          voiceProps={getVoiceProps(`Filas detectadas: ${preview.totalDetected}`)}
        />
        <StatBox
          label="Filas válidas"
          value={preview.validCount}
          voiceProps={getVoiceProps(`Filas válidas: ${preview.validCount}`)}
        />
        <StatBox
          label="Filas con errores"
          value={preview.invalidCount}
          voiceProps={getVoiceProps(`Filas con errores: ${preview.invalidCount}`)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SectionCard
          icon={Sun}
          title="Diurna (D)"
          value={sections.D}
          tone="bg-sky-50 border-sky-800 text-sky-950"
          voiceProps={getVoiceProps(`Secciones Diurnas D: ${sections.D}`)}
        />
        <SectionCard
          icon={Moon}
          title="Vespertina (V)"
          value={sections.V}
          tone="bg-indigo-50 border-indigo-800 text-indigo-950"
          voiceProps={getVoiceProps(`Secciones Vespertinas V: ${sections.V}`)}
        />
        <SectionCard
          icon={HelpCircle}
          title="Ambiguas"
          value={sections.ambiguous}
          tone={
            sections.ambiguous > 0
              ? 'bg-amber-50 border-amber-800 text-amber-950'
              : 'bg-white border-slate-400 text-slate-900'
          }
          voiceProps={getVoiceProps(`Secciones ambiguas: ${sections.ambiguous}`)}
        />
      </div>

      {preview.warnings.length > 0 && (
        <ul className="list-disc pl-5 text-xs sm:text-sm text-amber-950 space-y-1">
          {preview.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      )}

      {preview.ambiguousRows.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-sm font-black text-slate-950">Filas con sección ambigua</h4>
          <PreviewTable
            caption="Filas con sección ambigua"
            columns={AMBIGUOUS_COLUMNS}
            rows={preview.ambiguousRows}
          />
        </div>
      )}

      {preview.errors.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-sm font-black text-slate-950">Errores encontrados</h4>
          <PreviewTable caption="Errores por fila" columns={ERROR_COLUMNS} rows={preview.errors} />
        </div>
      )}

      {preview.sample.length > 0 && (
        <div className="space-y-1.5">
          <h4 className="text-sm font-black text-slate-950">Muestra de filas válidas</h4>
          <PreviewTable
            caption="Muestra de filas válidas"
            columns={SAMPLE_COLUMNS}
            rows={preview.sample}
          />
        </div>
      )}

      {needsAck && (
        <label
          htmlFor="dryrun-ack"
          className="min-h-[44px] flex items-start gap-3 p-3 rounded-xl border-2 border-amber-700 bg-white cursor-pointer"
        >
          <input
            id="dryrun-ack"
            type="checkbox"
            checked={acknowledged}
            onChange={(e) => onAcknowledgeChange(e.target.checked)}
            {...getVoiceProps(ACK_LABEL)}
            className={`w-6 h-6 mt-0.5 shrink-0 rounded border-2 border-slate-600 text-[#002B49] cursor-pointer ${FOCUS_RING}`}
          />
          <span className="text-sm font-bold text-slate-950">{ACK_LABEL}</span>
        </label>
      )}

      <div className="pt-3 border-t border-slate-300 space-y-2">
        {blockedHint && (
          <p id="dryrun-blocked-hint" className="text-xs sm:text-sm font-bold text-red-900">
            {blockedHint}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            {...getVoiceProps('Cancelar y descartar la revisión sin guardar')}
            className={`min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold bg-white hover:bg-slate-100 text-slate-900 border border-slate-400 cursor-pointer ${FOCUS_RING}`}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!canConfirm}
            aria-describedby={blockedHint ? 'dryrun-blocked-hint' : undefined}
            {...getVoiceProps('Confirmar y guardar el catálogo en la base de datos')}
            className={`min-h-[44px] px-6 py-2.5 rounded-xl text-sm font-black inline-flex items-center justify-center gap-2 ${FOCUS_RING} ${
              canConfirm
                ? 'bg-[#002B49] hover:bg-blue-950 text-white cursor-pointer'
                : 'bg-slate-300 text-slate-700 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? (
              <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="w-4 h-4" aria-hidden="true" />
            )}
            <span>Confirmar y guardar</span>
          </button>
        </div>
      </div>
    </section>
  );
};
