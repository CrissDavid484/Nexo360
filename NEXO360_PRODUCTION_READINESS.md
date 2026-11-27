# NEXO360 — INFORME DE PREPARACIÓN PARA PRODUCCIÓN (PRODUCTION READINESS REPORT)

**Institución:** Duoc UC — Sede Alameda  
**Proyecto:** Nexo360 • Plataforma Integral de Apoyo Estudiantil y Gestión PAEDIS  
**Fecha de Evaluación:** 26 de Noviembre de 2026  
**Estándares de Cumplimiento:** WCAG 2.2 Nivel AA / AAA • Ley N° 21.719 (Protección de Datos Personales) • OWASP Top 10 • Clean Code  
**Dictamen Técnico Global:** **PREPARADO TÉCNICAMENTE CON DEPENDENCIAS INSTITUCIONALES PENDIENTES**

---

## 1. Resumen Ejecutivo y Estado de Verificación

Nexo360 ha completado su proceso de remediación de seguridad, segregación de datos clínicos, endurecimiento de infraestructura Docker/CI y verificación automatizada local. La aplicación está preparada a nivel de código, arquitectura y configuración de despliegue, pero la puesta en marcha productiva institucional depende de credenciales externas, aprobaciones legales y validaciones finales en entorno *staging* real.

### Clasificación Honesta por Estado

- **COMPLETADO Y VERIFICADO (evidencia local post-correcciones):**
  - **172/172 pruebas backend aprobadas (0 fallos, 9 suites, 12 archivos)** ejecutadas explícitamente (`node --test`) y vía `npm run test:coverage --prefix backend` (**78.55% líneas, 60.23% ramas, 84.23% funciones** en `backend/coverage/lcov.info`).
  - **Pruebas frontend y build de producción aprobados:** `npm test --prefix frontend` (`satSimulatorBidirectionalTest.mjs`, Tests 1–4), `node frontend/src/tests/dashboardSimulatorTest.mjs` (Tests 1–6), `node frontend/src/tests/courseImportPreviewTest.mjs` (`OK`) y `npm run build --prefix frontend` (`1671 modules transformed` en `8.60s`).
  - **Auditoría de dependencias en producción (`--omit=dev --audit-level=high`):** `0` vulnerabilidades en `backend` y `0` en `frontend`.
  - **Validación de sintaxis e interpolación Docker Compose:** `docker compose -f docker-compose.prod.yml config --quiet` con variables requeridas (exit `0`), usuario no-root en `backend/Dockerfile` (`USER node`) y `frontend/Dockerfile.prod` (`USER nginx`), autenticación `--auth` en MongoDB 7 y usuario de aplicación con privilegios mínimos `readWrite` en `backend/mongo-init.js`.
- **IMPLEMENTADO SIN VALIDACIÓN COMPLETA (requiere staging / ejecución manual):**
  - Levantamiento real de la pila completa `docker-compose.prod.yml` contra un daemon Docker con MongoDB autenticado, inicialización real de `mongo-init.js`, prueba viva de `validateProductionConfig()`, salud de contenedores `/api/health/ready` y ciclo completo de respaldo/reversión (`mongodump` / `mongorestore`).
  - Ejecución del flujo `.github/workflows/ci.yml` en GitHub Actions y análisis remoto en SonarQube / SonarCloud (requiere secreto `SONAR_TOKEN` configurado en el repositorio).
  - Auditoría manual completa con lectores de pantalla reales (**NVDA / JAWS / VoiceOver**) sobre todos los flujos críticos.
