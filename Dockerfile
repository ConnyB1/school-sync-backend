# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copia los archivos package.json y package-lock.json para instalar dependencias primero
COPY package*.json ./
# Instala todas las dependencias, incluyendo las de desarrollo
RUN npm install --legacy-peer-deps

# Copia todo el código fuente al contenedor
COPY . .

# *** INICIO DE LA SECCIÓN DE DEPURACIÓN EN BUILDER STAGE ***
# Agrega los siguientes comandos para depuración:
RUN echo "DEBUG: Contenido de /app/src antes de tsc:" && ls -la /app/src
RUN echo "DEBUG: Ejecutando tsc --noEmit para verificar errores..." && npx tsc --noEmit --project tsconfig.build.json || (echo "ERROR: tsc --noEmit encontró errores!" && exit 1)

# Compila usando el build de NestJS
RUN echo "DEBUG: Ejecutando compilación principal (npm run build)..." && npm run build

# Muestra el contenido de /app/D después de la compilación
RUN echo "DEBUG: Contenido de /app/dist después de build:" && ls -la /app/dist
# Ahora verifica si main.js existe
RUN test -f /app/dist/main.js || (echo "Error: main.js not found in dist directory after compilation!" && exit 1)


# Stage 2: Production (la etapa final de tu aplicación)
FROM node:20-alpine
WORKDIR /app

# Copia solo los archivos necesarios de la etapa builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist/migrations ./dist/migrations
COPY --from=builder /app/tsconfig.json ./

# Instala solo las dependencias de producción (esto es correcto para la etapa final)
# AÑADE --legacy-peer-deps AQUÍ TAMBIÉN
RUN npm install --omit=dev --legacy-peer-deps

# *** INICIO DE LA SECCIÓN DE DEPURACIÓN EN PRODUCTION STAGE (para verificar la causa del error) ***
RUN echo "DEBUG: Contenido de /app en la etapa final:" && ls -la /app/
RUN echo "DEBUG: Contenido de /app/dist en la etapa final:" && ls -la /app/dist/
RUN echo "DEBUG: Contenido de package.json en la etapa final:" && cat /app/package.json
# *** FIN DE LA SECCIÓN DE DEPURACIÓN EN PRODUCTION STAGE ***

# Expone el puerto (ajusta si es diferente)
EXPOSE 3000

# Comando para iniciar la aplicación (debe apuntar a dist/main.js)
CMD ["npm", "run", "start:migrate"]