# Script PowerShell para deploy simplificado do Cockpit no K3s
# Uso: .\deploy-k3s-simple.ps1

param(
    [string]$AWX_API = "http://awx-service.awx.svc.cluster.local:8080",
    [string]$ImageTag = "latest",
    [switch]$UpdateConfig = $false,
    [switch]$Help
)

if ($Help) {
    Write-Host "🚀 Deploy Simplificado Cockpit K3s" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Uso:" -ForegroundColor Yellow
    Write-Host "  .\deploy-k3s-simple.ps1                                    # Deploy com configurações padrão"
    Write-Host "  .\deploy-k3s-simple.ps1 -AWX_API http://meu-awx:8080      # Deploy com URL customizada"
    Write-Host "  .\deploy-k3s-simple.ps1 -UpdateConfig                     # Apenas atualiza ConfigMap"
    Write-Host "  .\deploy-k3s-simple.ps1 -ImageTag v1.2.0                  # Deploy com tag específica"
    Write-Host ""
    Write-Host "Parâmetros:" -ForegroundColor Yellow
    Write-Host "  -AWX_API      : URL da API do AWX (padrão: cluster interno)"
    Write-Host "  -ImageTag     : Tag da imagem Docker (padrão: latest)"
    Write-Host "  -UpdateConfig : Apenas atualiza o ConfigMap sem rebuild"
    Write-Host "  -Help         : Mostra esta ajuda"
    exit 0
}

Write-Host "🚀 Deploy Simplificado Cockpit no K3s" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Verificar se kubectl está disponível
try {
    $null = kubectl version --client --short 2>$null
    Write-Host "✅ kubectl encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ kubectl não encontrado. Instale o kubectl primeiro." -ForegroundColor Red
    exit 1
}

# Verificar se K3s está rodando
try {
    $null = kubectl get nodes 2>$null
    Write-Host "✅ Cluster K3s acessível" -ForegroundColor Green
} catch {
    Write-Host "❌ Não foi possível acessar o cluster K3s" -ForegroundColor Red
    exit 1
}

# Função para atualizar ConfigMap
function Update-ConfigMap {
    Write-Host "🔧 Atualizando ConfigMap..." -ForegroundColor Yellow
    
    # Atualizar o arquivo ConfigMap com a nova URL
    $configContent = @"
apiVersion: v1
kind: ConfigMap
metadata:
  name: cockpit-config
  namespace: default
data:
  # URL da API do AWX
  VITE_AWX_API: "$AWX_API"
  
  # Configurações de Cache (TTL em minutos)
  VITE_CACHE_TTL: "300000"
  VITE_CACHE_MAX_SIZE: "100"
  VITE_CACHE_DASHBOARD_STATS_TTL: "5"
  VITE_CACHE_MONTHLY_DATA_TTL: "1440"
  VITE_CACHE_RECENT_EXECUTIONS_TTL: "2"
  VITE_CACHE_VERSION: "1.0.1"
  
  # Configurações de desenvolvimento/testes
  VITE_ENABLE_TEST_CREDENTIALS: "false"
  VITE_LOG_LEVEL: "info"
"@
    
    $configContent | Out-File -FilePath "k8s-configmap-temp.yaml" -Encoding UTF8
    
    try {
        kubectl apply -f k8s-configmap-temp.yaml
        Remove-Item "k8s-configmap-temp.yaml" -Force
        Write-Host "✅ ConfigMap atualizado com sucesso" -ForegroundColor Green
        Write-Host "   📡 AWX API: $AWX_API" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Erro ao aplicar ConfigMap: $_" -ForegroundColor Red
        exit 1
    }
}

# Se apenas atualizar config, fazer só isso
if ($UpdateConfig) {
    Update-ConfigMap
    
    Write-Host "🔄 Reiniciando pods para aplicar nova configuração..." -ForegroundColor Yellow
    kubectl rollout restart deployment/cockpit-deployment
    
    Write-Host "✅ Configuração atualizada! Aguarde os pods reiniciarem." -ForegroundColor Green
    exit 0
}

# Deploy completo
Write-Host "🔨 Iniciando build e deploy..." -ForegroundColor Yellow

# 1. Build da imagem Docker
Write-Host "📦 Construindo imagem Docker..." -ForegroundColor Yellow
try {
    docker build -t cockpit:$ImageTag .
    Write-Host "✅ Imagem construída: cockpit:$ImageTag" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro no build da imagem: $_" -ForegroundColor Red
    exit 1
}

# 2. Atualizar ConfigMap
Update-ConfigMap

# 3. Aplicar deployment
Write-Host "🚀 Aplicando deployment..." -ForegroundColor Yellow

$deploymentContent = @"
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cockpit-deployment
  namespace: default
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cockpit
  template:
    metadata:
      labels:
        app: cockpit
    spec:
      containers:
      - name: cockpit
        image: cockpit:$ImageTag
        ports:
        - containerPort: 8080
        envFrom:
        - configMapRef:
            name: cockpit-config
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        readinessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 5
        livenessProbe:
          httpGet:
            path: /
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
---
apiVersion: v1
kind: Service
metadata:
  name: cockpit-service
  namespace: default
spec:
  selector:
    app: cockpit
  ports:
  - port: 80
    targetPort: 8080
    protocol: TCP
  type: ClusterIP
"@

$deploymentContent | Out-File -FilePath "k8s-deployment-temp.yaml" -Encoding UTF8

try {
    kubectl apply -f k8s-deployment-temp.yaml
    Remove-Item "k8s-deployment-temp.yaml" -Force
    Write-Host "✅ Deployment aplicado com sucesso" -ForegroundColor Green
} catch {
    Write-Host "❌ Erro ao aplicar deployment: $_" -ForegroundColor Red
    exit 1
}

# 4. Aguardar pods ficarem prontos
Write-Host "⏳ Aguardando pods ficarem prontos..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=cockpit --timeout=120s

# 5. Mostrar status
Write-Host ""
Write-Host "📊 Status do Deployment:" -ForegroundColor Cyan
kubectl get pods -l app=cockpit
kubectl get svc cockpit-service

Write-Host ""
Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "🔗 Para acessar a aplicação:" -ForegroundColor Yellow
Write-Host "   kubectl port-forward svc/cockpit-service 8080:80" -ForegroundColor Cyan
Write-Host "   Depois acesse: http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "🔧 Para atualizar apenas as configurações:" -ForegroundColor Yellow
Write-Host "   .\deploy-k3s-simple.ps1 -UpdateConfig -AWX_API http://nova-url:8080" -ForegroundColor Cyan