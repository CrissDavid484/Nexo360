# Imagen ligera y segura basada en Alpine Linux
FROM node:20-alpine

# Directorio de trabajo de la aplicación
WORKDIR /app

# Evitar descarga innecesaria de Chromium pesado durante el build en contenedor
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_SKIP_DOWNLOAD=true

# Copiar manifiestos de dependencias primero para aprovechar caché de capas de Docker
COPY package*.json ./

# Instalar dependencias de producción de forma limpia
RUN npm install --omit=dev && npm cache clean --force

# Copiar código fuente del backend y asignar permisos al usuario sin privilegios (node)
COPY --chown=node:node . .

# Seguridad: Ejecutar el contenedor con usuario no-root
USER node

# Exponer puerto de la API
EXPOSE 5000

# Verificación de salud nativa del contenedor (usando IPv4 127.0.0.1 para Alpine BusyBox)
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

# Comando de inicio
CMD ["node", "server.js"]

