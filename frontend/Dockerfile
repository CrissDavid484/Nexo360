# Imagen ligera y segura basada en Alpine Linux
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Copiar manifiestos de dependencias para caché de capas de Docker
COPY package*.json ./

# Instalar dependencias con versiones bloqueadas y sin scripts arbitrarios
RUN npm ci --ignore-scripts && npm cache clean --force

# Copiar de forma explícita los archivos y directorios fuente requeridos
COPY --chown=node:node index.html vite.config.js ./
COPY --chown=node:node public ./public
COPY --chown=node:node src ./src

# Asegurar permisos sobre el directorio de caché de Vite para el usuario no-root
RUN mkdir -p /app/node_modules/.vite && chown -R node:node /app/node_modules

# Seguridad: Ejecutar con usuario no-root
USER node

# Exponer puerto de Vite
EXPOSE 5173

# Verificación de salud del servidor Frontend (usando IPv4 127.0.0.1 para Alpine BusyBox)
HEALTHCHECK --interval=10s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5173/ || exit 1

# Iniciar servidor Vite escuchando en 0.0.0.0:5173
CMD ["npm", "run", "dev"]

