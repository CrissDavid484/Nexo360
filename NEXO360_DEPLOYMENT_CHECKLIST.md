# NEXO360 — LISTA DE VERIFICACIÓN DE DESPLIEGUE EN PRODUCCIÓN (DEPLOYMENT CHECKLIST)

**Proyecto:** Nexo360 • Plataforma Integral de Apoyo Estudiantil y Gestión PAEDIS  
**Institución:** Duoc UC — Sede Alameda  
**Fecha de Emisión:** 26 de Noviembre de 2026  
**Estado:** `PREPARADO TÉCNICAMENTE CON DEPENDENCIAS INSTITUCIONALES PENDIENTES`

---

## 1. Matriz de Pendientes y Responsabilidades para Despliegue

| Qué falta | Quién lo entrega | Dónde se configura | Cómo se valida | Qué bloquea |
| :--- | :--- | :--- | :--- | :--- |
| **Credenciales MongoDB y JWT** (`MONGO_INITDB_ROOT_*`, `MONGO_APP_*`, `JWT_SECRET` ≥ 32 chars) | DevOps / Administrador de Infraestructura | Archivo `.env` en raíz (copiado desde `.env.prod.example`) | `docker compose -f docker-compose.prod.yml config --quiet` y arranque de `backend` sin error de `validateProductionConfig()` | Arranque completo de `mongodb` y `backend` en producción |
| **Microsoft Entra ID (OIDC)** (`AZURE_ENTRA_TENANT_ID`, `CLIENT_ID`, `CLIENT_SECRET`, `REDIRECT_URI`) | TI Corporativa / Identidad Duoc UC | `.env` en raíz (inyectado a `backend` vía `docker-compose.prod.yml`) | `GET /api/auth/oidc/status` responde `configured: true` y flujo PKCE autentica usuario real | Inicio de sesión institucional SSO Entra ID (`OIDC_NOT_CONFIGURED`) |
| **SICOL / Banner** (`SICOL_API_URL`, `SICOL_API_KEY`, `SICOL_CLIENT_ID`) | TI / Sistemas Académicos Duoc UC | `.env` en raíz | Llamada controlada de sincronización devuelve datos reales en lugar de `UNCONFIGURED` | Consulta/sincronización en vivo con ERP académico |
| **Springshare LibCal** (`LIBCAL_BASE_URL`, `LIBCAL_CLIENT_ID`, `LIBCAL_CLIENT_SECRET`) | Biblioteca Duoc UC | `.env` en raíz | Obtención de token OAuth2 `client_credentials` y consulta real de espacios | Reservas reales en LibCal (permanece como simulador formativo) |
| **SMTP Institucional** (`SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`) | TI / Infraestructura de Correo Duoc UC | `.env` en raíz | Envío de prueba con resultado `ENVIADO_SMTP` | Correos reales de bienvenida, recuperación y notificaciones |
| **Base Legal y Consentimiento (Ley N° 21.719)** | Área Legal / Oficial de Privacidad Duoc UC | Política institucional y actualización de `legalBasis` / flujo de consentimiento | Aprobación formal firmada sobre tratamiento de datos sensibles PAEDIS | Salida oficial a producción con estudiantes reales |
| **Certificados TLS/HTTPS y Dominio** | Infraestructura / Redes Duoc UC | Reverse proxy externo (Nginx/Caddy/LB) apuntando a `APP_PORT` (`8080` interno) + `FRONTEND_URL`/`APP_PUBLIC_URL` | `curl -I https://<dominio>/api/health/ready` con certificado válido y HSTS | Exposición segura en producción con HTTPS |
| **Auditoría Manual Screen Reader y Smoke Docker Staging** | Equipo QA / Accesibilidad | Entorno *staging* con `docker-compose.prod.yml` | Prueba manual con NVDA/VoiceOver y verificación E2E sobre contenedores activos | Firma final de paso a producción |
| **Token SonarQube en CI** (`SONAR_TOKEN`) | Mantenedor del Repositorio | GitHub Repository Secrets | Ejecución exitosa del job `sonarqube` en `.github/workflows/ci.yml` | Escaneo automático SonarQube en PRs/push |

---

## 2. Fase Pre-Despliegue (Pre-flight Checklist)

