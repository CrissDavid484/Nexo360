# NEXO360 — DOCUMENTO DE TRASPASO TÉCNICO INSTITUCIONAL (TECHNICAL HANDOVER)

**Institución Destinataria:** Duoc UC — Dirección de Tecnologías de la Información & Coordinación PAEDIS  
**Fecha de Entrega:** 26 de Noviembre de 2026  
**Estado Técnico Global:** `PREPARADO TÉCNICAMENTE CON DEPENDENCIAS INSTITUCIONALES PENDIENTES`  
**Repositorio de Código:** https://github.com/CrissDavid484/Nexo360  
**Repositorio de Documentación:** https://github.com/DanielaD1az/Nexo360

---

## 1. Visión General de la Arquitectura

Nexo360 es una aplicación web modular basada en la pila MERN (MongoDB 7, Express, React 18, Node.js 22) orientada a la gestión estudiantil y el Programa de Apoyo a Estudiantes con Discapacidad (PAEDIS), con soporte WCAG 2.2 AA/AAA y controles técnicos alineados a la Ley N° 21.719.

```
+-------------------------------------------------------------------------------+
|                                  CLIENTE (SPA)                                |
|  React 18 + Vite 6 + Tailwind CSS + Lucide Icons + LiveAnnouncer (A11y WCAG)  |
+-------------------------------------------------------------------------------+
                                      │ HTTPS / HTTP (Nginx Reverse Proxy :8080)
                                      ▼
+-------------------------------------------------------------------------------+
|                            REVERSE PROXY (NGINX ALPINE)                       |
|      Contenedor no-root (USER nginx) • Proxy /api/ -> backend:5000            |
+-------------------------------------------------------------------------------+
                                      │ HTTP interno (red nexo360-net)
                                      ▼
+-------------------------------------------------------------------------------+
|                         BACKEND API (EXPRESS / NODE.JS 22)                    |
|  - Contenedor no-root (USER node) • validateProductionConfig() fail-fast      |
|  - Middleware: JWT HS256 (iss/aud/tokenVersion), RBAC, requirePermission      |
|  - Rutas: /api/auth, /api/modules, /api/admin, /api/courses, /api/calendar    |
|  - Salud: /api/health/live, /api/health/ready, /api/health                    |
|  - Adaptadores: entraIdAdapter, sicolAdapter, libcalAdapter, smtpAdapter      |
+-------------------------------------------------------------------------------+
                                      │ Mongoose ODM (usuario readWrite en nexo360)
                                      ▼
+-------------------------------------------------------------------------------+
|                          MONGODB 7 (--auth, WiredTiger 0.25GB)                |
|  - users_profiles: Perfiles institucionales (campos clínicos legacy select:false)
|  - paedis_records: Expedientes clínicos PAEDIS canónicos y Ficha Docente      |
|  - student_interventions: Bitácora persistente de intervenciones              |
|  - attendance_simulations: Escenarios SAT no destructivos (TTL 7 días)        |
|  - courses / careers / sedes / academic_calendars / simulator_chart_snapshots |
|  - activity_logs: Bitácora de auditoría institucional                         |
+-------------------------------------------------------------------------------+
```

---

## 2. Modelo de Datos, Segregación PAEDIS y Ley N° 21.719

1. **`users_profiles` (`backend/models/UserProfile.js`):**
   - Almacena identificación institucional, rol, permisos granulares, `tokenVersion` (revocación de sesiones), `isBlocked`/`isActive`, preferencias de accesibilidad y matrícula.
   - **Compatibilidad de migración:** `UserProfile.js` conserva los campos heredados `diagnosticoDeclarado` y `notasConfidencialesPaedis` marcados con `select: false`. Las rutas de creación/actualización (`createStudent`, `updatePaedisCase`) ya **no** escriben antecedentes clínicos en `UserProfile`, y los serializadores `toPublicProfile()` y `toAdminView()` los excluyen.
   - **Migración idempotente:** `authService.syncPaedisRecordsMigration()` consulta explícitamente con `.select('+diagnosticoDeclarado +notasConfidencialesPaedis')` para trasladar datos heredados hacia `PaedisRecord` sin pérdida silenciosa.
   - **Consentimiento (pendiente de revisión legal):** Los valores por defecto son `consentGiven: false`, `consentDate: null`, `legalBasis: 'PENDIENTE_REVISION_INSTITUCIONAL'` e `informationDelivered: false`.
   - **Contraseñas:** `comparePassword()` acepta únicamente hashes `bcryptjs` (`$2a$` / `$2b$`), sin fallback en texto plano.
