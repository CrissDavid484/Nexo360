# Arquitectura de Software Nexo360 • Duoc UC - Sede Alameda (PAEDIS)

**Nexo360** es una plataforma One-Stop-Shop diseñada para el estreno piloto en **Duoc UC - Sede Alameda**, enfocada en estudiantes del **Programa de Apoyo a Estudiantes con Discapacidad (PAEDIS)**, coordinación académica y administración institucional. Garantiza cumplimiento **WCAG 2.2 AA / AAA**, protección de datos personales conforme a la **Ley N° 21.719** de Chile y una arquitectura backend/frontend desacoplada bajo principios **DRY** y **SRP**.

---

## 1. Estructura Real del Proyecto

```text
Nexo360/
├── backend/
│   ├── server.js                         # Punto de entrada Express, cabeceras OWASP, CORS y /api/health
│   ├── Dockerfile                        # Imagen Node 20 Alpine (usuario no-root, healthcheck)
│   ├── config/
│   │   └── db.js                         # Conexión resiliente a MongoDB + sembrado inicial esperado con await
│   ├── models/
│   │   ├── UserProfile.js                # Perfil institucional, ajustes PAEDIS, Ley 21.719 y a11y (strict: true)
│   │   ├── Sede.js                       # Modelo dinámico de sedes (semilla piloto: Sede Alameda)
│   │   ├── Career.js                     # Modelo dinámico de carreras Duoc UC
│   │   ├── CourseOffering.js             # Oferta académica por sede/carrera/período y bloques horarios
│   │   └── ActivityLog.js                # Auditoría de login, simulador, catálogo y eventos SAT
│   ├── utils/
│   │   ├── validationUtils.js            # EMAIL_REGEX, UUID_V4_REGEX, sanitizeString, escapeRegex, RUT y DEFAULT_ACCESSIBILITY_PREFERENCES
│   │   └── courseScheduleUtils.js        # Bloques horarios (b1-b18), parser de horarios y mergeUniqueBlocks
│   ├── services/
│   │   ├── authService.js                # Login bcryptjs, SSO Microsoft, perfiles, accesibilidad y ActivityLog
│   │   ├── catalogService.js             # Factoría CRUD DRY para Carreras y Sedes (MongoDB + memoria)
│   │   ├── predictiveRiskService.js      # Motor predictivo de retención vs. deserción (<70% RI, 70-75% alerta, >75% favorable)
│   │   ├── satAlertService.js            # Motor de Sistema de Alerta Temprana (SAT) y simulación de cortes SAP
│   │   ├── courseService.js              # Consulta, agrupación e importación masiva de asignaturas
│   │   └── excelParserService.js         # Parseo XLSX/Markdown/JSON de oferta académica y limpieza por período
│   ├── controllers/
│   │   ├── authController.js             # Autenticación, perfil, fotografía, accesibilidad y toma de ramos
│   │   ├── adminController.js            # Métricas, directorio estudiantil, cursos, CRUD catálogos y SAT Ficha 360
│   │   └── moduleController.js           # Endpoints de módulos institucionales (Centro de Ayuda)
│   ├── routes/
│   │   ├── authRoutes.js                 # /api/auth
│   │   ├── adminRoutes.js                # /api/admin (protegido JWT + Admin/Coordinador PAEDIS)
│   │   ├── courseRoutes.js               # /api/courses
│   │   └── moduleRoutes.js               # /api/modules
│   ├── middleware/
│   │   ├── authMiddleware.js             # verifyToken, optionalToken, requireAdmin, requireAdminOrCoordinator
│   │   └── rateLimitMiddleware.js        # Limitación de tasa en memoria para endpoints críticos
│   ├── data/
│   │   ├── seedUsers.json                # 14 perfiles institucionales piloto Sede Alameda
│   │   ├── institutionalModules.json     # 9 categorías institucionales y consejos PAEDIS
│   │   ├── alameda2026Seed.json          # 7.174 ofertas oficiales Alameda 2026-002 (incluye 87 virtuales sincrónicos)
│   │   ├── alameda2026Summary.json       # Resumen estadístico de carreras y secciones Alameda
│   │   └── seedCourseRows.json           # Respaldo liviano de filas de oferta académica
│   ├── scripts/
│   │   ├── parseAlamedaMd.js             # Generador de alameda2026Seed.json desde fuente Markdown
│   │   └── syncPasswords.js              # Actualización segura de hashes bcrypt en BD (try/finally)
│   └── tests/                            # Suite node --test (QA/OWASP, RBAC, Parser, Accesibilidad, Verifier)
│
└── frontend/
    ├── index.html                        # HTML accesible (OpenDyslexic, Piloto Sede Alameda)
    └── src/
        ├── App.jsx                       # Enrutamiento protegido, Lazy loading y VoiceReaderObserver
        ├── context/
        │   ├── AccessibilityContext.jsx  # Estado global WCAG 2.2 (fuente, contraste, dislexia, guía, voiceReader)
        │   └── AuthContext.jsx           # Estado de sesión JWT y sincronización de perfil
        ├── utils/
        │   ├── speechService.js          # Integración Web Speech API en español con deduplicación y cleanup
        │   ├── satUtils.js               # Evaluación unificada de umbrales SAT/RI
        │   └── studentUtils.js           # Catálogo piloto Sede Alameda y utilidades compartidas
        ├── hooks/                        # useAccessibleModal, useOnClickOutside
        ├── components/                   # Common (AccessibilityBar, VoiceReaderObserver, ReadingGuideOverlay, Navbar), Auth, Dashboard, Admin, Simulador y Vistas
        └── pages/                        # LoginPage, DashboardPage, NotFoundPage
```

---

