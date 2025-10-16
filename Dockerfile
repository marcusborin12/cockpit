# Build stage
FROM node:20-alpine AS build

RUN apk add --no-cache bash git

WORKDIR /app

# Copia arquivos de dependência
COPY package.json package-lock.json ./
RUN npm ci

# Copia código fonte
COPY . .

# Build usando apenas variáveis padrão do .env
RUN npm run build

# Production stage
FROM nginx:1.27-alpine

# Instalar gettext para substituição de variáveis
RUN apk add --no-cache gettext

# Copia build do Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuração do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Cria diretório para scripts de inicialização
RUN mkdir -p /docker-entrypoint.d

# Copiar script de injeção de runtime config
COPY inject-runtime-config.sh /docker-entrypoint.d/20-inject-runtime-config.sh

# Tornar o script executável
RUN chmod +x /docker-entrypoint.d/20-inject-runtime-config.sh

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
