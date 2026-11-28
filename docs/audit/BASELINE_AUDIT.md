# NEXO360 — INFORME DE AUDITORÍA DE LÍNEA BASE (FASE 0)

**Fecha:** 27 de Noviembre de 2026  
**Commit Auditado:** `f8cfcd94182d36493b0539ba793162b6216e0d1c`  
**Rama:** `main`  
**Estado del Árbol de Trabajo:** Limpio (`working tree clean`)  
**Estándares de Evaluación:** WCAG 2.2 AA / AAA • Ley N° 21.719 (Protección de Datos Personales) • OWASP Top 10 • Clean Code • Compromisos PMV Épicas Rev. 02  

---

## 1. Resumen Ejecutivo de la Línea Base

Se ha auditado integralmente el repositorio Nexo360 en el commit `f8cfcd9`. La plataforma cuenta con una arquitectura MERN modular funcionalmente orientada a la autonomía de estudiantes PAEDIS de Duoc UC - Sede Alameda. 

El repositorio cuenta con **208 pruebas backend automatizadas** y **6 suites frontend**, compilación de producción Vite limpia y calidad SonarQube con métricas sobresalientes (Rating A, 0.4% duplicación). Sin embargo, la auditoría profunda revela brechas de seguridad crítica en producción, falta de persistencia en la gestión de contenidos (Épica E-005), necesidad de atomicidad en la activación de cuentas y calibración de honestidad en simuladores (LibCal, SICOL, SAT).

---

## 2. Arquitectura Observada y Componentes

### 2.1. Frontend (React 18 + Vite 6 + Tailwind CSS)
* **Páginas Principales:** `LoginPage.jsx`, `DashboardPage.jsx`, `ActivateAccountPage.jsx`, `NotFoundPage.jsx`.
* **Módulos y Vistas Activas:**
  * Centro de Ayuda & Trámites (`DashboardPage`, `SearchBar`, `ModuleCard`, `ModuleModal`).
  * Panel Académico Oficial Vivo Duoc (`AcademicDashboardSection`, `AcademicOverview`, `AcademicAttendance`, `AcademicGrades`, `AcademicSchedule`, `AcademicProgress`).
  * Simulador de Toma de Ramos (`TomaRamosSimulator`).
  * Simulador de Asistencia SAT (`SatAttendanceSimulator`).
  * Vistas complementarias: `PerfilView`, `BibliotecaView`, `VivoDuocSummaryView`, `ServiciosDigitalesTicketsView`.
  * Panel de Administración: `AdminLayout`, `AcademicCatalog`, `StudentDirectory`, `PaedisManagement`, `SatMonitoring`, `AuditLog`, `ExplainabilityPanel`.
* **Accesibilidad:** `AccessibilityContext` (lector por voz TTS, contraste alto/oscuro, tipografía OpenDyslexic, tamaño de texto, reducción de animaciones), `AccessibilityBar`, `ThemeCurtainOverlay`, `ReadingGuideOverlay`.

### 2.2. Backend (Node.js 22 + Express 4 + Mongoose 9)
* **Punto de Entrada:** `server.js` con cabeceras Helmet/OWASP, CORS configurable, endpoints `/api/health/live`, `/api/health/ready`, `/api/health`.
* **Modelos MongoDB:**
  * `UserProfile` (`users_profiles`): cuentas institucionales, roles RBAC, `tokenVersion`.
  * `PaedisRecord` (`paedis_records`): expedientes confidenciales clínicos PAEDIS, ciclo de Ficha Docente (7 estados).
  * `StudentIntervention` (`student_interventions`): bitácora de intervenciones.
  * `AttendanceSimulation` (`attendance_simulations`): escenarios SAT no destructivos (TTL 7 días).
  * `CourseOffering`, `Career`, `Sede`, `AcademicCalendar`, `SimulatorChartSnapshot`, `ActivityLog`.
* **Servicios de Negocio:**
  * `academicDataService`: orquestador central de información académica con modos `disabled|mock|live`, prevención IDOR fail-closed, evaluación SAT y riesgo predictivo.
  * `authService`: login, activación con token SHA-256, cambio de credenciales, control de intentos.
  * `predictiveRiskService`: cálculo heurístico explicable de riesgo de deserción sin sesgo PAEDIS.
  * `satAlertService`: evaluación de riesgo RI bajo umbral 70%.
  * `academicCalendarService`, `simulatorSnapshotService`, `catalogService`, `emailService`, `excelParserService`.
* **Adaptadores Institucionales (`backend/services/adapters/`):**
  * `vivoDuocAdapter`: integración con API Vivo Duoc, caché en memoria aislada por usuario y modo.
  * `entraIdAdapter`: integración OIDC/OAuth2 con Microsoft Entra ID.
  * `sicolAdapter`: proxy desacoplado a SICOL.
  * `libcalAdapter`: proxy desacoplado a Springshare LibCal.
  * `smtpAdapter`: cliente de transporte SMTP seguro.
  * `adapterUtils`: utilidades SSRF y fetch con validación de host y timeout.

---

## 3. Estado de Cumplimiento de las 5 Épicas Originales