### 2.1 Configuración de Infraestructura y Servidor
- [ ] **Servidor Host:** Servidor Linux con Docker Engine y Docker Compose v2 activos. Recursos mínimos recomendados: 1–2 GB RAM (los límites en `docker-compose.prod.yml` reservan `512M` para `mongodb`, `384M` para `backend` y `128M` para `frontend`).
- [ ] **Firewall de Host:**
  - Puerto `443` (HTTPS) terminado en reverse proxy del host o balanceador institucional, reenviando al puerto `APP_PORT` expuesto por el contenedor `frontend` (puerto interno `8080` no privilegiado).
  - Puertos `5000` (Backend) y `27017` (MongoDB) **NO expuestos** hacia el exterior; permanecen aislados dentro de la red puente interna `nexo360-net`.

### 2.2 Variables de Entorno en `.env` (basado en `.env.prod.example`)
- [ ] Copiar plantilla: `cp .env.prod.example .env` en la raíz del proyecto (nunca versionar `.env`).
- [ ] Reemplazar todos los marcadores `<REEMPLAZAR_...>`:
  - `MONGO_INITDB_ROOT_USERNAME` y `MONGO_INITDB_ROOT_PASSWORD` (credenciales administrativas usadas por MongoDB y su healthcheck).
  - `MONGO_APP_USER` y `MONGO_APP_PASSWORD` (usuario con rol mínimo `readWrite` sobre `nexo360`, creado por `backend/mongo-init.js` al inicializar un volumen nuevo).
  - `JWT_SECRET` (mínimo 32 caracteres aleatorios, ej. `openssl rand -base64 48`; `validateProductionConfig()` aborta el arranque si falta, tiene `< 32` caracteres o usa claves de desarrollo/placeholders).
  - `FRONTEND_URL` y `APP_PUBLIC_URL` con la URL HTTPS canónica sin `/` final.
- [ ] Confirmar flags de seguridad en `NODE_ENV=production`:
  - `ENABLE_DEMO_ACCOUNTS=false` (`validateProductionConfig()` rechaza `true`).
  - `ALLOW_IN_MEMORY_FALLBACK=false` (`validateProductionConfig()` rechaza `true`).
- [ ] Completar variables opcionales según disponibilidad institucional (`AZURE_ENTRA_*`, `SICOL_*`, `LIBCAL_*`, `SMTP_*`) o dejarlas vacías para operar sin integración externa viva.

### 2.3 Validación de Código y Pruebas Previas (Local / CI)
- [ ] Backend: `npm run test:coverage --prefix backend` -> **172/172 tests pass** y generación de `backend/coverage/lcov.info` (ignorado por `.gitignore`).
- [ ] Frontend: `npm test --prefix frontend`, `node frontend/src/tests/dashboardSimulatorTest.mjs`, `node frontend/src/tests/courseImportPreviewTest.mjs` y `npm run build --prefix frontend`.
- [ ] Auditoría de dependencias: `npm audit --prefix backend --audit-level=high --omit=dev` y `npm audit --prefix frontend --audit-level=high --omit=dev` (`0` vulnerabilidades).
- [ ] Configuración Compose: `docker compose -f docker-compose.prod.yml config --quiet` (exit `0`).

---

## 3. Fase de Despliegue (Execution Checklist)

### 3.1 Respaldo Previo (Si existe volumen MongoDB previo)
```bash
docker exec -t nexo360-mongodb mongodump \
  --username "$MONGO_INITDB_ROOT_USERNAME" \
  --password "$MONGO_INITDB_ROOT_PASSWORD" \
  --authenticationDatabase admin \
  --db nexo360 \
  --out "/data/db/backup_pre_deploy_$(date +%F_%H%M%S)"
```

> **Nota sobre inicialización de MongoDB (`backend/mongo-init.js`):** El script `/docker-entrypoint-initdb.d/mongo-init.js` se ejecuta automáticamente **solo cuando `/data/db` está vacío**. Si se reutiliza un volumen preexistente, verificar que `MONGO_APP_USER` exista en la base `nexo360` con rol `readWrite`.

### 3.2 Construcción y Arranque
- [ ] Verificar `.env` en la raíz del repositorio (`/opt/nexo360/.env`).
- [ ] Construir y levantar contenedores:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build
  ```
- [ ] Comprobar que `nexo360-mongodb`, `nexo360-backend` y `nexo360-frontend` alcanzan estado `healthy`:
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```

---

