# Nexo360 — Matriz de Estado de Integraciones Externas (Fase 5)

**Fecha:** 27 de Noviembre de 2026  
**Versión:** 1.0.0-rc  
**Entorno de Referencia:** Duoc UC — Sede Alameda

---

## 1. Resumen de Estado de Integraciones

| Sistema Externo | Tipo de Integración | Adaptador / Servicio | Modos Soportados | Estado Actual | Requisito para Activación en Producción |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Experiencia Vivo Duoc** | API REST (OCI Ext) | `vivoDuocAdapter.js` / `academicDataService.js` | `disabled`, `mock`, `live` | **BLOCKED_EXTERNAL** (en `live`) / **OPERATIVO** (en `mock`) | Secretos OCI institucionales y autorización de red perimetral para `https://api-oci-ext-prd.duoc.cl`. |
| **Microsoft Entra ID** | OIDC / OAuth 2.0 (PKCE) | `entraIdAdapter.js` | `disabled`, `live` | **BLOCKED_EXTERNAL** (en `live`) | Registro de Aplicación (App Registration) en el Tenant Azure de Duoc UC con `client_secret` y redirect URI configurada. |
| **SICOL / Banner** | SAP WebDynpro / API | `sicolAdapter.js` / `TomaRamosSimulator.jsx` | `unconfigured`, `official`, `simulated` | **SIMULATED_FORMATIVE** | Convenio de API interna con Registraduría / TI Duoc UC; mientras tanto opera como simulador formativo no vinculante. |
| **Springshare LibCal** | HTTP / Widget Portal | `BibliotecaView.jsx` / `bibliotecaAlamedaData.js` | `interactive_simulation`, `official_links` | **SIMULATED_FORMATIVE** | Integración directa con API v1.1 de LibCal si se contrata API key; enlaces oficiales directos activos. |
| **Servidor SMTP Institucional** | SMTP (STARTTLS / TLS) | `smtpAdapter.js` / `emailService.js` | `local_preview`, `relay_smtp` | **OPERATIVO** | Variables `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` en entorno de producción. |

---

## 2. Detalle Técnico por Integración

### 2.1 Experiencia Vivo Duoc (`api-oci-ext-prd.duoc.cl`)
* **Propósito:** Consulta de perfil académico, matrícula vigente, notas parciales/exámenes, asistencias por asignatura y horario.
* **Seguridad y Resiliencia:**
  * Prevención IDOR estricta: La identidad del estudiante se deriva forzosamente del contexto autenticado (`req.user.email`), nunca de parámetros externos.
  * Sanitización contra SSRF/CSRF (Sonar S5144): Parámetros restringidos a lista blanca (`codAlumno`, `nombreUsuario`, `alumnoId`) y regex `^[a-zA-Z0-9._-]+$`. Hostname validado con `validateSafeHttpUrl`.
  * Caché en memoria aislada por usuario con TTL de 5 minutos y purga LRU/FIFO básica (máximo 500 entradas).
  * Tolerancia a fallos: Respuestas parciales estructuradas (`status: 'partial'`) si una sección secundaria falla.

### 2.2 Microsoft Entra ID (OIDC / SSO)
* **Propósito:** Autenticación institucional federada para estudiantes, coordinadores y docentes.
* **Seguridad y Resiliencia:**
  * Flujo PKCE con verificación criptográfica de `nonce` y `state` (prevención de CSRF y replay attacks).
  * Validación estricta de claims con firma RSA contra JWKS oficial de Microsoft Online.
  * Filtrado estricto de dominio institucional: Rechaza correos fuera de `@duocuc.cl`, `@profesor.duoc.cl` o `@duoc.cl`.
  * Rotación y almacenamiento de tokens de acceso (`setDuocApiToken` y `clearDuocApiTokens`).

### 2.3 SICOL / Banner (SAP WebDynpro)
* **Propósito:** Práctica formativa previa al hito oficial de Toma de Ramos.
* **Transparencia Institucional:**
  * Señalética explícita en interfaz: *"Simulador formativo sin efectos oficiales: no modifica la inscripción oficial en SICOL ni reserva cupos reales"*.
  * Botón directo visible: *"Ir a Toma de Ramos Oficial (SICOL)"*.

### 2.4 Springshare LibCal (Biblioteca Duoc UC)
* **Propósito:** Capacitación en reserva de salas de estudio y recursos tecnológicos (Lentes VR) para Sede Alameda.
* **Transparencia Institucional:**
  * Aviso visible en cabecera: *"Simulación formativa de reserva — No vinculante con Springshare LibCal"*.
  * Enlaces directos a las URL oficiales de reserva y check-in institucional (`duoc.libcal.com/r/accessible/space/31398`).

### 2.5 Servidor de Correo SMTP
* **Propósito:** Envío de enlaces de activación de cuenta segura, restablecimiento de contraseña y alertas SAT.
* **Honestidad en Estados de Entrega:**
  * Estados canónicos implementados: `PREPARADO`, `ENVIADO_SMTP`, `MODO_PRUEBA_LOCAL`, `FALLIDO`.
  * Nunca declara *"Entregado"* sin confirmación DSN formal; reporta *"Mensaje aceptado por el servidor SMTP relay"*.
