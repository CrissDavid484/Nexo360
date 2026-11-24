import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  FileSpreadsheet,
  Trash2,
  Search,
  X,
  RefreshCw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  FileText,
} from 'lucide-react';
import { api } from '@services/api';
import { normalizeImportPreview } from '@services/courseImportPreview';
import { ADMIN_THEME } from '@components/admin/adminTheme';
import { invalidateAcademicWeekCache } from '@components/common/AcademicWeekBadge';
import { ImportDryRunPreview } from '../ImportDryRunPreview';
import { CoursesCatalogTable } from '../CoursesCatalogTable';
import { parseCSV, normalizeCourseRows } from '@utils/csvParser';
import { Card } from '@components/ui/Card';
import { Button } from '@components/ui/Button';
import { Input } from '@components/ui/Input';

const formatCalRange = (start, end) => {
  if (!start && !end) return 'Por confirmar';
  if (start && end) return `${start} al ${end}`;
  return start || end;
};

function AcademicCalendarManager({ isAdmin, getVoiceProps, announce }) {
  const [calendars, setCalendars] = useState([]);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [isLoadingCal, setIsLoadingCal] = useState(true);
  const [isParsingPdf, setIsParsingPdf] = useState(false);
  const [isSavingPdf, setIsSavingPdf] = useState(false);
  const [pdfPreview, setPdfPreview] = useState(null);
  const [pendingFileName, setPendingFileName] = useState('');
  const [calFeedback, setCalFeedback] = useState(null);

  const loadCalendars = useCallback(async () => {
    setIsLoadingCal(true);
    try {
      const res = await api.getAdminAcademicCalendars();
      if (res?.success) {
        const list = Array.isArray(res.calendars) ? res.calendars : [];
        setCalendars(list);
        setCurrentStatus(res.current || null);
        setSelectedYear((prev) => {
          if (prev && list.some((c) => Number(c.year) === Number(prev))) return prev;
          return res.current?.year || list[0]?.year || 2026;
        });
      }
    } catch (err) {
      console.warn('[AcademicCalendarManager] Error cargando calendarios:', err.message);
    } finally {
      setIsLoadingCal(false);
    }
  }, []);

  useEffect(() => {
    loadCalendars();
  }, [loadCalendars]);

  const activeCalendar = useMemo(
    () => calendars.find((c) => Number(c.year) === Number(selectedYear)) || calendars[0] || null,
    [calendars, selectedYear]
  );

  const handleCalendarPdfSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setCalFeedback({ type: 'error', text: 'Solo se aceptan archivos PDF oficiales de Calendario Académico.' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    setIsParsingPdf(true);
    setCalFeedback(null);
    reader.onerror = () => {
      setIsParsingPdf(false);
      setCalFeedback({ type: 'error', text: 'No se pudo leer el archivo PDF seleccionado.' });
    };
    reader.onload = async (ev) => {
      try {
        const dataUrl = String(ev.target?.result || '');
        const fileBase64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
        const res = await api.importAdminAcademicCalendar(
          { fileBase64, fileName: file.name },
          { dryRun: true }
        );
        if (res?.success && res.preview?.calendar) {
          setPdfPreview(res.preview);
          setPendingFileName(file.name);
        } else {
          setCalFeedback({ type: 'error', text: res?.message || 'No se pudieron extraer hitos del PDF.' });
        }
      } catch (err) {
        setCalFeedback({ type: 'error', text: err.message || 'Error al analizar el PDF del calendario.' });
      } finally {
        setIsParsingPdf(false);
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleConfirmCalendarSave = async () => {
    if (!pdfPreview?.calendar) return;
    setIsSavingPdf(true);
    setCalFeedback(null);
    try {
      const res = await api.importAdminAcademicCalendar(
        { calendar: pdfPreview.calendar, fileName: pendingFileName },
        { dryRun: false }
      );
      if (res?.success) {
        const savedYear = res.calendar?.year || pdfPreview.calendar.year;
        setCalFeedback({
          type: 'success',
          text: res.message || `Calendario Académico ${savedYear} guardado correctamente en MongoDB.`,
        });
        announce?.(`Calendario Académico ${savedYear} actualizado.`, 'polite');
        setPdfPreview(null);
        setPendingFileName('');
        await loadCalendars();
        setSelectedYear(savedYear);
        invalidateAcademicWeekCache();
      } else {
        setCalFeedback({ type: 'error', text: res?.message || 'No se pudo guardar el calendario.' });
      }
    } catch (err) {
      setCalFeedback({ type: 'error', text: err.message || 'Error al guardar calendario en base de datos.' });
    } finally {
      setIsSavingPdf(false);
    }
  };

  const sem1 = activeCalendar?.semesters?.find((s) => s.semester === 1);
  const sem2 = activeCalendar?.semesters?.find((s) => s.semester === 2);

  return (
    <Card variant="interactive" padding="lg" className="rounded-2xl p-5 sm:p-6 space-y-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-950 border border-amber-200">
            <CalendarDays className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
            <span>Calendario Académico Duoc UC • MongoDB</span>
          </div>
          <h3 className={ADMIN_THEME.sectionTitle}>Programación Oficial 2026–2027 y Semana Lectiva</h3>
          <p className={ADMIN_THEME.moduleSubtitle}>
            La Semana 0 aplica exclusivamente a estudiantes de 1° año; cursos superiores inician en Semana 1 y el conteo se reinicia al comenzar el 2° Semestre.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {calendars.map((cal) => {
            const isActiveYear = Number(cal.year) === Number(activeCalendar?.year);
            return (
              <button
                key={cal.year}
                type="button"
                onClick={() => setSelectedYear(cal.year)}
                className={`${ADMIN_THEME.filterPillBase} ${
                  isActiveYear ? ADMIN_THEME.filterPillActive : ADMIN_THEME.filterPillIdle
                }`}
              >
                Año {cal.year}
              </button>
            );
          })}
        </div>
      </div>

      {currentStatus?.label && (
        <div className={`${ADMIN_THEME.subSurface} flex flex-col sm:flex-row sm:items-center justify-between gap-2`}>
          <div className="space-y-0.5">
            <span className={`${ADMIN_THEME.cardLabel} block`}>Estado Académico Vigente</span>
            <p className="text-sm font-bold text-neutral-900">{currentStatus.label}</p>
            {currentStatus.detail && <p className={ADMIN_THEME.metaText}>{currentStatus.detail}</p>}
            {currentStatus.upperYearNote && (
              <p className="text-xs font-medium text-amber-800">{currentStatus.upperYearNote}</p>
            )}
          </div>
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white border border-neutral-200 text-neutral-700 self-start sm:self-center">
            {currentStatus.calendarResolution || `Año ${currentStatus.year}`}
          </span>
        </div>
      )}

      {calFeedback && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm font-medium ${
            calFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
              : 'bg-rose-50 border-rose-200 text-rose-950'
          }`}
        >
          <span>{calFeedback.text}</span>
          <button
            type="button"
            onClick={() => setCalFeedback(null)}
            aria-label="Cerrar aviso de calendario"
            className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isLoadingCal ? (
        <div className="py-6 text-center text-sm text-neutral-500">Cargando programación académica...</div>
      ) : activeCalendar ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className={ADMIN_THEME.subSurface}>
            <span className={`${ADMIN_THEME.cardLabel} block`}>Temporada Verano (TAV)</span>
            <p className="text-sm font-bold text-neutral-900 mt-1">
              {formatCalRange(activeCalendar.tav?.start, activeCalendar.tav?.end)}
            </p>
            <p className={`${ADMIN_THEME.metaText} mt-1`}>
              Cierre académico: {activeCalendar.tav?.close || 'Por confirmar'}
            </p>
          </div>

          <div className={ADMIN_THEME.subSurface}>
            <span className={`${ADMIN_THEME.cardLabel} block`}>1° Semestre ({sem1?.code || `${activeCalendar.year}-1`})</span>
            <p className="text-sm font-bold text-neutral-900 mt-1">
              Clases: {formatCalRange(sem1?.classesStart, sem1?.classesEnd)}
            </p>
            <p className={`${ADMIN_THEME.metaText} mt-1`}>
              Semana 0 (1° Año): {formatCalRange(sem1?.weekZeroStart, sem1?.weekZeroEnd)}
            </p>
            <p className={`${ADMIN_THEME.metaText}`}>
              Exámenes: {formatCalRange(sem1?.examsStart, sem1?.examsEnd)} · Cierre: {sem1?.closeDate || '-'} · Duración: {sem1?.totalWeeks || 18} semanas
            </p>
          </div>

          <div className={ADMIN_THEME.subSurface}>
            <span className={`${ADMIN_THEME.cardLabel} block`}>Receso de Invierno</span>
            <p className="text-sm font-bold text-neutral-900 mt-1">
              {formatCalRange(activeCalendar.winterRecess?.start, activeCalendar.winterRecess?.end)}
            </p>
            <p className={`${ADMIN_THEME.metaText} mt-1`}>
              Pausa intersemestral previa al reinicio de Semana 1 en 2° Semestre.
            </p>
          </div>

          <div className={ADMIN_THEME.subSurface}>
            <span className={`${ADMIN_THEME.cardLabel} block`}>2° Semestre ({sem2?.code || `${activeCalendar.year}-2`})</span>
            <p className="text-sm font-bold text-neutral-900 mt-1">
              Clases: {formatCalRange(sem2?.classesStart, sem2?.classesEnd)}
            </p>
            <p className={`${ADMIN_THEME.metaText} mt-1`}>
              Exámenes: {formatCalRange(sem2?.examsStart, sem2?.examsEnd)}
            </p>
            <p className={`${ADMIN_THEME.metaText}`}>
              Cierre: {sem2?.closeDate || '-'} · Duración: {sem2?.totalWeeks || 18} semanas
            </p>
          </div>
        </div>
      ) : null}

      {isAdmin && (
        <div className="pt-4 border-t border-neutral-200 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-neutral-900">Actualizar Calendario Académico mediante PDF</h4>
              <p className={ADMIN_THEME.metaText}>
                Sube una resolución o calendario oficial Duoc UC (.pdf) para previsualizar las fechas detectadas antes de guardar.
              </p>
            </div>
            <label className="relative inline-flex cursor-pointer">
              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleCalendarPdfSelect}
                disabled={isParsingPdf || isSavingPdf}
                aria-label="Seleccionar PDF de Calendario Académico Duoc UC"
                {...getVoiceProps('Subir PDF de Calendario Académico Duoc UC')}
                className="sr-only peer"
              />
              <span className="min-h-[42px] px-4 py-2 rounded-xl bg-brand-navy text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 hover:opacity-95 transition-opacity peer-focus-visible:outline-none peer-focus-visible:ring-4 peer-focus-visible:ring-brand-gold">
                <FileText className="w-4 h-4" aria-hidden="true" />
                <span>{isParsingPdf ? 'Analizando PDF...' : 'Cargar Calendario PDF'}</span>
              </span>
            </label>
          </div>

          {pdfPreview?.calendar && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className={`${ADMIN_THEME.cardLabel} text-amber-900 block`}>
                    Vista Previa Detectada ({pendingFileName})
                  </span>
                  <p className="text-sm font-bold text-neutral-900 mt-0.5">
                    Año {pdfPreview.calendar.year} · {pdfPreview.calendar.resolution}
                  </p>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-white border border-amber-200 text-amber-900">
                  {pdfPreview.detectedFields?.length || 0} bloques detectados
                </span>
              </div>

              {Array.isArray(pdfPreview.warnings) && pdfPreview.warnings.length > 0 && (
                <div className="p-3 rounded-lg bg-white border border-amber-200 text-xs text-amber-900 space-y-1">
                  {pdfPreview.warnings.map((w, idx) => (
                    <p key={idx}>• {w}</p>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-neutral-800">
                <div className="p-3 rounded-lg bg-white border border-neutral-200">
                  <span className="font-bold block">1° Semestre {pdfPreview.calendar.year}</span>
                  <span>Semana 0 (1° Año): {formatCalRange(pdfPreview.calendar.semesters?.[0]?.weekZeroStart, pdfPreview.calendar.semesters?.[0]?.weekZeroEnd)}</span>
                  <span className="block">Clases: {formatCalRange(pdfPreview.calendar.semesters?.[0]?.classesStart, pdfPreview.calendar.semesters?.[0]?.classesEnd)}</span>
                  <span className="block">Exámenes: {formatCalRange(pdfPreview.calendar.semesters?.[0]?.examsStart, pdfPreview.calendar.semesters?.[0]?.examsEnd)}</span>
                </div>
                <div className="p-3 rounded-lg bg-white border border-neutral-200">
                  <span className="font-bold block">2° Semestre {pdfPreview.calendar.year}</span>
                  <span>Receso Invierno: {formatCalRange(pdfPreview.calendar.winterRecess?.start, pdfPreview.calendar.winterRecess?.end)}</span>
                  <span className="block">Clases: {formatCalRange(pdfPreview.calendar.semesters?.[1]?.classesStart, pdfPreview.calendar.semesters?.[1]?.classesEnd)}</span>
                  <span className="block">Exámenes: {formatCalRange(pdfPreview.calendar.semesters?.[1]?.examsStart, pdfPreview.calendar.semesters?.[1]?.examsEnd)}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleConfirmCalendarSave}
                  disabled={isSavingPdf}
                  className="min-h-[42px]"
                >
                  {isSavingPdf ? 'Guardando...' : `Confirmar y Guardar Año ${pdfPreview.calendar.year}`}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setPdfPreview(null);
                    setPendingFileName('');
                  }}
                  disabled={isSavingPdf}
                  className="min-h-[42px]"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

function OfertaAcademicaImport({ isAdmin, getVoiceProps, announce }) {
  const [isImporting, setIsImporting] = useState(false);
  const [dryRunPreview, setDryRunPreview] = useState(null);
  const [pendingUpload, setPendingUpload] = useState(null);
  const [dryRunAcknowledged, setDryRunAcknowledged] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [catalogSummary, setCatalogSummary] = useState(null);
  const [courses, setCourses] = useState([]);
  const [courseSearch, setCourseSearch] = useState('');
  const [selectedCareerFilter, setSelectedCareerFilter] = useState('all');

  const loadSummary = useCallback(async () => {
    try {
      setIsLoading(true);
      const [summaryRes, coursesRes] = await Promise.allSettled([
        api.getAdminCoursesSummary(),
        api.getCourses({ limit: 500 }),
      ]);
      if (summaryRes.status === 'fulfilled' && summaryRes.value?.success) {
        setCatalogSummary(summaryRes.value.summary);
      }
      if (coursesRes.status === 'fulfilled' && coursesRes.value?.success && Array.isArray(coursesRes.value.courses)) {
        setCourses(coursesRes.value.courses);
      }
    } catch (err) {
      console.error('[OfertaAcademicaImport] Error cargando catálogo:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => { loadSummary(); }, [loadSummary]);

  const careerOptions = useMemo(() => {
    const names = new Set();
    (catalogSummary?.careers || []).forEach((c) => {
      if (c?.carrera) names.add(c.carrera);
    });
    courses.forEach((c) => {
      if (c?.carrera) names.add(c.carrera);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b, 'es'));
  }, [catalogSummary, courses]);

  const filteredCourses = useMemo(() => {
    const q = courseSearch.toLowerCase().trim();
    return courses.filter((c) => {
      if (selectedCareerFilter !== 'all' && c.carrera !== selectedCareerFilter) {
        return false;
      }
      if (!q) return true;
      return (
        (c.sigla || '').toLowerCase().includes(q) ||
        (c.nombre || '').toLowerCase().includes(q) ||
        (c.carrera || '').toLowerCase().includes(q) ||
        (c.secciones || []).some(
          (s) =>
            (s.seccion || '').toLowerCase().includes(q) ||
            (s.profesor || '').toLowerCase().includes(q)
        )
      );
    });
  }, [courses, courseSearch, selectedCareerFilter]);

  const runDryRunValidation = useCallback(async ({ fileName, rows = null, rawMarkdown = null, xml = null, fileBase64 = null }) => {
    setIsImporting(true);
    setStatusFeedback(null);
    try {
      const dryRunRes = await api.importAdminCourses(rows, true, rawMarkdown, {
        dryRun: true,
        xml,
        fileBase64,
        filename: fileName,
      });
      if (dryRunRes?.success && dryRunRes.preview) {
        const normalized = normalizeImportPreview(dryRunRes.preview);
        setDryRunPreview(normalized);
        setPendingUpload({ fileName, rows, rawMarkdown, xml, fileBase64 });
        setDryRunAcknowledged(false);
      } else {
        setStatusFeedback({
          type: 'error',
          text: dryRunRes?.message || 'No se pudieron procesar registros válidos del archivo.',
        });
      }
    } catch (err) {
      console.error('[OfertaAcademicaImport] Error validando archivo:', err);
      setStatusFeedback({ type: 'error', text: err.message || 'Error al validar el archivo seleccionado.' });
    } finally {
      setIsImporting(false);
    }
  }, []);

  const handleFileChange = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const lowerName = file.name.toLowerCase();
    const isXml = lowerName.endsWith('.xml');
    const isExcel = lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls');
    const isCsv = lowerName.endsWith('.csv');
    const isMd = lowerName.endsWith('.md') || lowerName.endsWith('.markdown');

    if (!isXml && !isExcel && !isCsv && !isMd) {
      setStatusFeedback({ type: 'error', text: 'Formato no soportado. Sube un archivo .xml, .xlsx, .xls o .csv.' });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        if (isExcel) {
          const dataUrl = String(ev.target.result || '');
          const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
          await runDryRunValidation({ fileName: file.name, fileBase64: base64 });
        } else if (isXml) {
          const text = String(ev.target.result || '');
          await runDryRunValidation({ fileName: file.name, xml: text });
        } else if (isMd) {
          const text = String(ev.target.result || '');
          await runDryRunValidation({ fileName: file.name, rawMarkdown: text });
        } else if (isCsv) {
          const text = String(ev.target.result || '');
          const parsed = parseCSV(text);
          const rows = normalizeCourseRows(parsed);
          await runDryRunValidation({ fileName: file.name, rows });
        }
      } catch (err) {
        console.error('[OfertaAcademicaImport] Error leyendo archivo:', err);
        setStatusFeedback({ type: 'error', text: 'Error al leer el archivo. Verifica su estructura e intenta nuevamente.' });
      }
    };

    if (isExcel) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file, 'UTF-8');
    }
    e.target.value = '';
  }, [runDryRunValidation]);

  const handleConfirmImport = useCallback(async () => {
    if (!pendingUpload) return;
    setIsImporting(true);
    try {
      const res = await api.importAdminCourses(
        pendingUpload.rows,
        true,
        pendingUpload.rawMarkdown,
        {
          dryRun: false,
          xml: pendingUpload.xml,
          fileBase64: pendingUpload.fileBase64,
          filename: pendingUpload.fileName,
        }
      );
      if (res?.success) {
        setStatusFeedback({
          type: 'success',
          text: res.message || 'Catálogo importado y actualizado exitosamente en la base de datos.',
        });
        announce('Catálogo importado exitosamente.', 'polite');
        setDryRunPreview(null);
        setPendingUpload(null);
        await loadSummary();
      } else {
        setStatusFeedback({ type: 'error', text: res?.message || 'Error al importar catálogo.' });
      }
    } catch (err) {
      console.error('[OfertaAcademicaImport] Error importando:', err);
      setStatusFeedback({ type: 'error', text: 'Error de conexión al importar.' });
    } finally {
      setIsImporting(false);
    }
  }, [pendingUpload, announce, loadSummary]);

  const handleSeedCatalog = useCallback(async () => {
    if (!window.confirm('¿Restaurar el catálogo oficial 2026-002? Se sobrescribirán los datos actuales.')) return;
    try {
      setStatusFeedback({ type: 'success', text: 'Restaurando catálogo oficial...' });
      const res = await api.seedAdminCourses();
      if (res?.success) {
        setStatusFeedback({ type: 'success', text: res.message || 'Catálogo oficial restaurado exitosamente.' });
        announce('Catálogo oficial restaurado.', 'polite');
        await loadSummary();
      } else {
        setStatusFeedback({ type: 'error', text: res?.message || 'Error al restaurar catálogo.' });
      }
    } catch (err) {
      console.error('[OfertaAcademicaImport] Error restaurando:', err);
      setStatusFeedback({ type: 'error', text: 'Error al restaurar catálogo oficial.' });
    }
  }, [announce, loadSummary]);

  const handleClearCatalog = useCallback(async () => {
    if (!window.confirm('¿Vaciar completamente el catálogo? Esta acción no se puede deshacer.')) return;
    if (!window.confirm('CONFIRMACIÓN FINAL: ¿Está seguro de vaciar el catálogo?')) return;
    try {
      setStatusFeedback({ type: 'success', text: 'Vaciando catálogo...' });
      const res = await api.clearAdminCourses();
      if (res?.success) {
        setStatusFeedback({ type: 'success', text: res.message || 'Catálogo vaciado exitosamente.' });
        announce('Catálogo vaciado.', 'polite');
        await loadSummary();
      } else {
        setStatusFeedback({ type: 'error', text: res?.message || 'Error al vaciar catálogo.' });
      }
    } catch (err) {
      console.error('[OfertaAcademicaImport] Error vaciando:', err);
      setStatusFeedback({ type: 'error', text: 'Error al vaciar catálogo.' });
    }
  }, [announce, loadSummary]);

  const handleDownloadTemplate = useCallback(async () => {
    try {
      const res = await api.getCoursesMarkdown({ format: 'md' });
      const content = res?.markdown || res?.text;
      if (res?.success && content) {
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `oferta_academica_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        setStatusFeedback({ type: 'success', text: 'Catálogo descargado exitosamente.' });
        announce('Catálogo descargado.', 'polite');
      } else {
        setStatusFeedback({ type: 'error', text: 'No se pudo descargar el catálogo actual.' });
      }
    } catch (err) {
      console.error('[OfertaAcademicaImport] Error descargando catálogo:', err);
      setStatusFeedback({ type: 'error', text: 'Error al descargar catálogo.' });
    }
  }, [announce]);

  if (dryRunPreview) {
    return (
      <ImportDryRunPreview
        preview={dryRunPreview}
        fileName={pendingUpload?.fileName || 'archivo'}
        replaceCatalog={true}
        acknowledged={dryRunAcknowledged}
        onAcknowledgeChange={setDryRunAcknowledged}
        onConfirm={handleConfirmImport}
        onCancel={() => { setDryRunPreview(null); setPendingUpload(null); setDryRunAcknowledged(false); }}
        isSubmitting={isImporting}
      />
    );
  }

  return (
    <section aria-labelledby="oferta-academica-import-heading" className="space-y-6 animate-fade-in-up">
      <div className={`${ADMIN_THEME.cardSurface} flex flex-col lg:flex-row lg:items-center justify-between gap-4`}>
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-950 border border-emerald-200">
            <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Oferta Académica • Duoc UC - Sede Alameda</span>
          </div>
          <h2 id="oferta-academica-import-heading" className={ADMIN_THEME.moduleTitle}>Gestión de Oferta Académica y Calendario</h2>
          <p className={ADMIN_THEME.moduleSubtitle}>Importa la oferta académica, valida sus secciones antes de guardar, consulta los registros en base de datos y administra el Calendario Académico Duoc UC.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Button variant="secondary" size="sm" onClick={loadSummary} disabled={isLoading} {...getVoiceProps('Actualizar resumen del catálogo')} className="min-h-[42px] px-4 py-2">
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
            <span>Actualizar</span>
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownloadTemplate} {...getVoiceProps('Descargar catálogo actual')} className="min-h-[42px] px-4 py-2">
            <Download className="w-4 h-4" aria-hidden="true" />
            <span>Descargar catálogo</span>
          </Button>
        </div>
      </div>

      {statusFeedback && <div role="status" aria-live="polite" {...getVoiceProps(statusFeedback.text)} className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-sm font-medium shadow-xs transition-all ${statusFeedback.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-950' : 'bg-rose-50 border-rose-300 text-rose-950'}`}><div className="flex items-center gap-2.5">{statusFeedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" /> : <AlertTriangle className="w-5 h-5 text-rose-700 shrink-0" aria-hidden="true" />}<span>{statusFeedback.text}</span></div><button type="button" onClick={() => setStatusFeedback(null)} {...getVoiceProps('Cerrar notificación')} className="text-neutral-500 hover:text-neutral-900 p-1 rounded-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-gold" aria-label="Cerrar notificación"><X className="w-4 h-4" /></button></div>}

      <div className="space-y-6">
        {/* Calendario Académico Oficial Duoc UC (2026-2027) */}
        <AcademicCalendarManager isAdmin={isAdmin} getVoiceProps={getVoiceProps} announce={announce} />

        {/* Subida de archivo con previsualización */}
        <Card variant="outlined" padding="lg" className="rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold text-brand-navy bg-blue-100 border border-blue-200">
            <Upload className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
            <span>Cargar Oferta Académica</span>
          </div>
          <h3 className={ADMIN_THEME.sectionTitle}>Previsualización antes de guardar</h3>
          <p className={ADMIN_THEME.moduleSubtitle}>Sube el archivo de oferta académica (.xml, .xlsx, .xls o .csv). El sistema validará las secciones y horarios antes de confirmar el guardado.</p>
          <div className="relative">
            <input
              type="file"
              accept=".xml,.xlsx,.xls,.csv,.md"
              onChange={handleFileChange}
              disabled={isImporting}
              className="peer absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              aria-label="Seleccionar archivo de oferta académica"
              {...getVoiceProps('Seleccionar archivo de oferta académica para previsualizar')}
            />
            <div className="p-6 rounded-2xl border-2 border-dashed border-neutral-300 text-center bg-neutral-50 hover:border-brand-navy hover:bg-white peer-focus-visible:border-brand-navy peer-focus-visible:ring-4 peer-focus-visible:ring-brand-gold transition-all">
              <Upload className="w-10 h-10 text-neutral-400 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold text-neutral-900">
                {isImporting ? 'Procesando archivo...' : 'Arrastra y suelta tu archivo de oferta académica'}
              </p>
              <p className={`${ADMIN_THEME.metaText} mt-1`}>o haz clic para seleccionar (.xml, .xlsx, .xls, .csv)</p>
              <p className={`${ADMIN_THEME.metaText} mt-2`}>El archivo se valida antes de guardar en la base de datos</p>
            </div>
          </div>
        </Card>

        {/* Resumen y tabla real del catálogo actual */}
        <Card variant="interactive" padding="lg" className="rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className={ADMIN_THEME.sectionTitle}>Catálogo Actual en Base de Datos</h3>
              <p className={ADMIN_THEME.metaText}>Periodo activo: {catalogSummary?.periodoActivo || '2026 - 002'}</p>
            </div>
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
              Sincronizado con MongoDB
            </span>
          </div>
          {isLoading ? (
            <div className="p-4 text-center text-neutral-400 font-bold">
              <span className="animate-spin inline-block w-6 h-6 border-2 border-brand-navy border-t-transparent rounded-full" aria-hidden="true" />
              <span className="ml-2 block">Cargando catálogo...</span>
            </div>
          ) : catalogSummary ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatBox
                  label="Total secciones"
                  value={catalogSummary.totalSecciones ?? catalogSummary.totalCourses ?? 0}
                  voiceProps={getVoiceProps(`Total de secciones: ${catalogSummary.totalSecciones ?? 0}`)}
                />
                <StatBox
                  label="Asignaturas únicas"
                  value={catalogSummary.totalAsignaturas ?? courses.length}
                  voiceProps={getVoiceProps(`Asignaturas únicas: ${catalogSummary.totalAsignaturas ?? courses.length}`)}
                />
                <StatBox
                  label="Diurnas (D)"
                  value={catalogSummary.diurnas ?? 0}
                  voiceProps={getVoiceProps(`Secciones diurnas: ${catalogSummary.diurnas ?? 0}`)}
                />
                <StatBox
                  label="Vespertinas (V)"
                  value={catalogSummary.vespertinas ?? 0}
                  voiceProps={getVoiceProps(`Secciones vespertinas: ${catalogSummary.vespertinas ?? 0}`)}
                />
              </div>

              <div className="pt-2 space-y-3 border-t border-neutral-100">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                    <Input
                      type="search"
                      value={courseSearch}
                      onChange={(e) => setCourseSearch(e.target.value)}
                      placeholder="Buscar asignatura por sigla, nombre, docente o carrera..."
                      aria-label="Buscar asignatura en el catálogo"
                      className="pl-10 min-h-[42px]"
                    />
                  </div>
                  <select
                    value={selectedCareerFilter}
                    onChange={(e) => setSelectedCareerFilter(e.target.value)}
                    aria-label="Filtrar catálogo por carrera"
                    className={`${ADMIN_THEME.controlInput} sm:max-w-xs`}
                  >
                    <option value="all">Todas las carreras ({careerOptions.length})</option>
                    {careerOptions.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className={`flex items-center justify-between ${ADMIN_THEME.metaText}`}>
                  <span>Mostrando {filteredCourses.length} asignaturas agrupadas del catálogo real</span>
                </div>

                <div className="max-h-[540px] overflow-y-auto rounded-2xl">
                  <CoursesCatalogTable courses={filteredCourses} />
                </div>
              </div>
            </>
          ) : (
            <Card variant="filled" padding="lg" className="text-center">No se pudo cargar el resumen del catálogo.</Card>
          )}
        </Card>

        {/* Acciones de mantenimiento */}
        <Card variant="outlined" padding="lg" className="rounded-2xl p-5 sm:p-6 space-y-4 border-amber-200 bg-amber-50">
          <h3 className={`${ADMIN_THEME.sectionTitle} flex items-center gap-2`}>
            <AlertTriangle className="w-5 h-5 text-amber-700" aria-hidden="true" />
            Acciones de Mantenimiento
          </h3>
          <p className={ADMIN_THEME.moduleSubtitle}>Operaciones que modifican el catálogo completo. Úsalas con precaución.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="amber" size="sm" onClick={handleSeedCatalog} disabled={isLoading} {...getVoiceProps('Restaurar catálogo oficial 2026-002')} className="min-h-[42px] px-4 py-2">
              <RefreshCw className="w-4 h-4" aria-hidden="true" />
              <span>Restaurar Oficial 2026-002</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleClearCatalog} disabled={isLoading} {...getVoiceProps('Vaciar catálogo completamente')} className="min-h-[42px] px-4 py-2 border-rose-400 text-rose-700 hover:bg-rose-50">
              <Trash2 className="w-4 h-4" aria-hidden="true" />
              <span>Vaciar Catálogo</span>
            </Button>
          </div>
        </Card>
      </div>
    </section>
  );
}

const StatBox = ({ label, value, voiceProps }) => (
  <div {...voiceProps} className="p-4 bg-neutral-50 rounded-xl border border-neutral-200">
    <span className={`${ADMIN_THEME.cardLabel} block`}>{label}</span>
    <span className={`${ADMIN_THEME.kpiValue} mt-0.5 block`}>{Number(value ?? 0).toLocaleString('es-CL')}</span>
  </div>
);

export const OfertaAcademica = ({
  isAdmin,
  getVoiceProps,
  announce,
}) => {
  return (
    <OfertaAcademicaImport
      isAdmin={isAdmin}
      getVoiceProps={getVoiceProps}
      announce={announce}
    />
  );
};

export default OfertaAcademica;