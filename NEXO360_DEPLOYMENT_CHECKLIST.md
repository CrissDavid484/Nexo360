# NEXO360 — LISTA DE VERIFICACIÓN DE DESPLIEGUE EN PRODUCCIÓN (DEPLOYMENT CHECKLIST)

**Proyecto:** Nexo360 • Plataforma Integral de Apoyo Estudiantil y Gestión PAEDIS  
**Institución:** Duoc UC — Sede Alameda  
**Fecha de Emisión:** 26 de Noviembre de 2026  
**Versión:** 2.0.0-PROD  

---

## 1. Fase Pre-Despliegue (Pre-flight Checklist)

### 1.1 Configuración de Infraestructura y Servidor
- [ ] **Servidor Host:** Servidor Linux (Ubuntu 22.04 LTS / Debian 12 o superior) con mínimo 2 vCPU y 4 GB RAM.
- [ ] **Motor de Contenedores:** Docker Engine v24+ y Docker Compose v2.20+ instalados y con servicio activo.
- [ ] **Firewall de Host (UFW/Iptables):**
  - Puerto 80 (HTTP) abierto hacia Nginx reverse proxy.
  - Puerto 443 (HTTPS) abierto hacia Nginx reverse proxy.
  - Puerto 22 (SSH) restringido a llaves públicas autorizadas.
  - Puertos 5000 (Backend) y 27017 (MongoDB) **CERRADOS** hacia el exterior (visibles solo dentro de la red Docker interna `nexo360-network`).
- [ ] **Certificados TLS/SSL:** Certificados válidos emitidos por Let's Encrypt o CA institucional para los dominios de frontend y backend.

### 1.2 Variables de Entorno y Secretos (.env.production)
- [ ] `NODE_ENV=production` configurado estrictamente.
- [ ] `JWT_SECRET` generado aleatoriamente con alta entropía (`openssl rand -hex 64`), longitud mínima 64 caracteres.
- [ ] `MONGO_INITDB_ROOT_USERNAME` y `MONGO_INITDB_ROOT_PASSWORD` configurados con credenciales robustas.
- [ ] `MONGO_URI` apuntando a la base de datos autenticada (`mongodb://<user>:<pass>@mongodb:27017/nexo360?authSource=admin`).
- [ ] `FRONTEND_URL` y `APP_PUBLIC_URL` apuntando a las URLs públicas canónicas con protocolo HTTPS.
- [ ] `ENABLE_DEMO_ACCOUNTS=false` para entornos de producción real (o `true` exclusivamente durante demostraciones supervisadas).
- [ ] Parámetros de adaptadores institucionales configurados en `backend/.env`:
  - `AZURE_ENTRA_TENANT_ID`, `AZURE_ENTRA_CLIENT_ID`, `AZURE_ENTRA_CLIENT_SECRET`, `AZURE_ENTRA_REDIRECT_URI`.
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.
  - `SICOL_API_URL`, `SICOL_API_KEY` (opcional si se usa catálogo precargado).
  - `LIBCAL_BASE_URL`, `LIBCAL_CLIENT_ID`, `LIBCAL_CLIENT_SECRET` (opcional si opera formativo).

### 1.3 Validación de Código y Pruebas Locales
- [ ] Ejecutar suite completa de backend: `npm test --prefix backend` (142/142 pruebas aprobadas).
- [ ] Ejecutar suite de pruebas de frontend: `node frontend/tests/satSimulatorBidirectionalTest.mjs` (3/3 pruebas aprobadas).
- [ ] Compilar frontend de producción: `npm run build --prefix frontend` (cero advertencias o errores de bundling Vite).
- [ ] Verificar que no existan credenciales en código estático ni historial de git.

---

## 2. Fase de Despliegue (Execution Checklist)

### 2.1 Respaldo Previo (Si existe base de datos previa)
```bash
docker exec -t nexo360-mongodb mongodump --uri="mongodb://root:PASSWORD@localhost:27017/nexo360?authSource=admin" --out=/data/backup_pre_deploy_$(date +%F_%T)
```

