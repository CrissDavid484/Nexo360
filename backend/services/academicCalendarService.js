const zlib = require('zlib');
const mongoose = require('mongoose');
const AcademicCalendar = require('../models/AcademicCalendar');
const seedCalendars = require('../data/academicCalendarsSeed.json');

const CHILE_TIMEZONE = 'America/Santiago';

// Respaldo en memoria inicializado con los calendarios oficiales 2026-2027
const inMemoryCalendars = new Map(
  seedCalendars.map((cal) => [Number(cal.year), structuredClone(cal)])
);

function getChileDateString(date = new Date()) {
  if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
    return date.trim();
  }
  const d = date instanceof Date ? date : new Date(date);
  if (Number.isNaN(d.getTime())) {
    return getChileDateString(new Date());
  }
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: CHILE_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

function diffDaysUtc(startYmd, endYmd) {
  const [sy, sm, sd] = String(startYmd).split('-').map(Number);
  const [ey, em, ed] = String(endYmd).split('-').map(Number);
  const sMs = Date.UTC(sy, sm - 1, sd);
  const eMs = Date.UTC(ey, em - 1, ed);
  return Math.floor((eMs - sMs) / 86400000);
}

function addDaysYmd(ymd, deltaDays) {
  const [y, m, d] = String(ymd).split('-').map(Number);
  const next = new Date(Date.UTC(y, m - 1, d + deltaDays));
  const ny = next.getUTCFullYear();
  const nm = String(next.getUTCMonth() + 1).padStart(2, '0');
  const nd = String(next.getUTCDate()).padStart(2, '0');
  return `${ny}-${nm}-${nd}`;
}

function computeTotalWeeks(startYmd, endYmd) {
  if (!startYmd || !endYmd) return 18;
  const days = diffDaysUtc(startYmd, endYmd);
  return Math.max(1, Math.floor(Math.max(0, days) / 7) + 1);
}

async function ensureSeedCalendars() {
  for (const cal of seedCalendars) {
    if (!inMemoryCalendars.has(cal.year)) {
      inMemoryCalendars.set(cal.year, structuredClone(cal));
    }
    if (mongoose.connection.readyState === 1) {
      try {
        const existing = await AcademicCalendar.findOne({ year: cal.year });
        if (!existing) {
          await AcademicCalendar.create(cal);
        } else if (existing.updatedBy === 'system' && Array.isArray(existing.semesters)) {
          // Sincronizar duración oficial (18 semanas) en calendarios sembrados automáticamente
          let changed = false;
          for (const seedSem of cal.semesters || []) {
            const match = existing.semesters.find((s) => s.semester === seedSem.semester);
            if (match && match.totalWeeks !== seedSem.totalWeeks) {
              match.totalWeeks = seedSem.totalWeeks;
              changed = true;
            }
          }
          if (changed) {
            await existing.save();
          }
        }
      } catch (err) {
        console.warn('[AcademicCalendar] Error sembrando año', cal.year, err.message);
      }
    }
  }
}

async function getAllCalendars() {
  if (mongoose.connection.readyState === 1) {
    try {
      const docs = await AcademicCalendar.find({}).sort({ year: 1 }).lean();
      if (docs.length > 0) return docs;
      await ensureSeedCalendars();
      const seeded = await AcademicCalendar.find({}).sort({ year: 1 }).lean();
      if (seeded.length > 0) return seeded;
    } catch (err) {
      console.warn('[AcademicCalendar] Fallback a calendario en memoria:', err.message);
    }
  }
  return Array.from(inMemoryCalendars.values()).sort((a, b) => a.year - b.year);
}

