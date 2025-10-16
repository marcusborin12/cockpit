#!/bin/sh

# Script para injetar variáveis de ambiente no runtime
# Este script é executado pelo nginx antes de servir a aplicação

set -e

echo "🔧 Iniciando injeção de configuração runtime..."

# Arquivo onde as variáveis serão injetadas
CONFIG_FILE="/usr/share/nginx/html/runtime-config.js"

# Criando arquivo de configuração runtime
cat > "$CONFIG_FILE" << EOF
// Configuração injetada no runtime
window.__RUNTIME_CONFIG__ = {
  VITE_AWX_API: "${VITE_AWX_API:-}",
  VITE_CACHE_TTL: "${VITE_CACHE_TTL:-300000}",
  VITE_CACHE_MAX_SIZE: "${VITE_CACHE_MAX_SIZE:-100}",
  VITE_ENABLE_TEST_CREDENTIALS: "${VITE_ENABLE_TEST_CREDENTIALS:-false}",
  VITE_LOG_LEVEL: "${VITE_LOG_LEVEL:-info}"
};

console.log('🔧 Runtime Config carregado:', window.__RUNTIME_CONFIG__);
EOF

echo "✅ Configuração runtime criada em: $CONFIG_FILE"

# Verificar se o arquivo foi criado corretamente
if [ -f "$CONFIG_FILE" ]; then
    echo "📋 Conteúdo do arquivo de configuração:"
    cat "$CONFIG_FILE"
else
    echo "❌ Erro: Arquivo de configuração não foi criado!"
    exit 1
fi

echo "✅ Injeção de configuração runtime concluída!"