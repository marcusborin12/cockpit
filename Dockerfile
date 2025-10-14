# Etapa 1: build
FROM node:20-alpine AS build

# Instala dependências básicas do Node e do Vite
RUN apk add --no-cache bash git

WORKDIR /app

# Copia apenas os arquivos de dependência para cache do npm
COPY package.json package-lock.json ./

# Instala dependências
RUN npm ci

# Copia todo o código fonte para o container
COPY . .

# Garante que o Vite use o diretório correto para alias
ENV NODE_PATH=/app/src

# Build do projeto
RUN npm run build

# Etapa 2: nginx
FROM nginx:1.27-alpine

# Limpa diretório padrão
RUN rm -rf /usr/share/nginx/html/*

# Copia build do Vite
COPY --from=build /app/dist /usr/share/nginx/html

# Copia configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
