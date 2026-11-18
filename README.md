# Nexo360 • Plataforma One-Stop-Shop Duoc UC - Sede Alameda (PAEDIS)

> **Proyecto Oficial Capstone 2026 • Piloto Exclusivo: Duoc UC - Sede Alameda**  
> Plataforma web centralizada, accesible (**WCAG 2.2 AA / AAA**) y conforme a la **Ley N° 21.719 de Protección de Datos Personales**, diseñada para estudiantes y comunidad del **Programa de Apoyo a Estudiantes con Discapacidad (PAEDIS)** de **Duoc UC - Sede Alameda**.

---

## 📁 Estructura del Proyecto

```text
Nexo360/
├── docker-compose.yml            # Orquestación Docker (MongoDB 7, Backend, Frontend)
├── README.md                     # Guía general y puesta en marcha
├── NEXO360_ARCHITECTURE.md       # Especificación arquitectónica, WCAG 2.2 y DRY/SRP
│
├── backend/                      # API REST Node.js + Express + Mongoose (MongoDB)
│   ├── config/
│   │   └── db.js                 # Conexión resiliente a MongoDB y sembrado inicial
│   ├── controllers/
│   │   ├── adminController.js    # Gestión estudiantil, métricas, cursos y alertas SAT
│   │   ├── authController.js     # Login cifrado, SSO, perfil, accesibilidad y toma de ramos
│   │   └── moduleController.js   # Consulta de módulos institucionales Sede Alameda
│   ├── data/
│   │   ├── alameda2026Seed.json  # Catálogo oficial Alameda 2026-002 (7.174 ofertas)
│   │   ├── alameda2026Summary.json
│   │   ├── institutionalModules.json # 9 categorías institucionales y apoyos PAEDIS
│   │   ├── seedCourseRows.json   # Respaldo liviano de oferta académica
│   │   └── seedUsers.json        # Perfiles semilla institucionales (Sede Alameda)
│   ├── middleware/
│   │   ├── authMiddleware.js     # Verificación JWT HS256 y control de roles RBAC
│   │   └── rateLimitMiddleware.js# Limitación de tasa en memoria (OWASP A04)
│   ├── models/
│   │   ├── ActivityLog.js        # Auditoría de acciones y eventos SAT
│   │   ├── Career.js             # Catálogo dinámico de carreras Duoc UC
│   │   ├── CourseOffering.js     # Oferta de secciones y bloques horarios
│   │   ├── Sede.js               # Catálogo dinámico de sedes (semilla: Sede Alameda)
│   │   └── UserProfile.js        # Perfil, ajustes PAEDIS, Ley 21.719 y accesibilidad
│   ├── routes/
│   │   ├── adminRoutes.js        # /api/admin
│   │   ├── authRoutes.js         # /api/auth
│   │   ├── courseRoutes.js       # /api/courses
│   │   └── moduleRoutes.js       # /api/modules
│   ├── scripts/
│   │   ├── parseAlamedaMd.js     # Reconstructor de catálogo Alameda 2026-002 desde MD
│   │   └── syncPasswords.js      # Sincronización segura de hashes bcrypt en BD
│   ├── services/
│   │   ├── authService.js        # Autenticación bcrypt, SSO Microsoft y sesiones
│   │   ├── catalogService.js     # Factoría CRUD DRY para Carreras y Sedes
│   │   ├── courseService.js      # Consulta, agrupación e importación de cursos
│   │   ├── excelParserService.js # Ingesta XLSX / Markdown / JSON de oferta académica
│   │   ├── predictiveRiskService.js # Motor predictivo de retención vs. deserción
│   │   └── satAlertService.js    # Sistema de Alerta Temprana (SAT) y Ficha 360
│   ├── utils/
│   │   ├── courseScheduleUtils.js# Bloques horarios oficiales Duoc UC (b1-b18)
│   │   └── validationUtils.js    # Validadores, sanitización, RUT y defaults A11y
│   └── tests/                    # Suite de pruebas automatizadas (node --test)
│
└── frontend/                     # Aplicación React 18 + Vite + Tailwind CSS WCAG 2.2
    ├── index.html                # Documento accesible con soporte OpenDyslexic
    └── src/
        ├── components/           # Auth, Common (AccessibilityBar, VoiceReaderObserver), Dashboard, Admin, Simulador y Vistas
        ├── context/              # AccessibilityContext (incluye Lectura por Voz TTS) y AuthContext
        ├── hooks/                # Hooks reutilizables (useAccessibleModal, useOnClickOutside)
        ├── pages/                # LoginPage, DashboardPage, NotFoundPage
        ├── data/                 # Módulos Duoc UC Sede Alameda y datos del Simulador
        ├── services/             # Cliente HTTP API (/api)
        └── utils/                # speechService (Web Speech API), satUtils, studentUtils y parser MD
```

---

## 🚀 Cómo Ejecutar

### Opción A: Docker Compose (Entorno Completo)
```bash
docker compose up -d --build
```
- **Frontend:** `http://localhost:5173`
- **Backend API:** `http://localhost:5000/api/health`
- **MongoDB:** `localhost:27017/nexo360`

### Opción B: Ejecución Local

#### 1. Iniciar el Backend
```bash
cd backend
npm ci --ignore-scripts
npm start
```
*El servidor corre en `http://localhost:5000` con respaldo en memoria si MongoDB no está activo.*

#### 2. Iniciar el Frontend
```bash
cd frontend
npm ci --ignore-scripts
npm run dev
```
*La aplicación queda disponible en `http://localhost:5173`.*

### 3. Ejecutar Pruebas Backend
```bash
npm test --prefix backend
```

---

## ♿ Características Principales y Cumplimiento

- **Piloto Exclusivo Duoc UC - Sede Alameda**: Perfiles iniciales, oferta académica oficial Alameda 2026-002 (incluyendo optativos virtuales sincrónicos), biblioteca accesible, guías y endpoints alineados al piloto de Sede Alameda.
- **Modo Lectura por Voz (TTS WCAG 2.2)**: Nuevo toggle persistente `voiceReader` (`accessibilityPreferences.voiceReader` en MongoDB + Web Speech API en español en frontend) con lectura asistida al enfocar (`onFocus`) o pasar el cursor (`onMouseEnter`) sobre controles, tarjetas y textos clave, más silenciamiento rápido con `Escape`.
- **WCAG 2.2 AA / AAA**: Foco visible reforzado, modo Alto Contraste, fuente OpenDyslexic, reducción de movimiento, guía de lectura (`ReadingGuideOverlay`) y región en vivo ARIA (`aria-live`).
- **Seguridad y Ley N° 21.719**: Autenticación nativa con contraseñas cifradas (`bcryptjs`), tokens JWT HS256, flujo directo SSO institucional, limitación de finalidad, metadatos de consentimiento y eliminación de credenciales en serialización (`toJSON`/`toObject`).
- **Arquitectura Modular DRY / SRP**: Lógica de negocio desacoplada en servicios especializados (`predictiveRiskService`, `catalogService`, `satAlertService`, `courseService`, `excelParserService`) y utilidades compartidas (`validationUtils`, `courseScheduleUtils`).