function resolveAcademicWeekStatus(referenceDate = new Date(), calendarsList = null) {
  const calendars = Array.isArray(calendarsList) && calendarsList.length > 0
    ? [...calendarsList].sort((a, b) => a.year - b.year)
    : Array.from(inMemoryCalendars.values()).sort((a, b) => a.year - b.year);

  const dateStr = getChileDateString(referenceDate);
  const numericYear = Number.parseInt(dateStr.slice(0, 4), 10);
  const calendar = calendars.find((c) => Number(c.year) === numericYear) || null;

  if (!calendar) {
    return {
      date: dateStr,
      year: numericYear,
      semester: null,
      semesterCode: '',
      weekNumber: null,
      totalWeeks: null,
      phase: 'UNAVAILABLE',
      isWeekZero: false,
      firstYearOnly: false,
      label: 'Calendario Académico no disponible',
      detail: '',
      upperYearNote: '',
    };
  }

  const sem1 = (calendar.semesters || []).find((s) => s.semester === 1);
  const sem2 = (calendar.semesters || []).find((s) => s.semester === 2);

  // 1. Temporada Académica Extraordinaria de Verano (TAV)
  if (calendar.tav?.start && calendar.tav?.end && dateStr >= calendar.tav.start && dateStr <= calendar.tav.end) {
    const weekNumber = Math.floor(diffDaysUtc(calendar.tav.start, dateStr) / 7) + 1;
    const totalWeeks = computeTotalWeeks(calendar.tav.start, calendar.tav.end);
    return {
      date: dateStr,
      year: calendar.year,
      semester: 0,
      semesterCode: `${calendar.year}-TAV`,
      weekNumber,
      totalWeeks,
      phase: 'TAV',
      isWeekZero: false,
      firstYearOnly: false,
      label: `Verano (TAV) • Semana ${weekNumber}`,
      detail: `Temporada Académica de Verano (${calendar.tav.start} al ${calendar.tav.end})`,
      upperYearNote: '',
      calendarResolution: calendar.resolution,
    };
  }

  // 2. Semana 0 — exclusiva de 1° año en 1° Semestre
  if (sem1?.weekZeroStart && sem1?.weekZeroEnd && dateStr >= sem1.weekZeroStart && dateStr <= sem1.weekZeroEnd) {
    return {
      date: dateStr,
      year: calendar.year,
      semester: 1,
      semesterCode: sem1.code || `${calendar.year}-1`,
      weekNumber: 0,
      totalWeeks: sem1.totalWeeks || computeTotalWeeks(sem1.classesStart, sem1.classesEnd),
      phase: 'WEEK_ZERO',
      isWeekZero: true,
      firstYearOnly: true,
      label: 'Semana 0 (1° Año) • 1° Semestre',
      detail: `Inducción exclusiva estudiantes de 1° año (${sem1.weekZeroStart} al ${sem1.weekZeroEnd})`,
      upperYearNote: `Cursos superiores inician clases en Semana 1 (${sem1.classesStart})`,
      milestones: sem1,
      calendarResolution: calendar.resolution,
    };
  }

  // 3. Clases o Exámenes de 1° o 2° Semestre (conteo reinicia en Semana 1 al empezar el 2° Semestre)
  for (const sem of [sem1, sem2].filter(Boolean)) {
    const activeEnd =
      sem.examsEnd && (!sem.classesEnd || sem.examsEnd > sem.classesEnd)
        ? sem.examsEnd
        : sem.classesEnd;
    if (sem.classesStart && activeEnd && dateStr >= sem.classesStart && dateStr <= activeEnd) {
      const totalWeeks = sem.totalWeeks || computeTotalWeeks(sem.classesStart, sem.classesEnd);
      const rawWeek = Math.floor(diffDaysUtc(sem.classesStart, dateStr) / 7) + 1;
      const weekNumber = Math.min(rawWeek, totalWeeks);
      const inExams = Boolean(sem.examsStart && sem.examsEnd && dateStr >= sem.examsStart && dateStr <= sem.examsEnd);
      const inSurvey = Boolean(sem.surveyStart && sem.surveyEnd && dateStr >= sem.surveyStart && dateStr <= sem.surveyEnd);

      return {
        date: dateStr,
        year: calendar.year,
        semester: sem.semester,
        semesterCode: sem.code || `${calendar.year}-${sem.semester}`,
        weekNumber,
        totalWeeks,
        phase: inExams ? 'EXAMS' : 'CLASSES',
        isWeekZero: false,
        firstYearOnly: false,
        inSurvey,
        label: inExams
          ? `Semana ${weekNumber}/${totalWeeks} (Exámenes) • ${sem.semester}° Semestre`
          : `Semana ${weekNumber}/${totalWeeks} • ${sem.semester}° Semestre`,
        detail: inExams
          ? `Período de Exámenes ${sem.code} (${sem.examsStart} al ${sem.examsEnd})`
          : `Semana ${weekNumber} de ${totalWeeks} • Cierre ${sem.closeDate || sem.classesEnd}`,
        upperYearNote: '',
        milestones: sem,
        calendarResolution: calendar.resolution,
      };
    }

    if (sem.closeDate && dateStr === sem.closeDate) {
      return {
        date: dateStr,
        year: calendar.year,
        semester: sem.semester,
        semesterCode: sem.code || `${calendar.year}-${sem.semester}`,
        weekNumber: sem.totalWeeks || 18,
        totalWeeks: sem.totalWeeks || 18,
        phase: 'SEMESTER_CLOSE',
        isWeekZero: false,
        firstYearOnly: false,
        label: `Semestre ${sem.semester} • Cierre Académico`,
        detail: `Cierre académico oficial del semestre ${sem.code} (${sem.closeDate})`,
        upperYearNote: '',
        milestones: sem,
        calendarResolution: calendar.resolution,
      };
    }
  }

  // 4. Receso de Invierno entre 1° y 2° Semestre
  if (
    calendar.winterRecess?.start &&
    calendar.winterRecess?.end &&
    dateStr >= calendar.winterRecess.start &&
    dateStr <= calendar.winterRecess.end
  ) {
    return {
      date: dateStr,
      year: calendar.year,
      semester: 2,
      semesterCode: `${calendar.year}-2`,
      weekNumber: null,
      totalWeeks: sem2?.totalWeeks || 18,
      phase: 'RECESS',
      isWeekZero: false,
      firstYearOnly: false,
      label: 'Receso de Invierno • Pausa Intersemestral',
      detail: `Inicio de clases 2° Semestre: ${sem2?.classesStart || 'por confirmar'}`,
      upperYearNote: '',
      milestones: sem2 || sem1,
      calendarResolution: calendar.resolution,
    };
  }

  // 5. Fuera de ventana lectiva (ej. post-cierre diciembre o pre-Semana 0 febrero)
  return {
    date: dateStr,
    year: calendar.year,
    semester: sem1 && dateStr < sem1.classesStart ? 1 : 2,
    semesterCode: sem1 && dateStr < sem1.classesStart ? `${calendar.year}-1` : `${calendar.year}-2`,
    weekNumber: null,
    totalWeeks: null,
    phase: 'INTERSEMESTER',
    isWeekZero: false,
    firstYearOnly: false,
    label: `Calendario Duoc UC ${calendar.year} • Receso / Matrícula`,
    detail: sem1 && dateStr < sem1.classesStart
      ? `Semana 0 (1° año): ${sem1.weekZeroStart} • Inicio Semestre 1: ${sem1.classesStart}`
      : 'Período sin clases lectivas ordinarias',
    upperYearNote: '',
    milestones: sem1 || sem2,
    calendarResolution: calendar.resolution,
  };
}

