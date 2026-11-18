# Imagen ligera y segura basada en Alpine Linux
FROM node:20-alpine

# Directorio de trabajo de la aplicación
WORKDIR /app

# Copiar manifiestos de dependencias primero para aprovechar caché de capas de Docker
COPY package*.json ./

# Instalar dependencias de producción bloqueando versiones y previniendo ejecución de scripts
RUN npm ci --ignore-scripts --omit=dev && npm cache clean --force

# Copiar de forma explícita los directorios y archivos necesarios para evitar filtrado de archivos sensibles
COPY --chown=node:node server.js ./
COPY --chown=node:node config ./config
COPY --chown=node:node controllers ./controllers
COPY --chown=node:node data ./data
COPY --chown=node:node middleware ./middleware
COPY --chown=node:node models ./models
COPY --chown=node:node routes ./routes
COPY --chown=node:node scripts ./scripts
COPY --chown=node:node services ./services
COPY --chown=node:node utils ./utils

# Seguridad: Ejecutar el contenedor con usuario no-root
USER node

# Exponer puerto de la API
EXPOSE 5000

# Verificación de salud nativa del contenedor (usando IPv4 127.0.0.1 para Alpine BusyBox)
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/api/health || exit 1

# Comando de inicio
CMD ["node", "server.js"]

