#!/bin/bash

# Script para build e deploy do Cockpit de Automação no Kubernetes
# Compatível com minikube, k3s e outros clusters Kubernetes

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
IMAGE_NAME="cockpit-automacao"
VERSION="1.0.2"
NAMESPACE="default"
INGRESS_HOST="cockpit.local"

# Funções utilitárias
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Detecta o tipo de cluster Kubernetes
detect_k8s_type() {
    if command -v minikube >/dev/null 2>&1 && minikube status >/dev/null 2>&1; then
        echo "minikube"
    elif command -v k3s >/dev/null 2>&1; then
        echo "k3s"
    elif kubectl cluster-info | grep -q "master"; then
        echo "generic"
    else
        echo "unknown"
    fi
}

# Build da imagem Docker
build_image() {
    log_info "Construindo imagem Docker: ${IMAGE_NAME}:${VERSION}"
    
    if ! docker build -t ${IMAGE_NAME}:${VERSION} .; then
        log_error "Falha no build da imagem Docker"
        exit 1
    fi
    
    # Tag latest
    docker tag ${IMAGE_NAME}:${VERSION} ${IMAGE_NAME}:latest
    
    log_success "Imagem construída com sucesso"
}

# Carrega imagem no cluster
load_image_to_cluster() {
    local k8s_type=$(detect_k8s_type)
    
    log_info "Detectado cluster: ${k8s_type}"
    log_info "Carregando imagem no cluster..."
    
    case $k8s_type in
        "minikube")
            # Para minikube, usa o daemon Docker interno
            eval $(minikube docker-env)
            docker build -t ${IMAGE_NAME}:${VERSION} .
            log_success "Imagem carregada no minikube"
            ;;
        "k3s")
            # Para k3s, importa a imagem
            docker save ${IMAGE_NAME}:${VERSION} | k3s ctr images import -
            log_success "Imagem carregada no k3s"
            ;;
        "generic"|"unknown")
            log_warning "Cluster genérico detectado. Certifique-se de que a imagem está disponível no registry do cluster"
            log_info "Para clusters remotos, considere fazer push para um registry:"
            log_info "docker tag ${IMAGE_NAME}:${VERSION} your-registry/${IMAGE_NAME}:${VERSION}"
            log_info "docker push your-registry/${IMAGE_NAME}:${VERSION}"
            ;;
    esac
}

# Deploy no Kubernetes
deploy_to_k8s() {
    log_info "Aplicando manifesto no Kubernetes..."
    
    # Aplica o manifesto
    if ! kubectl apply -f k8s-manifests.yaml -n ${NAMESPACE}; then
        log_error "Falha ao aplicar manifesto"
        exit 1
    fi
    
    log_success "Manifesto aplicado"
    
    # Aguarda deployment ficar pronto
    log_info "Aguardando deployment ficar pronto..."
    if ! kubectl rollout status deployment/cockpit-automacao -n ${NAMESPACE} --timeout=300s; then
        log_error "Timeout aguardando deployment"
        show_debug_info
        exit 1
    fi
    
    log_success "Deployment concluído"
}

# Mostra informações de debug
show_debug_info() {
    log_info "Informações de debug:"
    echo
    echo "=== PODS ==="
    kubectl get pods -l app=cockpit-automacao -n ${NAMESPACE} -o wide
    echo
    echo "=== SERVICES ==="
    kubectl get services -l app=cockpit-automacao -n ${NAMESPACE}
    echo
    echo "=== INGRESS ==="
    kubectl get ingress cockpit-automacao-ingress -n ${NAMESPACE} 2>/dev/null || log_warning "Ingress não encontrado"
    echo
    echo "=== DEPLOYMENT DESCRIBE ==="
    kubectl describe deployment cockpit-automacao -n ${NAMESPACE}
    echo
    echo "=== POD LOGS (últimas 50 linhas) ==="
    kubectl logs -l app=cockpit-automacao -n ${NAMESPACE} --tail=50 || log_warning "Não foi possível obter logs"
}

# Mostra status final
show_status() {
    log_success "Deploy concluído com sucesso!"
    echo
    log_info "Status do deployment:"
    kubectl get pods -l app=cockpit-automacao -n ${NAMESPACE}
    kubectl get services -l app=cockpit-automacao -n ${NAMESPACE}
    
    # Verifica se ingress existe
    if kubectl get ingress cockpit-automacao-ingress -n ${NAMESPACE} >/dev/null 2>&1; then
        kubectl get ingress cockpit-automacao-ingress -n ${NAMESPACE}
        echo
        log_info "Acesso à aplicação:"
        log_info "🌐 http://${INGRESS_HOST}"
        log_info "📝 Adicione ao /etc/hosts: echo '127.0.0.1 ${INGRESS_HOST}' | sudo tee -a /etc/hosts"
    fi
    
    # Port-forward como alternativa
    echo
    log_info "Alternativa - Port Forward:"
    log_info "kubectl port-forward service/cockpit-automacao-service 8080:8080 -n ${NAMESPACE}"
    log_info "🌐 http://localhost:8080"
}

# Função de limpeza
cleanup() {
    log_info "Para remover o deployment:"
    log_info "kubectl delete -f k8s-manifests.yaml -n ${NAMESPACE}"
}

# Função principal
main() {
    echo
    log_info "🚀 Iniciando deploy do Cockpit de Automação v${VERSION}"
    echo
    
    # Verificações pré-requisitos
    if ! command -v docker >/dev/null 2>&1; then
        log_error "Docker não encontrado. Instale o Docker primeiro."
        exit 1
    fi
    
    if ! command -v kubectl >/dev/null 2>&1; then
        log_error "kubectl não encontrado. Instale o kubectl primeiro."
        exit 1
    fi
    
    # Verifica se kubectl consegue conectar
    if ! kubectl cluster-info >/dev/null 2>&1; then
        log_error "Não foi possível conectar ao cluster Kubernetes"
        exit 1
    fi
    
    # Executa deploy
    build_image
    load_image_to_cluster
    deploy_to_k8s
    show_status
    
    echo
    cleanup
    echo
    log_success "🎉 Deploy finalizado!"
}

# Tratamento de sinais
trap 'log_error "Deploy interrompido pelo usuário"; exit 1' INT TERM

# Executa função principal se script for executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi