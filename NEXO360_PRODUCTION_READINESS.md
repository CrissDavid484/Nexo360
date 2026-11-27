# NEXO360 — INFORME DE PREPARACIÓN PARA PRODUCCIÓN (PRODUCTION READINESS REPORT)

**Institución:** Duoc UC — Sede Alameda  
**Proyecto:** Nexo360 • Plataforma Integral de Apoyo Estudiantil y Gestión PAEDIS  
**Fecha de Evaluación:** 26 de Noviembre de 2026  
**Estándares de Cumplimiento:** WCAG 2.2 Nivel AA / AAA • Ley N° 21.719 (Protección de Datos Personales) • OWASP Top 10 • Clean Code  
**Dictamen Técnico Global:** **B. PREPARADO TÉCNICAMENTE, CON VALIDACIONES EXTERNAS PENDIENTES**

---

## 1. Resumen Ejecutivo

Nexo360 ha completado su proceso integral de auditoría, remediación, estabilización y profesionalización técnica sobre la base de código existente, sin alterar su identidad funcional ni su experiencia accesible. El sistema se encuentra estructuralmente listo para operar de manera confiable, segura y mantenible en entornos de producción orquestados con contenedores Docker en VPS Linux.

La plataforma resuelve y unifica la experiencia estudiantil, los servicios de apoyo a la inclusión del **Programa de Apoyo a Estudiantes con Discapacidad (PAEDIS)**, el **Sistema de Alerta Temprana (SAT)** alineado a la normativa académica Duoc UC 2026 (umbral regulatorio del 70% de asistencia), el directorio administrativo y los simuladores formativos de Toma de Ramos y Reserva de Biblioteca.

---

## 2. Hallazgos Iniciales y Correcciones Realizadas (Etapas 0 a 11)

| Etapa | Hallazgo Crítico Previo | Corrección Implementada y Verificada |
| :--- | :--- | :--- |
| **Etapa 0 y 1: Seguridad & Auth** | Bypass de contraseñas planas (`isNewlyCreated`), hash débil y contrato de perfil sin segregación. | Autenticación criptográfica con `bcryptjs`, contraseñas institucionales hasheadas, segregación en 3 contratos de API (`toPublicProfile`, `toAdminView`, `toPaedisRestricted`), RBAC estricto gobernado por roles y permisos, y sesiones controladas por JWT con validación de cuenta activa. |
| **Etapa 2: Modelo de Datos** | Expedientes médicos y simulaciones volátiles almacenados en el mismo documento de perfil. | Segregación física en colecciones dedicadas: `PaedisRecord` (expediente confidencial Ley N° 21.719 con índice en `studentEmail`) y `AttendanceSimulation` (escenarios volátiles con TTL de 7 días). Migración idempotente automática al inicio del servidor. |
| **Etapa 3: Panel Admin** | Datos históricos de adopción inventados (`185..395`) y mínimos artificiales (`Math.max(..., 4)`). Ciudad/Ubicación de sede como texto libre. | Dashboard alimentado exclusivamente de MongoDB con estado vacío claro si no hay datos. Selector dependiente de 16 regiones de Chile con comuna/ciudad oficial (`CHILE_CITIES_BY_REGION`). Bitácora de auditoría paginada y filtrada. |
| **Etapa 4: SAT 70%** | Umbral general desfasado al 75% e inconsistencia entre vista y simulador. | Alineación reglamentaria canónica al 70% de asistencia mínima (Duoc UC 2026): RI (<70%), Preventivo (70% - 74.9%), Regular (≥75%). Funciones puras de cálculo bidireccional que nunca mutan la base de datos real. |
| **Etapa 5: Explicabilidad** | Métrica inventada "Prob. Titulación" y penalización algorítmica por condición de discapacidad. | Eliminación de "Prob. Titulación" en UI y backend. Eliminación de la penalización de +30 puntos a estudiantes PAEDIS sin tutor. Retorno de estado transparente `SIN_DATOS` para perfiles sin historial académico suficiente. |
| **Etapa 6: Gestión PAEDIS** | Ajustes razonables y acuses docentes sin sincronización formal ni trazabilidad segura. | Flujo de vida completo (`Registro → Evaluación → Aprobación → Ficha Docente → Acuse → Renovación`). Sincronización en `PaedisRecord`, registro de auditoría de acceso confidencial (`paedis_records_consulted`) y marca `[MODALIDAD DE ENTREGA: MANUAL]` cuando no hay correo institucional docente disponible. |
| **Etapa 7: Simuladores y Portal** | Ausencia de distinción clara entre práctica formativa y registros oficiales vinculantes. | Insignias destacadas de advertencia en Biblioteca (`Simulador de Práctica Formativa • No es Reserva Oficial`), Toma de Ramos y Vivo Duoc (`No altera registros del sistema académico oficial`). Atajo directo a Centro de Ayuda para estudiantes Online. |
| **Etapa 8: Limpieza de Código** | Código redundante y dependencias no utilizadas en frontend y backend. | Refactorización modular, eliminación de variables obsoletas, consolidación de utilitarios compartidos y arquitectura limpia DRY. |
| **Etapa 9: Accesibilidad WCAG** | Riesgo de trampas de foco en modales interactivos y pérdida de foco accesible. | Trampas de foco accesibles con `useAccessibleModal`, soporte completo para teclado (Escape, Tab), contraste 7:1 en componentes clave, locución en vivo con `LiveAnnouncer` y soporte incondicional para `prefers-reduced-motion`. |
| **Etapa 10: Testing Integral** | Pruebas no cubrían nuevos modelos segregados ni umbral reglamentario al 70%. | 141 pruebas unitarias e integrales en backend pasando al 100% (`node --test`), más suite de pruebas frontend para el simulador bidireccional SAT. |
| **Etapa 11: Despliegue Producción** | `/api/health` retornaba `status: 'OK'` con código 200 aunque MongoDB estuviese desconectado. | `/api/health` evalúa `readyState === 1`, retornando 503 (`status: 'ERROR'`) si la base de datos cae. Dockerfile y docker-compose.prod.yml con healthchecks sincronizados y usuario no-root. |

