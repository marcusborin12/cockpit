#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script de limpeza para remover arquivos antigos da estrutura K3s
.DESCRIPTION
    Remove os arquivos antigos após confirmar que a nova estrutura está funcionando
#>

$ErrorActionPreference = "Stop"

Write-Host "🧹 Limpeza da Estrutura K3s" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Yellow

$oldFiles = @(
    "k3s\k8s-configmap.yaml",
    "k3s\k8s-deployment.yaml", 
    "k3s\k8s-manifests.yaml"
)

$docsToMove = @(
    "k3s\DEPLOYMENT-v1.0.0.md",
    "k3s\K3S-DEPLOY.md",
    "k3s\KUBERNETES.md"
)

Write-Host "📋 Arquivos que serão removidos:" -ForegroundColor Cyan
foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        Write-Host "  ❌ $file" -ForegroundColor Red
    }
}

Write-Host "`n📋 Documentação que será movida:" -ForegroundColor Cyan
foreach ($file in $docsToMove) {
    if (Test-Path $file) {
        Write-Host "  📁 $file → k3s\docs\" -ForegroundColor Blue
    }
}

Write-Host "`n⚠️  ATENÇÃO: Esta operação não pode ser desfeita!" -ForegroundColor Yellow
$confirm = Read-Host "Deseja continuar? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "❌ Operação cancelada." -ForegroundColor Red
    exit 0
}

# Mover documentação
Write-Host "`n📁 Movendo documentação..."
foreach ($file in $docsToMove) {
    if (Test-Path $file) {
        $fileName = Split-Path $file -Leaf
        Move-Item $file "k3s\docs\$fileName" -Force
        Write-Host "  ✅ Movido: $fileName" -ForegroundColor Green
    }
}

# Remover arquivos antigos
Write-Host "`n🗑️ Removendo arquivos antigos..."
foreach ($file in $oldFiles) {
    if (Test-Path $file) {
        Remove-Item $file -Force
        Write-Host "  ✅ Removido: $file" -ForegroundColor Green
    }
}

Write-Host "`n✅ Limpeza concluída!" -ForegroundColor Green
Write-Host "📁 Nova estrutura ativa em k3s/" -ForegroundColor Cyan
Write-Host "🚀 Use: .\k3s\scripts\deploy-cockpit.ps1" -ForegroundColor Cyan