function decodePdfLiteralString(raw) {
  return String(raw || '')
    .replace(/\\([nrtbf()\\])/g, (_, ch) => {
      const map = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
      return map[ch] || ch;
    })
    .replace(/\\([0-7]{1,3})/g, (_, oct) => String.fromCharCode(Number.parseInt(oct, 8)));
}

function readPdfLiteralString(content, startIdx) {
  let i = startIdx + 1;
  let depth = 1;
  let raw = '';
  const len = content.length;
  while (i < len && depth > 0) {
    const ch = content[i];
    if (ch === '\\') {
      if (i + 1 < len) {
        raw += ch + content[i + 1];
        i += 2;
        continue;
      }
      break;
    }
    if (ch === '(') {
      depth += 1;
    } else if (ch === ')') {
      depth -= 1;
      if (depth === 0) break;
    }
    raw += ch;
    i += 1;
  }
  return { raw, endIdx: i };
}

function extractTextTokensFromStreamContent(content) {
  if (!content || (!content.includes('Tj') && !content.includes('TJ'))) return '';
  const lines = [];
  let currentLine = [];
  const len = content.length;
  let i = 0;

  const flushLine = () => {
    if (currentLine.length > 0) {
      const joined = currentLine.join('').replace(/\s+/g, ' ').trim();
      if (joined) lines.push(joined);
      currentLine = [];
    }
  };

  while (i < len) {
    const ch = content[i];
    if (ch === '(') {
      const { raw, endIdx } = readPdfLiteralString(content, i);
      const after = content.slice(endIdx + 1, endIdx + 10);
      if (/^\s*Tj\b/.test(after)) {
        currentLine.push(decodePdfLiteralString(raw));
      }
      i = endIdx + 1;
      continue;
    }
    if (ch === '[') {
      const closeBracket = content.indexOf(']', i + 1);
      if (closeBracket !== -1 && closeBracket - i < 8192) {
        const after = content.slice(closeBracket + 1, closeBracket + 10);
        if (/^\s*TJ\b/.test(after)) {
          let j = i + 1;
          let arrayText = '';
          while (j < closeBracket) {
            if (content[j] === '(') {
              const { raw, endIdx } = readPdfLiteralString(content, j);
              arrayText += decodePdfLiteralString(raw);
              j = endIdx + 1;
            } else {
              j += 1;
            }
          }
          if (arrayText) currentLine.push(arrayText);
          i = closeBracket + 1;
          continue;
        }
      }
    }
    // Operadores de nueva línea/bloque en stream PDF (ET, T*, TD); Td/Tm intra-celda agregan espacio suave
    if ((ch === 'T' && (content[i + 1] === '*' || content[i + 1] === 'D')) || (ch === 'E' && content[i + 1] === 'T')) {
      const prev = i > 0 ? content[i - 1] : ' ';
      const next = content[i + 2] || ' ';
      if (/\s/.test(prev) && /\s/.test(next)) {
        flushLine();
        i += 2;
        continue;
      }
    }
    if (ch === 'T' && (content[i + 1] === 'd' || content[i + 1] === 'm')) {
      const prev = i > 0 ? content[i - 1] : ' ';
      const next = content[i + 2] || ' ';
      if (/\s/.test(prev) && /\s/.test(next)) {
        if (currentLine.length > 0) currentLine.push(' ');
        i += 2;
        continue;
      }
    }
    i += 1;
  }

  flushLine();
  return lines.join('\n');
}

