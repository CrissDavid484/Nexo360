# Nexo360 — Reporte de Aseguramiento de Calidad y Pruebas (Fase 6)

**Fecha:** 27 de Noviembre de 2026  
**Versión del Release:** 1.0.0-rc  
**Plataforma de Ejecución:** Node.js v24.19.0 / Node.js 22 LTS  
**Resultado Global:** **APROBADO (PASSED) — 100% Suites en Verde**

---

## 1. Resumen Ejecutivo de Ejecución

| Área | Suites Ejecutadas | Pruebas Totales | Aprobadas | Fallidas | Tiempo de Ejecución |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Backend (Node.js Test Runner)** | 24 suites | 231 pruebas | **231 (100%)** | 0 | 13.2 s |
| **Frontend (Componentes & Lógica)** | 6 suites | 35 pruebas | **35 (100%)** | 0 | 2.1 s |
| **Frontend Build (Vite Production)** | 1 pipeline | 1682 módulos | **Exitoso** | 0 | 11.8 s |
| **SonarQube Quality Gate** | Análisis Estático | OWASP ASVS / Clean Code | **Triple A (Cumplido)** | 0 blockers | < 3% duplicación (0.6%) |

---

## 2. Detalle de Suites Backend

| Archivo de Prueba | Cobertura / Funcionalidad Validada | Pruebas | Estado |
| :--- | :--- | :--- | :--- |
| `tests/security.hardening.test.js` | Secrets fail-fast, fail-closed prod config, concurrencia en activación, string identity rejection | 12 | **PASS** |
| `tests/helpContent.test.js` | Épica E-005 CMS Editorial: seed, ciclo draft/published/archived, versionHistory, rollback y RBAC | 8 | **PASS** |
| `tests/academicDataService.test.js` | Bloque A: modos disabled/mock/live, prevención IDOR, 0 vs null, salvaguarda de riesgo predictivo | 16 | **PASS** |
| `tests/vivoDuocAdapter.test.js` | Adaptador Vivo Duoc: normalización, caché separada por usuario, manejo 401/502/504, IDOR protection | 20 | **PASS** |
| `tests/qa.audit.test.js` | Cabeceras de seguridad OWASP, CORS, rate-limiting, NoSQL injection, catálogo institucional | 11 | **PASS** |
| `tests/accountActivation.test.js` | Token criptográfico de uso único, rechazo de passwords débiles, invalidación atómica | 9 | **PASS** |
| `tests/predictiveRisk.test.js` | Motor de predicción de riesgo académico, umbral 70%, explicabilidad y ausencia de alarmas falsas | 18 | **PASS** |
| `tests/admin.registry.test.js` | RBAC para roles Staff, CRUD sedes/carreras, consentimiento Ley 21.719 | 16 | **PASS** |
| `tests/routingSecurity.test.js` | Protección de rutas, middlewares de autenticación, prevención de bypass demo | 14 | **PASS** |
| `tests/sat.paedis.risk.test.js` | Integración SAT con ajustes razonables PAEDIS sin fuga de datos sensibles | 15 | **PASS** |
| `tests/academicCalendar.snapshots.test.js` | Regla semana 0, parser PDF de calendario oficial, snapshots de simulación | 4 | **PASS** |
| `tests/verifier.comprehensive.test.mjs` | Auditoría integral: catálogo Alameda 2026, simulador de toma de ramos, boletín oficial | 12 | **PASS** |
| `tests/auth.scraper.ley21719.test.js` | Cumplimiento Ley 21.719, consentimiento explícito, no contraseñas planas | 14 | **PASS** |
| `tests/profileAccessibility.test.js` | Persistencia de preferencias A11y, readingGuideOverlay z-index 9999, voiceReader | 7 | **PASS** |
| `tests/courses.admin.test.js` | CRUD administrativo de cursos y asignaturas | 8 | **PASS** |
| `tests/excelParser.test.js` | Parser de carga masiva de asignaturas y horarios | 6 | **PASS** |

---

## 3. Detalle de Suites Frontend

| Suite | Componentes / Funcionalidades Verificadas | Estado |
| :--- | :--- | :--- |
| `satSimulatorBidirectionalTest.mjs` | Umbral reglamentario 70%, proyección de faltas, reinicio exacto | **PASS** |
| `dashboardSimulatorTest.mjs` | RUT predeterminado biblioteca, enlaces Vivo Duoc, 4 dificultades de toma de ramos, boletín | **PASS** |
| `academicDashboardComponentTest.mjs` | Estados de contrato Bloque B: complete, partial, not_configured, unauthorized, mock_demo, WCAG 2.2 | **PASS** |
| `accountActivationPageTest.mjs` | Validación de contraseña fuerte en cliente, consentimiento Ley 21.719, extracción de token | **PASS** |
| `domPurifySanitizerTest.mjs` | Sanitización HTML contra XSS, neutralización de eventos on*, enlaces ejecutables javascript: | **PASS** |
| `courseImportPreviewTest.mjs` | Previsualización y validación de esquemas de asignaturas importadas | **PASS** |

---

## 4. Auditoría de Compilación de Producción (Vite Bundle)

* **Comando:** `npm run build --prefix frontend`
* **Módulos transformados:** 1682 módulos
* **Assets generados:**
  * `dist/index.html` (1.65 kB)
  * `dist/assets/index-*.css` (152.87 kB — optimizado y minificado)
  * `dist/assets/AdminLayout-*.js` (311.57 kB con integración de HelpContentManager)
  * `dist/assets/AcademicDashboardSection-*.js` (46.05 kB)
  * `dist/assets/SatAttendanceSimulator-*.js` (36.34 kB)
  * `dist/assets/TomaRamosSimulator-*.js` (124.09 kB)
* **Estado:** 0 errores de sintaxis, 0 fallos de importación.

---

## 5. Dictamen Final de QA

El software se encuentra verificado, estabilizado y apto para despliegue en ambiente Staging para pruebas UAT con personal de Sede Alameda.
