/**
 * Motor de búsqueda semántica e intencional para el Centro de Ayuda Nexo360 (Duoc UC - Sede Alameda).
 * Extraído bajo principio SRP para mantener baja complejidad cognitiva en DashboardPage.
 */

export const PURPOSE_GROUPS = [
  { id: 'all', label: 'Todas', ids: null },
  {
    id: 'academico',
    label: 'Vida académica y admisión',
    ids: ['vida-academica', 'admision-matricula', 'orientacion-nuevos', 'titulados'],
  },
  {
    id: 'inclusion',
    label: 'Inclusión y bienestar',
    ids: ['beneficios-estudiantiles', 'convivencia-inclusion'],
  },
  {
    id: 'finanzas-digital',
    label: 'Finanzas y soporte TI',
    ids: ['pagos-deudas', 'servicios-digitales', 'sostenedor'],
  },
];

export const SPANISH_STOPWORDS = new Set([
  'de', 'la', 'el', 'en', 'un', 'una', 'los', 'las', 'y', 'o', 'a', 'al', 'del',
  'por', 'para', 'con', 'que', 'su', 'sus', 'mi', 'mis', 'tu', 'tus', 'se', 'lo',
  'como', 'mas', 'pero', 'este', 'esta', 'estos', 'estas', 'es', 'son', 'fue', 'era',
]);

export const SEARCH_SYNONYMS = {
  certificado: ['certificado', 'certificados', 'constancia', 'constancias', 'concentracion', 'acreditacion', 'documento', 'documentos', 'papel'],
  nota: ['nota', 'notas', 'calificacion', 'calificaciones', 'promedio', 'promedios', 'rendimiento', 'evaluacion', 'evaluaciones', 'examen', 'examenes'],
  inasistencia: ['inasistencia', 'inasistencias', 'asistencia', 'asistencias', 'falta', 'faltas', 'justificar', 'justificacion', 'licencia', 'medica', 'medico', 'ri', 'reprobacion', 'reprobado', '70%'],
  ramo: ['ramo', 'ramos', 'asignatura', 'asignaturas', 'materia', 'materias', 'inscripcion', 'inscribir', 'toma', 'horario', 'horarios', 'seccion', 'secciones', 'simulador', 'sap', 'sicol', 'webdynpro'],
  inscribir: ['inscribir', 'inscripcion', 'toma', 'ramo', 'ramos', 'asignatura', 'asignaturas', 'sicol', 'seccion'],
  gratuidad: ['gratuidad', 'cae', 'beca', 'becas', 'beneficio', 'beneficios', 'arancel', 'aranceles', 'matricula', 'pago', 'pagos', 'cuota', 'cuotas', 'deuda', 'deudas', 'repactar'],
  mfa: ['mfa', 'clave', 'contrasena', 'authenticator', 'microsoft', 'correo', 'ava', 'blackboard', 'wifi', 'bloqueo'],
  tne: ['tne', 'pase', 'escolar', 'totem', 'bip', 'tarjeta', 'transporte', 'metro'],
  paedis: ['paedis', 'discapacidad', 'ajuste', 'ajustes', 'razonable', 'razonables', 'cuidador', 'cuidadora', 'cuidadores', 'ley 21790', 'inclusion', 'salud', 'mental', 'psicologo'],
};

const SYNONYM_ENTRIES = Object.entries(SEARCH_SYNONYMS);

/**
 * Normaliza texto a minúsculas sin acentos diacríticos ni espacios extremos.
 */
export function normalizeSearchText(value) {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Reduce plurales y sufijos simples en español para emparejamiento tolerante.
 */
export function stemSpanishWord(word) {
  if (!word || word.length <= 3) return word;
  if (word.endsWith('ces')) return `${word.slice(0, -3)}z`;
  if (word.endsWith('es') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('is') && !word.endsWith('us') && word.length > 3) {
    return word.slice(0, -1);
  }
  return word;
}

/**
 * Calcula la distancia de edición de Levenshtein entre dos cadenas.
 */
export function levenshteinDist(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      const val =
        a.charAt(i - 1) === b.charAt(j - 1)
          ? row[j - 1]
          : Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }
  return row[b.length];
}

/**
 * Evalúa si una palabra objetivo coincide de forma difusa o por prefijo con el término consultado.
 */