function extractTextFromPdfBuffer(buffer) {
  if (!buffer) return '';
  const rawLatin = Buffer.isBuffer(buffer) ? buffer.toString('latin1') : String(buffer);
  const extractedParts = [];
  const maxInflateBytes = 2 * 1024 * 1024;

  const streamRegex = /stream(?:\r\n|\r|\n)([\s\S]*?)endstream/g;
  let sm;
  while ((sm = streamRegex.exec(rawLatin)) !== null) {
    const streamSlice = Buffer.from(sm[1], 'latin1');
    let inflated = null;
    try {
      inflated = zlib.inflateSync(streamSlice, { maxOutputLength: maxInflateBytes });
    } catch {
      try {
        inflated = zlib.inflateRawSync(streamSlice, { maxOutputLength: maxInflateBytes });
      } catch {
        inflated = streamSlice;
      }
    }
    const text = inflated.toString('latin1');
    const tokens = extractTextTokensFromStreamContent(text);
    if (tokens.trim()) extractedParts.push(tokens);
    if (/\d{2}-\d{2}-20\d{2}/.test(text)) extractedParts.push(text);
  }

  // Fallback para PDFs sin compresión o texto plano copiado
  if (extractedParts.length === 0) {
    const directTokens = extractTextTokensFromStreamContent(rawLatin);
    extractedParts.push(directTokens || rawLatin);
  }

  return extractedParts.join('\n');
}

function normalizeIsoDate(rawDateStr) {
  const dmy = String(rawDateStr || '').match(/^(\d{2})[-/](\d{2})[-/](20\d{2})$/);
  if (dmy) return `${dmy[3]}-${dmy[2]}-${dmy[1]}`;
  const ymd = String(rawDateStr || '').match(/^(20\d{2})[-/](\d{2})[-/](\d{2})$/);
  if (ymd) return `${ymd[1]}-${ymd[2]}-${ymd[3]}`;
  return null;
}

