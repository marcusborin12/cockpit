#!/bin/bash

echo "🔍 Testando conectividade com AWX..."

# Testa a conectividade básica
echo "📡 Testando conectividade HTTP para AWX..."
curl -I http://192.168.15.52:8080/api/v2/ 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Conectividade básica OK"
else
    echo "❌ Problema de conectividade básica"
fi

# Testa o endpoint de me
echo "🔐 Testando endpoint /me com credenciais básicas..."
curl -I -u "test:test" http://192.168.15.52:8080/api/v2/me/ 2>/dev/null

echo "🏁 Teste concluído"