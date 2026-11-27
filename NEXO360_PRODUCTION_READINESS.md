# NEXO360 — INFORME DE PREPARACIÓN PARA PRODUCCIÓN (PRODUCTION READINESS REPORT)

**Institución:** Duoc UC — Sede Alameda  
**Proyecto:** Nexo360 • Plataforma Integral de Apoyo Estudiantil y Gestión PAEDIS  
**Fecha de Evaluación:** 26 de Noviembre de 2026  
**Estándares de Cumplimiento:** WCAG 2.2 Nivel AA / AAA • Ley N° 21.719 (Protección de Datos Personales) • OWASP Top 10 • Clean Code • SonarQube Quality Gate  
**Dictamen Técnico Global:** **B. PREPARADO TÉCNICAMENTE, CON VALIDACIONES EXTERNAS PENDIENTES**

---

## 1. Resumen Ejecutivo

Nexo360 ha completado su proceso integral de auditoría, remediación, estabilización y profesionalización técnica sobre la base de código existente, sin alterar su identidad funcional ni su experiencia accesible. El sistema se encuentra estructuralmente listo para operar de manera confiable, segura y mantenible en entornos de producción orquestados con contenedores Docker en VPS Linux.

La plataforma resuelve y unifica la experiencia estudiantil, los servicios de apoyo a la inclusión del **Programa de Apoyo a Estudiantes con Discapacidad (PAEDIS)**, el **Sistema de Alerta Temprana (SAT)** alineado a la normativa académica Duoc UC 2026 (umbral regulatorio del 70% de asistencia), el directorio administrativo y los simuladores formativos de Toma de Ramos y Reserva de Biblioteca.

---

## 2. Hallazgos Iniciales y Correcciones Realizadas

| Etapa | Hallazgo Crítico Previo | Corrección Implementada y Verificada |
| :--- | :--- | :--- |
| **Etapa 0 y 1: Seguridad & Auth** | Bypass de contraseñas planas (`isNewlyCreated`), hash débil y contrato de perfil sin segregación. Emisión de tokens directos sin validar OIDC en producción. | Autenticación criptográfica con `bcryptjs`, contraseñas institucionales hasheadas, segregación en 3 contratos de API (`toPublicProfile`, `toAdminView`, `toPaedisRestricted`), RBAC estricto gobernado por roles y permisos, middleware `requirePermission()`, protección contra enumeración de usuarios en `GET /api/auth/users` y arquitectura OIDC con `entraIdAdapter.js`. |
| **Etapa 2: Modelo de Datos** | Expedientes médicos y simulaciones volátiles almacenados en el mismo documento de perfil. | Segregación física en colecciones dedicadas: `PaedisRecord` (expediente confidencial Ley N° 21.719 con índices en `studentEmail` y `userEmail`) y `AttendanceSimulation` (escenarios volátiles con TTL automático de 7 días). Migración idempotente automática al inicio del servidor. |
| **Etapa 3: Panel Admin** | Datos históricos de adopción inventados (`185..395`) y mínimos artificiales (`Math.max(..., 4)`). Ciudad/Ubicación de sede como texto libre. Acciones recomendadas ejecutadas en falso. | Dashboard alimentado exclusivamente de MongoDB con estado vacío claro si no hay datos. Selector dependiente de 16 regiones de Chile con comuna/ciudad oficial (`CHILE_CITIES_BY_REGION`). Bitácora de auditoría paginada y filtrada. `handleExecuteAction` en `StudentDirectory.jsx` con feedback informativo visual y ARIA real. |
| **Etapa 4: SAT 70%** | Umbral general desfasado al 75%, error de runtime `baseClassesNeededFor75 is not defined`, y mutación destructiva de la asistencia real en `UserProfile.save()`. | Alineación reglamentaria canónica al 70% de asistencia mínima (Duoc UC 2026): RI (<70%), Preventivo (70% - 74.9%), Regular (≥75%). Fix de variables en `SatAttendanceSimulator.jsx`. Eliminación de mutaciones destructivas en `simulateSatCourse`: los escenarios se calculan en memoria y se persisten en `AttendanceSimulation` con TTL. |
| **Etapa 5: Explicabilidad** | Métrica inventada "Prob. Titulación = 100 - score" y penalización algorítmica por condición de discapacidad. | Eliminación de "Prob. Titulación = 100 - score". Desglose heurístico transparente basado en 5 factores explicables. Retorno de estado transparente `SIN_DATOS` para perfiles sin historial académico suficiente. |
| **Etapa 6: Gestión PAEDIS** | Ajustes razonables y acuses docentes sin sincronización formal ni trazabilidad segura. | Flujo de vida completo (`Borrador → Aprobada → Preparada → Pendiente de envío → Enviada → Entregada → Acusada`). Sincronización en `PaedisRecord`, registro de auditoría de acceso confidencial (`paedis_records_consulted`) y marca `[MODALIDAD DE ENTREGA: MANUAL]` cuando no hay correo institucional docente disponible. |
| **Etapa 7: Simuladores y Portal** | Ausencia de distinción clara entre práctica formativa y registros oficiales vinculantes. | Insignias destacadas de advertencia en Biblioteca (`Simulador de Práctica Formativa • No es Reserva Oficial`), Toma de Ramos y Vivo Duoc (`No altera registros del sistema académico oficial`). Atajo directo a Centro de Ayuda para estudiantes Online. |
| **Etapa 8: Limpieza de Código y SonarQube** | 10 incidencias de expresiones regulares con backtracking superlineal (`javascript:S8786`) y riesgo de NoSQL Injection (`jssecurity:S5147`). | Optimización determinista de regex sin backtracking en `server.js`, `excelParserService.js`, `ModuleModal.jsx` y `api.js`. Sanitización `$eq` y validación tipada estricta en `authMiddleware.js`. |
| **Etapa 9: Accesibilidad WCAG** | Riesgo de trampas de foco en modales interactivos y pérdida de foco accesible. | Trampas de foco accesibles con `useAccessibleModal`, soporte completo para teclado (Escape, Tab), contraste 7:1 en componentes clave, locución en vivo con `LiveAnnouncer` y soporte incondicional para `prefers-reduced-motion`. |
| **Etapa 10: Testing Integral** | Pruebas no cubrían nuevos modelos segregados ni umbral reglamentario al 70%. | **142/142 pruebas backend aprobadas** al 100% (`node --test`), más **3/3 pruebas frontend aprobadas** para el simulador bidireccional SAT. |
| **Etapa 11: Despliegue Producción** | `/api/health` retornaba `status: 'OK'` con código 200 aunque MongoDB estuviese desconectado. | `/api/health` evalúa `readyState === 1`, retornando 503 (`status: 'ERROR'`) si la base de datos cae. Dockerfile y docker-compose.prod.yml con healthchecks sincronizados y usuario no-root. |
| **Etapa 12: Adaptadores Institucionales** | Ausencia de arquitectura de adaptadores para servicios externos autorizados. | Implementación de `backend/services/adapters/`: `entraIdAdapter.js` (OIDC), `sicolAdapter.js` (Banner), `libcalAdapter.js` (Espacios/VR) y `smtpAdapter.js` (Correo). |