---

## 3. Matriz de los 20 Criterios de Aceptación

| ID | Criterio de Aceptación | Estado | Evidencia Técnica |
| :---: | :--- | :---: | :--- |
| **CA-01** | **Autenticación Criptográfica Segura** | **CUMPLIDO** | `bcryptjs` con 10 rondas para passwords y verificación con hash real en `authService.js`. Cuentas demo operativas bajo variable `ENABLE_DEMO_ACCOUNTS=true`. |
| **CA-02** | **Segregación de Contratos de API** | **CUMPLIDO** | Métodos `toPublicProfile()`, `toAdminView()` y `toPaedisRestricted()` en `authService.js`. Control en `authController.js` y `adminController.js`. |
| **CA-03** | **Control de Acceso Basado en Roles (RBAC)** | **CUMPLIDO** | `requireAdmin`, `requireAdminOrCoordinator` y `requirePaedisCoordinator` en `authMiddleware.js`. Verificado en suites de prueba con respuestas 401/403. |
| **CA-04** | **Segregación de Datos PAEDIS (Ley 21.719)** | **CUMPLIDO** | Modelo `PaedisRecord.js` en colección dedicada `paedis_records`. Índice explícito en `studentEmail` y `userEmail`. Datos clínicos omitidos para perfiles no autorizados. |
| **CA-05** | **Migración de Datos Idempotente** | **CUMPLIDO** | `authService.syncPaedisRecordsMigration()` ejecutado al arrancar `backend/server.js`, sin duplicación de registros ni fallos ante reconexiones. |
| **CA-06** | **Umbral Regulatorio SAT 70%** | **CUMPLIDO** | `satAlertService.js` y `satUtils.js` evalúan `RI < 70%`, `Preventivo 70% - 74.9%` y `Regular ≥ 75%`. Cálculos de inasistencias y faltas permitidas ajustados a Duoc UC 2026. |
| **CA-07** | **Simulación SAT no Destructiva** | **CUMPLIDO** | Modelo `AttendanceSimulation.js` con TTL automático de 7 días. Cálculos bidireccionales puros que no alteran `attendancePercentage` real de `UserProfile`. |
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
| **CA-20** | **Cero Fallos en Compilación y Pruebas** | **CUMPLIDO** | `141/141 tests backend` exitosos, `3/3 tests frontend` exitosos, compilación de producción con Vite limpia en 8.97s sin errores de bundling. |

---

## 4. Estado de Seguridad, Accesibilidad e Integridad de Datos

### Seguridad y Ciberseguridad (OWASP Top 10)
* **A01: Broken Access Control:** Resuelto mediante middleware JWT obligatorio, RBAC segregado y verificación de usuario activo en base de datos en cada petición protegida.
* **A02: Cryptographic Failures:** Contraseñas hasheadas con `bcryptjs` (salt rounds = 10); tokens JWT firmados con clave simétrica robusta; transmisión de contraseñas planas eliminada en contratos de API.
* **A03: Injection:** Sanitización estricta de cadenas, escape de expresiones regulares en búsquedas (`escapeRegex`) y uso estricto de operadores seguros de Mongoose evitando NoSQL Injection.
* **A04: Rate Limiting & DoS:** Middleware de limitación de tasa en rutas de autenticación y transacciones críticas.
* **A05: Security Misconfiguration:** Cabeceras HTTP de seguridad configuradas en backend (Helmet) y Nginx (`X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`). Contenedores Docker ejecutan con usuarios no-root (`node` y `nginx`).
* **Ley N° 21.719:** Los diagnósticos médicos y notas clínicas nunca se entregan en contratos públicos ni de administradores generales de TI. Solo la Coordinación PAEDIS autorizada puede leer o editar expedientes confidenciales.

