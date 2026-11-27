# NEXO360 — DOCUMENTO DE TRASPASO TÉCNICO INSTITUCIONAL (TECHNICAL HANDOVER)

**Institución Destinataria:** Duoc UC — Dirección de Tecnologías de la Información & Coordinación PAEDIS  
**Fecha de Entrega:** 26 de Noviembre de 2026  
**Versión de Entrega:** 2.0.0-PROD  
**Repositorio de Código:** https://github.com/CrissDavid484/Nexo360  
**Repositorio de Documentación:** https://github.com/DanielaD1az/Nexo360  

---

## 1. Visión General de la Arquitectura

Nexo360 es una plataforma modular basada en la pila MERN (MongoDB, Express, React, Node.js) diseñada bajo principios de arquitectura limpia, accesibilidad universal (WCAG 2.2 AA/AAA) y cumplimiento estricto de la Ley N° 21.719 sobre Protección de Datos Personales en Chile.

```
+-------------------------------------------------------------------------------+
|                                  CLIENTE (SPA)                                |
|  React 19 + Vite 6 + Tailwind CSS + Lucide Icons + LiveAnnouncer (A11y WCAG)  |
+-------------------------------------------------------------------------------+
                                      │ HTTPS (CORS Filtrado)
                                      ▼
+-------------------------------------------------------------------------------+
|                            REVERSE PROXY (NGINX)                              |
|           Terminación SSL + Cabeceras OWASP + Gzip + Cache Control            |
+-------------------------------------------------------------------------------+
                                      │ Proxy Pass
                                      ▼
+-------------------------------------------------------------------------------+
|                         BACKEND API (EXPRESS / NODE.JS)                       |
|  - Middleware: Auth JWT (HS256), RBAC, Permissions, RateLimiter, Helmet       |
|  - Rutas: /api/auth, /api/admin, /api/courses, /api/calendar, /api/health     |
|  - Controladores y Servicios Especializados                                   |
|  - Adaptadores Externos: entraIdAdapter, sicolAdapter, libcalAdapter, smtp    |
+-------------------------------------------------------------------------------+
                                      │ Mongoose ODM (Conexión Autenticada)
                                      ▼
+-------------------------------------------------------------------------------+
|                               MONGODB DATABASE                                |
|  - users_profiles: Datos generales de estudiantes, docentes y directivos      |
|  - paedis_records: Expedientes clínicos confidenciales segregados            |
|  - attendance_simulations: Escenarios volátiles de prueba (TTL 7 días)        |
|  - courses / academic_catalogs: Asignaturas y periodos oficiales Duoc UC      |
|  - activity_logs: Bitácora inmutable de auditoría institucional               |
+-------------------------------------------------------------------------------+
```

---

## 2. Segregación del Modelo de Datos y Ley N° 21.719

Para dar cumplimiento legal y técnico irrestricto a la Ley N° 21.719, la base de datos no mezcla datos académicos generales con expedientes de salud o discapacidad:

1. **`users_profiles` (`UserProfile.js`):** Almacena identificación, correo institucional, rol, preferencias de accesibilidad y matrícula. No contiene campos de diagnósticos clínicos ni notas confidenciales de la UAP.
2. **`paedis_records` (`PaedisRecord.js`):** Contiene el diagnóstico declarado, la barrera evaluada, los ajustes razonables asignados y el historial de acuses docentes. Cuenta con índices en `userEmail` y `studentEmail`, y su acceso está restringido exclusivamente al rol `coordinador_paedis`.
3. **`attendance_simulations` (`AttendanceSimulation.js`):** Registra las proyecciones formativas ejecutadas por administradores o coordinadores sobre el semáforo SAT. Se auto-elimina tras 7 días mediante un índice TTL de MongoDB (`expires: 604800`).

---

## 3. Adaptadores de Integración Institucional (`backend/services/adapters/`)

