# Esta es una imagen de node.js
FROM node:24.21.0-trixie-slim

# Establece el directorio de trabajo
WORKDIR /usr/app

# Copia package.json y package-lock.json al directorio de trabajo
COPY package*.json .

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación al directorio de trabajo
COPY . .

# Establece la variable de entorno NODE_ENV a development
ENV NODE_ENV=development

# Expone el puerto de la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
# CMD ["npm", "run", "start:dev"]