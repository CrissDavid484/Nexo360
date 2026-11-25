# Nexo360 • Duoc UC - Sede Alameda (PAEDIS)

Plataforma One-Stop-Shop institucional para **Duoc UC - Sede Alameda**, orientada a estudiantes del **Programa de Apoyo a Estudiantes con Discapacidad (PAEDIS)**, coordinación de inclusión y administración académica. Implementa accesibilidad **WCAG 2.2 AA / AAA**, protección de datos personales conforme a la **Ley N° 21.719** y una arquitectura modular **DRY / SRP**.

---

## Métricas de Calidad y Estado del Código

- **Tests Automatizados:** **134 tests backend pasando** (100% de éxito en 6 suites con `node --test`) + suite de integración frontend.
- **SonarQube Clean Code:**
  - **Reliability:** Rating A (0 Bugs).
  - **Security:** Rating A (0 Vulnerabilidades, 0 Security Hotspots).
  - **Maintainability:** Rating A (Technical Debt ratio < 1%).
  - **Duplication:** 0.4% (Umbral de calidad < 3.0%).
- **Cero Dependencias Vulnerables:** `npm audit` limpio (0 vulnerabilidades) en backend y frontend.

---

## Stack Tecnológico

- **Backend:** Node.js (`>= 20.19`, Docker `node:22-alpine`), Express 4 (`^4.21.2`), Mongoose 9 (`^9.12.2`), MongoDB 7 (driver `7.9.0`), `bcryptjs`, `jsonwebtoken` (HS256), `node-xlsx`, `pdf-parse`.
- **Frontend:** React 18 (`^18.3.1`), Vite 6 (`^6.1.0`), React Router 7 (`^7.18.5`), Tailwind CSS 3 (`^3.4.17`), Lucide React.
- **Calidad y Testing:** `node --test` (134 pruebas unitarias e integrales en backend), SonarQube Clean Code, Docker Compose.
- **Seguridad y Ciberseguridad:** Cero almacenamiento de contraseñas planas, RBAC estricto, OWASP Top 10, sanitización contra NoSQL/XSS/ReDoS y Rate Limiting.

---

## Estructura del Repositorio

