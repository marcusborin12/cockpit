#!/bin/bash

# Configurações
NAMESPACE="default"
CONFIGMAP_NAME="cockpit-config"
IMAGE_NAME="cockpit-awx"
IMAGE_TAG="latest"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Extraindo configurações do ConfigMap...${NC}"

# Função para verificar se o comando foi executado com sucesso
check_command() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ Erro: $1${NC}"
        exit 1
    fi
}

# Verificar se o ConfigMap existe
kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE > /dev/null 2>&1
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ ConfigMap '$CONFIGMAP_NAME' não encontrado no namespace '$NAMESPACE'${NC}"
    echo -e "${YELLOW}💡 Execute primeiro: kubectl apply -f k8s-configmap.yaml${NC}"
    exit 1
fi

# Extrair variáveis do ConfigMap
echo -e "${YELLOW}📄 Obtendo configurações do ConfigMap '$CONFIGMAP_NAME'...${NC}"

VITE_AWX_API=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_AWX_API}')
VITE_CACHE_DASHBOARD_STATS_TTL=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_DASHBOARD_STATS_TTL}')
VITE_CACHE_MONTHLY_DATA_TTL=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_MONTHLY_DATA_TTL}')
VITE_CACHE_RECENT_EXECUTIONS_TTL=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_RECENT_EXECUTIONS_TTL}')
VITE_CACHE_VERSION=$(kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_VERSION}')

# Verificar se as variáveis foram extraídas
if [ -z "$VITE_AWX_API" ]; then
    echo -e "${RED}❌ Erro: VITE_AWX_API não encontrado no ConfigMap${NC}"
    exit 1
fi

# Mostrar configurações que serão usadas
echo -e "${GREEN}📋 Configurações extraídas:${NC}"
echo -e "  ${BLUE}VITE_AWX_API:${NC} $VITE_AWX_API"
echo -e "  ${BLUE}VITE_CACHE_DASHBOARD_STATS_TTL:${NC} $VITE_CACHE_DASHBOARD_STATS_TTL"
echo -e "  ${BLUE}VITE_CACHE_MONTHLY_DATA_TTL:${NC} $VITE_CACHE_MONTHLY_DATA_TTL"
echo -e "  ${BLUE}VITE_CACHE_RECENT_EXECUTIONS_TTL:${NC} $VITE_CACHE_RECENT_EXECUTIONS_TTL"
echo -e "  ${BLUE}VITE_CACHE_VERSION:${NC} $VITE_CACHE_VERSION"

# Build da imagem Docker com as configurações do ConfigMap
echo -e "${YELLOW}🐳 Construindo imagem Docker '$IMAGE_NAME:$IMAGE_TAG'...${NC}"

docker build \
  --build-arg VITE_AWX_API="$VITE_AWX_API" \
  --build-arg VITE_CACHE_DASHBOARD_STATS_TTL="$VITE_CACHE_DASHBOARD_STATS_TTL" \
  --build-arg VITE_CACHE_MONTHLY_DATA_TTL="$VITE_CACHE_MONTHLY_DATA_TTL" \
  --build-arg VITE_CACHE_RECENT_EXECUTIONS_TTL="$VITE_CACHE_RECENT_EXECUTIONS_TTL" \
  --build-arg VITE_CACHE_VERSION="$VITE_CACHE_VERSION" \
  -t $IMAGE_NAME:$IMAGE_TAG .

check_command "Imagem Docker construída com sucesso"

# Mostrar informações da imagem
echo -e "${GREEN}📦 Imagem criada:${NC}"
docker images | grep $IMAGE_NAME | head -1

echo -e "${GREEN}✅ Build concluído! Próximos passos:${NC}"
echo -e "${BLUE}1.${NC} Importar no K3s: ${YELLOW}docker save $IMAGE_NAME:$IMAGE_TAG | sudo k3s ctr images import -${NC}"
echo -e "${BLUE}2.${NC} Deploy: ${YELLOW}kubectl apply -f k8s-deployment.yaml${NC}"
echo -e "${BLUE}3.${NC} Port-forward: ${YELLOW}kubectl port-forward service/cockpit-awx-service 8080:80${NC}"