export function isFuzzyWordMatch(targetWord, queryWord) {
  if (!targetWord || !queryWord) return false;
  if (targetWord === queryWord) return true;
  if (queryWord.length >= 3 && targetWord.startsWith(queryWord)) return true;
  if (Math.abs(targetWord.length - queryWord.length) > 2) return false;

  const dist = levenshteinDist(targetWord, queryWord);
  if (queryWord.length <= 4) return dist === 0;
  if (queryWord.length <= 7) return dist <= 1;
  return dist <= 2;
}

function hasSynonymMatch(qTok, qStem, targetTokens, targetStems) {
  return SYNONYM_ENTRIES.some(([root, syns]) => {
    const qMatchesRoot =
      qTok === root || qStem === root || syns.includes(qTok) || syns.includes(qStem);
    if (!qMatchesRoot) return false;
    return (
      targetTokens.some((token) => syns.includes(token)) ||
      targetStems.some((stem) => syns.includes(stem))
    );
  });
}

function doesTokenMatchTarget(qTok, targetTokens, targetStems) {
  const qStem = stemSpanishWord(qTok);
  if (targetStems.includes(qStem)) return true;

  if (targetTokens.some((tTok) => !SPANISH_STOPWORDS.has(tTok) && isFuzzyWordMatch(tTok, qTok))) {
    return true;
  }

  return hasSynonymMatch(qTok, qStem, targetTokens, targetStems);
}

/**
 * Crea una función de puntuación textual reutilizable para una consulta normalizada.
 */
export function createTextMatcher(normTerm, queryTokens) {
  const activeTokens = queryTokens.filter((token) => !SPANISH_STOPWORDS.has(token));
  const tokensToTest = activeTokens.length > 0 ? activeTokens : queryTokens;
  const minRequired = tokensToTest.length === 1 ? 1 : Math.ceil(tokensToTest.length * 0.4);

  return (rawText) => {
    if (!rawText) return 0;
    const normTarget = normalizeSearchText(rawText);
    if (normTarget.includes(normTerm)) return 10;

    const targetTokens = normTarget.split(/\s+/).filter(Boolean);
    const targetStems = targetTokens.map(stemSpanishWord);

    let matchedCount = 0;
    for (const qTok of tokensToTest) {
      if (doesTokenMatchTarget(qTok, targetTokens, targetStems)) {
        matchedCount++;
      }
    }

    return matchedCount >= minRequired ? (matchedCount / tokensToTest.length) * 5 : 0;
  };
}

/**
 * Detecta intenciones semánticas prioritarias (certificados de notas y toma de ramos).
 */
export function detectSearchIntents(normTerm, queryTokens, queryStems) {
  const certificadoTerms = [
    'certificado de notas',
    'certificados de notas',
    'certificado de nota',
    'certificados de nota',
    'certificado notas',
    'certificados notas',
    'concentracion de notas',
  ];
  const hasCertStem = queryStems.some(
    (q) => q === 'certificado' || SEARCH_SYNONYMS.certificado.includes(q)
  );
  const hasNotaStem = queryStems.some(
    (q) => q === 'nota' || SEARCH_SYNONYMS.nota.includes(q)
  );
  const isCertificadoNotasIntent =
    certificadoTerms.some((phrase) => normTerm.includes(phrase)) ||
    (hasCertStem && hasNotaStem);

  const tomaRamosTerms = [
    'inscribir',
    'toma de ramo',
    'toma de ramos',
    'inscripcion de asignatura',
    'inscripcion de asignaturas',
    'inscribir mi ramo',
    'inscribir ramo',
    'inscribir ramos',
    'sicol',
  ];
  const hasRamoToken = queryTokens.some((q) =>
    ['ramo', 'ramos', 'asignatura', 'asignaturas'].includes(q)
  );
  const hasInscribirToken = queryTokens.some((q) =>
    ['inscribir', 'toma', 'tomar', 'elegir'].includes(q)
  );
  const isTomaRamosIntent =
    tomaRamosTerms.some((phrase) => normTerm.includes(phrase)) ||
    (hasRamoToken && hasInscribirToken);

  return { isCertificadoNotasIntent, isTomaRamosIntent };
}