```text
Nexo360/
├── docker-compose.yml              # Orquestación de desarrollo (MongoDB 7 + Backend + Frontend)
├── docker-compose.prod.yml         # Orquestación de producción (Nginx frontend + Backend seguro)
├── .env.prod.example               # Plantilla de variables de entorno seguras para producción
├── .gitignore                      # Exclusiones limpias (Zero-Knowledge y sin artefactos locales)
├── README.md                       # Documentación técnica, arquitectura y operación
│
├── backend/                        # API REST Node.js + Express + Mongoose 9
│   ├── server.js                   # Punto de entrada, cabeceras OWASP, CORS estricto y /api/health
│   ├── Dockerfile                  # Imagen Docker Node 22 Alpine (usuario no-root + healthcheck)
│   ├── config/                     # Conexión resiliente a MongoDB y ponderaciones predictivas
│   ├── controllers/                # adminController, authController, moduleController
│   ├── data/
│   │   ├── academicCalendarsSeed.json # Semilla oficial Calendario Académico Duoc UC (2026-2027)
│   │   ├── alameda2026Seed.json    # Catálogo oficial Alameda 2026-002 (7.174 ofertas consolidadas)
│   │   ├── alameda2026Summary.json # Resumen estadístico de carreras y secciones
│   │   ├── institutionalModules.json # 9 categorías de ayuda y apoyos PAEDIS (129 artículos)
│   │   ├── seedCourseRows.json     # Respaldo de oferta académica estándar
│   │   └── seedUsers.json          # 14 perfiles institucionales (estudiantes, PAEDIS y staff)
│   ├── middleware/                 # authMiddleware (JWT / RBAC estricto), rateLimitMiddleware (OWASP A04)
│   ├── models/                     # UserProfile, AcademicCalendar, SimulatorChartSnapshot,
│   │                               # CourseOffering, Career, Sede, ActivityLog
│   ├── routes/                     # /api/auth, /api/admin, /api/courses, /api/calendar, /api/modules
│   ├── scripts/                    # parseAlamedaMd.js (ingesta automatizada de catálogos)
│   ├── services/                   # academicCalendarService, simulatorSnapshotService,
│   │                               # predictiveRiskService, courseService, authService,
│   │                               # emailService, excelParserService, satAlertService
│   ├── utils/                      # validationUtils (XSS/NoSQL/RUT/A11y), courseScheduleUtils
│   └── tests/                      # 134 pruebas unitarias e integrales en 6 suites (node --test)
│
└── frontend/                       # SPA React 18 + Vite 6 + Tailwind CSS
    ├── Dockerfile                  # Imagen Node 20 Alpine (Vite development)
    ├── Dockerfile.prod             # Imagen de producción con Nginx Alpine multi-etapa
    ├── nginx.conf                  # Servidor proxy y compresión gzip para SPA
    ├── index.html                  # Plantilla base con soporte OpenDyslexic y accesibilidad
    └── src/
        ├── App.jsx                 # Enrutamiento SPA protegido con lazy loading
        ├── context/                # AuthContext, AccessibilityContext (TTS, contraste, fuentes)
        ├── hooks/                  # useAccessibleModal, useOnClickOutside, useDebounce
        ├── pages/                  # LoginPage, DashboardPage, NotFoundPage
        ├── data/                   # duocModulesData, infrastructureCatalog.json, tomaRamosData
        ├── services/api.js         # Cliente API tipado con manejo de tokens e interceptores
        ├── utils/                  # speechService, satUtils, studentUtils, clearReadingUtils,
        │                           # markdownScheduleParser, lazyLoad
        ├── components/
        │   ├── admin/              # AdminDashboard, AcademicCatalog, StudentDirectory,
        │   │                       # PaedisManagement, SatMonitoring, AuditLog, ExplainabilityPanel
        │   ├── auth/               # LoginForm, DemoAccountsSelector, MfaPrompt, ForgotPasswordFlow
        │   ├── common/             # UnifiedNavbar, AccessibilityBar, AcademicWeekBadge,
        │   │                       # ThemeCurtainOverlay, ReadingGuideOverlay, LiveAnnouncer
        │   ├── dashboard/          # SearchBar, ModuleCard, ModuleModal, YouTubeTutorialPlayer
        │   ├── simulation/         # TomaRamosSimulator (Modo Guiado / Realista y Boletín Oficial)
        │   ├── ui/                 # Button, Modal, Card, Input, Select, Table, Badge, Toggle
        │   └── views/              # PerfilView, BibliotecaView, VivoDuocSummaryView, ServiciosDigitales
        └── tests/                  # Pruebas de integración del simulador y previsualización
```

---

## Funcionalidades Clave

### 1. Simulador de Toma de Ramos (Inscripción Académica)
- **Catálogo Alameda 2026-002:** Ingesta oficial con 7.174 ofertas académicas, 2.389 secciones y bloques horarios estándar `b1`–`b18`.
- **Modos de Inscripción:**
  - **Modo Guiado:** Asistencia paso a paso con tips contextuales y recomendaciones de balance horario.
  - **Modo Realista:** Simulación de estrés y alta demanda sin ayudas ni tips, reproduciendo el entorno real de toma de ramos.
  - **Separación Estricta de Jornada:** Detección de secciones Diurnas (`D`) y Vespertinas (`V`) para evitar mezclas incompatibles.
  - **Generación de Boletín Oficial:** Resumen curricular descargable e imprimible con carga de créditos y salas asignadas.
- **Control de Acceso Seguro:** Validación de cuenta institucional registrada (`isRegisteredInDb: true`), bloqueando accesos anónimos con código `403`.