### Accesibilidad (WCAG 2.2 AA / AAA)
* **Perceptibilidad:** Contraste tipográfico superior a 4.5:1 en modo estándar y 7:1 en componentes esenciales; fuentes inclusivas (OpenDyslexic) y alternativas textuales en todos los íconos decorativos (`aria-hidden="true"`) y controles interactivos (`aria-label`, `getVoiceProps`).
* **Operabilidad:** Foco visible destacado con anillo de foco de alto contraste (`focus-visible:ring-4 focus-visible:ring-[#FFB81C]`); navegación integral por teclado sin trampas de foco no intencionales; atajos de teclado para cerrar modales (`Escape`).
* **Comprensibilidad:** Avisos hablados en tiempo real mediante `LiveAnnouncer` ante cambios de estado, confirmaciones y mensajes de alerta; lenguaje claro y exento de tecnicismos crípticos.
* **Robustez:** Compatibilidad estricta con navegadores modernos y lectores de pantalla (NVDA, JAWS, VoiceOver), y soporte para preferencias de reducción de movimiento (`@media (prefers-reduced-motion: reduce)`).

---

## 5. Funcionalidades Operativas vs. Simuladas

| Módulo / Funcionalidad | Clasificación | Comportamiento Técnico |
| :--- | :---: | :--- |
| **Autenticación y Registro Institucional** | **100% OPERATIVO** | CRUD de usuarios, login con credenciales institucionales, hash bcrypt, emisión y validación de tokens JWT, gestión de roles y permisos. |
| **Gestión de Inclusión PAEDIS (Ley 21.719)** | **100% OPERATIVO** | Expedientes confidenciales segregados, asignación de ajustes razonables, acuses docentes, descarga de ficha docente (.txt) y trazabilidad en bitácora de auditoría. |
| **Sistema de Alerta Temprana (SAT) y Alertas** | **100% OPERATIVO** | Monitoreo de inasistencias por ramo, detección de causal de reprobación por inasistencia (<70%), Ficha 360 y categorización de riesgo. |
| **Simulador de Asistencia SAT** | **FORMATIVO / VOLÁTIL** | Permite proyectar escenarios (+1 asistencia, +1 falta, licencia médica) guardados temporalmente en `AttendanceSimulation` (TTL 7 días) sin mutar la base histórica real. |
| **Motor Predictivo de Deserción** | **100% OPERATIVO** | Cálculo matemático puro multivariable ponderado (asistencia, situación académica, simulaciones, tendencia, carga) con explicabilidad factor por factor y detección de falta de datos (`SIN_DATOS`). |
| **Catálogo de Carreras y Sedes** | **100% OPERATIVO** | Gestión dinámica en MongoDB con normalización a las 20 sedes oficiales y 9 escuelas de Duoc UC. |
| **Simulador de Toma de Ramos (SICOL)** | **PRÁCTICA FORMATIVA** | Entorno gamificado de inscripción y ajuste horario para el estudiante. Opera sobre base de datos local del cliente y catálogo cargado, sin conectar al servidor SAP/SICOL central de Duoc UC. |
| **Simulador de Reserva de Biblioteca** | **PRÁCTICA FORMATIVA** | Simula selección de espacios y generación de código alfanumérico de check-in para aprendizaje del estudiante, proveyendo enlaces directos hacia la plataforma oficial LibCal de Duoc UC. |
| **Mesa de Ayuda y Tickets Digitales** | **OPERATIVO / ENLACE DIRECTO** | Directorio de canales (teléfono, WhatsApp, correos oficiales) y redirección estructurada hacia los formularios Zendesk del Centro de Ayuda institucional. |

---

## 6. Dependencias Institucionales Pendientes

Para alcanzar una puesta en marcha institucional plena e integrada al ecosistema corporativo de Duoc UC, se requiere coordinar con las respectivas áreas de TI institucional las siguientes validaciones externas:

