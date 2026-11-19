# Nexo360 • Duoc UC - Sede Alameda (PAEDIS)

Plataforma One-Stop-Shop institucional para **Duoc UC - Sede Alameda**, orientada a estudiantes del **Programa de Apoyo a Estudiantes con Discapacidad (PAEDIS)**, coordinación de inclusión y administración académica. Implementa accesibilidad **WCAG 2.2 AA / AAA**, protección de datos personales conforme a la **Ley N° 21.719** y una arquitectura modular **DRY / SRP**.

---

## Stack Tecnológico

- **Backend:** Node.js (`>= 20.19`, Docker `node:22-alpine`), Express 4, Mongoose 9 (`9.12.2`), MongoDB 7 (driver `7.9.0`), `bcryptjs`, `jsonwebtoken` (HS256), `node-xlsx`.
- **Frontend:** React 18, Vite 6, React Router 7, Tailwind CSS 3, Lucide React.
- **Calidad y Testing:** `node --test` (60 tests backend + 10 tests simulador frontend), SonarQube (`sonar-project.properties`), Docker Compose.

---

## Estructura del Proyecto

```text
Nexo360/
├── docker-compose.yml              # Orquestación MongoDB 7 + Backend + Frontend
├── sonar-project.properties        # Configuración de análisis estático y exclusiones
├── README.md                       # Documentación general, arquitectura y operación
│
├── backend/                        # API REST Node.js + Express + Mongoose 9
│   ├── server.js                   # Punto de entrada, cabeceras OWASP, CORS y /api/health
│   ├── Dockerfile                  # Imagen Node 22 Alpine (usuario no-root + healthcheck)
│   ├── config/db.js                # Conexión resiliente a MongoDB + sembrado inicial con await
│   ├── controllers/                # adminController, authController, moduleController
│   ├── data/
│   │   ├── alameda2026Seed.json    # Catálogo oficial Alameda 2026-002 (7.174 ofertas)
│   │   ├── alameda2026Summary.json # Resumen estadístico de carreras y secciones
│   │   ├── institutionalModules.json # 9 categorías de ayuda y apoyos PAEDIS
│   │   ├── seedCourseRows.json     # Respaldo liviano de oferta académica
│   │   └── seedUsers.json          # 14 perfiles semilla Sede Alameda (estudiantes, PAEDIS y staff)
│   ├── middleware/                 # authMiddleware (JWT/RBAC), rateLimitMiddleware (OWASP A04)
│   ├── models/                     # UserProfile, CourseOffering, Career, Sede, ActivityLog
│   ├── routes/                     # /api/auth, /api/admin, /api/courses, /api/modules
│   ├── scripts/                    # parseAlamedaMd.js, syncPasswords.js
│   ├── services/                   # authService, catalogService, courseService, excelParserService,
│   │                               # predictiveRiskService, satAlertService
│   ├── utils/                      # validationUtils (XSS/NoSQL/RUT/A11y), courseScheduleUtils (b1-b18)
│   └── tests/                      # 7 suites automatizadas (node --test)
│
└── frontend/                       # SPA React 18 + Vite 6 + Tailwind CSS
    ├── Dockerfile                  # Imagen Node 20 Alpine (Vite dev server)
    ├── index.html                  # Soporte tipográfico OpenDyslexic
    └── src/
        ├── App.jsx                 # Enrutamiento protegido, lazy loading y VoiceReaderObserver
        ├── context/                # AuthContext, AccessibilityContext (TTS, contraste, fuente, guía)
        ├── hooks/                  # useAccessibleModal, useOnClickOutside
        ├── pages/                  # LoginPage, DashboardPage, NotFoundPage
        ├── data/                   # duocModulesData, infrastructureCatalog.json, tomaRamosData
        ├── services/api.js         # Cliente HTTP (/api)
        ├── utils/                  # speechService, satUtils, studentUtils, dashboardSearchUtils,
        │                           # lazyLoad, markdownScheduleParser
        ├── components/
        │   ├── admin/              # PaedisCaseManagementSection, EarlyWarningSatSection,
        │   │                       # CoursesAdminSection, CoursesCatalogTable, MarkdownPreviewModal
        │   ├── auth/               # LoginForm, DemoAccountsSelector, MfaPrompt
        │   ├── common/             # UnifiedNavbar, AccessibilityBar, VoiceReaderObserver,
        │   │                       # ReadingGuideOverlay, ThemeCurtainOverlay, LiveAnnouncer,
        │   │                       # SkipLink, ErrorBoundary
        │   ├── dashboard/          # SearchBar, ModuleCard, ModuleModal
        │   ├── simulation/         # TomaRamosSimulator, SapSelectBoxIcon
        │   └── views/              # AdminPanelView, PerfilView, BibliotecaView,
        │                           # VivoDuocSummaryView, ServiciosDigitalesTicketsView
        └── tests/                  # dashboardSimulatorTest.mjs (10 verificaciones)
```

---

## Funcionalidades Clave