- **BLOQUEADO POR DEPENDENCIA EXTERNA (requiere entrega institucional Duoc UC):**
  - Integración viva con **Microsoft Entra ID / Vivo Duoc** (`AZURE_ENTRA_TENANT_ID`, `AZURE_ENTRA_CLIENT_ID`, `AZURE_ENTRA_CLIENT_SECRET`, `AZURE_ENTRA_REDIRECT_URI`). Sin estas variables, el adaptador opera *fail-closed* devolviendo `OIDC_NOT_CONFIGURED`.
  - Integración viva con **SICOL / Banner** (`SICOL_API_URL`, `SICOL_API_KEY`). Sin estas credenciales, `sicolAdapter.js` devuelve `{ configured: false, mode: 'UNCONFIGURED', data: null }`.
  - Integración viva con **Springshare LibCal** (`LIBCAL_BASE_URL`, `LIBCAL_CLIENT_ID`, `LIBCAL_CLIENT_SECRET`). Sin estas credenciales, `libcalAdapter.js` opera en modo formativo `{ configured: false, isOfficialBooking: false, bookingId: null, mode: 'PRACTICE_SIMULATION' }`.
  - Relé **SMTP institucional** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) para entrega real de correos; sin DSN/host SMTP, `smtpAdapter.js` diferencia `MODO_PRUEBA_LOCAL` / `PREPARADO` sin declarar `ENTREGADO`.
  - Revisión y aprobación formal del equipo jurídico/privacidad de Duoc UC respecto de los valores iniciales de consentimiento bajo Ley N° 21.719 (`consentGiven: false`, `legalBasis: 'PENDIENTE_REVISION_INSTITUCIONAL'`).

---

## 2. Hallazgos Remediados y Evidencia Técnica

| Bloque | Corrección Implementada | Evidencia Verificada |
| :--- | :--- | :--- |
| **Autenticación, OIDC y RBAC** | Eliminados los defaults heredados de Vivo Duoc en `entraIdAdapter.js` y `frontend/src/services/api.js`. Verificación criptográfica OIDC con PKCE S256, `state` de un solo uso (10 min), firma RS256 contra JWKS, `iss`/`aud` en JWT HS256, revocación mediante `tokenVersion` (`$inc`), bloqueo *fail-closed* si MongoDB cae en producción (`503`), `demo-token-cristian` restringido estrictamente a `NODE_ENV === 'test'`, protección de `/api/auth/users` y aplicación estricta de `requirePermission()`. | Suite `backend/tests/security.hardening.test.js` (7/7 pass) y auditoría de código en `authMiddleware.js`, `authService.js`, `authController.js`, `adminRoutes.js`. |
| **Segregación Clínica PAEDIS (Ley N° 21.719)** | Expedientes confidenciales centralizados en `PaedisRecord` (`paedis_records`) con ciclo de Ficha Docente (`BORRADOR → APROBADA → PREPARADA → PENDIENTE_ENVIO → ENVIADA → ENTREGADA → ACUSADA`) e invariante en `pre('validate')` que solo marca `fichaDocenteNotificada: true` en estados enviados/entregados/acusados. `UserProfile.js` conserva los campos heredados `diagnosticoDeclarado` y `notasConfidencialesPaedis` marcados con `select: false` para compatibilidad de migración; `createStudent` y `updatePaedisCase` ya no escriben datos clínicos en `UserProfile`, `toPublicProfile()`/`toAdminView()` los omiten, y `syncPaedisRecordsMigration()` usa `.select('+diagnosticoDeclarado +notasConfidencialesPaedis')` para migrar antecedentes existentes sin pérdida. | `UserProfile.js`, `PaedisRecord.js`, `authService.js`, `adminController.js`, `sat.paedis.risk.test.js` (18/18 pass) y `admin.registry.test.js`. |
| **Consentimiento y Contraseñas** | Eliminado fallback en texto plano en `UserProfile.comparePassword` (solo `bcrypt.compare` para hashes `$2a$`/`$2b$`). Corregidos los defaults de consentimiento en `UserProfile.js` a `consentGiven: false`, `consentDate: null`, `legalBasis: 'PENDIENTE_REVISION_INSTITUCIONAL'` e `informationDelivered: false`. | `UserProfile.js` y `sat.paedis.risk.test.js`. |
| **SAT 70%, Simulaciones e Intervenciones** | Umbral regulatorio unificado al 70% (`DEFAULT_MIN_ATTENDANCE = 70`, `PREVENTIVE_UPPER_BOUND = 74.9`) con soporte de umbral por asignatura (`minAttendanceRequired`) en `satAlertService.js`, `satUtils.js`, `SatAttendanceSimulator.jsx` y `SatMonitoring.jsx`. Separación matemática de proyección futura `(attended+1)/(total+1)` frente a corrección pasada `(attended+1)/total`, estado `NO_DATA` cuando `total === 0`, bloqueo de recuperaciones imposibles, `reset` exacto sin 95% falso, y persistencia no destructiva en `AttendanceSimulation`. Persistencias reales de intervenciones en `StudentIntervention` (`student_interventions`) con `externalDerivationPerformed: false`. | `satAlertService.js`, `StudentIntervention.js`, `SatMonitoring.jsx`, `SatAttendanceSimulator.jsx`, `StudentDirectory.jsx`, `sat.paedis.risk.test.js` y tests frontend. |
| **Riesgo Predictivo y Snapshots** | Eliminada `graduationProbability` y toda penalización por condición PAEDIS o no uso del simulador en `predictiveRiskService.js` (agregados `isHeuristic: true`, `indicatorType: 'HEURISTIC_EARLY_FOLLOWUP'`, `requiresHumanReview: true`, `disclaimer`, y `riskLevel: 'SIN_DATOS'` cuando faltan registros). Eliminada `distributeRealistic18Weeks()` y referencias hardcodeadas en `simulatorSnapshotService.js`. | `predictiveRiskService.js`, `simulatorSnapshotService.js`, `predictiveRisk.test.js`, `sat.paedis.risk.test.js`. |
| **Producción, Healthchecks y CI/CD** | MongoDB 7 con `--auth`, usuario `readWrite` mínimo en `backend/mongo-init.js` y healthcheck autenticado. `validateProductionConfig()` en `backend/server.js` aborta el arranque en producción si falta `JWT_SECRET` (<32 chars o placeholder), falta `MONGODB_URI`, o si `ENABLE_DEMO_ACCOUNTS=true` / `ALLOW_IN_MEMORY_FALLBACK=true`. Endpoints `/api/health/live`, `/api/health/ready` y `/api/health`. CI reproducible en `.github/workflows/ci.yml` con LCOV (`backend/coverage/lcov.info`) y `sonar-project.properties`. | `docker-compose.prod.yml`, `backend/mongo-init.js`, `backend/Dockerfile`, `.env.prod.example`, `backend/server.js`, `.github/workflows/ci.yml`. |
| **Accesibilidad WCAG 2.2 AA y UX** | Agregado bloque guía `"Comienza la búsqueda de tus trámites aquí"` en `DashboardPage.jsx`, manejo honesto de errores/estados en `AcademicCatalog.jsx`, `StudentDirectory.jsx` y `PaedisManagement.jsx`, y soporte de `prefers-reduced-motion` / `.reduced-motion`. | `DashboardPage.jsx`, `AcademicCatalog.jsx`, `StudentDirectory.jsx`, `PaedisManagement.jsx`, `index.css` y build Vite limpio. |