2. **`paedis_records` (`backend/models/PaedisRecord.js`):**
   - Colección canónica confidencial (`studentId`/`userId`, `studentEmail`/`userEmail`, `diagnosticoDeclarado`, `notasConfidenciales`, `ajustesRazonables`, `fichaDocenteEstado` con enum de 7 estados desde `BORRADOR` hasta `ACUSADA`, `fichaDocenteHistorial`, `tutorPaedisAsignado`).
   - Invariante en `pre('validate')`: `fichaDocenteNotificada` solo vale `true` cuando `fichaDocenteEstado` es `'ENVIADA'`, `'ENTREGADA'` o `'ACUSADA'`. Descargar la ficha `.txt` en frontend transiciona a `'PREPARADA'`, nunca a notificada/enviada.
3. **`student_interventions` (`backend/models/StudentIntervention.js`):**
   - Registra intervenciones reales sobre estudiantes (`status` en `REGISTRADA`, `EN_SEGUIMIENTO`, `COMPLETADA`, `CANCELADA`) con `externalDerivationPerformed: false`, dejando explícito que las derivaciones requieren gestión manual del responsable asignado.
4. **`attendance_simulations` (`backend/models/AttendanceSimulation.js`):**
   - Persiste simulaciones SAT no destructivas (`TTL 7 días`) calculadas sobre el umbral reglamentario `70%` (`minAttendanceRequired`) y proyecciones separadas para clases futuras `(attended+1)/(total+1)` y correcciones pasadas `(attended+1)/total`.

---

## 3. Adaptadores de Integración Institucional (`backend/services/adapters/`)

Todos los adaptadores están implementados como contratos desacoplados y probados localmente con simulaciones/mocks. **Ninguno ha sido ejecutado ni probado contra servidores reales de Duoc UC.**

| Adaptador | Archivo | Contrato Implementado | Estado Actual y Dependencia |
| :--- | :--- | :--- | :--- |
| **Microsoft Entra ID** | `entraIdAdapter.js` | Flujo OIDC con PKCE `S256`, almacén de `state` de un solo uso (10 min), verificación de firma `RS256` contra JWKS y validación de `tid`/`nonce`/`exp`/`nbf` y dominio `@duocuc.cl`. Sin defaults heredados. | **BLOQUEADO POR CREDENCIALES:** Si faltan `AZURE_ENTRA_TENANT_ID`, `AZURE_ENTRA_CLIENT_ID`, `AZURE_ENTRA_CLIENT_SECRET` o `AZURE_ENTRA_REDIRECT_URI`, falla cerrado (`OIDC_NOT_CONFIGURED`). |
| **SICOL / Banner** | `sicolAdapter.js` | Cliente HTTP con timeout y reintento único en `502`/`503`/`504`, leyendo `SICOL_API_URL`, `SICOL_API_KEY` y `SICOL_CLIENT_ID`. | **BLOQUEADO POR CREDENCIALES:** Sin `SICOL_API_URL` y `SICOL_API_KEY`, retorna `{ configured: false, mode: 'UNCONFIGURED', data: null }`. |
| **Springshare LibCal** | `libcalAdapter.js` | Autenticación OAuth2 `client_credentials` contra `${baseUrl}/oauth/token` con caché por expiración. | **BLOQUEADO POR CREDENCIALES:** Sin configuración real, `reserveSpace()` opera como simulador formativo (`{ configured: false, isOfficialBooking: false, bookingId: null, mode: 'PRACTICE_SIMULATION' }`). |
| **SMTP Institucional** | `smtpAdapter.js` | Envío de correos diferenciando estados `PREPARADO`, `ENVIADO_SMTP`, `MODO_PRUEBA_LOCAL` y `FALLIDO` sin reportar falsamente `ENTREGADO`. | **PENDIENTE CONFIGURACIÓN SMTP:** Requiere `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` y `SMTP_FROM` en producción para envío real. |

---

## 4. Control de Acceso (RBAC), Validación de Arranque y Salud

- **Roles y permisos (`authMiddleware.js`, `adminRoutes.js`):**
  - `admin` / `administrador`: Gestión TI, catálogos, usuarios y bitácora `ActivityLog`. No tiene permisos clínicos PAEDIS (`paedis_read`/`paedis_write` removidos de `STAFF_ROLE_META.admin`) y recibe `403` en rutas PAEDIS confidenciales.
  - `coordinador_paedis`: Gestión exclusiva de expedientes `PaedisRecord`, Fichas Docentes e intervenciones.
  - `profesor` y `estudiante`: Restringidos a sus rutas autorizadas; `requirePermission()` valida permisos explícitamente incluso cuando `permissions` está vacío (`[]`), y cualquier cambio de rol/permisos incrementa `tokenVersion` para invalidar tokens previos.
