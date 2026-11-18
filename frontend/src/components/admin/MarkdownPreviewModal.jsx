import React, { useRef } from 'react';
import { FileText, Check, Copy, Download, X } from 'lucide-react';
import { useAccessibility } from '../../context/AccessibilityContext';
import { useAccessibleModal } from '../../hooks/useAccessibleModal';

/**
 * Modal accesible para visualización, copiado y descarga de la oferta académica
 * en formato Markdown (.md) normalizado.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Controla si el modal es visible
 * @param {Function} props.onClose - Callback al cerrar el modal
 * @param {string} props.markdownContent - Contenido Markdown a previsualizar
 * @param {Function} props.onCopy - Callback para copiar al portapapeles
 * @param {Function} props.onDownload - Callback para descargar archivo .md
 * @param {boolean} props.copied - Indica si el contenido fue recién copiado
 */
export const MarkdownPreviewModal = ({
  isOpen,
  onClose,
  markdownContent,
  onCopy,
  onDownload,
  copied = false,
}) => {
  const { getVoiceProps } = useAccessibility();
  const modalRef = useRef(null);
  const closeButtonRef = useRef(null);

  useAccessibleModal({
    isOpen,
    onClose,
    containerRef: modalRef,
    initialFocusRef: closeButtonRef,
  });

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="md-modal-title"
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        ref={modalRef}
        tabIndex={-1}
        className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden focus:outline-none"
      >
        <header className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-[#002B49] flex items-center justify-center">
              <FileText className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h3 id="md-modal-title" className="text-base sm:text-lg font-black text-slate-950">
                Representación Limpia en Formato Markdown (.md)
              </h3>
              <p className="text-xs text-slate-600">
                Tabla estructurada y normalizada de Duoc UC - Sede Alameda lista para auditoría, git o descarga oficial.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCopy}
              {...getVoiceProps(
                copied
                  ? 'Contenido Markdown copiado al portapapeles'
                  : 'Copiar contenido Markdown al portapapeles'
              )}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer"
              title="Copiar contenido Markdown al portapapeles"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="w-4 h-4 text-slate-700" aria-hidden="true" />
              )}
              <span>{copied ? '¡Copiado!' : 'Copiar'}</span>
            </button>

            <button
              type="button"
              onClick={onDownload}
              {...getVoiceProps('Descargar archivo Markdown')}
              className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#002B49] hover:bg-blue-950 text-white inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer"
              title="Descargar archivo .md"
            >
              <Download className="w-4 h-4 text-amber-400" aria-hidden="true" />
              <span>Descargar .md</span>
            </button>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              {...getVoiceProps('Cerrar modal de vista previa Markdown')}
              className="min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-950 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 flex items-center justify-center cursor-pointer"
              aria-label="Cerrar modal de vista previa Markdown"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 overflow-y-auto font-mono text-xs bg-slate-900 text-slate-100 rounded-b-3xl">
          <pre className="whitespace-pre-wrap leading-relaxed select-all">
            {markdownContent || 'Sin contenido Markdown disponible.'}
          </pre>
        </main>
      </div>
    </div>
  );
};

export default MarkdownPreviewModal;
