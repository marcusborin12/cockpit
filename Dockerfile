# Build stage
FROM node:20-alpine AS build
ENV NODE_OPTIONS="--no-node-snapshot"

WORKDIR /app

# Copia arquivos de dependência
COPY package.json package-lock.json ./

# Limpa cache npm e instala dependências
RUN npm cache clean --force && \
    npm install && \
    npm ls vite

# Copia código fonte
COPY . .

# Debug: verificar se vite existe e fazer build
RUN ls -la node_modules/.bin/ | grep vite || echo "Vite not found in .bin" && \
    npx vite build

# Production stage - imagem final menor
FROM nginx:1.25-alpine

# Copia apenas o build (não o node_modules)
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copia e torna executável o script de runtime config
COPY inject-runtime-config.sh /docker-entrypoint.d/20-inject-runtime-config.sh
RUN chmod +x /docker-entrypoint.d/20-inject-runtime-config.sh

USER node

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