## 2. Flujo de Autenticación Nativa, SSO y Ley N° 21.719

1. **Autenticación Cifrada Nativa (`POST /api/auth/login`)**: Valida el correo institucional (`@duocuc.cl`, `@profesor.duoc.cl`, `@duoc.cl`) mediante `EMAIL_REGEX` y verifica la contraseña contra el hash `bcryptjs` almacenado en `UserProfile` (o en memoria si MongoDB está en respaldo local).
2. **SSO Institucional (`POST /api/auth/sso-login`)**: Permite acceso directo integrado con la URL oficial OAuth de Vivo Duoc (`authService.getOfficialLoginUrl()`), validando pertenencia institucional y emitiendo JWT `HS256`.
3. **Control de Acceso al Simulador (`isRegisteredInDb`)**: Cuentas creadas dinámicamente que no figuran registradas oficialmente en la base de datos (`isRegisteredInDb: false`) pueden usar el Centro de Ayuda y accesibilidad, pero reciben `403 SIMULATOR_ACCESS_DENIED_NOT_REGISTERED` al acceder a `/api/auth/toma-ramos` o `/api/auth/simulator-log`.
4. **Cumplimiento Ley N° 21.719**:
   - `UserProfile` ejecuta un hook `pre('save')` que cifra contraseñas con `bcryptjs` (salt 10) y transformadores `toJSON`/`toObject` que excluyen `password` y `__v` de toda respuesta.
   - Se registran `consentimientoLey21719`, `purposeLimitation` y `consentMetadata` con derechos ARCO y política de retención académica.
   - Endpoint informativo público `GET /api/auth/ley21719`.

---

## 3. Accesibilidad WCAG 2.2 AA/AAA y Modo Lectura por Voz (`voiceReader`)

El subdocumento `accessibilityPreferences` en `UserProfile.js` y su sanitizador centralizado (`validationUtils.sanitizeAccessibilityPreferences`) soportan:

- `fontSize`: `'normal' | 'large' | 'xlarge'`
- `highContrast`: `Boolean` (default `false`)
- `dyslexicFont`: `Boolean` (default `false`)
- `reducedMotion`: `Boolean` (default `false`)
- `readingGuide`: `Boolean` (default `false`)
- `voiceReader`: `Boolean` (default `false`) — **Nuevo modo de Lectura en Voz Alta (TTS WCAG 2.2)**
- `screenReaderOptimized`: `Boolean` (default `true`)

**Flujo de Lectura por Voz:**
- En **Frontend**, el usuario activa **"Activar Lectura por Voz"** desde `AccessibilityBar` (`AccessibilityContext.voiceReader`), habilitando la síntesis de voz en español (`Web Speech API`) ante eventos `onFocus` y `onMouseEnter` en botones, enlaces, formularios, tarjetas y encabezados (con soporte de `VoiceReaderObserver` y cancelación inmediata mediante `Escape`).
- En **Backend**, `PUT /api/auth/accessibility` valida y normaliza la preferencia `voiceReader` junto al resto de flags, persistiendo tanto en MongoDB como en la caché en memoria de `authService`. `authService.formatUserResponse` fusiona siempre con `DEFAULT_ACCESSIBILITY_PREFERENCES` para evitar propiedades indefinidas en perfiles históricos o semilla.

---

## 4. Piloto Duoc UC - Sede Alameda y Oferta Académica

- **Sede Piloto**: Todos los perfiles semilla de `backend/data/seedUsers.json`, módulos institucionales (`backend/data/institutionalModules.json`), defaults de creación (`DEFAULT_SEDE = 'Sede Alameda'`) y semilla de sedes (`INITIAL_SEDES = ['Sede Alameda']`) operan enfocados en **Duoc UC - Sede Alameda**, manteniendo operativos los endpoints CRUD (`/api/admin/sedes`, `/api/admin/careers`) para gestión administrativa dinámica.
- **Catálogo Alameda 2026-002**: `backend/data/alameda2026Seed.json` contiene **7.174 filas** (7.087 ofertas presenciales/online de `ALAMEDA` + 87 optativos transversales de `SEDE VIRTUAL SINCRÓNICA`), consolidables en 2.389 secciones de carrera y bloques horarios `b1`–`b18` (`courseScheduleUtils.js`).

---

## 5. Refactorización Arquitectónica DRY / SRP y Resiliencia Asíncrona

- **Separación de Responsabilidades (SRP)**:
  - `validationUtils.js`: centraliza validaciones, sanitización XSS/NoSQL, escape regex, cálculo/búsqueda de RUT y defaults de accesibilidad.
  - `predictiveRiskService.js`: encapsula el algoritmo de semáforo predictivo de deserción (`ALTO`/`RI < 70%`, `MEDIO 70-75%`, `BAJO > 75%`) desacoplado de `adminController.js`.
  - `catalogService.js`: factoría DRY reutilizable para CRUD de Carreras y Sedes con manejo explícito de colisiones `E11000` (sin `.catch(() => {})` silenciosos).
  - `authMiddleware.js`: unifica la resolución de tokens JWT y sesión demo controlada en `resolveUserFromHeader`.
- **Eliminación de Redundancias y Promesas Seguras**:
  - Consumo directo de `seedUsers.json` y `institutionalModules.json` sin archivos puente `.js`.
  - Eliminación de inicialización asíncrona flotante al importar `courseService.js`; el sembrado inicial en MongoDB se ejecuta explícitamente con `await` en `config/db.js`.
  - Inclusión de eventos SAT (`sat_weekly_cut_simulated`, `sat_intervention_updated`) en el `enum` de `ActivityLog.js`.
  - Limpieza de manejadores `catch` silenciosos y garantía de desconexión `try/finally` en `scripts/syncPasswords.js`.
