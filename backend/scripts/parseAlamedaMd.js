/**
 * Script de Ingesta y Reconstrucción Oficial: ALAMEDA 2026-002
 *
 * Lee el archivo de oferta académica en Markdown (con tablas segmentadas horizontalmente),
 * reconstruye todas las filas de la sede Alameda, normaliza campos, genera bloques de horario Duoc UC,
 * y genera el archivo semilla unificado: backend/data/alameda2026Seed.json
 *
 * Uso:
 *   node backend/scripts/parseAlamedaMd.js [ruta_al_archivo_md]
 */

const fs = require('fs');
const path = require('path');
const excelParser = require('../services/excelParserService');

// Rutas predeterminadas
const DEFAULT_MD_PATH = 'c:/Users/crist/Downloads/ALAMEDA 2026 002.md';
const FALLBACK_MD_PATH = path.join(__dirname, '../data/ALAMEDA 2026 002.md');
const SEED_OUTPUT_PATH = path.join(__dirname, '../data/alameda2026Seed.json');
const SUMMARY_OUTPUT_PATH = path.join(__dirname, '../data/alameda2026Summary.json');

async function run() {
  console.log('===============================================================');
  console.log(' [Nexo360] Parseador y Reconstructor Oficial: Alameda 2026-002');
  console.log('===============================================================');

  const targetPath = process.argv[2] || (fs.existsSync(DEFAULT_MD_PATH) ? DEFAULT_MD_PATH : FALLBACK_MD_PATH);

  if (!fs.existsSync(targetPath)) {
    console.error(`[ERROR] No se encontró el archivo de origen en: ${targetPath}`);
    process.exit(1);
  }

  console.log(`[1/4] Leyendo archivo Markdown: ${targetPath}`);
  const startTime = Date.now();
  const mdContent = fs.readFileSync(targetPath, 'utf8');
  const lineCount = mdContent.split(/\r?\n/).length;
  console.log(`      Archivo leído con éxito (${lineCount.toLocaleString()} líneas).`);

  console.log('[2/4] Reconstruyendo tablas segmentadas horizontalmente y extrayendo filas...');
  const parseResult = excelParser.parseMarkdownTable(mdContent, { periodo: '2026 - 002' });
  const offerings = parseResult.offerings;
  const consolidated = parseResult.consolidated;

  console.log(`      Filas de oferta reconstruidas: ${offerings.length.toLocaleString()}`);
  console.log(`      Secciones consolidadas únicas: ${consolidated.length.toLocaleString()}`);

  console.log('[3/4] Validando integridad de datos y cobertura de carreras...');
  const careerMap = new Map();
  let totalBloques = 0;

  for (const item of offerings) {
    totalBloques += item.bloques ? item.bloques.length : 0;
    if (!careerMap.has(item.carrera)) {
      careerMap.set(item.carrera, {
        carrera: item.carrera,
        sede: item.sede,
        totalFilas: 0,
        secciones: new Set(),
        asignaturas: new Set(),
        docentes: new Set(),
      });
    }
    const cData = careerMap.get(item.carrera);
    cData.totalFilas++;
    cData.secciones.add(item.seccion);
    cData.asignaturas.add(item.sigla);
    if (item.docente) cData.docentes.add(item.docente);
  }

  const careerList = Array.from(careerMap.values()).map((c) => ({
    carrera: c.carrera,
    sede: c.sede,
    totalFilas: c.totalFilas,
    totalSecciones: c.secciones.size,
    totalAsignaturas: c.asignaturas.size,
    totalDocentes: c.docentes.size,
  }));

  // Ordenar por número de secciones
  careerList.sort((a, b) => b.totalSecciones - a.totalSecciones);

  console.log(`      Total Carreras detectadas: ${careerList.length}`);
  console.log(`      Total Bloques de horario asignados: ${totalBloques.toLocaleString()}`);

  console.log('\n--- Resumen por Carreras Principales ---');
  for (const c of careerList.slice(0, 10)) {
    console.log(`  • ${c.carrera.padEnd(45)} | Asignaturas: ${String(c.totalAsignaturas).padStart(3)} | Secciones: ${String(c.totalSecciones).padStart(4)} | Filas: ${String(c.totalFilas).padStart(4)}`);
  }
  if (careerList.length > 10) {
    console.log(`  ... y ${careerList.length - 10} carreras más.`);
  }

  // Comprobar carreras requeridas clave
  const checkCareers = [
    'INGENIER. EN INFRAESTRUCTURA TECNOLÓGICA',
    'INGENIERÍA EN INFORMÁTICA',
    'ANALISTA PROGRAMADOR',
    'INGENIERÍA EN CONECTIVIDAD Y REDES',
    'INGENIERÍA EN CONSTRUCCIÓN',
    'INGENIERÍA EN PREVENCIÓN DE RIESGOS',
    'AUDITORÍA',
  ];

  console.log('\n--- Verificación de Carreras Críticas ---');
  for (const reqCareer of checkCareers) {
    const found = careerList.find((c) => c.carrera.includes(reqCareer) || reqCareer.includes(c.carrera));
    if (found) {
      console.log(`  [OK] ${found.carrera}: ${found.totalAsignaturas} asignaturas, ${found.totalSecciones} secciones`);
    } else {
      console.warn(`  [ALERTA] Carrera no encontrada: ${reqCareer}`);
    }
  }

  console.log('\n[4/4] Guardando catálogo unificado en JSON...');
  // Asegurar que exista backend/data
  const dataDir = path.dirname(SEED_OUTPUT_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // Guardar archivo semilla unificado
  fs.writeFileSync(SEED_OUTPUT_PATH, JSON.stringify(offerings, null, 2), 'utf8');
  const seedStat = fs.statSync(SEED_OUTPUT_PATH);
  console.log(`      Catálogo semilla guardado: ${SEED_OUTPUT_PATH} (${(seedStat.size / 1024 / 1024).toFixed(2)} MB)`);

  // Guardar resumen estadístico
  const summary = {
    periodo: '2026 - 002',
    sede: 'ALAMEDA',
    totalFilas: offerings.length,
    totalSecciones: consolidated.length,
    totalBloques,
    totalCarreras: careerList.length,
    generadoEn: new Date().toISOString(),
    carreras: careerList,
  };
  fs.writeFileSync(SUMMARY_OUTPUT_PATH, JSON.stringify(summary, null, 2), 'utf8');
  console.log(`      Resumen estadístico guardado: ${SUMMARY_OUTPUT_PATH}`);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n Proceso finalizado exitosamente en ${totalTime}s.`);
  console.log('===============================================================\n');

  return { offerings, consolidated, summary };
}

if (require.main === module) {
  run().catch((err) => {
    console.error('[FATAL] Error ejecutando parseAlamedaMd:', err);
    process.exit(1);
  });
}

module.exports = run;