---

## 3. Matriz Resumida de Criterios Técnicos

| Área | Estado | Nota de Alcance / Condición |
| :--- | :---: | :--- |
| **Autenticación, JWT y RBAC** | **COMPLETADO Y VERIFICADO** | Verificado localmente con 172 tests; OIDC productivo requiere credenciales Entra ID. |
| **Segregación PAEDIS (`PaedisRecord`)** | **COMPLETADO Y VERIFICADO** | `UserProfile` retiene `diagnosticoDeclarado` y `notasConfidencialesPaedis` con `select: false` solo para compatibilidad de migración idempotente. |
| **Consentimiento Ley N° 21.719** | **IMPLEMENTADO / PENDIENTE LEGAL** | Defaults seguros (`consentGiven: false`, `legalBasis: 'PENDIENTE_REVISION_INSTITUCIONAL'`) requieren validación jurídica Duoc UC. |
| **SAT 70%, Simulaciones e Intervenciones** | **COMPLETADO Y VERIFICADO** | Simulador no destructivo; derivaciones requieren gestión manual del responsable asignado. |
| **Adaptadores (Entra ID, SICOL, LibCal, SMTP)** | **BLOQUEADO POR EXTERNOS** | Contratos y adaptadores listos y probados con mocks; sin pruebas contra endpoints reales de Duoc UC. |
| **Contenedores, Healthchecks y CI** | **COMPLETADO (LOCAL) / PENDIENTE STAGING** | `docker compose config` validado; pendiente levantar stack real con `.env` de producción y correr CI en GitHub/SonarQube. |
| **Accesibilidad WCAG 2.2 AA** | **IMPLEMENTADO SIN AUDITORÍA MANUAL** | Controles semánticos y build verificados; falta prueba manual con lector de pantalla (NVDA / VoiceOver). |

---

