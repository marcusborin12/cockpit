# Multi-stage build para otimizar o tamanho da imagem
FROM node:18-alpine AS builder

# Define diretório de trabalho
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./
COPY bun.lockb ./

# Instala dependências
RUN npm ci --silent --only=production

# Copia código fonte
COPY . .

# Build da aplicação para produção
RUN npm run build

# Etapa de produção com Nginx
FROM nginx:1.25-alpine

# Remove configuração padrão do nginx
RUN rm /etc/nginx/conf.d/default.conf

# Copia configuração personalizada do nginx
COPY nginx.conf /etc/nginx/conf.d/

# Copia build da aplicação React
COPY --from=builder /app/dist /usr/share/nginx/html

# Cria usuário não-root para segurança
RUN addgroup -g 1001 -S nginx && \
    adduser -S -D -H -u 1001 -h /var/cache/nginx -s /sbin/nologin -G nginx -g nginx nginx

# Define permissões
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Muda para usuário não-root
USER nginx

# Expõe porta 8080 (não privilegiada)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/ || exit 1

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]