### 2.2 Despliegue con Docker Compose
- [ ] Clonar o sincronizar repositorio en directorio seguro: `/opt/nexo360`.
- [ ] Copiar archivo `.env.production` al directorio raíz y directorio `backend/`.
- [ ] Construir y levantar contenedores en segundo plano:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --build
  ```
- [ ] Verificar el estado de los contenedores (`STATUS: Up (healthy)`):
  ```bash
  docker compose -f docker-compose.prod.yml ps
  ```

---

## 3. Fase Post-Despliegue (Post-Deployment Verification)

### 3.1 Verificación de Salud del Sistema (Healthcheck)
- [ ] Endpoint de salud: `curl -I https://api.nexo360.duoc.cl/api/health`
  - Debe responder `HTTP/1.1 200 OK`.
  - El cuerpo debe confirmar `status: "OK"` y `dbConnection: 1`.
- [ ] Prueba de fallo de base de datos: Ante desconexión forzada de MongoDB, el endpoint `/api/health` debe retornar `HTTP/1.1 503 Service Unavailable` (`status: "ERROR"`).

### 3.2 Verificación de Módulos Críticos
- [ ] **Autenticación:**
  - Login con credenciales de Administrador TI (`c.guzman@duocuc.cl`).
  - Login con credenciales de Coordinador PAEDIS (`c.rojas@duocuc.cl`).
  - Verificación de que en producción `POST /api/auth/sso-login` bloquea inicios de sesión directos no autorizados sin credencial OIDC.
- [ ] **Seguridad RBAC:**
  - Estudiante no puede acceder a `/api/admin/metrics`, `/api/admin/students` ni `/api/admin/courses/seed` (debe recibir `403 Forbidden`).
  - Administrador TI no puede visualizar expedientes clínicos confidenciales de PAEDIS (debe recibir `403 Forbidden`).
- [ ] **Sistema de Alerta Temprana (SAT):**
  - Simulación de corte semanal en una asignatura: verificar que la petición sea no destructiva y que el valor de asistencia real del estudiante en `UserProfile` no se altere.
  - Verificación de inserción de escenario volátil en `AttendanceSimulation`.
- [ ] **Catálogo Duoc UC:**
  - Carga de carreras vinculadas a las 9 escuelas oficiales y 20 sedes de Duoc UC a nivel nacional.
  - Verificación del selector dependiente Región → Comuna en el formulario de sedes.
- [ ] **Accesibilidad (WCAG 2.2):**
  - Navegación completa con teclado (Tab, Shift+Tab, Enter, Space, Escape).
  - Lector de pantalla anunciando cambios de página y modales vía `LiveAnnouncer`.
  - Soporte de reducción de movimiento (`prefers-reduced-motion`).

---

## 4. Procedimiento de Reversión (Rollback Plan)

En caso de detectarse anomalías críticas o fallos de servicio no recuperables en los primeros 30 minutos tras el despliegue:

1. **Detener contenedores de la versión actual:**
   ```bash
   docker compose -f docker-compose.prod.yml down
   ```
2. **Restaurar respaldo de MongoDB previo al despliegue:**
   ```bash
   docker exec -i nexo360-mongodb mongorestore --uri="mongodb://root:PASSWORD@localhost:27017/nexo360?authSource=admin" --drop /data/backup_pre_deploy_<TIMESTAMP>/nexo360
   ```
3. **Revertir código a la versión estable anterior:**
   ```bash
   git checkout <TAG_VERSION_ANTERIOR>
   docker compose -f docker-compose.prod.yml up -d --build
   ```
4. **Verificar recuperación del servicio:**
   ```bash
   curl -s https://api.nexo360.duoc.cl/api/health | jq .
   ```
5. **Notificar al equipo de operaciones y registrar incidente en bitácora.**
