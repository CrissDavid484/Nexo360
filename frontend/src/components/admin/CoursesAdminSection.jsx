import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Sparkles,
  Layers,
  Calendar,
  Building2,
  BookOpen,
  User,
  Check,
  X,
  FileText,
  Eye,
  Copy,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useAccessibility } from '../../context/AccessibilityContext';
import { CARRERAS_DUOC, CATALOGO_INFRAESTRUCTURA_TECNOLOGICA, ASIGNATURAS_DISPONIBLES } from '../../data/tomaRamosData';

/**
 * Utilidad para limpiar celdas de Markdown (elimina asteriscos negrita y espacios)
 */
const cleanMdCell = (cell) => {
  if (!cell) return '';
  return String(cell).replace(/^\*\*|\*\*$/g, '').trim();
};

/**
 * Parser de horarios en formato Markdown:
 * Soporta tanto tablas segmentadas horizontalmente (como 'ALAMEDA 2026 002.md')
 * como tablas Markdown unificadas tradicionales con todas las columnas juntas.
 */
const parseMarkdownSchedule = (mdText) => {
  const lines = mdText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return [];

  const isChunked = lines.some(
    (l) => l.includes('**Nombre Asignatura**') || l.includes('Nombre Asignatura')
  );

  // 1. Tabla Markdown unificada estándar
  if (!isChunked) {
    const tableLines = lines.filter(
      (l) => l.startsWith('|') && l.endsWith('|') && !l.includes(':-')
    );
    if (tableLines.length < 2) return [];

    const headerCells = tableLines[0]
      .split('|')
      .slice(1, -1)
      .map(cleanMdCell);

    const rows = [];
    for (let i = 1; i < tableLines.length; i++) {
      const cells = tableLines[i]
        .split('|')
        .slice(1, -1)
        .map(cleanMdCell);
      if (cells.length < 2) continue;

      const getVal = (possibleNames) => {
        const foundIdx = headerCells.findIndex((h) =>
          possibleNames.some(
            (p) => h.toLowerCase().replace(/[\s_.-]/g, '') === p.toLowerCase()
          )
        );
        return foundIdx !== -1 && cells[foundIdx] !== undefined ? cells[foundIdx] : '';
      };

      const sigla = getVal(['siglaasignatura', 'sigla', 'codigo']);
      const nombre = getVal(['nombreasignatura', 'nombre', 'asignatura']);
      const seccion = getVal(['seccion', 'sección']) || `${sigla}-001D`;

      if (sigla) {
        rows.push({
          sede: getVal(['sede']) || 'ALAMEDA',
          carrera: getVal(['carrera', 'nombrecarrera']) || 'INGENIERÍA DUOC UC',
          plan: getVal(['plan']) || '',
          jornada: getVal(['jornada']) || 'Diurno',
          sigla,
          nombre: nombre || sigla,
          nivel: getVal(['nivel', 'semestre']) || 'Optativos',
          seccion,
          horario: getVal(['horario', 'bloquehorario']) || '',
          docente: getVal(['docente', 'profesor']) || 'DOCENTE ASIGNADO',
          modalidad:
            getVal(['asignaturavirtualsincronica', 'modalidad', 'tipo']) || 'PRESENCIAL',
        });
      }
    }
    return rows;
  }

  // 2. Parser para tablas Markdown segmentadas horizontalmente (Duoc Alameda)
  const rows = [];
  const headerIndices = [];

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.includes('Sigla Asignatura') || l.includes('**Sigla**')) {
      headerIndices.push({ type: 'c1', idx: i });
    } else if (l.includes('Nombre Asignatura') && l.includes('Sección')) {
      headerIndices.push({ type: 'c2', idx: i });
    } else if (
      l.includes('Horario') &&
      (l.includes('Docente') || l.includes('VIRTUAL') || l.includes('SINCRONICA'))
    ) {
      headerIndices.push({ type: 'c3', idx: i });
    } else if (l.includes('Sección') && l.includes('Horario')) {
      headerIndices.push({ type: 'c23', idx: i });
    }
  }

  let p = 0;
  while (p < headerIndices.length) {
    const h1 = headerIndices[p];
    if (h1 && h1.type === 'c1') {
      const h2 = headerIndices[p + 1];
      const h3 = headerIndices[p + 2];

      if (h2 && h2.type === 'c2' && h3 && h3.type === 'c3') {
        const c1Rows = [];
        for (let j = h1.idx + 1; j < h2.idx; j++) {
          const l = lines[j];
          if (l.startsWith('|') && !l.includes(':-') && !l.includes('**')) {
            const cells = l.split('|').slice(1, -1).map(cleanMdCell);
            if (cells.length >= 5) {
              c1Rows.push({
                sede: cells[0] || 'ALAMEDA',
                carrera: cells[1] || 'INGENIERÍA DUOC UC',
                plan: cells[2] || '',
                jornada: cells[3] || 'Diurno',
                sigla: cells[4] || '',
              });
            }
          }
        }

        const c2Rows = [];
        for (let j = h2.idx + 1; j < h3.idx; j++) {
          const l = lines[j];
          if (l.startsWith('|') && !l.includes(':-') && !l.includes('**')) {
            const cells = l.split('|').slice(1, -1).map(cleanMdCell);
            if (cells.length >= 3) {
              c2Rows.push({
                nombre: cells[0] || '',
                nivel: cells[1] || 'Optativos',
                seccion: cells[2] || '',
              });
            }
          }
        }

        const endIdx = p + 3 < headerIndices.length ? headerIndices[p + 3].idx : lines.length;
        const c3Rows = [];
        for (let j = h3.idx + 1; j < endIdx; j++) {
          const l = lines[j];
          if (
            l.startsWith('|') &&
            !l.includes(':-') &&
            !l.includes('**') &&
            !l.includes('![')
          ) {
            const cells = l.split('|').slice(1, -1).map(cleanMdCell);
            if (cells.length >= 2) {
              c3Rows.push({
                horario: cells[0] || '',
                docente: cells[1] || 'DOCENTE ASIGNADO',
                modalidad: cells[2] || 'ONLINE SINCRONA',
              });
            }
          }
        }

        const minLen = Math.min(c1Rows.length, c2Rows.length, c3Rows.length);
        for (let k = 0; k < minLen; k++) {
          if (c1Rows[k].sigla) {
            rows.push({
              ...c1Rows[k],
              ...c2Rows[k],
              ...c3Rows[k],
            });
          }
        }
        p += 3;
        continue;
      } else if (h2 && h2.type === 'c23') {
        const c1Rows = [];
        for (let j = h1.idx + 1; j < h2.idx; j++) {
          const l = lines[j];
          if (l.startsWith('|') && !l.includes(':-') && !l.includes('**')) {
            const cells = l.split('|').slice(1, -1).map(cleanMdCell);
            if (cells.length >= 5) {
              c1Rows.push({
                sede: cells[0] || 'ALAMEDA',
                carrera: cells[1] || 'INGENIERÍA DUOC UC',
                plan: cells[2] || '',
                jornada: cells[3] || 'Diurno',
                sigla: cells[4] || '',
              });
            }
          }
        }

        const endIdx = p + 2 < headerIndices.length ? headerIndices[p + 2].idx : lines.length;
        const c23Rows = [];
        for (let j = h2.idx + 1; j < endIdx; j++) {
          const l = lines[j];
          if (l.startsWith('|') && !l.includes(':-') && !l.includes('**')) {
            const cells = l.split('|').slice(1, -1).map(cleanMdCell);
            if (cells.length >= 3) {
              c23Rows.push({
                seccion: cells[0] || '',
                horario: cells[1] || '',
                docente: cells[2] || 'DOCENTE ASIGNADO',
                nombre: cells[0] || '',
                nivel: 'Optativo',
                modalidad: 'PRESENCIAL',
              });
            }
          }
        }

        const minLen = Math.min(c1Rows.length, c23Rows.length);
        for (let k = 0; k < minLen; k++) {
          if (c1Rows[k].sigla) {
            rows.push({
              ...c1Rows[k],
              ...c23Rows[k],
            });
          }
        }
        p += 2;
        continue;
      }
    }
    p++;
  }

  return rows.filter((r) => r.sigla);
};

