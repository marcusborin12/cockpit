# Script PowerShell para deploy no Kubernetes (Windows)
param(
    [string]$ImageName = "cockpit-automacao",
    [string]$Version = "1.0.2",
    [string]$Namespace = "default"
)

# Configurações
$IngressHost = "cockpit.local"

# Funções utilitárias
function Write-Info($message) {
    Write-Host "ℹ️  $message" -ForegroundColor Blue
}

function Write-Success($message) {
    Write-Host "✅ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠️  $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "❌ $message" -ForegroundColor Red
}

# Detecta tipo do cluster
function Get-K8sType {
    if (Get-Command minikube -ErrorAction SilentlyContinue) {
        $minikubeStatus = minikube status 2>$null
        if ($LASTEXITCODE -eq 0) {
            return "minikube"
        }
    }
    if (Get-Command k3s -ErrorAction SilentlyContinue) {
        return "k3s"
    }
    return "generic"
}

# Build da imagem
function Build-Image {
    Write-Info "Construindo imagem Docker: ${ImageName}:${Version}"
    
    $buildResult = docker build -t "${ImageName}:${Version}" .
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha no build da imagem Docker"
        exit 1
    }
    
    docker tag "${ImageName}:${Version}" "${ImageName}:latest"
    Write-Success "Imagem construída com sucesso"
}

# Carrega imagem no cluster
function Load-ImageToCluster {
    $k8sType = Get-K8sType
    Write-Info "Detectado cluster: $k8sType"
    Write-Info "Carregando imagem no cluster..."
    
    switch ($k8sType) {
        "minikube" {
            # Para minikube
            & minikube docker-env --shell powershell | Invoke-Expression
            docker build -t "${ImageName}:${Version}" .
            Write-Success "Imagem carregada no minikube"
        }
        "k3s" {
            # Para k3s
            docker save "${ImageName}:${Version}" | k3s ctr images import -
            Write-Success "Imagem carregada no k3s"
        }
        default {
            Write-Warning "Cluster genérico detectado. Certifique-se de que a imagem está disponível no registry"
        }
    }
}

# Deploy no Kubernetes
function Deploy-ToK8s {
    Write-Info "Aplicando manifesto no Kubernetes..."
    
    kubectl apply -f k8s-manifests.yaml -n $Namespace
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Falha ao aplicar manifesto"
        exit 1
    }
    
    Write-Success "Manifesto aplicado"
    
    Write-Info "Aguardando deployment ficar pronto..."
    kubectl rollout status deployment/cockpit-automacao -n $Namespace --timeout=300s
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Timeout aguardando deployment"
        Show-DebugInfo
        exit 1
    }
    
    Write-Success "Deployment concluído"
}

# Mostra informações de debug
function Show-DebugInfo {
    Write-Info "Informações de debug:"
    Write-Host ""
    Write-Host "=== PODS ===" -ForegroundColor Cyan
    kubectl get pods -l app=cockpit-automacao -n $Namespace -o wide
    Write-Host ""
    Write-Host "=== SERVICES ===" -ForegroundColor Cyan
    kubectl get services -l app=cockpit-automacao -n $Namespace
    Write-Host ""
    Write-Host "=== INGRESS ===" -ForegroundColor Cyan
    kubectl get ingress cockpit-automacao-ingress -n $Namespace 2>$null
    Write-Host ""
    Write-Host "=== LOGS ===" -ForegroundColor Cyan
    kubectl logs -l app=cockpit-automacao -n $Namespace --tail=20
}

# Mostra status final
function Show-Status {
    Write-Success "Deploy concluído com sucesso!"
    Write-Host ""
    Write-Info "Status do deployment:"
    kubectl get pods -l app=cockpit-automacao -n $Namespace
    kubectl get services -l app=cockpit-automacao -n $Namespace
    
    $ingressExists = kubectl get ingress cockpit-automacao-ingress -n $Namespace 2>$null
    if ($LASTEXITCODE -eq 0) {
        kubectl get ingress cockpit-automacao-ingress -n $Namespace
        Write-Host ""
        Write-Info "Acesso à aplicação:"
        Write-Info "🌐 http://$IngressHost"
        Write-Info "📝 Adicione ao C:\Windows\System32\drivers\etc\hosts: 127.0.0.1 $IngressHost"
    }
    
    Write-Host ""
    Write-Info "Alternativa - Port Forward:"
    Write-Info "kubectl port-forward service/cockpit-automacao-service 8080:8080 -n $Namespace"
    Write-Info "🌐 http://localhost:8080"
}

# Verificações
function Test-Prerequisites {
    if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Error "Docker não encontrado. Instale o Docker primeiro."
        exit 1
    }
    
    if (!(Get-Command kubectl -ErrorAction SilentlyContinue)) {
        Write-Error "kubectl não encontrado. Instale o kubectl primeiro."
        exit 1
    }
    
    kubectl cluster-info 2>$null | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Não foi possível conectar ao cluster Kubernetes"
        exit 1
    }
}

# Função principal
function Main {
    Write-Host ""
    Write-Info "🚀 Iniciando deploy do Cockpit de Automação v$Version"
    Write-Host ""
    
    Test-Prerequisites
    Build-Image
    Load-ImageToCluster
    Deploy-ToK8s
    Show-Status
    
    Write-Host ""
    Write-Info "Para remover o deployment:"
    Write-Info "kubectl delete -f k8s-manifests.yaml -n $Namespace"
    Write-Host ""
    Write-Success "🎉 Deploy finalizado!"
}

# Executa se script for chamado diretamente
if ($MyInvocation.InvocationName -ne '.') {
    Main
}