function normalizeForMatch(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function extractDatePairsFromLine(line) {
  const matches = [...String(line || '').matchAll(/(\d{2}[-/]\d{2}[-/]20\d{2}|20\d{2}[-/]\d{2}[-/]\d{2})/g)];
  return matches.map((m) => normalizeIsoDate(m[1])).filter(Boolean);
}

function parseAcademicCalendarPdf({ buffer = null, textContent = '', fileName = '' } = {}) {
  const combinedText = `${textContent || ''}\n${buffer ? extractTextFromPdfBuffer(buffer) : ''}`.trim();
  const normalizedAll = normalizeForMatch(combinedText);

  const yearMatch =
    normalizedAll.match(/calendario academico\s*(20\d{2})/) ||
    normalizedAll.match(/20(2\d)-[12]/) ||
    String(fileName || '').match(/(20\d{2})/);
  const detectedYear = yearMatch
    ? Number.parseInt(yearMatch[1].length === 4 ? yearMatch[1] : `20${yearMatch[1]}`, 10)
    : new Date().getFullYear();

  const resMatch = combinedText.match(/Resoluci[oó]n\s*N[°º]?\s*[\d/]+/i);
  const resolution = resMatch
    ? `${resMatch[0]} • Calendario Académico ${detectedYear}`
    : `Calendario Académico Oficial Duoc UC ${detectedYear}`;

  const lines = combinedText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const warnings = [];
  const detectedFields = [];

  let currentSection = null; // 'TAV' | 'S1' | 'S2' | 'TABLE'
  const parsed = {
    year: detectedYear,
    resolution,
    sourceFileName: fileName || `calendario-academico-${detectedYear}.pdf`,
    tav: { start: null, end: null, close: null },
    winterRecess: { start: null, end: null },
    semesters: [
      {
        semester: 1,
        code: `${detectedYear}-1`,
        label: `1° Semestre ${detectedYear}`,
        weekZeroStart: null,
        weekZeroEnd: null,
        prepStart: null,
        prepEnd: null,
        classesStart: null,
        classesEnd: null,
        examsStart: null,
        examsEnd: null,
        closeDate: null,
        withdrawalStart: null,
        withdrawalEnd: null,
        surveyStart: null,
        surveyEnd: null,
        riDate: null,
        totalWeeks: 18,
      },
      {
        semester: 2,
        code: `${detectedYear}-2`,
        label: `2° Semestre ${detectedYear}`,
        weekZeroStart: null,
        weekZeroEnd: null,
        prepStart: null,
        prepEnd: null,
        classesStart: null,
        classesEnd: null,
        examsStart: null,
        examsEnd: null,
        closeDate: null,
        withdrawalStart: null,
        withdrawalEnd: null,
        surveyStart: null,
        surveyEnd: null,
        riDate: null,
        totalWeeks: 18,
      },
    ],
  };

  const s1 = parsed.semesters[0];
  const s2 = parsed.semesters[1];

  const assignSemesterByMonth = (dates, assignFn) => {
    if (dates.length >= 4) {
      assignFn(s1, dates[0], dates[1]);
      assignFn(s2, dates[2], dates[3]);
      return;
    }
    if (dates.length >= 2) {
      const m = Number.parseInt(dates[0].slice(5, 7), 10);
      if (currentSection === 'S2' || (currentSection !== 'S1' && m >= 7)) {
        assignFn(s2, dates[0], dates[1]);
      } else {
        assignFn(s1, dates[0], dates[1]);
      }
    }
  };

  for (const line of lines) {
    const low = normalizeForMatch(line);
    if (/(?:1er|1°|primer)\s+semestre/.test(low) || low.includes(`${detectedYear}-1`)) {
      currentSection = 'S1';
    } else if (/(?:2do|2°|segundo)\s+semestre/.test(low) || low.includes(`${detectedYear}-2`)) {
      currentSection = 'S2';
    } else if (/^\s*tav\b/.test(low) || low.includes('temporada academica extraordinaria')) {
      currentSection = 'TAV';
    }

    const dates = extractDatePairsFromLine(line);
    if (dates.length === 0) continue;

    if (low.includes('induccion estudiantes de inicio') || low.includes('semana cero')) {
      s1.weekZeroStart = dates[0];
      s1.weekZeroEnd = dates[1] || dates[0];
      detectedFields.push('Semana 0 (1° Año)');
    } else if (low.includes('preparacion y coordinacion academica')) {
      assignSemesterByMonth(dates, (sem, a, b) => {
        sem.prepStart = a;
        sem.prepEnd = b;
      });
    } else if (low.includes('clases temporada academica extraordinaria')) {
      parsed.tav.start = dates[0];
      parsed.tav.end = dates[1] || dates[0];
      detectedFields.push('Temporada de Verano (TAV)');
    } else if (low.includes('clases temporada academica ordinaria')) {
      assignSemesterByMonth(dates, (sem, a, b) => {
        sem.classesStart = a;
        sem.classesEnd = b;
        sem.totalWeeks = computeTotalWeeks(a, b);
      });
      detectedFields.push('Período de Clases');
    } else if (low.includes('periodo de examenes')) {
      assignSemesterByMonth(dates, (sem, a, b) => {
        sem.examsStart = a;
        sem.examsEnd = b;
      });
      detectedFields.push('Período de Exámenes');
    } else if (low.includes('retiro de asignaturas') && !low.includes('practica')) {
      assignSemesterByMonth(dates, (sem, a, b) => {
        sem.withdrawalStart = a;
        sem.withdrawalEnd = b;
      });
    } else if (low.includes('encuesta docente')) {
      assignSemesterByMonth(dates, (sem, a, b) => {
        sem.surveyStart = a;
        sem.surveyEnd = b;
      });
    } else if (low.includes('reprobacion por inasistencia')) {
      if (dates.length >= 2) {
        s1.riDate = dates[0];
        s2.riDate = dates[1];
      } else {
        const m = Number.parseInt(dates[0].slice(5, 7), 10);
        if (m >= 9) s2.riDate = dates[0];
        else s1.riDate = dates[0];
      }
    } else if (low.includes('cierre academico y termino del semestre')) {
      for (const d of dates) {
        const m = Number.parseInt(d.slice(5, 7), 10);
        if (m <= 3) parsed.tav.close = d;
        else if (m <= 8) s1.closeDate = d;
        else s2.closeDate = d;
      }
      detectedFields.push('Cierre Semestral');
    }
  }

  // Fallback parcial contra seed conocido del año si el PDF solo trae actualización mensual o semestre
  const fallbackYearCal = inMemoryCalendars.get(detectedYear);
  if (fallbackYearCal) {
    if (!parsed.tav.start) parsed.tav = { ...fallbackYearCal.tav };
    for (const [idx, sem] of parsed.semesters.entries()) {
      const fbSem = fallbackYearCal.semesters[idx];
      if (!fbSem) continue;
      for (const key of Object.keys(fbSem)) {
        if (sem[key] === null || sem[key] === undefined) {
          sem[key] = fbSem[key];
        }
      }
    }
  }

  if (s1.classesEnd && s2.classesStart) {
    parsed.winterRecess = {
      start: addDaysYmd(s1.closeDate || s1.classesEnd, 1),
      end: addDaysYmd(s2.classesStart, -1),
    };
  }

  if (!s1.classesStart || !s2.classesStart) {
    warnings.push('No se detectaron todas las fechas de inicio de clases en el archivo; revisa la vista previa antes de confirmar.');
  }

  return {
    calendar: parsed,
    detectedFields: Array.from(new Set(detectedFields)),
    warnings,
    extractedChars: combinedText.length,
  };
}

async function saveAcademicCalendar(calendarData, updatedBy = 'admin') {
  const year = Number(calendarData?.year);
  if (!Number.isInteger(year) || year < 2024 || year > 2040) {
    throw new Error('El calendario debe especificar un año académico entero válido (2024–2040).');
  }

  const semesters = Array.isArray(calendarData.semesters) ? calendarData.semesters : [];
  if (semesters.length === 0) {
    throw new Error('El calendario debe contener al menos un semestre con fechas lectivas.');
  }
  const isoDateRe = /^\d{4}-\d{2}-\d{2}$/;
  for (const sem of semesters) {
    if (!isoDateRe.test(String(sem?.classesStart || '')) || !isoDateRe.test(String(sem?.classesEnd || ''))) {
      throw new Error(
        `El semestre ${sem?.semester || ''} debe incluir fechas válidas de inicio y término de clases (YYYY-MM-DD).`
      );
    }
  }

  const normalized = {
    year,
    resolution: String(calendarData.resolution || `Calendario Académico Oficial Duoc UC ${year}`).trim(),
    sourceFileName: String(calendarData.sourceFileName || `calendario-${year}.pdf`).trim(),
    tav: calendarData.tav && typeof calendarData.tav === 'object' ? calendarData.tav : {},
    winterRecess:
      calendarData.winterRecess && typeof calendarData.winterRecess === 'object'
        ? calendarData.winterRecess
        : {},
    semesters,
    updatedBy: String(updatedBy || 'admin'),
  };

  if (mongoose.connection.readyState === 1) {
    const doc = await AcademicCalendar.findOneAndUpdate(
      { year },
      { $set: normalized },
      { upsert: true, returnDocument: 'after', runValidators: true }
    ).lean();
    const persisted = doc || normalized;
    inMemoryCalendars.set(year, structuredClone(persisted));
    return persisted;
  }

  inMemoryCalendars.set(year, structuredClone(normalized));
  return normalized;
}

module.exports = {
  CHILE_TIMEZONE,
  getChileDateString,
  ensureSeedCalendars,
  getAllCalendars,
  resolveAcademicWeekStatus,
  extractTextFromPdfBuffer,
  parseAcademicCalendarPdf,
  saveAcademicCalendar,
};