/**
 * Genera una representación limpia y unificada en formato Markdown (.md)
 * a partir de las filas de asignaturas procesadas.
 */
const generateCleanMarkdown = (rows, metadata = {}) => {
  const period = metadata.periodo || '2026 - 002';
  const campus = metadata.sede || 'ALAMEDA';
  const timestamp = new Date().toLocaleString('es-CL');

  let md = `# Oferta Académica Duoc UC - Sede ${campus}\n`;
  md += `**Período:** ${period} | **Generado:** ${timestamp} | **Total Registros:** ${rows.length}\n\n`;
  md += `| Sede | Carrera | Plan | Jornada | Sigla Asignatura | Nombre Asignatura | Nivel | Sección | Horario | Docente | Modalidad |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  for (const r of rows) {
    const esc = (v) => String(v || '').replace(/\|/g, '\\|').trim();
    md += `| ${esc(r.sede || campus)} | ${esc(r.carrera)} | ${esc(r.plan)} | ${esc(r.jornada)} | ${esc(r.sigla)} | ${esc(r.nombre)} | ${esc(r.nivel)} | ${esc(r.seccion)} | ${esc(r.horario)} | ${esc(r.docente)} | ${esc(r.modalidad)} |\n`;
  }
  return md;
};

export const CoursesAdminSection = () => {
  const { user } = useAuth();
  const { announce } = useAccessibility();

  // Permisos: Administrador general y Coordinador PAEDIS
  const userRole = user?.role?.toLowerCase() || '';
  const canManageCourses =
    userRole === 'admin' || userRole === 'administrador' || userRole === 'coordinador_paedis';

  // Estados de datos en servidor
  const [coursesSummary, setCoursesSummary] = useState(null);
  const [coursesList, setCoursesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Filtros de visualización
  const [selectedCareerFilter, setSelectedCareerFilter] = useState('TODAS');
  const [searchTerm, setSearchTerm] = useState('');

  // Carga de archivos (.xlsx, .xls, .csv, .md)
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [previewStats, setPreviewStats] = useState(null);
  const [cleanMarkdownContent, setCleanMarkdownContent] = useState('');
  const [isMdModalOpen, setIsMdModalOpen] = useState(false);
  const [isCopiedMd, setIsCopiedMd] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Checkbox: "Sobreescribir catálogo anterior" marcado por defecto (true)
  const [replaceCatalog, setReplaceCatalog] = useState(true);

  const fileInputRef = useRef(null);

  // Cargar resumen de asignaturas desde la API / Base de datos
  const loadCoursesData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [summaryRes, coursesRes] = await Promise.all([
        api.getAdminCoursesSummary().catch(() => null),
        api.getCourses({ periodo: '2026 - 002' }).catch(() => null),
      ]);

      if (summaryRes?.success) {
        setCoursesSummary(summaryRes.summary);
      } else {
        // Fallback local con datos sembrados
        setCoursesSummary({
          totalSecciones:
            CATALOGO_INFRAESTRUCTURA_TECNOLOGICA.reduce((a, c) => a + c.secciones.length, 0) +
            ASIGNATURAS_DISPONIBLES.reduce((a, c) => a + c.secciones.length, 0),
          totalAsignaturas:
            CATALOGO_INFRAESTRUCTURA_TECNOLOGICA.length + ASIGNATURAS_DISPONIBLES.length,
          totalCarreras: CARRERAS_DUOC.length,
          periodoActivo: '2026 - 002',
          careers: CARRERAS_DUOC.map((c) => ({
            carrera: c.nombre,
            plan: c.codigo,
            sede: c.sede,
            periodo: c.periodo,
            totalAsignaturas: c.nombre.includes('INFRAESTRUCTURA')
              ? CATALOGO_INFRAESTRUCTURA_TECNOLOGICA.length
              : ASIGNATURAS_DISPONIBLES.length,
            totalSecciones: c.nombre.includes('INFRAESTRUCTURA') ? 50 : 25,
          })),
        });
      }

      if (coursesRes?.success && coursesRes.courses) {
        setCoursesList(coursesRes.courses);
      } else {
        setCoursesList([...CATALOGO_INFRAESTRUCTURA_TECNOLOGICA, ...ASIGNATURAS_DISPONIBLES]);
      }
    } catch (err) {
      console.warn('Error cargando catálogo de cursos:', err);
      setCoursesList([...CATALOGO_INFRAESTRUCTURA_TECNOLOGICA, ...ASIGNATURAS_DISPONIBLES]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCoursesData();
  }, [loadCoursesData]);

  // Procesador unificado de archivos (.xlsx, .xls, .csv, .md)
  const processSelectedFile = (file) => {
    if (!file) return;

    setUploadedFileName(file.name);
    const fileNameLower = file.name.toLowerCase();
    const isMarkdown = fileNameLower.endsWith('.md') || fileNameLower.endsWith('.markdown');

    if (isMarkdown) {
      // Lectura como texto de archivo Markdown
      const textReader = new FileReader();
      textReader.onload = (event) => {
        try {
          const rawText = event.target.result;
          const mappedRows = parseMarkdownSchedule(rawText);

          if (!mappedRows || mappedRows.length === 0) {
            setFeedback({
              type: 'error',
              text: 'El archivo Markdown seleccionado no contiene una tabla de asignaturas reconocible o está vacío.',
            });
            announce('Error al procesar archivo Markdown: sin filas reconocidas.', 'assertive');
            return;
          }

          const distinctCarreras = Array.from(new Set(mappedRows.map((r) => r.carrera)));
          const distinctSiglas = Array.from(new Set(mappedRows.map((r) => r.sigla)));
          const distinctSecciones = Array.from(new Set(mappedRows.map((r) => r.seccion)));
          const distinctDocentes = Array.from(
            new Set(mappedRows.map((r) => r.docente).filter((d) => d && d !== 'DOCENTE ASIGNADO'))
          );

          setParsedRows(mappedRows);
          setPreviewStats({
            totalFilas: mappedRows.length,
            asignaturasUnicas: distinctSiglas.length,
            seccionesUnicas: distinctSecciones.length,
            carreras: distinctCarreras,
            docentesUnicos: distinctDocentes.length,
          });

          const cleanMd = generateCleanMarkdown(mappedRows, {
            periodo: '2026 - 002',
            sede: mappedRows[0]?.sede || 'ALAMEDA',
          });
          setCleanMarkdownContent(cleanMd);

          const successMsg = `Archivo Markdown "${file.name}" leído: ${mappedRows.length} registros, ${distinctSiglas.length} asignaturas únicas y ${distinctCarreras.length} carreras detectadas.`;
          setFeedback({
            type: 'success',
            text: successMsg,
          });
          announce(successMsg, 'polite');
        } catch (err) {
          console.error('Error parseando archivo Markdown:', err);
          setFeedback({
            type: 'error',
            text: `Error al procesar el archivo Markdown: ${err.message}`,
          });
          announce('Error procesando archivo Markdown.', 'assertive');
        }
      };
      textReader.readAsText(file, 'utf-8');
    } else {
      // Lectura como binario de Excel (.xlsx / .xls / .csv)
      const binaryReader = new FileReader();
      binaryReader.onload = (event) => {
        try {
          const data = new Uint8Array(event.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];

          const rawJson = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

          if (!rawJson || rawJson.length === 0) {
            setFeedback({
              type: 'error',
              text: 'El archivo Excel seleccionado está vacío o no contiene filas legibles.',
            });
            announce('Error: archivo Excel vacío.', 'assertive');
            return;
          }

          const mappedRows = rawJson
            .map((row) => {
              const keys = Object.keys(row);
              const getVal = (possibleNames) => {
                const foundKey = keys.find((k) =>
                  possibleNames.some(
                    (p) => k.trim().toLowerCase().replace(/[\s_.-]/g, '') === p.toLowerCase()
                  )
                );
                return foundKey ? String(row[foundKey]).trim() : '';
              };

              const sede = getVal(['sede']) || 'ALAMEDA';
              const carrera =
                getVal(['carrera', 'nombrecarrera']) || 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA';
              const plan = getVal(['plan', 'codigoplan']) || '1446815';
              const jornada = getVal(['jornada']) || 'Diurno';
              const sigla = getVal(['siglaasignatura', 'sigla', 'codigo']) || '';
              const nombre = getVal(['nombreasignatura', 'nombre', 'asignatura']) || '';
              const nivel = getVal(['nivel', 'semestre']) || 'Optativos';
              const seccion = getVal(['seccion', 'sección']) || `${sigla}-001D`;
              const horario = getVal(['horario', 'bloquehorario']) || '';
              const docente = getVal(['docente', 'profesor']) || 'DOCENTE ASIGNADO';
              const modalidad =
                getVal(['asignaturavirtualsincronica', 'modalidad', 'tipo']) || 'ONLINE SINCRONA';

              return {
                sede,
                carrera,
                plan,
                jornada,
                sigla,
                nombre,
                nivel,
                seccion,
                horario,
                docente,
                modalidad,
              };
            })
            .filter((r) => r.sigla && r.nombre);

          if (mappedRows.length === 0) {
            setFeedback({
              type: 'error',
              text: 'No se reconocieron columnas de asignaturas (Sigla Asignatura, Nombre Asignatura, Sección, Horario). Revisa la plantilla oficial.',
            });
            announce('Error: Columnas de asignaturas no encontradas en el archivo Excel.', 'assertive');
            return;
          }

          const distinctCarreras = Array.from(new Set(mappedRows.map((r) => r.carrera)));
          const distinctSiglas = Array.from(new Set(mappedRows.map((r) => r.sigla)));
          const distinctSecciones = Array.from(new Set(mappedRows.map((r) => r.seccion)));
          const distinctDocentes = Array.from(
            new Set(mappedRows.map((r) => r.docente).filter((d) => d && d !== 'DOCENTE ASIGNADO'))
          );

          setParsedRows(mappedRows);
          setPreviewStats({
            totalFilas: mappedRows.length,
            asignaturasUnicas: distinctSiglas.length,
            seccionesUnicas: distinctSecciones.length,
            carreras: distinctCarreras,
            docentesUnicos: distinctDocentes.length,
          });

          // Generación de representación limpia en Markdown
          const cleanMd = generateCleanMarkdown(mappedRows, {
            periodo: '2026 - 002',
            sede: mappedRows[0]?.sede || 'ALAMEDA',
          });
          setCleanMarkdownContent(cleanMd);

          const successMsg = `Archivo Excel "${file.name}" leído: ${mappedRows.length} registros, ${distinctSiglas.length} asignaturas únicas y ${distinctCarreras.length} carreras detectadas. Representación Markdown limpia generada.`;
          setFeedback({
            type: 'success',
            text: successMsg,
          });
          announce(successMsg, 'polite');
        } catch (err) {
          console.error('Error parseando archivo Excel:', err);
          setFeedback({
            type: 'error',
            text: `Error al procesar el archivo Excel: ${err.message}`,
          });
          announce('Error procesando archivo Excel.', 'assertive');
        }
      };
      binaryReader.readAsArrayBuffer(file);
    }
  };

  // Manejo de eventos drag & drop accesibles
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      processSelectedFile(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  // Guardar filas procesadas en la Base de Datos
  const handleImportToDatabase = async () => {
    if (!parsedRows || parsedRows.length === 0) return;
    if (!canManageCourses) {
      setFeedback({
        type: 'error',
        text: 'Acceso denegado: Se requiere rol de Administrador o Coordinador PAEDIS para modificar el catálogo.',
      });
      announce('Acceso denegado para guardar catálogo.', 'assertive');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.importAdminCourses(parsedRows, replaceCatalog, cleanMarkdownContent);
      if (res?.success) {
        const successMsg = `¡Catálogo guardado en Base de Datos! Se importaron ${
          res.result?.seccionesImportadas || parsedRows.length
        } secciones para ${res.result?.carrerasDetectadas?.length || 1} carreras.${
          replaceCatalog ? ' El catálogo anterior fue reemplazado de forma limpia.' : ''
        }`;
        setFeedback({
          type: 'success',
          text: successMsg,
        });
        announce(successMsg, 'polite');
        setParsedRows([]);
        setPreviewStats(null);
        setUploadedFileName('');
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadCoursesData();
      } else {
        setFeedback({
          type: 'error',
          text: res?.message || 'Error al guardar asignaturas en la base de datos.',
        });
        announce('Error al guardar asignaturas.', 'assertive');
      }
    } catch (err) {
      console.error('Error al importar:', err);
      setFeedback({
        type: 'error',
        text: 'Error de conexión con el servidor backend al importar cursos.',
      });
      announce('Error de conexión al importar cursos.', 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Descargar Plantilla Excel Oficial preformateada
  const handleDownloadTemplate = () => {
    try {
      const sampleData = [
        {
          Sede: 'ALAMEDA',
          Carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
          Plan: '1446815',
          Jornada: 'Diurno',
          'Sigla Asignatura': 'OCY1104',
          'Nombre Asignatura': 'CIBERSEGURIDAD OFENSIVA',
          Nivel: 'Optativos',
          Sección: 'OCY1104-001D',
          Horario: 'Lu 8:31:00 - 9:50:00',
          Docente: 'JOSE ERASMO MATUS',
          'ASIGNATURA VIRTUAL SINCRONICA': 'ONLINE SINCRONA',
        },
        {
          Sede: 'ALAMEDA',
          Carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
          Plan: '1446815',
          Jornada: 'Diurno',
          'Sigla Asignatura': 'OCY1104',
          'Nombre Asignatura': 'CIBERSEGURIDAD OFENSIVA',
          Nivel: 'Optativos',
          Sección: 'OCY1104-001D',
          Horario: 'Lu 10:01:00 - 11:20:00',
          Docente: 'JOSE ERASMO MATUS',
          'ASIGNATURA VIRTUAL SINCRONICA': 'ONLINE SINCRONA',
        },
        {
          Sede: 'ALAMEDA',
          Carrera: 'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
          Plan: '1446815',
          Jornada: 'Diurno',
          'Sigla Asignatura': 'DOY0101',
          'Nombre Asignatura': 'INGENIERÍA DEVOPS',
          Nivel: 'Optativos',
          Sección: 'DOY0101-001D',
          Horario: 'Ma 16:01:00 - 17:20:00',
          Docente: 'CRISTIAN ANDRES BUGUEÑO',
          'ASIGNATURA VIRTUAL SINCRONICA': 'ONLINE SINCRONA',
        },
        {
          Sede: 'ALAMEDA',
          Carrera: 'INGENIERÍA EN INFORMÁTICA',
          Plan: '1446114',
          Jornada: 'Diurno',
          'Sigla Asignatura': 'PTY4614',
          'Nombre Asignatura': 'PROYECTO CAPSTONE',
          Nivel: 'Semestre 8',
          Sección: 'PTY4614-001D',
          Horario: 'Mi 8:31:00 - 9:50:00',
          Docente: 'MAURICIO GÓMEZ ARRATIA',
          'ASIGNATURA VIRTUAL SINCRONICA': 'PRESENCIAL',
        },
      ];

      const ws = XLSX.utils.json_to_sheet(sampleData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Oferta_2026_002');
      XLSX.writeFile(wb, 'Plantilla_DuocUC_Toma_Ramos_2026.xlsx');

      const msg = 'Plantilla oficial de Excel descargada ("Plantilla_DuocUC_Toma_Ramos_2026.xlsx").';
      setFeedback({ type: 'success', text: msg });
      announce(msg, 'polite');
    } catch (err) {
      console.error('Error descargando plantilla:', err);
    }
  };

  // Descargar el Markdown limpio generado como archivo .md
  const handleDownloadCleanMarkdown = () => {
    if (!cleanMarkdownContent) return;

    try {
      const blob = new Blob([cleanMarkdownContent], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const filename = uploadedFileName
        ? `Limpio_${uploadedFileName.replace(/\.[^/.]+$/, '')}.md`
        : 'Catalogo_Limpio_DuocUC_Alameda_2026_002.md';

      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const msg = `Archivo Markdown descargado con éxito: ${filename}`;
      setFeedback({ type: 'success', text: msg });
      announce(msg, 'polite');
    } catch (err) {
      console.error('Error descargando archivo Markdown:', err);
    }
  };

  // Copiar Markdown al portapapeles
  const handleCopyMarkdown = async () => {
    if (!cleanMarkdownContent) return;

    try {
      await navigator.clipboard.writeText(cleanMarkdownContent);
      setIsCopiedMd(true);
      announce('Contenido Markdown copiado al portapapeles.', 'polite');
      setTimeout(() => setIsCopiedMd(false), 3000);
    } catch (err) {
      console.warn('Error copiando al portapapeles:', err);
    }
  };

  // Restaurar semilla oficial 2026-002
  const handleSeedOfficialData = async () => {
    if (!canManageCourses) {
      setFeedback({
        type: 'error',
        text: 'Acceso denegado: Se requiere rol de Administrador o Coordinador PAEDIS para restaurar el catálogo semilla.',
      });
      announce('Acceso denegado para restaurar catálogo.', 'assertive');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.seedAdminCourses();
      const msg = 'Catálogo oficial semilla 2026-002 restaurado correctamente en la Base de Datos.';
      setFeedback({
        type: 'success',
        text: msg,
      });
      announce(msg, 'polite');
      await loadCoursesData();
    } catch (err) {
      setFeedback({
        type: 'error',
        text: 'Error al restaurar el catálogo semilla.',
      });
      announce('Error al restaurar el catálogo semilla.', 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrado reactivo de asignaturas para la tabla
  const filteredCourses = useMemo(() => {
    return coursesList.filter((course) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !searchTerm.trim() ||
        course.sigla?.toLowerCase().includes(q) ||
        course.nombre?.toLowerCase().includes(q) ||
        course.secciones?.some(
          (s) => s.profesor?.toLowerCase().includes(q) || s.seccion?.toLowerCase().includes(q)
        );

      const matchesCareer =
        selectedCareerFilter === 'TODAS' ||
        (course.carrera &&
          course.carrera.toLowerCase().includes(selectedCareerFilter.toLowerCase()));

      return matchesSearch && matchesCareer;
    });
  }, [coursesList, searchTerm, selectedCareerFilter]);

  return (
    <article aria-labelledby="courses-admin-title" className="space-y-6">
      {/* 1. Alertas de Estado y Feedback Accesibles */}
      {feedback && (
        <section
          role="status"
          aria-live="polite"
          className={`p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-xs transition-all ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-red-50 border-red-300 text-red-950'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" aria-hidden="true" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" aria-hidden="true" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="min-h-[44px] min-w-[44px] text-slate-600 hover:text-slate-950 p-2 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 flex items-center justify-center cursor-pointer"
            aria-label="Cerrar notificación"
          >
            <X className="w-4 h-4" />
          </button>
        </section>
      )}

      {/* Aviso de Modo Consulta si no es Administrador ni Coordinador */}
      {!canManageCourses && (
        <section
          aria-label="Aviso de permisos de rol"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex items-start gap-3 text-xs sm:text-sm font-medium shadow-2xs"
        >
          <ShieldAlert className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <span className="font-black text-amber-950 block">
              Modo de Solo Consulta (Rol:{' '}
              {user?.roleLabel || user?.role || 'Estudiante / Tutor Institucional'})
            </span>
            <p className="mt-0.5 text-amber-900 leading-relaxed">
              Puedes examinar la oferta horaria, procesar archivos para generar vistas previas y
              descargar representaciones limpias en Markdown (.md). Las acciones de sobreescritura y
              modificación en base de datos están reservadas para la Coordinación PAEDIS y
              Administradores.
            </p>
          </div>
        </section>
      )}

      {/* 2. Tarjetas KPI de Oferta Académica Almacenada */}
      <section
        aria-labelledby="kpi-heading"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <h2 id="kpi-heading" className="sr-only">
          Indicadores generales de oferta académica
        </h2>

        <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-2xs">
          <header className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
              Secciones en BD
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#002B49] flex items-center justify-center">
              <Layers className="w-4 h-4" aria-hidden="true" />
            </div>
          </header>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {coursesSummary?.totalSecciones || 0}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
            Oferta horaria disponible
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-2xs">
          <header className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
              Asignaturas Únicas
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center">
              <BookOpen className="w-4 h-4" aria-hidden="true" />
            </div>
          </header>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {coursesSummary?.totalAsignaturas || 0}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
            Ramos catalogados
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-2xs">
          <header className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
              Carreras Activas
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-900 flex items-center justify-center">
              <Building2 className="w-4 h-4" aria-hidden="true" />
            </div>
          </header>
          <p className="mt-2 text-2xl font-black text-slate-950">
            {coursesSummary?.totalCarreras || CARRERAS_DUOC.length}
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
            Planes de estudio configurados
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-300 shadow-2xs">
          <header className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-700">
              Período de Toma
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-900 flex items-center justify-center">
              <Calendar className="w-4 h-4" aria-hidden="true" />
            </div>
          </header>
          <p className="mt-2 text-2xl font-black text-slate-950">2026 - 002</p>
          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
            Sede Alameda • Segundo Semestre
          </p>
        </div>
      </section>

      {/* 3. Panel de Carga de Archivos (.xlsx y .md) */}
      <section
        aria-labelledby="upload-section-title"
        className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-300 shadow-2xs space-y-6"
      >
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-950 border border-emerald-300 mb-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Importador Oficial de Ramos (Excel & Markdown)</span>
            </div>
            <h2 id="upload-section-title" className="text-lg sm:text-xl font-bold text-slate-950">
              Actualizar Oferta Académica desde Archivos .XLSX o .MD
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-3xl leading-relaxed">
              Carga la oferta horaria oficial en formato <strong>Excel (.xlsx / .csv)</strong> o{' '}
              <strong>Markdown (.md)</strong> de Duoc UC Alameda. El sistema analiza la estructura,
              reconstruye secciones y genera una representación limpia en Markdown para su descarga
              o incorporación a la base de datos.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 inline-flex items-center gap-2 border border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer"
              title="Descargar plantilla de Excel preformateada para carga de ramos"
            >
              <Download className="w-4 h-4 text-slate-700" aria-hidden="true" />
              <span>Descargar Plantilla Excel</span>
            </button>

            <button
              type="button"
              onClick={handleSeedOfficialData}
              disabled={isSubmitting || !canManageCourses}
              aria-disabled={isSubmitting || !canManageCourses}
              className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 border transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
                canManageCourses
                  ? 'bg-blue-50 hover:bg-blue-100 text-[#002B49] border-blue-300 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-60'
              }`}
              title={
                canManageCourses
                  ? 'Restaura el catálogo oficial con las asignaturas Alameda 2026-002'
                  : 'Acción restringida a Administradores y Coordinación PAEDIS'
              }
            >
              <Sparkles className="w-4 h-4 text-amber-500" aria-hidden="true" />
              <span>Restaurar Catálogo Oficial 2026</span>
            </button>
          </div>
        </header>

        {/* Zona de Arrastrar y Soltar o Selector de Archivo */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-6 sm:p-9 text-center transition-all ${
            isDragging
              ? 'border-[#002B49] bg-blue-100/60 ring-4 ring-amber-300'
              : 'border-slate-400 hover:border-[#002B49] bg-slate-50/80 hover:bg-blue-50/40'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            id="course-file-input"
            accept=".xlsx, .xls, .csv, .md, .markdown, text/markdown, text/plain"
            onChange={handleFileInputChange}
            className="sr-only"
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-[#002B49] text-[#FFB81C] flex items-center justify-center shadow-md">
              <UploadCloud className="w-8 h-8" aria-hidden="true" />
            </div>

            <label
              htmlFor="course-file-input"
              className="text-sm sm:text-base font-bold text-slate-900 cursor-pointer hover:text-[#002B49] hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 rounded-lg px-2 py-1"
            >
              {uploadedFileName ? (
                <span className="text-[#002B49] font-black underline">
                  Archivo cargado: {uploadedFileName}
                </span>
              ) : (
                'Haz clic aquí para seleccionar o arrastra tu archivo .XLSX o .MD'
              )}
            </label>

            <p className="text-xs text-slate-600 max-w-xl">
              Formatos aceptados: <strong>.xlsx, .xls, .csv y .md</strong> (Markdown con tablas de
              Sede Alameda, Sigla, Asignatura, Sección, Horario y Docente).
            </p>
          </div>
        </div>

        {/* Resumen de Filas Detectadas, Previsualización y Control de Sobreescritura */}
        {previewStats && parsedRows.length > 0 && (
          <section
            aria-labelledby="preview-stats-heading"
            className="p-5 rounded-2xl bg-amber-50/90 border border-amber-300 space-y-5 animate-fade-in"
          >
            <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-amber-200/80 pb-4">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-md text-[11px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 mb-1">
                  Archivo Analizado Exitosamente
                </span>
                <h3
                  id="preview-stats-heading"
                  className="text-base sm:text-lg font-black text-amber-950"
                >
                  Vista Previa: {uploadedFileName}
                </h3>
                <p className="text-xs text-amber-900 mt-0.5">
                  Estructura validada y normalizada para el simulador de Toma de Ramos.
                </p>
              </div>

              {/* Botones de Visualización y Descarga del Markdown Limpio */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMdModalOpen(true)}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-[#002B49] border border-blue-300 shadow-2xs inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer"
                  title="Ver la representación limpia en formato Markdown (.md)"
                >
                  <Eye className="w-4 h-4 text-[#002B49]" aria-hidden="true" />
                  <span>Ver Markdown Limpio (.md)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCleanMarkdown}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-black bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 shadow-2xs inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer"
                  title="Descargar la representación limpia en archivo .md"
                >
                  <Download className="w-4 h-4 text-slate-700" aria-hidden="true" />
                  <span>Descargar .md</span>
                </button>
              </div>
            </header>

            {/* Estadísticas de Vista Previa (KPIs) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Total Registros / Filas
                </span>
                <span className="text-xl font-black text-slate-900">
                  {previewStats.totalFilas.toLocaleString('es-CL')}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Asignaturas Únicas
                </span>
                <span className="text-xl font-black text-slate-900">
                  {previewStats.asignaturasUnicas}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Secciones Únicas
                </span>
                <span className="text-xl font-black text-slate-900">
                  {previewStats.seccionesUnicas}
                </span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-amber-200">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Carreras Detectadas
                </span>
                <span className="text-xl font-black text-slate-900">
                  {previewStats.carreras.length}
                </span>
              </div>
            </div>

            {/* Listado de Carreras detectadas */}
            <div className="p-3 bg-white/80 rounded-xl border border-amber-200 text-xs">
              <span className="font-bold text-amber-950 block mb-1">
                Carreras identificadas en el archivo:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {previewStats.carreras.map((c, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-950 text-[11px] font-semibold border border-amber-300"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>

            {/* Switch / Checkbox de Sobreescritura y Botón Guardar en BD */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-amber-200/80">
              {/* Checkbox de Sobreescritura marcado por defecto */}
              <label
                htmlFor="replace-catalog-switch"
                className={`min-h-[44px] flex items-center gap-3 p-2 rounded-xl transition-colors select-none ${
                  canManageCourses ? 'cursor-pointer hover:bg-amber-100/60' : 'cursor-not-allowed opacity-60'
                }`}
              >
                <input
                  type="checkbox"
                  id="replace-catalog-switch"
                  checked={replaceCatalog}
                  onChange={(e) => canManageCourses && setReplaceCatalog(e.target.checked)}
                  disabled={!canManageCourses}
                  aria-disabled={!canManageCourses}
                  className="w-5 h-5 rounded border-2 border-slate-400 text-[#002B49] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer"
                />
                <div className="text-xs">
                  <span className="font-black text-slate-900 block">
                    Sobreescribir catálogo anterior (eliminar datos del año previo)
                  </span>
                  <span className="text-[11px] text-slate-600 block">
                    Limpia registros previos en la base de datos para evitar ramos duplicados u
                    obsoletos.
                  </span>
                </div>
              </label>

              <button
                type="button"
                onClick={handleImportToDatabase}
                disabled={isSubmitting || !canManageCourses}
                aria-disabled={isSubmitting || !canManageCourses}
                title={
                  canManageCourses
                    ? 'Guardar los datos procesados en la Base de Datos oficial de Nexo360'
                    : 'Acción restringida a Administradores y Coordinación PAEDIS'
                }
                className={`min-h-[44px] px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-md transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 ${
                  canManageCourses
                    ? 'bg-[#002B49] hover:bg-blue-950 text-white cursor-pointer'
                    : 'bg-slate-300 text-slate-600 cursor-not-allowed opacity-60'
                }`}
              >
                {isSubmitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-400" aria-hidden="true" />
                ) : (
                  <Check className="w-4 h-4 text-amber-400" aria-hidden="true" />
                )}
                <span>Guardar en Base de Datos</span>
              </button>
            </div>

            {/* Muestra de las primeras 5 filas parseadas */}
            <div className="overflow-x-auto rounded-xl border border-amber-300 bg-white shadow-2xs">
              <table className="w-full text-left text-xs" role="table">
                <caption className="sr-only">
                  Muestra preliminar de las primeras asignaturas analizadas
                </caption>
                <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                  <tr>
                    <th scope="col" className="p-2.5">
                      Sigla
                    </th>
                    <th scope="col" className="p-2.5">
                      Asignatura
                    </th>
                    <th scope="col" className="p-2.5">
                      Carrera
                    </th>
                    <th scope="col" className="p-2.5">
                      Sección
                    </th>
                    <th scope="col" className="p-2.5">
                      Horario
                    </th>
                    <th scope="col" className="p-2.5">
                      Docente
                    </th>
                    <th scope="col" className="p-2.5">
                      Modalidad
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                  {parsedRows.slice(0, 5).map((row, idx) => (
                    <tr key={idx} className="hover:bg-amber-50/50">
                      <td className="p-2.5 font-mono font-black text-[#002B49]">{row.sigla}</td>
                      <td className="p-2.5 font-bold text-slate-950">{row.nombre}</td>
                      <td className="p-2.5 text-slate-600 text-[11px]">{row.carrera}</td>
                      <td className="p-2.5 font-mono text-xs">{row.seccion}</td>
                      <td className="p-2.5 text-[11px] font-mono text-slate-700">{row.horario}</td>
                      <td className="p-2.5 text-[11px]">{row.docente}</td>
                      <td className="p-2.5 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-[#002B49] font-bold text-[10px]">
                          {row.modalidad}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </section>

      {/* 4. Explorador del Catálogo Almacenado en Base de Datos */}
      <section
        aria-labelledby="catalog-list-heading"
        className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-300 shadow-2xs space-y-5"
      >
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 id="catalog-list-heading" className="text-base sm:text-lg font-bold text-slate-950">
              Asignaturas Almacenadas en Base de Datos
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-0.5">
              Visualiza los ramos y secciones que los estudiantes verán en el simulador según su
              carrera.
            </p>
          </div>

          <button
            type="button"
            onClick={loadCoursesData}
            aria-label="Refrescar lista de cursos desde el servidor"
            className="min-h-[44px] px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-xl inline-flex items-center gap-2 transition-colors self-start sm:self-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer border border-slate-300"
          >
            <RefreshCw
              className={`w-4 h-4 text-slate-700 ${isLoading ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>Refrescar Lista</span>
          </button>
        </header>

        {/* Barra de Filtros Accesible */}
        <fieldset className="grid grid-cols-1 md:grid-cols-12 gap-3 border-0 p-0 m-0">
          <legend className="sr-only">Filtros de búsqueda de asignaturas</legend>

          <div className="md:col-span-6 relative">
            <label htmlFor="course-search-input" className="sr-only">
              Buscar asignatura, sigla, sección o profesor
            </label>
            <Search
              className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="course-search-input"
              type="text"
              placeholder="Buscar por sigla, asignatura, sección o profesor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full min-h-[44px] pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-950 placeholder:text-slate-500 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
            />
          </div>

          <div className="md:col-span-6 flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 shrink-0" aria-hidden="true" />
            <label htmlFor="career-filter-select" className="sr-only">
              Filtrar por Carrera
            </label>
            <select
              id="career-filter-select"
              value={selectedCareerFilter}
              onChange={(e) => setSelectedCareerFilter(e.target.value)}
              className="w-full min-h-[44px] py-2 px-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
            >
              <option value="TODAS">
                Todas las Carreras ({coursesSummary?.careers?.length || CARRERAS_DUOC.length})
              </option>
              {CARRERAS_DUOC.map((c) => (
                <option key={c.codigo} value={c.nombre}>
                  {c.nombreCorto} ({c.codigo})
                </option>
              ))}
            </select>
          </div>
        </fieldset>

        {/* Tabla Accesible de Asignaturas */}
        <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-2xs">
          <table className="w-full text-left text-xs" role="table">
            <caption className="sr-only">
              Catálogo actual de asignaturas almacenadas en la base de datos de Nexo360
            </caption>
            <thead className="bg-[#002B49] text-white font-bold">
              <tr>
                <th scope="col" className="p-3.5">
                  Sigla
                </th>
                <th scope="col" className="p-3.5">
                  Nombre de la Asignatura
                </th>
                <th scope="col" className="p-3.5">
                  Créditos / Tipo
                </th>
                <th scope="col" className="p-3.5">
                  Secciones Disponibles
                </th>
                <th scope="col" className="p-3.5">
                  Horarios & Docentes
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-900">
              {filteredCourses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-600 font-medium">
                    No se encontraron asignaturas que coincidan con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredCourses.map((course) => (
                  <tr key={course.sigla} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3.5 font-mono font-black text-[#002B49] align-top">
                      <span className="px-2 py-1 bg-blue-50 border border-blue-200 rounded-lg">
                        {course.sigla}
                      </span>
                    </td>
                    <td className="p-3.5 font-bold align-top">
                      <div className="text-slate-950">{course.nombre}</div>
                      <div className="text-[11px] text-slate-600 font-normal mt-0.5">
                        {course.carrera || 'Ingeniería Duoc UC'}
                      </div>
                    </td>
                    <td className="p-3.5 align-top font-medium">
                      <span className="font-bold text-slate-950">{course.creditos} cr</span>
                      <span className="block text-[10px] uppercase font-bold text-slate-500 mt-0.5">
                        {course.tipo || 'Optativo'}
                      </span>
                    </td>
                    <td className="p-3.5 align-top">
                      <span className="inline-block px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-bold text-[11px]">
                        {course.secciones?.length || 0} sección(es)
                      </span>
                    </td>
                    <td className="p-3.5 align-top space-y-1">
                      {course.secciones?.slice(0, 3).map((sec, sIdx) => (
                        <div
                          key={sIdx}
                          className="text-[11px] p-2 rounded-lg bg-slate-50 border border-slate-300"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-[#002B49]">
                              Sec: {sec.seccion}
                            </span>
                            <span className="text-[10px] text-slate-600 font-medium">
                              {sec.sala}
                            </span>
                          </div>
                          <div className="text-slate-700 font-medium text-[10px] mt-0.5">
                            {sec.profesor} • <em>{sec.horarioTexto}</em>
                          </div>
                        </div>
                      ))}
                      {course.secciones?.length > 3 && (
                        <span className="text-[10px] text-slate-500 font-semibold block">
                          +{course.secciones.length - 3} secciones adicionales...
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 5. Modal Accesible de Vista Previa Markdown (.md) */}
      {isMdModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="md-modal-title"
          className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
        >
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-300 overflow-hidden">
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
                    Tabla estructurada y normalizada lista para auditoría, git o descarga oficial.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyMarkdown}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer"
                  title="Copiar contenido Markdown al portapapeles"
                >
                  {isCopiedMd ? (
                    <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-700" aria-hidden="true" />
                  )}
                  <span>{isCopiedMd ? '¡Copiado!' : 'Copiar'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCleanMarkdown}
                  className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold bg-[#002B49] hover:bg-blue-950 text-white inline-flex items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 cursor-pointer"
                  title="Descargar archivo .md"
                >
                  <Download className="w-4 h-4 text-amber-400" aria-hidden="true" />
                  <span>Descargar .md</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsMdModalOpen(false)}
                  className="min-h-[44px] min-w-[44px] p-2 text-slate-600 hover:text-slate-950 rounded-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2 flex items-center justify-center cursor-pointer"
                  aria-label="Cerrar modal de vista previa Markdown"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </header>

            <main className="p-4 sm:p-6 overflow-y-auto font-mono text-xs text-slate-900 bg-slate-900 text-slate-100 rounded-b-3xl">
              <pre className="whitespace-pre-wrap leading-relaxed select-all">
                {cleanMarkdownContent || 'Sin contenido Markdown disponible.'}
              </pre>
            </main>
          </div>
        </div>
      )}
    </article>
  );
};
