# Nexo360 — Matriz de Trazabilidad de Requisitos (RTM)

**Fecha:** 27 de Noviembre de 2026  
**Versión:** 1.0.0-rc  
**Alcance:** Épicas E-001 a E-005, Ley N° 21.719 y Criterios WCAG 2.2 AA

---

## 1. Matriz de Cobertura por Épica

| ID Épica | Nombre de la Épica | Módulos Backend | Componentes Frontend | Pruebas Automatizadas de Verificación | Estado |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **E-001** | **Autenticación Institucional, Activación Cero Contraseñas Predecibles y Cumplimiento Ley 21.719** | `authService.js`, `adminController.js`, `authMiddleware.js`, `UserProfile.js` | `ActivateAccountPage.jsx`, `RegisterUserModal.jsx`, `AuthContext.jsx` | `accountActivation.test.js`, `auth.scraper.ley21719.test.js`, `security.hardening.test.js` | **CUMPLIDO** |
| **E-002** | **Simulador Formativo de Toma de Ramos (SICOL / SAP WebDynpro)** | `courseService.js`, `CourseOffering.js`, `sicolAdapter.js` | `TomaRamosSimulator.jsx`, `OfertaAcademica.jsx` | `verifier.comprehensive.test.mjs`, `courses.admin.test.js`, `excelParser.test.js` | **CUMPLIDO** |
| **E-003** | **Sistema de Alerta Temprana (SAT) y Asistencia Proyectada** | `satAlertService.js`, `predictiveRiskService.js`, `academicCalendarService.js` | `SatAttendanceSimulator.jsx`, `SatMonitoring.jsx`, `AcademicAttendance.jsx` | `predictiveRisk.test.js`, `sat.paedis.risk.test.js`, `academicCalendar.snapshots.test.js`, `satSimulatorBidirectionalTest.mjs` | **CUMPLIDO** |
| **E-004** | **Accesibilidad Universal WCAG 2.2 AA y Acompañamiento PAEDIS** | `paedisController.js`, `userController.js`, `authMiddleware.js` | `PaedisManagement.jsx`, `ReadingGuideOverlay.jsx`, `AccessibilityContext.jsx` | `profileAccessibility.test.js`, `sat.paedis.risk.test.js`, `academicDashboardComponentTest.mjs` | **CUMPLIDO** |
| **E-005** | **Gestión Editorial de Trámites y Contenidos (CMS)** | `helpContentService.js`, `HelpProcedure.js`, `moduleController.js`, `moduleRoutes.js` | `HelpContentManager.jsx`, `AdminLayout.jsx`, `HelpCenterView.jsx` | `helpContent.test.js`, `qa.audit.test.js` | **CUMPLIDO** |

---

## 2. Detalle de Requisitos No Funcionales y Seguridad

| Requisito | Estándar / Norma | Implementación en Nexo360 | Evidencia de Prueba |
| :--- | :--- | :--- | :--- |
| **Protección contra Inyecciones y OWASP Top 10** | OWASP ASVS v4.0 | Sanitización NoSQL injection, DOMPurify fail-closed, validación SSRF con lista blanca en adaptadores. | `qa.audit.test.js`, `domPurifySanitizerTest.mjs`, `vivoDuocAdapter.test.js` |
| **Accesibilidad Digital** | WCAG 2.2 AA | Contraste mínimo 4.5:1, navegación completa por teclado, anillos de foco `ring-4 ring-amber-400`, soporte lector de pantalla ARIA polite/assertive, overlay guía de lectura (`z-[9999]`). | `academicDashboardComponentTest.mjs`, `profileAccessibility.test.js` |
| **Protección de Datos Personales** | Ley N° 21.719 (Chile) | Consentimiento explícito de tratamiento de datos al activar cuenta, eliminación de contraseñas planas, trazabilidad de logs administrativos. | `accountActivation.test.js`, `auth.scraper.ley21719.test.js` |
| **Calidad de Código y Mantenibilidad** | SonarQube Clean Code | 0.6% de duplicación en código, 0 vulnerabilidades de seguridad abiertas, Quality Gate Triple A. | Reporte SonarQube / `sonar-project.properties` |
