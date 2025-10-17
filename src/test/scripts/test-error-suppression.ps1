#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para testar supressão de erros de extensões
.DESCRIPTION
    Inicia a aplicação e verifica se os erros de extensões estão sendo suprimidos
#>

$ErrorActionPreference = "Stop"

Write-Host "🔧 Testando supressão de erros de extensões" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# Definir variáveis de ambiente
$env:VITE_AWX_API = "http://192.168.15.52:8080"
$env:VITE_LOG_LEVEL = "debug"

Write-Host "✅ Configurações de teste:" -ForegroundColor Green
Write-Host "   - Filtros de console ativados" -ForegroundColor Gray
Write-Host "   - Interceptadores de erro globais ativados" -ForegroundColor Gray
Write-Host "   - Supressão de runtime.lastError ativada" -ForegroundColor Gray

Write-Host "`n🚀 Iniciando aplicação..." -ForegroundColor Blue
Write-Host "   ℹ️  Erros de extensões devem ser suprimidos automaticamente" -ForegroundColor Yellow
Write-Host "   🔍 Verifique o console do navegador - não deve aparecer 'Unchecked runtime.lastError'" -ForegroundColor Yellow

npm run dev