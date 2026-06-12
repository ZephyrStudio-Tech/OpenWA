# Usamos Node 20 completo (sin -alpine) para evitar errores con Vite
FROM node:20 AS builder

WORKDIR /app

# Copiamos los archivos de dependencias
COPY package*.json ./

# ¡LA MAGIA ESTÁ AQUÍ! Instalamos ignorando conflictos de versiones
RUN npm install --legacy-peer-deps

# Copiamos el resto del código
COPY . .

# Compilamos la aplicación
RUN npm run build

# Etapa de producción con Nginx
FROM nginx:alpine

# Copiamos la web ya construida al servidor Nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiamos la configuración de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