### 2. Snapshots Programados del Simulador (03:00 AM y 03:00 PM)
- **Colección `SimulatorChartSnapshot`:** Almacenamiento periódico en MongoDB de métricas precalculadas (adopción iniciada vs. completada, secciones más demandadas, distribución semestral).
- **Rendimiento Protegido:** Las consultas de gráficos en el Panel Admin leen directamente el último snapshot almacenado, garantizando tiempos de respuesta inferiores a 15ms sin recalcular sobre toda la base histórica.
- **Distribución en 18 Semanas:** Métricas desglosadas por las 18 semanas lectivas oficiales de Duoc UC con comparativa histórica multianual.

### 3. Calendario Académico Duoc UC (2026-2027) e Insignia Dinámica
- **Insignia `AcademicWeekBadge`:** Despliega en la barra superior la semana lectiva actual (ej. `Semana 16/18 • 2° Semestre`) calculada en tiempo real.
- **Ingesta desde PDF Oficial:** Extracción automatizada de hitos curriculares, semanas de inducción (Semana 0) y reinicio de semestre desde resoluciones de Vicerrectoría Académica.

### 4. Panel de Administración, SAT y Centro PAEDIS
- **Directorio de Estudiantes y Ficha 360:** Filtros por carrera, sede y estado académico con visualización del semáforo predictivo de deserción.
- **Centro de Operaciones PAEDIS (Ley N° 21.719):** Gestión confidencial de ajustes razonables, acuses de recibo docentes y renovación semestral con aislamiento de diagnósticos clínicos restringidos exclusivamente a Coordinadores PAEDIS.
- **Sistema de Alerta Temprana (SAT):** Detección temprana de inasistencias críticas (`< 70% RI / Alto Riesgo`, `70-75% Moderado`, `> 75% Bajo Riesgo`) con módulo de simulación de asistencia por asignatura.
- **Catálogo Dinámico y Dry-Run:** Ingesta de asignaturas vía Excel (`.xlsx`) y Markdown (`.md`) con previsualización segura y detección de choques antes de guardar.
- **Bitácora Institucional (ActivityLog):** Registro inmutable de eventos administrativos con sanitización de datos personales.

### 5. Accesibilidad Universal WCAG 2.2 AA / AAA
- **Lector de Pantalla Nativo (`voiceReader`):** Síntesis de voz accesible en español con atajo global `Alt + V`, navegación por 4 flechas de movimiento para personas no videntes y lectura de cambios dinámicos con `aria-live`.
- **Selector de Modo Claro / Oscuro Personalizado:** Componente `.theme-switch` animado (sol, luna, estrellas y nubes) con persistencia en sesión y base de datos.
- **Herramientas Visuales:** Soporte para tipografía OpenDyslexic, filtros de daltonismo (Deuteranopia, Protanopia, Tritanopia), regla de lectura (`ReadingGuideOverlay` con capa máxima `z-[9999]`) y modo de lectura simplificada.

---

## Cuentas de Demostración y Roles

Para pruebas y evaluación del sistema, la pantalla de inicio de sesión dispone de un selector rápido de cuentas preconfiguradas con contraseña universal:

| Rol Institucional | Correo Demo | Contraseña | Capacidades y Alcance |
| :--- | :--- | :--- | :--- |
| **Administrador / PAEDIS** | `c.guzman@duocuc.cl` | `Duoc2026!` | Acceso total: Panel Admin, Catálogo Alameda, SAT, Auditoría y Módulo PAEDIS |
| **Coordinador PAEDIS** | `coord.paedis@duoc.cl` | `Duoc2026!` | Gestión de expedientes PAEDIS confidenciales, ajustes razonables y seguimiento |
| **Estudiante PAEDIS** | `d.rojas@duocuc.cl` | `Duoc2026!` | Portal de estudiante, simulador de toma de ramos con ajustes PAEDIS aplicados |
| **Estudiante Regular** | `an.ordenesd@duocuc.cl` | `Duoc2026!` | Portal de estudiante, asistencia y simulación estándar de toma de ramos |
| **Estudiante en Riesgo** | `m.contreras@duocuc.cl` | `Duoc2026!` | Caso SAT con asistencia `< 70%` para validar alertas preventivas de deserción |
| **Tutora Par** | `v.soto@duocuc.cl` | `Duoc2026!` | Acompañamiento a pares y credencial cuidadora Ley N° 21.790 |