### 1. Simulador de Toma de Ramos (SAP SICOL)
- Alimentado por la oferta oficial **Alameda 2026-002** (`7.174` ofertas consolidables en `2.389` secciones y bloques `b1`–`b18`).
- Soporta **Modo Guiado** y **Modo Realista** en 4 niveles de dificultad (`Fácil`, `Intermedio`, `Difícil`, `Muy Difícil`), con panel lateral derecho fijo (**Hoja de Ruta de Referencia**) y emisión de **Boletín Oficial** imprimible.
- Control de acceso mediante `isRegisteredInDb`: usuarios no registrados en BD reciben `403 SIMULATOR_ACCESS_DENIED_NOT_REGISTERED` al intentar operar el simulador.

### 2. Panel Administrativo, SAT y Centro de Operaciones PAEDIS
- **Directorio Unificado:** selector compacto entre **Estudiantes** y **Administrativos**, con filtro de búsqueda por nombre, RUT o sede y orden alfabético.
- **Gestión PAEDIS & Ajustes Razonables (`PaedisCaseManagementSection`):** ciclo de vida completo de casos (barrera, acreditación RND/COMPIN, tutor par, notas confidenciales y ajustes aprobados) y emisión trazable de **Ficha Docente Confidencial** con acuses de recibo conforme a la Ley N° 21.719.
- **Sistema de Alerta Temprana (`EarlyWarningSatSection`) y Semáforo Predictivo:** evaluación por asignatura (`< 70% RI / Alto Riesgo`, `70-75% Moderado`, `> 75% Bajo Riesgo`), simulación de cortes semanales SAP y registro de intervenciones Ficha 360.
- **Catálogos Dinámicos:** CRUD de Carreras y Sedes (`catalogService`) e ingesta masiva de oferta académica desde archivos `.xlsx` y `.md` (`excelParserService`).

### 3. Accesibilidad WCAG 2.2 AA/AAA y Autonomía No Vidente
- **Botón Flotante Retráctil (`AccessibilityBar`):** acoplado en la esquina inferior derecha (`Ajustes de accesibilidad`) con despliegue suave por hover, foco o estado abierto.
- **Lectura en Voz Alta (`voiceReader`):** síntesis de voz en español (`Web Speech API`) disparada en `onFocus` y `onMouseEnter`, lectura automática de anuncios `announce()`, sufijos semánticos ARIA (`VoiceReaderObserver`), atajo global `Alt + V` y cancelación con `Escape`.
- **MFA Accesible (`MfaPrompt`):** extiende el tiempo de espera cuando `voiceReader` está activo e incluye botón para repetir el código en voz alta.
- **Preferencias Persistentes (`PUT /api/auth/accessibility`):** `fontSize`, `highContrast`, `dyslexicFont` (OpenDyslexic), `reducedMotion`, `readingGuide` (`ReadingGuideOverlay` en `z-[9999]`), `voiceReader` y `screenReaderOptimized`.

---

## Seguridad, Cumplimiento Ley N° 21.719 y API REST

- **Protección de Datos y Autenticación:** contraseñas cifradas con `bcryptjs` mediante hook `pre('save')` en Mongoose 9, eliminación de `password` y `__v` en `toJSON`/`toObject`, metadatos de consentimiento ARCO y limitación de finalidad (`purposeLimitation`).
- **Hardening API:** JWT `HS256`, RBAC (`requireAdmin`, `requireAdminOrCoordinator`), `rateLimitMiddleware` en login/MFA, cabeceras de seguridad OWASP, sanitización XSS/NoSQL/ReDoS y prevención de **Log Injection** en controladores.

| Recurso | Rutas principales | Acceso |
| :--- | :--- | :--- |
| Salud API | `GET /api/health` | Público |
| Autenticación y Perfil | `POST /api/auth/login`, `POST /api/auth/sso-login`, `GET /api/auth/me`, `PUT /api/auth/accessibility`, `GET/POST/PUT /api/auth/toma-ramos` | Público / JWT |
| Módulos Institucionales | `GET /api/modules`, `GET /api/modules/:key` | Público (caché MongoDB) |
| Oferta Académica | `GET /api/courses`, `GET /api/courses/careers`, `POST /api/courses/import` | Token opcional / Admin-Coord |
| Administración, SAT y PAEDIS | `GET /api/admin/metrics`, CRUD `/students`, `/courses/*`, `/careers`, `/sedes`, `/sat-alerts/*`, `PATCH /api/admin/paedis/:id/case` | JWT + Admin o Coord. PAEDIS |

---

## Ejecución y Pruebas

### Opción A: Docker Compose
```bash
docker compose up -d --build
```
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api/health`
- **MongoDB:** `localhost:27017/nexo360`

### Opción B: Ejecución Local
```bash
# Backend (puerto 5000, con fallback en memoria si MongoDB no está activo)
cd backend && npm ci --ignore-scripts && npm start

# Frontend (puerto 5173)
cd frontend && npm ci --ignore-scripts && npm run dev
```

### Validación Automatizada y Build
```bash
# Suite Backend (60 pruebas en 7 archivos)
npm test --prefix backend

# Verificación del Simulador Frontend (10 pruebas)
node frontend/src/tests/dashboardSimulatorTest.mjs

# Build de producción Frontend
npm run build --prefix frontend
```
