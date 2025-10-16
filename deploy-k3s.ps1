# Script de deploy do Cockpit AWX no K3s para Windows PowerShell
# Este script faz todo o processo: ConfigMap → Build → Deploy

# Configurações
$NAMESPACE = "default"
$CONFIGMAP_NAME = "cockpit-config"
$APP_NAME = "cockpit-awx"
$IMAGE_TAG = "latest"

# Função para verificar comandos
function Check-Command {
    param($Description)
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $Description" -ForegroundColor Green
    } else {
        Write-Host "❌ Erro: $Description" -ForegroundColor Red
        exit 1
    }
}

Write-Host "🚀 Iniciando deploy completo do Cockpit AWX no K3s..." -ForegroundColor Blue

# 1. Aplicar ConfigMap
Write-Host "📄 Aplicando ConfigMap..." -ForegroundColor Yellow
kubectl apply -f k8s-configmap.yaml
Check-Command "ConfigMap aplicado"

# 2. Aguardar um momento
Start-Sleep -Seconds 2

# 3. Obter configurações do ConfigMap
Write-Host "🔧 Obtendo configurações do ConfigMap..." -ForegroundColor Yellow
$VITE_AWX_API = kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_AWX_API}'
$VITE_CACHE_DASHBOARD_STATS_TTL = kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_DASHBOARD_STATS_TTL}'
$VITE_CACHE_MONTHLY_DATA_TTL = kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_MONTHLY_DATA_TTL}'
$VITE_CACHE_RECENT_EXECUTIONS_TTL = kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_RECENT_EXECUTIONS_TTL}'
$VITE_CACHE_VERSION = kubectl get configmap $CONFIGMAP_NAME -n $NAMESPACE -o jsonpath='{.data.VITE_CACHE_VERSION}'

Write-Host "🔗 Configurações extraídas:" -ForegroundColor Green
Write-Host "  VITE_AWX_API: $VITE_AWX_API"
Write-Host "  VITE_CACHE_VERSION: $VITE_CACHE_VERSION"

# 4. Build da imagem Docker
Write-Host "🐳 Construindo imagem Docker..." -ForegroundColor Yellow
docker build `
  --build-arg VITE_AWX_API="$VITE_AWX_API" `
  --build-arg VITE_CACHE_DASHBOARD_STATS_TTL="$VITE_CACHE_DASHBOARD_STATS_TTL" `
  --build-arg VITE_CACHE_MONTHLY_DATA_TTL="$VITE_CACHE_MONTHLY_DATA_TTL" `
  --build-arg VITE_CACHE_RECENT_EXECUTIONS_TTL="$VITE_CACHE_RECENT_EXECUTIONS_TTL" `
  --build-arg VITE_CACHE_VERSION="$VITE_CACHE_VERSION" `
  -t "${APP_NAME}:${IMAGE_TAG}" .
Check-Command "Imagem Docker construída"

# 5. Importar imagem no K3s
Write-Host "📦 Importando imagem no K3s..." -ForegroundColor Yellow
docker save "${APP_NAME}:${IMAGE_TAG}" | k3s ctr images import -
Check-Command "Imagem importada no K3s"

# 6. Aplicar deployment
Write-Host "🚢 Aplicando deployment..." -ForegroundColor Yellow
kubectl apply -f k8s-deployment.yaml
Check-Command "Deployment aplicado"

# 7. Aguardar pods ficarem prontos
Write-Host "⏳ Aguardando pods ficarem prontos..." -ForegroundColor Yellow
kubectl wait --for=condition=ready pod -l app=$APP_NAME --timeout=300s
Check-Command "Pods prontos"

# 8. Mostrar status
Write-Host "📊 Status do deployment:" -ForegroundColor Yellow
kubectl get pods -l app=$APP_NAME -o wide
Write-Host ""
kubectl get services cockpit-awx-service

# 9. Mostrar como acessar
Write-Host "🌐 Para acessar a aplicação:" -ForegroundColor Green
Write-Host "kubectl port-forward service/cockpit-awx-service 8080:80" -ForegroundColor Blue
Write-Host "Em seguida acesse: http://localhost:8080" -ForegroundColor Yellow

Write-Host "✅ Deploy concluído com sucesso!" -ForegroundColor Green

# 10. Opcional: Fazer port-forward automaticamente
$response = Read-Host "Deseja fazer port-forward automaticamente? (y/N)"
if ($response -eq "y" -or $response -eq "Y") {
    Write-Host "🔗 Iniciando port-forward..." -ForegroundColor Blue
    Write-Host "Acesse: http://localhost:8080" -ForegroundColor Yellow
    Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
    kubectl port-forward service/cockpit-awx-service 8080:80
}