---

## Matriz de Endpoints API REST

| Módulo | Método | Ruta | Acceso | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| **Salud** | `GET` | `/api/health` | Público | Verificación de estado del servidor, uptime y conectividad a MongoDB |
| **Autenticación** | `POST` | `/api/auth/login` | Público (Rate-limit) | Inicio de sesión institucional con emisión de JWT |
| | `GET` | `/api/auth/me` | JWT | Obtención del perfil activo y preferencias de accesibilidad |
| | `PUT` | `/api/auth/accessibility` | JWT | Persistencia de ajustes de contraste, TTS y fuentes |
| | `GET/POST`| `/api/auth/toma-ramos` | JWT (`isRegisteredInDb`) | Consulta y confirmación de asignaturas inscritas |
| **Calendario** | `GET` | `/api/calendar/current` | Público | Semana lectiva vigente, hito académico actual y metadatos |
| | `GET` | `/api/calendar/weeks` | Público | Lista completa de las 18 semanas del semestre |
| **Oferta Académica** | `GET` | `/api/courses` | Público | Catálogo de asignaturas con filtros por carrera, sede y jornada |
| | `GET` | `/api/courses/careers` | Público | Catálogo oficial de 20 carreras de Sede Alameda |
| | `POST` | `/api/courses/import` | Admin / Coord | Ingesta masiva de asignaturas vía Excel o Markdown |
| **Módulos** | `GET` | `/api/modules` | Público | Directorio de 9 módulos institucionales y 129 artículos de apoyo |
| **Administración**| `GET` | `/api/admin/metrics` | Admin / Coord | Métricas institucionales de retención, PAEDIS y estado académico |
| | `GET` | `/api/admin/charts-snapshot`| Admin / Coord | Snapshots optimizados para gráficos de adopción del simulador |
| | `GET/POST`| `/api/admin/students` | Admin / Coord | Directorio 360 de estudiantes y registro de nuevos usuarios |
| | `PATCH` | `/api/admin/paedis/:id/case`| Coord PAEDIS | Actualización reservada de expediente de ajustes razonables |
| | `GET` | `/api/admin/audit-logs` | Admin | Bitácora inmutable de eventos conforme a la Ley N° 21.719 |

---

## Seguridad y Cumplimiento Normativo

- **Ley N° 21.719 (Protección de Datos Personales):**
  - Cero almacenamiento de contraseñas sin cifrar (hash irreversible con `bcryptjs` y 10 rondas de salt).
  - Eliminación automática de campos confidenciales (`password`, `passwordResetTokenHash`) en cualquier serialización `toJSON` / `toObject`.
  - Consentimiento informado explícito y política estricta de limitación de finalidad (`purposeLimitation`).
- **Seguridad OWASP Top 10:**
  - Cabeceras HTTP endurecidas: `Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`.
  - Rate Limiting en memoria contra ataques de fuerza bruta en endpoints de autenticación y restablecimiento.
  - Prevención de inyecciones NoSQL mediante tipado estricto en esquemas de Mongoose y sanitización regex lineal libre de ReDoS.
  - Aislamiento estricto de roles RBAC: `admin`, `coordinador_paedis`, `profesor`, `tutor_par`, `estudiante`.

---

## Ejecución y Despliegue

### Opción A: Contenedores Docker (Recomendado)
```bash
# Iniciar servicios con reconstrucción de imágenes
docker compose up -d --build

# Verificar estado de los contenedores
docker compose ps
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **MongoDB:** `localhost:27017/nexo360`

### Opción B: Ejecución Local en Node.js
```bash
# 1. Backend (puerto 5000)
cd backend
npm install
npm start

# 2. Frontend (puerto 5173)
cd ../frontend
npm install
npm run dev
```

---

## Suite de Calidad y Pruebas

```bash
# Ejecutar la suite completa de 134 pruebas automatizadas de backend
npm test --prefix backend

# Validar la compilación de producción del frontend
npm run build --prefix frontend
```