## 4. Plan de Traspaso a Duoc UC (5 Bloques Operativos)

### A. Trabajo de software que todavía debe completarse (opcional / post-entrega)
1. Una vez completada y verificada la migración de expedientes en la base de datos productiva existente, planificar una ventana de mantenimiento futura para retirar los campos heredados `select: false` (`diagnosticoDeclarado`, `notasConfidencialesPaedis`) del esquema `UserProfile.js`.
2. Incorporar cobertura LCOV automatizada para el frontend (actualmente `sonar.coverage.exclusions` excluye `frontend/**` mientras el frontend ejecuta sus 3 scripts ESM sin reporte LCOV).

### B. Configuración de infraestructura
1. Aprovisionar VPS/servidor Linux con Docker Engine + Docker Compose v2, reverse proxy TLS/HTTPS (443 → puerto `APP_PORT` del contenedor `frontend` en `8080`), y firewall cerrando `5000` y `27017` hacia internet.
2. Copiar `.env.prod.example` a `.env` en la raíz del proyecto y reemplazar **todos** los marcadores `<REEMPLAZAR_...>` (`MONGO_INITDB_ROOT_USERNAME`, `MONGO_INITDB_ROOT_PASSWORD`, `MONGO_APP_USER`, `MONGO_APP_PASSWORD`, `JWT_SECRET` ≥ 32 chars, `FRONTEND_URL`, `APP_PUBLIC_URL`), manteniendo `ENABLE_DEMO_ACCOUNTS=false` y `ALLOW_IN_MEMORY_FALLBACK=false`.
3. Verificar límites de memoria asignados en `docker-compose.prod.yml` (`mongodb: 512M`, `backend: 384M`, `frontend: 128M`) respecto de la RAM real del host.

### C. Autorizaciones y credenciales institucionales
1. **TI Duoc UC / Identidad:** Registrar aplicación Nexo360 en **Microsoft Entra ID** y entregar `AZURE_ENTRA_TENANT_ID`, `AZURE_ENTRA_CLIENT_ID`, `AZURE_ENTRA_CLIENT_SECRET` y `AZURE_ENTRA_REDIRECT_URI`.
2. **TI Duoc UC / ERP Académico:** Autorizar acceso y entregar `SICOL_API_URL`, `SICOL_API_KEY` y `SICOL_CLIENT_ID` si se requiere sincronización directa de nóminas/asistencia.
3. **Biblioteca Duoc UC / Springshare:** Entregar `LIBCAL_BASE_URL`, `LIBCAL_CLIENT_ID` y `LIBCAL_CLIENT_SECRET` si se desea habilitar reservas reales (de lo contrario opera explícitamente como simulador formativo).
4. **Infraestructura de Correo:** Entregar `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM` para notificaciones reales.
5. **DevSecOps:** Configurar secreto `SONAR_TOKEN` (y opcionalmente variable `SONAR_HOST_URL`) en GitHub Actions para habilitar el job `sonarqube` en `.github/workflows/ci.yml`.

### D. Validaciones legales, seguridad y accesibilidad
1. Revisión jurídica/privacidad de Duoc UC (Ley N° 21.719) para aprobar el texto de aviso informativo, base legal (`legalBasis`) y flujo de captura de `consentGiven` en perfiles institucionales.
2. Validación de seguridad en *staging* (prueba de arranque con `NODE_ENV=production` y `validateProductionConfig()`, verificación de rechazo `401`/`403` en rutas protegidas y `503` cuando MongoDB está caído).
3. Auditoría manual de accesibilidad con teclado completo y lectores de pantalla (**NVDA** en Windows / **VoiceOver** en macOS) sobre login, Dashboard, Toma de Ramos, Ficha 360, SAT y Panel PAEDIS.

### E. Puesta en marcha y pruebas finales
1. Levantar pila en *staging* / pre-producción con `.env` completo (`docker compose -f docker-compose.prod.yml up -d --build`) y comprobar estado `healthy` de `mongodb`, `backend` (`/api/health/ready`) y `frontend`.
2. Ejecutar pruebas smoke autenticadas con usuarios reales/Entra ID, confirmar creación de usuario `MONGO_APP_USER` (`readWrite`) por `mongo-init.js` y verificar respaldo/restauración (`mongodump` / `mongorestore`).
