#!/bin/bash

# Script completo de deploy do Cockpit AWX no K3s
# Este script faz todo o processo: ConfigMap → Build → Deploy

# Configurações
NAMESPACE="default"
CONFIGMAP_NAME="cockpit-config"
APP_NAME="cockpit-awx"
IMAGE_TAG="latest"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Iniciando deploy completo do Cockpit AWX no K3s...${NC}"

# Função para verificar se o comando foi executado com sucesso
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ Erro: $1${NC}"
        exit 1
    fi
}

# 1. Aplicar ConfigMap
echo -e "${YELLOW}📄 Aplicando ConfigMap...${NC}"
kubectl apply -f k8s-configmap.yaml
check_command "ConfigMap aplicado"

# 2. Aguardar um momento para o ConfigMap ser criado
sleep 2

# 3. Obter configurações do ConfigMap
echo -e "${YELLOW}🔧 Obtendo configurações do ConfigMap...${NC}"
VITE_AWX_API=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_AWX_API}')
VITE_CACHE_DASHBOARD_STATS_TTL=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_DASHBOARD_STATS_TTL}')
VITE_CACHE_MONTHLY_DATA_TTL=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_MONTHLY_DATA_TTL}')
VITE_CACHE_RECENT_EXECUTIONS_TTL=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_RECENT_EXECUTIONS_TTL}')
VITE_CACHE_VERSION=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_VERSION}')

echo -e "${GREEN}🔗 Configurações extraídas:${NC}"
echo -e "  VITE_AWX_API: $VITE_AWX_API"
echo -e "  VITE_CACHE_VERSION: $VITE_CACHE_VERSION"

# 4. Build da imagem Docker com as configurações do ConfigMap
echo -e "${YELLOW}🐳 Construindo imagem Docker...${NC}"
docker build \
  --build-arg VITE_AWX_API="$VITE_AWX_API" \
  --build-arg VITE_CACHE_DASHBOARD_STATS_TTL="$VITE_CACHE_DASHBOARD_STATS_TTL" \
  --build-arg VITE_CACHE_MONTHLY_DATA_TTL="$VITE_CACHE_MONTHLY_DATA_TTL" \
  --build-arg VITE_CACHE_RECENT_EXECUTIONS_TTL="$VITE_CACHE_RECENT_EXECUTIONS_TTL" \
  --build-arg VITE_CACHE_VERSION="$VITE_CACHE_VERSION" \
  -t $APP_NAME:$IMAGE_TAG .
check_command "Imagem Docker construída"

# 5. Importar imagem no K3s
echo -e "${YELLOW}📦 Importando imagem no K3s...${NC}"
docker save $APP_NAME:$IMAGE_TAG | sudo k3s ctr images import -
check_command "Imagem importada no K3s"

# 6. Aplicar deployment
echo -e "${YELLOW}🚢 Aplicando deployment...${NC}"
kubectl apply -f k8s-deployment.yaml
check_command "Deployment aplicado"

# 7. Aguardar pods ficarem prontos
echo -e "${YELLOW}⏳ Aguardando pods ficarem prontos...${NC}"
kubectl wait --for=condition=ready pod -l app=$APP_NAME --timeout=300s
check_command "Pods prontos"

# 8. Mostrar status
echo -e "${YELLOW}📊 Status do deployment:${NC}"
kubectl get pods -l app=$APP_NAME -o wide
echo ""
kubectl get services cockpit-awx-service

# 9. Mostrar como acessar
echo -e "${GREEN}🌐 Para acessar a aplicação:${NC}"
echo -e "${BLUE}kubectl port-forward service/cockpit-awx-service 8080:80${NC}"
echo -e "Em seguida acesse: ${YELLOW}http://localhost:8080${NC}"

echo -e "${GREEN}✅ Deploy concluído com sucesso!${NC}"

# 10. Opcional: Fazer port-forward automaticamente
read -p "Deseja fazer port-forward automaticamente? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}🔗 Iniciando port-forward...${NC}"
    echo -e "${YELLOW}Acesse: http://localhost:8080${NC}"
    echo -e "${YELLOW}Pressione Ctrl+C para parar${NC}"
    kubectl port-forward service/cockpit-awx-service 8080:80
fi