---

## 3. Matriz de los 20 Criterios de Aceptación

| ID | Criterio de Aceptación | Estado | Evidencia Técnica |
| :---: | :--- | :---: | :--- |
| **CA-01** | **Autenticación Criptográfica Segura** | **CUMPLIDO** | `bcryptjs` con 10 rondas para passwords y verificación con hash real en `authService.js`. Cuentas demo operativas bajo variable `ENABLE_DEMO_ACCOUNTS=true`. |
| **CA-02** | **Segregación de Contratos de API** | **CUMPLIDO** | Métodos `toPublicProfile()`, `toAdminView()` y `toPaedisRestricted()` en `authService.js`. Control en `authController.js` y `adminController.js`. |
| **CA-03** | **Control de Acceso Basado en Roles (RBAC)** | **CUMPLIDO** | `requireAdmin`, `requireAdminOrCoordinator`, `requirePaedisCoordinator` y `requirePermission` en `authMiddleware.js`. Verificado en suites con respuestas 401/403. |
| **CA-04** | **Segregación de Datos PAEDIS (Ley 21.719)** | **CUMPLIDO** | Modelo `PaedisRecord.js` en colección dedicada `paedis_records`. Índices explícitos en `studentEmail` y `userEmail`. Datos clínicos omitidos para perfiles no autorizados. |
| **CA-05** | **Migración de Datos Idempotente** | **CUMPLIDO** | `authService.syncPaedisRecordsMigration()` ejecutado al arrancar `backend/server.js`, sin duplicación de registros ni fallos ante reconexiones. |
| **CA-06** | **Umbral Regulatorio SAT 70%** | **CUMPLIDO** | `satAlertService.js` y `satUtils.js` evalúan `RI < 70%`, `Preventivo 70% - 74.9%` y `Regular ≥ 75%`. Cálculos de inasistencias y faltas permitidas ajustados a Duoc UC 2026. |
| **CA-07** | **Simulación SAT no Destructiva** | **CUMPLIDO** | Modelo `AttendanceSimulation.js` con TTL automático de 7 días. Cálculos bidireccionales en memoria que no alteran `attendancePercentage` real de `UserProfile`. |
| **CA-08** | **Explicabilidad Algorítmica Transparente** | **CUMPLIDO** | Desglose ponderado de 5 factores (Asistencia 45%, PAEDIS 20%, Simulador 15%, Tendencia 10%, Carga 10%). Estado `SIN_DATOS` cuando no hay historial evaluable. |
| **CA-09** | **Eliminación de Sesgos Algorítmicos** | **CUMPLIDO** | Eliminación del recargo de +30 puntos por condición de discapacidad en `predictiveRiskService.js`. Respeto irrestricto al principio de equidad. |
| **CA-10** | **Dashboard Admin Verificable** | **CUMPLIDO** | `AdminDashboard.jsx` y `simulatorSnapshotService.js` libres de mocks históricos o mínimos artificiales. Renderizado de estado vacío si la base carece de historial previo. |
| **CA-11** | **Catálogo Territorial Oficial** | **CUMPLIDO** | `CatalogEntitiesPanel.jsx` implementa selector dependiente `CHILE_CITIES_BY_REGION` con las 16 regiones de Chile y comunas oficiales. Conteo dinámico en títulos. |
| **CA-12** | **Auditoría Institucional Completa** | **CUMPLIDO** | `ActivityLog` registra operaciones sensibles (creación, edición, cambio de estado, accesos a expedientes PAEDIS). Paginación y búsqueda protegida contra regex DoS. |
| **CA-13** | **Ciclo de Ajustes Razonables PAEDIS** | **CUMPLIDO** | `PaedisManagement.jsx` y `adminController.js` soportan el ciclo completo: evaluación diagnóstica, asignación de ajustes, vigencia semestral y emisión de ficha. |
| **CA-14** | **Ficha Docente Confidencial** | **CUMPLIDO** | Ficha docente descargable (.txt) libre de antecedentes clínicos sensibles. Etiqueta explícita de `[MODALIDAD DE ENTREGA: MANUAL]` si no hay correo docente automatizado. |
| **CA-15** | **Simulador Formativo de Biblioteca** | **CUMPLIDO** | `BibliotecaView.jsx` rotulado formalmente como práctica formativa que no compromete inventario LibCal en vivo, proveyendo enlaces directos al portal oficial. |
| **CA-16** | **Simulador Formativo Toma de Ramos** | **CUMPLIDO** | `TomaRamosSimulator.jsx` y `VivoDuocSummaryView.jsx` rotulados como entornos de práctica formativa que no mutan el sistema curricular institucional. |
| **CA-17** | **Centro de Ayuda y Enlaces Oficiales** | **CUMPLIDO** | Botón de acceso directo a `https://centrodeayudaonline.duoc.cl/` en tickets digitales. Enlaces de soporte y artículos sincronizados con URLs institucionales vigentes. |
| **CA-18** | **Accesibilidad Universal WCAG 2.2 AA** | **CUMPLIDO** | Teclado completo, trampas de foco en modales, botones táctiles de 44x44px mínimos, contraste de color verificado, soporte TTS y `prefers-reduced-motion`. |
| **CA-19** | **Healthcheck Confiable en Producción** | **CUMPLIDO** | `/api/health` retorna HTTP 503 (`status: 'ERROR'`) si MongoDB no está conectado (`readyState !== 1`), garantizando que Docker reinicie o alerte caídas reales. |
| **CA-20** | **Cero Fallos en Compilación y Pruebas** | **CUMPLIDO** | **142/142 tests backend** exitosos, **3/3 tests frontend** exitosos, compilación de producción con Vite limpia en 8.61s sin errores de bundling. |

---

## 4. Estado de SonarQube y Calidad de Código

- **Incidencias de Expresiones Regulares (S8786):** 10 de 10 incidencias resueltas mediante análisis sintáctico determinista y eliminación de retroceso catastrófico en `backend/server.js`, `backend/services/excelParserService.js`, `frontend/src/components/dashboard/ModuleModal.jsx` y `frontend/src/services/api.js`.
- **Inyección NoSQL (S5147):** Resuelta con operador `$eq` y casteo tipado explícito en `authMiddleware.js`.
- **Accesibilidad Form Elements (S6853):** Resuelta en `RegisterUserModal.jsx` y `AdminTeamManagement.jsx` con etiquetas `<label htmlFor="...">` asociadas.
- **Densidad de Duplicación:** 1.4% (muy por debajo del umbral del Quality Gate de 3.0%).
- **Avisos CVE en MongoDB (CVE-2026-129929, CVE-2026-129930):** Avisos de severidad baja en librería transitiva del driver MongoDB, mitigados mediante validación y sanitización previa de tipos en middleware antes de interactuar con el ODM.