function defaultSubmoduleBoost(sub, { isCertificadoNotasIntent, isTomaRamosIntent }) {
  let boost = 0;
  if (isCertificadoNotasIntent) {
    if (sub.id === 'certificados-alumnos-notas') boost += 50;
    if (sub.id === 'notas-examenes') boost += 30;
  }
  if (isTomaRamosIntent && sub.id === 'inscripcion-asignaturas') {
    boost += 60;
  }
  return boost;
}

function scoreArticleItem(art, matchText, { isCertificadoNotasIntent, isTomaRamosIntent }) {
  let score = matchText(art.title) * 2 + matchText(art.summary);
  if (isCertificadoNotasIntent && (art.url || '').includes('certificados')) {
    score += 30;
  }
  if (isTomaRamosIntent && (art.title || '').toLowerCase().includes('inscripci')) {
    score += 30;
  }
  return score;
}

function filterMeaningfulResults(sortedItems, topThreshold, minScore) {
  const topScore = sortedItems[0]?.score || 0;
  if (topScore < topThreshold) return sortedItems;

  const cutoff = Math.max(minScore, topScore * 0.35);
  return sortedItems.filter((item) => item.score >= cutoff);
}

/**
 * Ejecuta el análisis completo de búsqueda sobre categorías, trámites y artículos oficiales.
 */
export function analyzeDashboardSearch({
  categories = [],
  searchTerm = '',
  purposeFilter = 'all',
  purposeGroups = PURPOSE_GROUPS,
  getSubmoduleBoost = defaultSubmoduleBoost,
}) {
  const normTerm = normalizeSearchText(searchTerm);
  const activeGroup = purposeGroups.find((group) => group.id === purposeFilter);
  const baseCategories = activeGroup?.ids
    ? categories.filter((cat) => activeGroup.ids.includes(cat.id))
    : categories;

  if (!normTerm) {
    return {
      categories: baseCategories,
      matchedSubmodules: [],
      matchedArticles: [],
      isCertificadoNotasIntent: false,
      isTomaRamosIntent: false,
    };
  }

  const queryTokens = normTerm.split(/\s+/).filter(Boolean);
  const queryStems = queryTokens.map(stemSpanishWord);
  const intents = detectSearchIntents(normTerm, queryTokens, queryStems);
  const matchText = createTextMatcher(normTerm, queryTokens);

  const matchedSubmodules = [];
  const matchedArticles = [];

  for (const category of categories) {
    for (const sub of category.submodules || []) {
      const tagScore = (sub.intentTags || []).reduce(
        (acc, tag) => acc + matchText(tag) * 2,
        0
      );
      const subScore =
        matchText(sub.title) * 2 +
        matchText(sub.description) +
        matchText(sub.intentGoal) * 2 +
        matchText(sub.instructions) +
        matchText(sub.paedisTip) +
        tagScore +
        getSubmoduleBoost(sub, intents);

      let articleMatchedInSub = false;
      for (const art of sub.articles || []) {
        const artScore = scoreArticleItem(art, matchText, intents);
        if (artScore > 0) {
          articleMatchedInSub = true;
          matchedArticles.push({
            ...art,
            category,
            submodule: sub,
            score: artScore,
          });
        }
      }

      if (subScore > 0 || articleMatchedInSub) {
        matchedSubmodules.push({
          category,
          submodule: sub,
          score: subScore,
        });
      }
    }
  }

  matchedSubmodules.sort((a, b) => b.score - a.score);
  matchedArticles.sort((a, b) => b.score - a.score);

  const meaningfulSubmodules = filterMeaningfulResults(matchedSubmodules, 25, 15);
  const meaningfulArticles = filterMeaningfulResults(matchedArticles, 20, 10);

  const meaningfulCategoryIds = new Set([
    ...meaningfulSubmodules.map((m) => m.category.id),
    ...meaningfulArticles.map((a) => a.category.id),
  ]);

  return {
    categories: categories.filter((c) => meaningfulCategoryIds.has(c.id)),
    matchedSubmodules: meaningfulSubmodules,
    matchedArticles: meaningfulArticles,
    isCertificadoNotasIntent: intents.isCertificadoNotasIntent,
    isTomaRamosIntent: intents.isTomaRamosIntent,
  };
}
