# Guía de Despliegue de Nexo360 en VPS Linux Gratuito
### Duoc UC - Sede Alameda • Plataforma Accesible (WCAG 2.2 AA/AAA)

Esta guía documenta el procedimiento paso a paso para desplegar la versión de producción de **Nexo360** en servidores virtuales privados (VPS) con recursos ajustados, tales como:
- **Oracle Cloud Always Free:** Instancias Ampere ARM (hasta 4 OCPU y 24 GB RAM) o AMD (1 GB RAM).
- **Google Cloud Platform:** Instancias `e2-micro` (2 vCPU compartidas, 1 GB RAM).
- **AWS Free Tier:** Instancias `t2.micro` / `t3.micro` (1 GB RAM).
- **Cualquier VPS estándar** con Ubuntu 22.04 / 24.04 LTS o Debian 12.

---

## 1. Configuración de Memoria Swap (Obligatorio en VPS de 1 GB de RAM)

En servidores con 1 GB de memoria RAM (como Google Cloud `e2-micro` o AWS `t2.micro`), la compilación de Vite puede consumir más memoria de la disponible y disparar el *OOM Killer*. Crear un archivo de intercambio (swap) de 2 GB garantiza estabilidad total:

```bash
# Verificar si ya existe swap
sudo swapon --show

# Si no hay swap, crear un archivo de 2 GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Hacer el swap permanente tras reinicios
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Ajustar swappiness a un valor equilibrado para servidores (10)
sudo sysctl vm.swappiness=10
echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf
```

---

## 2. Instalación de Docker y Docker Compose

Instala Docker Engine y el plugin Docker Compose oficial con el script automatizado:

```bash
# Descargar e instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Agregar tu usuario al grupo docker (para no usar sudo en cada comando)
sudo usermod -aG docker $USER

# Aplicar los cambios de grupo a la sesión actual
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

---

## 3. Clonar el Repositorio y Configurar Variables de Entorno

```bash
# Clonar el proyecto en tu directorio home
git clone https://github.com/CrissDavid484/Nexo360.git
cd Nexo360

# Crear el archivo .env a partir de la plantilla de producción
cp .env.prod.example .env

# Generar una clave JWT secreta segura
openssl rand -base64 32
```

Edita el archivo `.env` con `nano .env` y ajusta:
```ini
APP_PORT=80
JWT_SECRET=pega_aqui_la_clave_generada_con_openssl
FRONTEND_URL=http://TU_IP_PUBLICA_O_DOMINIO
APP_PUBLIC_URL=http://TU_IP_PUBLICA_O_DOMINIO
```

> **Nota:** Si tienes un nombre de dominio asignado al VPS (por ejemplo `nexo360.tudominio.cl`), colócalo en `FRONTEND_URL` y `APP_PUBLIC_URL` con `http://` o `https://` según corresponda.

---

## 4. Construcción y Puesta en Marcha en Producción

Ejecuta Docker Compose usando el archivo de orquestación de producción:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### ¿Qué hace este comando?
1. **Compila el frontend con Node 20 y Vite en multi-stage build**, empaquetándolo en un contenedor ultra-ligero de **Nginx Alpine** que sirve los archivos estáticos con compresión `gzip` y enruta `/api/` al backend.
2. **Inicia el backend** con Node 22 Alpine, usuario no-root y validación nativa de salud (`HEALTHCHECK`).
3. **Inicia MongoDB 7** con límite de caché WiredTiger a 256 MB (`--wiredTigerCacheSizeGB 0.25`), asegurando que no consuma memoria excesiva.
4. **Aisla MongoDB y el Backend**: Ni Mongo ni el puerto 5000 se exponen al exterior; todo el tráfico de la plataforma entra únicamente a través del puerto 80 de Nginx.

---

## 5. Verificación de Funcionamiento

Verifica que los tres servicios estén activos y en estado `healthy`:

```bash
docker compose -f docker-compose.prod.yml ps
```

Deberías ver una salida similar a:
```
NAME               IMAGE                     COMMAND                  SERVICE    STATUS
nexo360-mongodb    mongo:7                   "mongod --wiredTiger…"   mongodb    Up (healthy)
nexo360-backend    nexo360-backend           "node server.js"         backend    Up (healthy)
nexo360-frontend   nexo360-frontend          "nginx -g 'daemon of…"   frontend   Up (healthy)
```

Prueba la respuesta del endpoint de salud del sistema:

```bash
curl http://localhost/api/health
```

Respuesta esperada:
```json
{
  "status": "OK",
  "service": "Nexo360 Backend API • Duoc UC - Sede Alameda (Plataforma Oficial)",
  "campus": "Duoc UC - Sede Alameda",
  "database": {
    "engine": "MongoDB",
    "status": "connected"
  },
  "accessibilityStandard": "WCAG 2.2 AA / AAA",
  "timestamp": "2026-11-19T..."
}
```

¡Listo! Ya puedes abrir `http://TU_IP_PUBLICA/` en tu navegador web.

---

## 6. Configuración de SSL / HTTPS (Opcional Recomendado)

Para habilitar candado verde (HTTPS) de forma gratuita:

### Opción A: Cloudflare (La más fácil y rápida)
1. Apunta tu dominio a la IP pública del VPS mediante un registro DNS tipo `A`.
2. Activa el proxy de Cloudflare (nube naranja).
3. En la pestaña **SSL/TLS** de Cloudflare, selecciona el modo **Flexible** (o **Full** con certificado Origin).

### Opción B: Caddy como Proxy Reverso con SSL Automático
Si prefieres que el propio VPS gestione certificados Let's Encrypt automáticamente:
1. En `.env`, cambia `APP_PORT=8080`.
2. Reinicia los contenedores: `docker compose -f docker-compose.prod.yml up -d`.
3. Instala Caddy: `sudo apt install -y caddy`.
4. Edita `/etc/caddy/Caddyfile`:
   ```caddyfile
   nexo360.tudominio.cl {
       reverse_proxy 127.0.0.1:8080
   }
   ```
5. Recarga Caddy: `sudo systemctl reload caddy`.

---

## 7. Comandos de Operación y Mantenimiento

```bash
# Ver logs en tiempo real de todos los servicios
docker compose -f docker-compose.prod.yml logs -f

# Ver logs solo del backend
docker compose -f docker-compose.prod.yml logs -f backend

# Detener los contenedores sin borrar los datos
docker compose -f docker-compose.prod.yml stop

# Reiniciar los contenedores
docker compose -f docker-compose.prod.yml restart

# Actualizar a la última versión del repositorio
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build
```