La plataforma provee una arquitectura de adaptadores desacoplada que permite funcionar tanto en modo autónomo (con base de datos local y simulaciones formativas) como en modo integrado con los sistemas centrales de Duoc UC:

| Adaptador | Archivo | Función y Contrato | Estado Actual |
| :--- | :--- | :--- | :--- |
| **Microsoft Entra ID** | `entraIdAdapter.js` | Autenticación institucional OIDC / Azure AD con Tenant ID oficial de Duoc UC (`72fd0b5a...`). Mapea claims a roles y valida expiración y audiencia de tokens. | Preparado con fallback de desarrollo y validación estricta en producción. |
| **SICOL / Banner** | `sicolAdapter.js` | Sincronización de nóminas y porcentaje de asistencia oficial desde el ERP académico. | Preparado con interfaz asíncrona y respaldo a MongoDB local. |
| **Springshare LibCal** | `libcalAdapter.js` | Consulta y reserva de cubículos de estudio y visores de realidad virtual Meta Quest 3 en Biblioteca Alameda. | Preparado con sandbox formativo y endpoints OAuth2. |
| **SMTP Institucional** | `smtpAdapter.js` | Envío de correos de bienvenida, recuperación de contraseñas y notificaciones PAEDIS con sanitización CRLF y prevención de inyección. | Totalmente operativo con servidor SMTP real o outbox de desarrollo. |

---

## 4. Control de Acceso y Roles (RBAC)

Nexo360 define cuatro roles institucionales nativos:

1. **`admin` / `administrador`:** Administrador TI de la plataforma. Gestiona usuarios, catálogos territoriales y de asignaturas, monitoreo de servidor y bitácora de auditoría. Por diseño de privacidad, no puede ver diagnósticos clínicos PAEDIS.
2. **`coordinador_paedis`:** Gestor del Programa de Apoyo a Estudiantes con Discapacidad. Acceso exclusivo a `PaedisRecord`, emisión de Fichas Docentes y seguimiento de casos en SAT.
3. **`profesor`:** Docente de aula. Consulta listas de estudiantes autorizadas y confirma acuse de recibo de ajustes razonables para su ramo.
4. **`estudiante`:** Usuario final del portal estudiantil. Acceso a toma de ramos formativa, simulador de biblioteca, tickets de mesa de ayuda y configuración de accesibilidad. Bloqueado (403) ante cualquier ruta administrativa.

---

## 5. Parámetros de Operación y Monitoreo

### 5.1 Endpoint de Diagnóstico y Salud (`/api/health`)
- **HTTP 200 OK:** El servidor Express está activo y MongoDB se encuentra en estado `readyState === 1` (conectado).
- **HTTP 503 Service Unavailable:** MongoDB se encuentra desconectado, reiniciando o inaccesible. Este código permite a los orquestadores (Docker Swarm, Kubernetes, Render) detectar fallos reales de base de datos y no enmascarar caídas.

### 5.2 Bitácora de Auditoría (`ActivityLog`)
Cada operación de creación, actualización de privilegios, simulación SAT o consulta a expedientes PAEDIS genera un registro inmutable en `activity_logs`. El Administrador TI puede consultar y filtrar estos registros desde el panel `/admin` con protección contra expresiones regulares complejas (ReDoS).

---

## 6. Procedimientos de Mantenimiento Rutinario

### 6.1 Respaldo de Base de Datos
Se recomienda programar una tarea cron diaria en el servidor anfitrión:
```bash
0 2 * * * docker exec nexo360-mongodb mongodump --uri="mongodb://root:PASS@localhost:27017/nexo360?authSource=admin" --out=/backups/mongo_$(date +\%F)
```

### 6.2 Rotación de Secretos
Para rotar el `JWT_SECRET`, actualice la variable en `.env.production` y reinicie el contenedor backend (`docker compose restart backend`). Las sesiones activas de usuarios requerirán un nuevo inicio de sesión.
