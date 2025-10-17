#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy simplificado do Cockpit sem ConfigMap
.DESCRIPTION
    Script para deploy da aplicação Cockpit usando apenas variáveis de ambiente no deployment
.PARAMETER ImageTag
    Tag da imagem Docker (padrão: 1.0.2)
.PARAMETER AwxApi
    URL da API do AWX (padrão: http://192.168.15.52:8080)
.PARAMETER Replicas
    Número de réplicas (padrão: 2)
.EXAMPLE
    .\deploy-simple.ps1
    .\deploy-simple.ps1 -ImageTag "1.0.3" -AwxApi "http://novo-awx:8080"
    .\deploy-simple.ps1 -ImageTag "1.0.3" -Replicas 3
#>

param(
    [string]$ImageTag = "1.0.2",
    [string]$AwxApi = "http://192.168.15.52:8080",
    [int]$Replicas = 2
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Cockpit Deploy Simplificado (Sem ConfigMap)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Verificar se kubectl está disponível
if (-not (Get-Command kubectl -ErrorAction SilentlyContinue)) {
    Write-Host "❌ kubectl não encontrado. Instale o kubectl primeiro." -ForegroundColor Red
    exit 1
}

# Verificar conexão com K3s
try {
    kubectl cluster-info --request-timeout=5s | Out-Null
    Write-Host "✅ Conectado ao cluster K3s" -ForegroundColor Green
} catch {
    Write-Host "❌ Não foi possível conectar ao cluster K3s" -ForegroundColor Red
    exit 1
}

Write-Host "🏗️ Configuração do deploy:" -ForegroundColor Blue
Write-Host "   📦 Imagem: cockpit-app:$ImageTag"
Write-Host "   🔗 AWX API: $AwxApi"
Write-Host "   📊 Réplicas: $Replicas"

# Criar deployment temporário com variáveis personalizadas
$deploymentContent = Get-Content "deploy/cockpit-simple.yaml" -Raw

# Substituir valores no template
$deploymentContent = $deploymentContent -replace 'image: cockpit-app:1.0.2', "image: cockpit-app:$ImageTag"
$deploymentContent = $deploymentContent -replace 'value: "http://192.168.15.52:8080"', "value: `"$AwxApi`""
$deploymentContent = $deploymentContent -replace 'replicas: 2', "replicas: $Replicas"

Write-Host "`n🚀 Aplicando manifests..." -ForegroundColor Yellow

# Aplicar via pipeline
$deploymentContent | kubectl apply -f -

# Aguardar deployment ficar pronto
Write-Host "`n⏳ Aguardando deployment ficar pronto..." -ForegroundColor Yellow
kubectl rollout status deployment/cockpit-automacao -n cockpit --timeout=300s

# Verificar status
Write-Host "`n📊 Status do deployment:" -ForegroundColor Green
kubectl get pods -n cockpit -l app=cockpit-automacao
kubectl get svc -n cockpit
kubectl get ingress -n cockpit

Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "🌐 Acesso via:" -ForegroundColor Cyan
Write-Host "   - http://cockpit.local"
Write-Host "   - http://cluster-ip/cockpit"
Write-Host "   - kubectl port-forward -n cockpit svc/cockpit-service 8080:80"
Write-Host "`n📋 Para acompanhar logs:" -ForegroundColor Gray
Write-Host "   kubectl logs -n cockpit -l app=cockpit-automacao -f"