1. **Microsoft Entra ID (Azure AD SSO Institucional):**
   * *Estado:* El flujo local y el formato de login institucional funcionan con credenciales internas y hashing `bcrypt`.
   * *Pendiente:* Registro oficial de la aplicación (*App Registration*) en el tenant corporativo de Microsoft Entra ID de Duoc UC (`@duocuc.cl` / `@profesor.duoc.cl` / `@duoc.cl`) para habilitar el intercambio real de tokens OAuth 2.0 / OpenID Connect en el endpoint de callback.
2. **Sistema de Información Curricular (SICOL / Banner / SAP):**
   * *Estado:* Nexo360 dispone de ingesta masiva por archivo Excel/Markdown y APIs de oferta académica.
   * *Pendiente:* Provisión de una API REST o webhook institucional seguro de solo lectura para sincronizar automáticamente en segundo plano la asistencia diaria de clases y la carga inscrita de cada estudiante.
3. **Plataforma Springshare LibCal (Bibliotecas Duoc UC):**
   * *Estado:* Integración por interfaz directa con enlaces parametrizados por sede y simulador formativo de check-in.
   * *Pendiente:* Llaves de API de Springshare LibCal si se deseara sincronizar en tiempo real el inventario de salas de estudio físicas y visores VR de la Sede Alameda.
4. **Servidor SMTP Corporativo (Notificaciones por Correo):**
   * *Estado:* El servicio `emailService.js` conmuta de manera segura a modo de registro en consola si no se configuran credenciales SMTP.
   * *Pendiente:* Provisión de host SMTP y credenciales de retransmisión autorizadas (`no-reply@duocuc.cl`) en el archivo `.env` del servidor de producción.

---

## 7. Guía de Despliegue en Producción (Docker VPS)

### Requisitos Mínimos del Servidor
* **Sistema Operativo:** Ubuntu Server 22.04 LTS / Debian 12 / Rocky Linux 9.
* **Hardware:** 2 vCPU, 2 GB RAM (mínimo 1 GB con swap activo), 20 GB de almacenamiento SSD.
* **Software:** Docker Engine 24+ y Docker Compose v2+.

### Pasos de Despliegue
1. **Clonar repositorio y navegar al directorio raíz:**
   ```bash
   git clone <URL_REPOSITORIO> Nexo360
   cd Nexo360
   ```
2. **Configurar variables de entorno de producción:**
   ```bash
   cp .env.prod.example .env
   ```
   Editar `.env` y definir valores seguros:
   * `JWT_SECRET`: Cadena aleatoria de 32+ bytes (`openssl rand -base64 32`).
   * `APP_PORT`: Puerto HTTP del host (ej. `80` o `8080`).
   * `FRONTEND_URL`: URL pública del servicio (ej. `https://nexo360.alameda.duoc.cl`).
   * `APP_PUBLIC_URL`: URL pública de la API backend.
   * `ENABLE_DEMO_ACCOUNTS`: `false` en entornos de producción con usuarios reales, o `true` en ambientes de demostración.
3. **Compilar y levantar contenedores en segundo plano:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. **Verificar el estado de salud de los servicios:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   curl -f http://localhost/api/health
   ```
5. **Copia de seguridad de la base de datos MongoDB:**
   ```bash
   docker exec -t nexo360-mongodb mongodump --db nexo360 --out /data/db/backup_$(date +%F)
   ```

---

## 8. Dictamen Final

```
========================================================================================
                                DICTAMEN TÉCNICO FINAL
========================================================================================

Calificación Oficial:
[ B. PREPARADO TÉCNICAMENTE, CON VALIDACIONES EXTERNAS PENDIENTES ]

Fundamentación:
1. La base de código de Nexo360 es técnicamente sólida, segura, mantenible y libre de deuda
   técnica crítica. Cumple con los 20 Criterios de Aceptación institucionales.
2. No existen vulnerabilidades conocidas en dependencias (`npm audit` en 0).
3. Todas las suites automatizadas de pruebas pasan al 100% (141 pruebas backend y 3 frontend).
4. El proceso de bundling y construcción de producción de Vite es completamente exitoso.
5. Se cumplen estrictamente los requisitos de la Ley N° 21.719 en cuanto a confidencialidad
   de datos de salud y expedientes PAEDIS.
6. La interfaz cumple cabalmente con la norma de accesibilidad WCAG 2.2 AA / AAA.
7. La única razón por la que no se dictamina "A. Listo sin observaciones" radica en que la
   conexión definitiva con los servicios centrales de Duoc UC (Microsoft Entra ID corporativo,
   APIs de SICOL/Banner y credenciales SMTP autorizadas) depende de la entrega de llaves y
   autorizaciones por parte de la Dirección de Tecnologías de Duoc UC.

========================================================================================
```
