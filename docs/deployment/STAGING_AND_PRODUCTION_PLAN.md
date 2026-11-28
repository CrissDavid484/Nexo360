# Nexo360 — Plan de Despliegue en Staging y Producción (Fase 7)

**Fecha:** 27 de Noviembre de 2026  
**Versión:** 1.0.0-rc  
**Plataforma de Despliegue:** Docker Compose / Linux VPS / Cloud Container

---

## 1. Topología de Infraestructura

```
[ Cliente Web / Móvil / PAEDIS ]
               │
               ▼  HTTPS :443 (TLS 1.3 / HSTS / Let's Encrypt)
     ┌───────────────────┐
     │   Nginx Reverse   │ ◄── Rate-Limiting, Compresión Gzip,
     │  Proxy & Static   │     CSP, Headers OWASP (X-Frame, XSS)
     └─────────┬─────────┘
               │  Red interna Docker (nexo360-net)
       ┌───────┴───────┐
       ▼               ▼
┌──────────────┐ ┌──────────────┐
│  Frontend    │ │  Backend API │ ◄── Node.js 22 LTS (Express)
│  (Static SPA)│ │  (:5000 int) │     JWT HS256, RBAC, Validador SSRF
└──────────────┘ └───────┬──────┘
                         │ Red interna aislada (:27017 privado)
                         ▼
               ┌──────────────────┐
               │    MongoDB 7     │ ◄── WiredTiger Cache: 256MB
               │  (Auth RBAC)     │     Volumen persistente cifrado
               └──────────────────┘
```

---

## 2. Requisitos de Hardware y Dimensionamiento

### 2.1 Perfil Mínimo (VPS Económico / Staging 1GB RAM)
* **CPU:** 1 vCPU
* **RAM:** 1024 MB (1 GB)
* **Disco:** 20 GB SSD NVMe
* **Optimización aplicada:**
  * MongoDB limitado a 256 MB de cache WiredTiger (`--wiredTigerCacheSizeGB 0.25`).
  * Backend Node.js con `--max-old-space-size=384`.
  * Límite de memoria Docker: MongoDB (512 MB), Backend (384 MB), Nginx (128 MB).

### 2.2 Perfil Institucional Recomendado (Producción Duoc UC)
* **CPU:** 2 vCPUs
* **RAM:** 4096 MB (4 GB)
* **Disco:** 50 GB SSD
* **Base de datos:** MongoDB Atlas M10+ o clúster Replica Set administrado.

---

## 3. Matriz de Variables de Entorno de Producción (`.env.prod`)

| Variable | Requisito / Formato | Propósito |
| :--- | :--- | :--- |
| `NODE_ENV` | `production` (estricto) | Activa protecciones fail-fast, deshabilita bypasses y exige HTTPS. |
| `JWT_SECRET` | Mínimo 32 caracteres criptográficos | Firma y verificación de tokens de sesión HS256. |
| `MONGODB_URI` | `mongodb://user:pass@host:27017/nexo360?authSource=admin` | Conexión autenticada a la base de datos. |
| `FRONTEND_URL` | `https://nexo360.duoc.cl` | Origen exclusivo permitido para políticas CORS y cookies. |
| `ENABLE_DEMO_ACCOUNTS` | `false` (obligatorio en prod) | Bloquea creación o login en cuentas no autenticadas institucionalmente. |
| `ALLOW_IN_MEMORY_FALLBACK` | `false` (obligatorio en prod) | Evita persistencia efímera en memoria ante desconexión de BD. |
| `DUOC_API_MODE` | `disabled` (o `live` con token OCI) | Modo fail-closed de integración con Vivo Duoc. |

---

## 4. Procedimiento de Inicialización y Puesta en Marcha

### Paso 1: Clonar y configurar variables de entorno
```bash
git clone https://github.com/CrissDavid484/Nexo360.git /opt/nexo360
cd /opt/nexo360
cp .env.prod.example .env.prod
chmod 600 .env.prod
nano .env.prod # Ingresar credenciales seguras de producción
```

### Paso 2: Validar sintaxis de Compose
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod config --quiet
```

### Paso 3: Despliegue inicial de contenedores
```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

### Paso 4: Verificación de estado de salud
```bash
docker compose -f docker-compose.prod.yml ps
curl -fsS https://nexo360.duoc.cl/api/health
```

---

## 5. Estrategia de Respaldo y Rollback

* **Respaldos Automatizados (Cron diario):**
  ```bash
  mongodump --uri="$MONGODB_URI" --gzip --archive=/backups/nexo360_$(date +%F).gz
  ```
* **Procedimiento de Rollback Inmediato:**
  1. Si una nueva versión falla los healthchecks de Docker, el proxy Nginx continúa enrutando al contenedor previo.
  2. Para revertir a un commit específico:
     ```bash
     git checkout <COMMIT_SHA_PREVIO>
     docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
     ```
