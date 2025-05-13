FROM node:20-alpine
WORKDIR /usr/src/app

# Copia package*.json y lock
COPY package*.json ./

# Instala dependencias (incluyendo dev)
RUN npm install

# Copia todo el código fuente (incluyendo tu main.ts modificado)
COPY . .

# Compila el código TS a JS en la carpeta /dist
RUN npm run build

# (Opcional prune)

# Expone puerto
EXPOSE 3000

# Ejecuta la aplicación compilada desde /dist
CMD [ "node", "dist/main.js" ]