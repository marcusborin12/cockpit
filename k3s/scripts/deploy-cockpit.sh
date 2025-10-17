#!/bin/bash
#
# Deploy do Cockpit Automação no K3s - Estrutura Sanitizada
# Uso: ./deploy-cockpit.sh [IMAGE_TAG] [AWX_API_URL]
#

set -e

# Configurações padrão
IMAGE_TAG="${1:-1.0.2}"
AWX_API="${2:-http://192.168.15.52:8080}"
MANIFESTS_PATH="manifests"

echo "🚀 Cockpit K3s Deploy - Estrutura Sanitizada"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Verificar se kubectl está disponível
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl não encontrado. Instale o kubectl primeiro."
    exit 1
fi

# Verificar conexão com K3s
if ! kubectl cluster-info --request-timeout=5s &> /dev/null; then
    echo "❌ Não foi possível conectar ao cluster K3s"
    exit 1
fi
echo "✅ Conectado ao cluster K3s"

echo ""
echo "🏗️ Iniciando deploy completo..."
echo "   📦 Imagem: cockpit-app:$IMAGE_TAG"
echo "   🔗 AWX API: $AWX_API"

# 1. Aplicar Namespace
echo ""
echo "📁 Aplicando namespace..."
kubectl apply -f "$MANIFESTS_PATH/01-namespace.yaml"

# 2. Atualizar e aplicar ConfigMap
echo "📝 Aplicando ConfigMap..."
sed "s|VITE_AWX_API: \"http://awx-service.awx.svc.cluster.local:8080\"|VITE_AWX_API: \"$AWX_API\"|g" \
    "$MANIFESTS_PATH/02-configmap.yaml" | kubectl apply -f -

# 3. Atualizar e aplicar Deployment
echo "🚀 Aplicando Deployment..."
sed "s|image: cockpit-app:1.0.2|image: cockpit-app:$IMAGE_TAG|g" \
    "$MANIFESTS_PATH/03-deployment.yaml" | kubectl apply -f -

# 4. Aplicar Service
echo "🔗 Aplicando Service..."
kubectl apply -f "$MANIFESTS_PATH/04-service.yaml"

# 5. Aplicar Ingress
echo "🌐 Aplicando Ingress..."
kubectl apply -f "$MANIFESTS_PATH/05-ingress.yaml"

# 6. Aguardar deployment ficar pronto
echo ""
echo "⏳ Aguardando deployment ficar pronto..."
kubectl rollout status deployment/cockpit-automacao -n cockpit --timeout=300s

# 7. Verificar status
echo ""
echo "📊 Status do deployment:"
kubectl get pods -n cockpit -l app=cockpit-automacao
kubectl get svc -n cockpit
kubectl get ingress -n cockpit

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesso via: http://localhost/cockpit ou http://cockpit.local"
echo "📋 Para acompanhar logs: kubectl logs -n cockpit -l app=cockpit-automacao -f"