# Nexo360 • Plataforma One-Stop-Shop Duoc UC PAEDIS

> **Proyecto Oficial Independiente**  
> Plataforma web centralizada y altamente accesible (WCAG 2.2 AA) diseñada para estudiantes del **Programa de Apoyo a Estudiantes con Discapacidad (PAEDIS)** de Duoc UC.

---

## 📁 Estructura del Proyecto

Esta carpeta es completamente autónoma e independiente de maquetas o archivos previos:

```text
nexo360/
├── backend/                  # Servidor Node.js + Express + Puppeteer + MongoDB
│   ├── config/               # Conexión a MongoDB (Mongoose)
│   ├── controllers/          # Controladores (Auth, MFA Polling, Módulos)
│   ├── models/               # Modelos (UserProfile, ScrapedDataCache)
│   ├── services/             # Proxy de Autenticación Puppeteer y Scraper
│   ├── routes/               # Endpoints REST (/api/auth, /api/modules)
│   ├── middleware/           # Validación de JWT propio de Nexo360
│   ├── server.js             # Punto de entrada de la API
│   ├── package.json
│   └── .env.example
│
├── frontend/                 # Aplicación React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/       # Componentes accesibles (Auth, Dashboard, Common)
│   │   ├── context/          # AccessibilityContext y AuthContext
│   │   ├── pages/            # LoginPage y DashboardPage
│   │   ├── data/             # Datos de las 9 categorías y submenús Duoc
│   │   └── services/         # Cliente API para backend
│   ├── tailwind.config.js    # Paleta Duoc y modo Alto Contraste
│   ├── package.json
│   └── vite.config.js
│
├── NEXO360_ARCHITECTURE.md   # Especificación arquitectónica y WCAG 2.2
└── README.md
```

---

## 🚀 Cómo Ejecutar

### 1. Iniciar el Backend (Terminal 1)
```bash
cd nexo360/backend
npm.cmd install
npm.cmd start
```
*El servidor correrá en `http://localhost:5000` con el proxy de autenticación Zero-Knowledge y modo mock activado por defecto para pruebas locales.*

### 2. Iniciar el Frontend (Terminal 2)
```bash
cd nexo360/frontend
npm.cmd install
npm.cmd run dev
```
*La aplicación estará disponible en `http://localhost:5173`.*

---

## ♿ Características Principales
- **Zero-Knowledge Credentials**: Las contraseñas institucionales nunca se guardan en la base de datos; solo se procesan en la sesión de Puppeteer para resolver el inicio institucional.
- **Flujo MFA Number Match**: Despliega el número del Microsoft Authenticator en tamaño gigante y realiza polling cada 2s hasta aprobación.
- **WCAG 2.2 AA**: Foco visible claro, modo de alto contraste (>15:1), tipografía escalable, compatibilidad con dislexia y región en vivo ARIA (`aria-live`).
- **Dashboard Institucional 2026**: 9 categorías completas con los 18 submenús de Vida Académica y apoyos PAEDIS.