## 4. Fase Post-Despliegue (Staging / Pre-Producción)

### 4.1 Verificación de Endpoints de Salud
- [ ] Liveness (proceso vivo): `GET /api/health/live` -> HTTP `200` (`status: "ALIVE"`).
- [ ] Readiness (conexión MongoDB activa `readyState === 1`): `GET /api/health/ready` -> HTTP `200` (`status: "READY"`, `database.connected: true`); ante caída de MongoDB debe responder HTTP `503` (`status: "NOT_READY"`).
- [ ] Health general: `GET /api/health` -> HTTP `200` (`status: "OK"`) cuando MongoDB está conectado, o HTTP `503` (`status: "ERROR"`) si está desconectado en producción.

### 4.2 Verificación Funcional, Seguridad y Accesibilidad en Vivo
- [ ] Confirmar que `GET /api/auth/users` exige token válido de rol administrativo (`401`/`403` en otro caso).
- [ ] Confirmar que `POST /api/auth/sso-login` y cuentas demo están deshabilitados en producción (`ENABLE_DEMO_ACCOUNTS=false`).
- [ ] Verificar segregación PAEDIS: Administrador TI recibe `403` en rutas clínicas confidenciales y no recibe diagnósticos en `toAdminView()`; Coordinador PAEDIS gestiona `PaedisRecord` y estados de Ficha Docente (`BORRADOR` → `ACUSADA`) sin marcar `notificada` al solo descargar `.txt`.
- [ ] Verificar simulador SAT (umbral 70% / `minAttendanceRequired`) y creación de intervenciones persistentes sin alteración de `UserProfile`.
- [ ] Ejecutar prueba manual de accesibilidad con teclado y lector de pantalla (NVDA / VoiceOver).

---

## 5. Procedimiento de Reversión (Rollback Plan)

Si se detectan fallos críticos tras el despliegue, mantener **`mongodb` en ejecución** antes de restaurar el respaldo:

1. **Detener únicamente los servicios de aplicación (`backend` y `frontend`):**
   ```bash
   docker compose -f docker-compose.prod.yml stop backend frontend
   ```
2. **Asegurar que `mongodb` esté arriba y saludable:**
   ```bash
   docker compose -f docker-compose.prod.yml up -d mongodb
   docker compose -f docker-compose.prod.yml ps mongodb
   ```
3. **Restaurar el respaldo de MongoDB con `mongodb` en ejecución:**
   ```bash
   docker exec -i nexo360-mongodb mongorestore \
     --username "$MONGO_INITDB_ROOT_USERNAME" \
     --password "$MONGO_INITDB_ROOT_PASSWORD" \
     --authenticationDatabase admin \
     --nsInclude="nexo360.*" \
     --drop \
     "/data/db/backup_pre_deploy_<TIMESTAMP>/nexo360"
   ```
4. **Revertir el código al tag estable anterior y reconstruir servicios:**
   ```bash
   git checkout <TAG_VERSION_ANTERIOR>
   docker compose -f docker-compose.prod.yml up -d --build
   ```
5. **Verificar recuperación:**
   ```bash
   docker compose -f docker-compose.prod.yml ps
   curl -fsS http://127.0.0.1:${APP_PORT:-80}/api/health/ready
   ```

---

## 6. Bloques de Traspaso a Duoc UC (Resumen)

- **A. Software pendiente post-entrega:** Retiro futuro de los campos `select: false` heredados en `UserProfile.js` tras confirmar migración en BD real; reporte LCOV automatizado en frontend.
- **B. Infraestructura:** Host Linux, TLS/HTTPS en reverse proxy, `.env` sin `<REEMPLAZAR_...>`, volumen MongoDB persistente.
- **C. Credenciales e integraciones:** Entra ID (`AZURE_ENTRA_*`), SICOL (`SICOL_*`), LibCal (`LIBCAL_*`), SMTP (`SMTP_*`) y `SONAR_TOKEN` en GitHub Actions.
- **D. Validaciones legales, seguridad y accesibilidad:** Aprobación jurídica Ley N° 21.719 (`consentGiven` / `legalBasis`), pruebas *fail-fast* en *staging* y auditoría manual NVDA/VoiceOver.
- **E. Puesta en marcha:** Ejecución inicial de `docker-compose.prod.yml`, verificación de `mongo-init.js` y prueba de `mongodump`/`mongorestore`.
