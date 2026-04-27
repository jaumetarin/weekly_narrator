# Imagen base
FROM node:20-alpine

# Directorio de trabajo
WORKDIR /app

# Instalar dependencias primero
COPY package*.json ./
RUN npm install

# Copiar código fuente
COPY . .

# Arrancar en modo desarrollo
CMD ["npm", "run", "start:dev"]