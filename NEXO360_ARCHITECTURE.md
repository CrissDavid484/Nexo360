# Arquitectura de Software Nexo360 - Duoc UC PAEDIS

Nexo360 es una plataforma One-Stop-Shop diseñada para estudiantes del **Programa de Apoyo a Estudiantes con Discapacidad (PAEDIS)** de Duoc UC. Centraliza servicios y trámites dispersos de la institución garantizando cumplimiento de **WCAG 2.2 AA** y seguridad **Zero-Knowledge Credentials**.

---

## 1. Estructura del Proyecto

```text
Capsone 2026 - Daniela-Cristian/
├── backend/
│   ├── .env                      # Variables de entorno
│   ├── .env.example              # Plantilla de configuración
│   ├── package.json              # Dependencias Node.js
│   ├── server.js                 # Punto de entrada Express
│   ├── config/
│   │   └── db.js                 # Conexión resiliente a MongoDB (Mongoose)
│   ├── models/
│   │   ├── UserProfile.js        # Perfil y preferencias de accesibilidad (Sin contraseña)
│   │   └── ScrapedDataCache.js   # Caché de FAQs y trámites con TTL
│   ├── controllers/
│   │   ├── authController.js     # Login, polling MFA y preferencias
│   │   └── moduleController.js   # Endpoints de módulos institucionales
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth
│   │   └── moduleRoutes.js       # /api/modules
│   ├── services/
│   │   ├── authScraperService.js # Proxy Puppeteer MFA Number Match
│   │   └── dataScraperService.js # Gestor de caché y scraper institucional
│   └── middleware/
│       └── authMiddleware.js     # Verificación JWT de Nexo360
│
└── frontend/
    ├── index.html                # HTML accesible con OpenDyslexic
    ├── package.json              # React 18, Vite, Tailwind CSS, Lucide
    ├── vite.config.js            # Proxy a backend localhost:5000
    ├── tailwind.config.js        # Paleta Duoc UC y Modo Alto Contraste
    ├── postcss.config.js
    └── src/
        ├── main.jsx              # Entry point con Providers y Router
        ├── App.jsx               # Rutas protegidas y layout base
        ├── index.css             # Estilos WCAG 2.2, fuentes y contraste
        ├── context/
        │   ├── AccessibilityContext.jsx # Tamaño fuente, contraste, voz ARIA
        │   └── AuthContext.jsx          # Estado de sesión y persistencia
        ├── services/
        │   └── api.js                   # Cliente HTTP (Login, polling, módulos)
        ├── data/
        │   └── duocModulesData.js       # 9 categorías y submenús Duoc 2026
        ├── components/
        │   ├── common/
        │   │   ├── SkipLink.jsx         # Salto al contenido (WCAG 2.4.1)
        │   │   ├── LiveAnnouncer.jsx    # Anunciador ARIA en vivo (WCAG 4.1.3)
        │   │   ├── AccessibilityBar.jsx # Barra superior A+/A-, contraste, etc.
        │   │   └── Navbar.jsx           # Navegación institucional
        │   ├── auth/
        │   │   ├── LoginForm.jsx        # Formulario accesible con loader
        │   │   └── MfaPrompt.jsx        # Pantalla número grande y Polling 2s
        │   └── dashboard/
        │       ├── SearchBar.jsx        # Búsqueda reactiva con anuncio de resultados
        │       ├── ModuleCard.jsx       # Tarjetas grandes con íconos e indicadores
        │       └── ModuleModal.jsx      # Modal con 18 submenús y tips PAEDIS
        └── pages/
            ├── LoginPage.jsx            # Orquestador del flujo de login
            └── DashboardPage.jsx        # Panel centralizado de servicios
```

---

## 2. Flujo de Autenticación Zero-Knowledge & MFA (Fase 1)

1. **Recepción en Memoria**: El estudiante ingresa correo y contraseña en `LoginForm.jsx`.
2. **Proxy de Autenticación**: El backend recibe las credenciales y las entrega directamente al navegador controlado por Puppeteer (`authScraperService.js`). **La contraseña nunca se persiste en disco ni en base de datos**.
3. **Detección de MFA**: Puppeteer detecta la pantalla de desafío de Microsoft Authenticator (Number Match) y extrae el número de 2 dígitos.
4. **Pantalla de Aprobación**: El frontend muestra dicho número en tamaño extra grande (7xl/8xl), legible y anunciado a lectores de pantalla.
5. **Polling Reactivo**: El frontend consulta `GET /api/auth/mfa-status/:sessionId` cada 2 segundos.
6. **Aprobación y Emisión de Token**: Una vez aprobada la solicitud en el teléfono móvil, el backend cierra la sesión de Puppeteer de forma segura y emite un JWT firmado por Nexo360, guardando únicamente el perfil público y las preferencias del estudiante en MongoDB.
7. **Redirección**: El frontend recibe el JWT y redirige automáticamente al Dashboard.

---

## 3. Estructura de Base de Datos MongoDB (Fase 2)

- **`UserProfile`**: Almacena `email`, `rut`, `nombre`, `carrera`, `sede`, datos PAEDIS (`tutorParAsignado`, `ajustesAprobados`) y el objeto `accessibilityPreferences` (`fontSize`, `highContrast`, `dyslexicFont`, `reducedMotion`). Cuenta con un hook de seguridad `pre('save')` para garantizar la eliminación de cualquier intento de guardar contraseñas.
- **`ScrapedDataCache`**: Almacena información institucional organizada por `categoryKey`, conteniendo `faqs`, `submodules`, `portalUrl`, `last_updated` y un método `isExpired()` gobernado por un `ttlHours` (por defecto 24 horas).

---

## 4. Categorías Institucionales Implementadas (Fase 3)

1. **Admisión y Matrícula**: Admisión regular, cambio de institución, reintegros.
2. **Orientación Estudiantes Nuevos**: Talleres extracurriculares, semana cero, semestre cero, TNE primera vez, servicios digitales.
3. **Estudiantes - Vida Académica (Módulo Principal)**:
   - Seguro médico
   - Programa de movilidad
   - Especializaciones Informática
   - Talleres
   - Calendario Académico 2026
   - Inscripción de Asignaturas
   - Asistencias e Inasistencias
   - Créditos y Becas
   - Notas y Exámenes
   - Revalidación TNE
   - TAV
   - Prácticas
   - Fondos concursables 2026
   - Continuidad de estudios
   - Cambio de carrera
   - Duoc Laboral
   - Renuncia
   - Suspensión Académica
4. **Beneficios Estudiantiles**: Apoyo a estudiantes cuidadores Ley N° 21.790, PAEDIS, Programas de Apoyo, Bienestar, Apoyo psicológico.
5. **Pagos y Deudas**: Matrícula, arancel, opciones de repactación.
6. **Servicios Digitales**: Acceso AVA, correo institucional, Wifi, Microsoft 365, ciberseguridad, convenios de software como Azure y Adobe.
7. **Titulados**: Diplomas, ceremonias, certificados.
8. **Convivencia, inclusión y equidad de género**: Canal de denuncias, cambio de nombre social.
9. **Sostenedor**: Solicitudes y certificados del alumno.