- **Validación *Fail-Fast* en Producción (`backend/server.js`):**
  - `validateProductionConfig()` se ejecuta en `startServer()` cuando `NODE_ENV === 'production'` (no interfiere al importar `app` en tests) y aborta el arranque si:
    1. `JWT_SECRET` falta, tiene `< 32` caracteres o coincide con secretos de desarrollo/placeholders (`nexo360_duoc_paedis_secret_key_wcag_2026`, `genera_una_clave...`, `<REEMPLAZAR_...>`).
    2. `MONGODB_URI` falta o contiene `<REEMPLAZAR_...>`.
    3. `ENABLE_DEMO_ACCOUNTS === 'true'` o `ALLOW_IN_MEMORY_FALLBACK === 'true'`.
- **Endpoints de Salud (`backend/server.js`):**
  - `GET /api/health/live`: HTTP `200` (`ALIVE`) si el proceso Express responde.
  - `GET /api/health/ready`: HTTP `200` (`READY`) únicamente cuando `mongoose.connection.readyState === 1`; en cualquier otro estado responde HTTP `503` (`NOT_READY`). Usado por `HEALTHCHECK` en `backend/Dockerfile` y `docker-compose.prod.yml`.
  - `GET /api/health`: HTTP `200` (`OK`) si MongoDB está conectado, HTTP `200` (`TEST_DEGRADED`) solo en `NODE_ENV === 'test'`, o HTTP `503` (`ERROR`) si está desconectado fuera de pruebas.

---

## 5. CI/CD, Calidad de Código y Verificación Actual

- **Pipeline CI (`.github/workflows/ci.yml`):**
  - `backend`: `npm ci --prefix backend --ignore-scripts`, `npm run test:coverage --prefix backend` (genera `backend/coverage/lcov.info`), `npm audit --prefix backend --audit-level=high --omit=dev`.
  - `frontend`: `npm ci --prefix frontend --ignore-scripts`, `npm test --prefix frontend`, `npm run build --prefix frontend`, `npm audit --prefix frontend --audit-level=high --omit=dev`.
  - `docker-compose-check`: valida `docker compose -f docker-compose.prod.yml config --quiet`.
  - `sonarqube`: descarga el artefacto LCOV y ejecuta `SonarSource/sonarqube-scan-action@v5` usando `sonar-project.properties` (`sonar.javascript.lcov.reportPaths=backend/coverage/lcov.info`) cuando `SONAR_TOKEN` está definido.
- **Evidencia local verificada tras la última edición de código:**
  - Backend: **172/172 pruebas aprobadas** (`node --test` y `npm run test:coverage --prefix backend`, **78.55% cobertura de líneas**).
  - Frontend: **Tests 1–4** (`satSimulatorBidirectionalTest.mjs`), **Tests 1–6** (`dashboardSimulatorTest.mjs`), `courseImportPreviewTest.mjs` (`OK`) y `vite build` limpio (`1671 modules transformed`, `8.60s`).
  - Auditoría de dependencias (`--omit=dev --audit-level=high`): `0` vulnerabilidades en `backend` y `frontend`.

---

## 6. Resumen de Traspaso a Duoc UC (5 Bloques)

1. **A. Trabajo de software restante (futuro):** Retirar los campos heredados `select: false` (`diagnosticoDeclarado`, `notasConfidencialesPaedis`) de `UserProfile.js` una vez verificada la migración en producción; sumar cobertura LCOV automatizada para frontend.
2. **B. Infraestructura:** Aprovisionar host Linux, TLS/HTTPS en reverse proxy, completar `.env` desde `.env.prod.example` sin placeholders y confirmar almacenamiento persistente de `nexo360_mongodb_data`.
3. **C. Autorizaciones y credenciales institucionales:** Entregar credenciales de Microsoft Entra ID, SICOL/Banner, LibCal, relé SMTP y secreto `SONAR_TOKEN` en GitHub.
4. **D. Validaciones legales, seguridad y accesibilidad:** Aprobación jurídica Ley N° 21.719 (`consentGiven`, `legalBasis`), pruebas *fail-fast* en *staging* y auditoría manual con lector de pantalla (NVDA / VoiceOver).
5. **E. Puesta en marcha y pruebas finales:** Arranque completo de `docker-compose.prod.yml` en *staging*, verificación de `mongo-init.js` y prueba controlada de respaldo/reversión (`mongodump` / `mongorestore`).
