#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy simplificado do Cockpit Automação no K3s
.DESCRIPTION
    Script para deploy/atualização rápida da aplicação Cockpit no K3s usando a nova estrutura de manifests
.PARAMETER ImageTag
    Tag da imagem Docker (padrão: 1.0.2)
.PARAMETER AwxApi
    URL da API do AWX (padrão: http://192.168.15.52:8080)
.PARAMETER UpdateConfig
    Atualiza apenas a configuração sem rebuild (switch)
.EXAMPLE
    .\deploy-cockpit.ps1
    .\deploy-cockpit.ps1 -ImageTag "1.0.3" -AwxApi "http://novo-awx:8080"
    .\deploy-cockpit.ps1 -UpdateConfig -AwxApi "http://novo-awx:8080"
#>

param(
    [string]$ImageTag = "1.0.2",
    [string]$AwxApi = "http://192.168.15.52:8080",
    [switch]$UpdateConfig
)

$ErrorActionPreference = "Stop"

Write-Host "🚀 Cockpit K3s Deploy - Estrutura Sanitizada" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

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

$manifestsPath = "manifests"

if ($UpdateConfig) {
    Write-Host "🔧 Atualizando apenas configuração..." -ForegroundColor Yellow
    
    # Atualizar ConfigMap
    Write-Host "📝 Atualizando ConfigMap com AWX API: $AwxApi"
    kubectl patch configmap cockpit-config -n cockpit --patch="{`"data`":{`"VITE_AWX_API`":`"$AwxApi`"}}"
    
    # Restart do deployment
    Write-Host "🔄 Reiniciando deployment..."
    kubectl rollout restart deployment/cockpit-automacao -n cockpit
    kubectl rollout status deployment/cockpit-automacao -n cockpit --timeout=300s
    
    Write-Host "✅ Configuração atualizada com sucesso!" -ForegroundColor Green
    exit 0
}

Write-Host "🏗️ Iniciando deploy completo..." -ForegroundColor Blue
Write-Host "   📦 Imagem: cockpit-app:$ImageTag"
Write-Host "   🔗 AWX API: $AwxApi"

# 1. Aplicar Namespace
Write-Host "`n📁 Aplicando namespace..."
kubectl apply -f "$manifestsPath/01-namespace.yaml"

# 2. Atualizar ConfigMap com a URL do AWX fornecida
Write-Host "📝 Aplicando ConfigMap..."
$configMapContent = Get-Content "$manifestsPath/02-configmap.yaml" -Raw
$configMapContent = $configMapContent -replace 'VITE_AWX_API: "http://awx-service.awx.svc.cluster.local:8080"', "VITE_AWX_API: `"$AwxApi`""
$configMapContent | kubectl apply -f -

# 3. Atualizar Deployment com a imagem fornecida
Write-Host "🚀 Aplicando Deployment..."
$deploymentContent = Get-Content "$manifestsPath/03-deployment.yaml" -Raw
$deploymentContent = $deploymentContent -replace 'image: cockpit-app:1.0.2', "image: cockpit-app:$ImageTag"
$deploymentContent | kubectl apply -f -

# 4. Aplicar Service
Write-Host "🔗 Aplicando Service..."
kubectl apply -f "$manifestsPath/04-service.yaml"

# 5. Aplicar Ingress
Write-Host "🌐 Aplicando Ingress..."
kubectl apply -f "$manifestsPath/05-ingress.yaml"

# 6. Aguardar deployment ficar pronto
Write-Host "`n⏳ Aguardando deployment ficar pronto..."
kubectl rollout status deployment/cockpit-automacao -n cockpit --timeout=300s

# 7. Verificar status
Write-Host "`n📊 Status do deployment:"
kubectl get pods -n cockpit -l app=cockpit-automacao
kubectl get svc -n cockpit
kubectl get ingress -n cockpit

Write-Host "`n✅ Deploy concluído com sucesso!" -ForegroundColor Green
Write-Host "🌐 Acesso via: http://localhost/cockpit ou http://cockpit.local" -ForegroundColor Cyan
Write-Host "📋 Para acompanhar logs: kubectl logs -n cockpit -l app=cockpit-automacao -f" -ForegroundColor Gray