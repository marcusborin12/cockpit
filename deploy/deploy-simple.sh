#!/bin/bash
#
# Deploy simplificado do Cockpit sem ConfigMap
# Uso: ./deploy-simple.sh [IMAGE_TAG] [AWX_API_URL] [REPLICAS]
#

set -e

# Configurações padrão
IMAGE_TAG="${1:-1.0.2}"
AWX_API="${2:-http://192.168.15.52:8080}"
REPLICAS="${3:-2}"

echo "🚀 Cockpit Deploy Simplificado (Sem ConfigMap)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

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
echo "🏗️ Configuração do deploy:"
echo "   📦 Imagem: cockpit-app:$IMAGE_TAG"
echo "   🔗 AWX API: $AWX_API"
echo "   📊 Réplicas: $REPLICAS"

echo ""
echo "🚀 Aplicando manifests..."

# Aplicar com substituições
sed -e "s|image: cockpit-app:1.0.2|image: cockpit-app:$IMAGE_TAG|g" \
    -e "s|value: \"http://192.168.15.52:8080\"|value: \"$AWX_API\"|g" \
    -e "s|replicas: 2|replicas: $REPLICAS|g" \
    deploy/cockpit-simple.yaml | kubectl apply -f -

# Aguardar deployment ficar pronto
echo ""
echo "⏳ Aguardando deployment ficar pronto..."
kubectl rollout status deployment/cockpit-automacao -n cockpit --timeout=300s

# Verificar status
echo ""
echo "📊 Status do deployment:"
kubectl get pods -n cockpit -l app=cockpit-automacao
kubectl get svc -n cockpit
kubectl get ingress -n cockpit

echo ""
echo "✅ Deploy concluído com sucesso!"
echo "🌐 Acesso via:"
echo "   - http://cockpit.local"
echo "   - http://cluster-ip/cockpit"
echo "   - kubectl port-forward -n cockpit svc/cockpit-service 8080:80"
echo ""
echo "📋 Para acompanhar logs:"
echo "   kubectl logs -n cockpit -l app=cockpit-automacao -f"