| Épica | Compromiso PMV | Estado Línea Base | Diagnóstico Técnico |
| :--- | :--- | :---: | :--- |
| **E-001** | Exploración y búsqueda de trámites y servicios | `VERIFIED` | Motor de búsqueda tolerante, agrupación por categorías, navegación por teclado y móvil operativa. |
| **E-002** | Orientación guiada de trámites y servicios | `VERIFIED` | 9 categorías y más de 120 artículos con pasos, requisitos y enlaces externos institucionales. |
| **E-003** | Experiencia y accesibilidad digital (WCAG 2.2 AA) | `IMPLEMENTED` | Cumplimiento estático de atributos ARIA, contraste, touch targets >= 44px; pendiente validación manual con NVDA/VoiceOver. |
| **E-004** | Acceso e integración con servicios institucionales | `IMPLEMENTED` | Enlaces y adaptadores institucionales con modos fail-closed; pendiente habilitación con credenciales reales. |
| **E-005** | Gestión y mantenimiento de contenidos | `FAILED` / `INCOMPLETO` | **Los trámites residen en archivos estáticos (`duocModulesData.js` e `institutionalModules.json`). No existe persistencia en base de datos ni interfaz administrativa para crear/editar trámites sin modificar código.** |

---

## 4. Defectos Identificados por Fase de Intervención

### 4.1. Seguridad y Configuración Productiva (Fase 1)
1. **Bypass de Secretos en `server.js`:** `validateProductionConfig()` genera automáticamente una clave temporal `crypto.randomBytes(32)` y redirige `MONGODB_URI` a `localhost` en producción. Debe fallar cerrado (*fail-fast*) impidiendo el arranque inseguro.
2. **Elevación de Privilegios y Bypass de Activación en `adminController.js`:**
   * `body.isDemoAccount` es aceptado ciegamente desde el cliente, permitiendo que cualquier petición active cuentas de demostración.
   * `body.isActivated` permite forzar el estado de activación sin pasar por el flujo de token.
   * `body.permissions` permite inyectar permisos sin verificar el rol del usuario autenticado ni la política del servidor.
   * `isExplicitPasswordAllowed` permite fijar contraseñas directas si el cliente envía `isDemoAccount: true`.
3. **Condición de Carrera en `authService.js` (`activateAccountWithToken`):**
   * El token de activación se consulta con `findOne` y luego se actualiza con `userDoc.save()`, permitiendo ataques de repetición concurrentes (*replay/double-spending*). Debe resolverse atómicamente con `findOneAndUpdate`.
4. **Almacenamiento de Sesión en Frontend:**
   * JWT almacenado en `localStorage` sujeto a riesgos de XSS; debe implementarse un mecanismo de mitigación, sanitización estricta y limpieza exhaustiva en logout.

### 4.2. Calibración Funcional y Honestidad (Fase 3)
1. **Simulador SAT:** La invocación desde `AcademicAttendance` debe inyectar la línea base académica real (`totalSessions`, `attendedSessions`, `courseCode`, `minAttendanceRequired`) para no forzar al estudiante a ingresar datos que la plataforma ya conoce.
2. **Biblioteca y LibCal:** El módulo `BibliotecaView` y `libcalAdapter` deben declarar explícitamente el estado de simulación formativa y no generar códigos o mensajes que simulen una confirmación institucional oficial.
3. **Toma de Ramos:** Clarificar que la simulación de inscripción no tiene efectos vinculantes sobre SICOL.

### 4.3. Gestión Editorial de Contenidos (Fase 2 / Épica E-005)
1. Ausencia de modelo Mongoose `InstitutionalArticle` / `HelpModule`.
2. Ausencia de endpoints CRUD `/api/modules` con control de versiones y auditoría.
3. Ausencia de interfaz de edición editorial en el panel de administración.
4. Falta script de migración idempotente desde `institutionalModules.json` hacia MongoDB.

### 4.4. Depuración de Código Huérfano (Fase 4)
1. Componentes sin uso o desconectados: `CatalogEntitiesPanel.jsx`, `ConfirmActionDialog.jsx`, `MarkdownPreviewModal.jsx`, `Toggle.jsx`.
2. Archivos `index.js` de re-exportación con referencias obsoletas.

### 4.5. Integraciones Externas (Fase 5)
1. `smtpAdapter.js` reporta `ENVIADO_SMTP` ante pruebas socket sin validación real de entrega.
2. Contratos de Vivo Duoc, SICOL y LibCal requieren matrices de variables y documentación precisa de dependencias bloqueantes (`BLOCKED_EXTERNAL`).

---

## 5. Plan de Acción Inmediato

1. **Fase 1:** Corregir `backend/server.js`, `backend/controllers/adminController.js` y `backend/services/authService.js` con pruebas de regresión y concurrencia.
2. **Fase 2:** Implementar el modelo y servicio de gestión editorial de contenidos (Épica E-005), endpoints administrativos, migración de datos y componentes React.
3. **Fase 3:** Calibrar los simuladores (SAT, LibCal, Toma de Ramos) asegurando línea base fiel y mensajes transparentes.
4. **Fase 4:** Realizar inventario de código huérfano y documentar `ORPHAN_CODE_REPORT.md`.
5. **Fase 5:** Documentar `INTEGRATION_STATUS.md` y corregir adaptadores.
6. **Fases 6 a 9:** Pruebas integrales, infraestructura staging, validación de privacidad y entrega final de reportes.
