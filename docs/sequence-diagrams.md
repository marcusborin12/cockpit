# Diagramas de Sequência - Cockpit de Automação AWX

Este documento contém os diagramas de sequência que descrevem os principais fluxos da aplicação de automação AWX.

## 📋 Índice

1. [Fluxo de Autenticação](#1-fluxo-de-autenticação)
2. [Carregamento do Dashboard](#2-carregamento-do-dashboard)
3. [Execução de Job Template](#3-execução-de-job-template)
4. [Monitoramento de Execução](#4-monitoramento-de-execução)
5. [Sistema de Cache](#5-sistema-de-cache)
6. [Filtros e Busca de Automações](#6-filtros-e-busca-de-automações)

---

## 1. Fluxo de Autenticação

```mermaid
sequenceDiagram
    participant U as Usuário
    participant L as Login.tsx
    participant AC as AuthContext
    participant AS as AWXService
    participant C as auth-cookies.ts
    participant AWX as AWX API
    participant D as Dashboard

    Note over U,D: Processo de Login e Autenticação

    U->>L: Insere credenciais (username, password)
    L->>L: Validação com Zod Schema
    
    alt Validação OK
        L->>AC: login(username, password)
        AC->>AS: login(username, password)
        
        Note over AS,AWX: Basic Auth Headers
        AS->>AS: btoa(username:password)
        AS->>AWX: GET /api/v2/me/ [Basic Auth]
        
        alt Credenciais Válidas
            AWX-->>AS: 200 OK + User Data
            AS->>C: setAuthCookie(credentials, username, 10min)
            C->>C: localStorage cookie com expiração
            AS-->>AC: userData
            AC->>AC: setUser(userData)
            AC-->>L: Success
            
            L->>L: Toast de sucesso
            L->>D: navigate("/dashboard")
            
        else Credenciais Inválidas
            AWX-->>AS: 401 Unauthorized
            AS-->>AC: Erro "Credenciais inválidas"
            AC-->>L: Erro
            L->>L: Toast de erro
        end
    else Validação Falha
        L->>L: Toast de erro de validação
    end

    Note over U,D: Verificação de Sessão Existente
    
    D->>AC: useAuth() - verificação inicial
    AC->>AS: isLoggedIn()
    AS->>C: hasValidAuthSession()
    C->>C: Verifica cookie não expirado
    
    alt Sessão Válida
        C-->>AS: true
        AS->>AWX: GET /api/v2/me/ [Session Credentials]
        AWX-->>AS: User Data
        AS-->>AC: userData
        AC->>AC: setUser(userData)
    else Sessão Expirada/Inválida
        C-->>AS: false/null
        AS-->>AC: null
        AC->>AC: setUser(null)
        AC->>D: Redirect to /login
    end
```

---

## 2. Carregamento do Dashboard

```mermaid
sequenceDiagram
    participant U as Usuário
    participant D as Dashboard.tsx
    participant H as useAwxDashboard
    participant DC as DashboardCache
    participant AS as AWXService
    participant AWX as AWX API

    Note over U,AWX: Carregamento Inicial do Dashboard

    U->>D: Acessa /dashboard
    D->>H: useAwxDashboard()
    
    par Estatísticas Gerais
        H->>DC: get('dashboardStats')
        alt Cache Válido
            DC-->>H: Cached Stats
            H->>D: stats (from cache)
        else Cache Expirado/Inexistente
            DC-->>H: null
            H->>AS: getDashboardStats()
            
            Note over AS,AWX: Últimos 12 meses
            AS->>AWX: GET /jobs/?created__gte=DATE&page_size=200
            AWX-->>AS: Total Jobs
            
            AS->>AWX: GET /jobs/?status=successful&created__gte=DATE
            AWX-->>AS: Successful Jobs
            
            AS->>AWX: GET /jobs/?status=failed&created__gte=DATE
            AWX-->>AS: Failed Jobs
            
            AS->>AWX: GET /jobs/?status__in=running,pending,waiting
            AWX-->>AS: Running Jobs
            
            AS->>AS: Calcular taxas (success/failure rate)
            AS-->>H: Estatísticas calculadas
            
            H->>DC: set('dashboardStats', stats, TTL=5min)
            H->>D: stats (fresh data)
        end
    and Dados Mensais
        H->>DC: get('monthlyData')
        alt Cache Válido
            DC-->>H: Cached Monthly Data
            H->>D: monthlyData (from cache)
        else Cache Expirado/Inexistente
            DC-->>H: null
            H->>AS: getMonthlyExecutionData()
            
            AS->>AWX: GET /jobs/?created__gte=12_MONTHS_AGO
            AWX-->>AS: Jobs dos últimos 12 meses
            
            AS->>AS: Agrupar por mês e status
            AS->>AS: Calcular métricas mensais
            AS-->>H: Monthly data processed
            
            H->>DC: set('monthlyData', data, TTL=60min)
            H->>D: monthlyData (fresh data)
        end
    and Execuções Recentes
        H->>DC: get('recentExecutions')
        alt Cache Válido
            DC-->>H: Cached Recent Executions
            H->>D: recentExecutions (from cache)
        else Cache Expirado/Inexistente
            DC-->>H: null
            H->>AS: getRecentExecutions(10)
            
            AS->>AWX: GET /jobs/?order_by=-created&page_size=10
            AWX-->>AS: Recent 10 jobs
            
            AS->>AS: Format job data (name, status, time, duration)
            AS-->>H: Formatted recent executions
            
            H->>DC: set('recentExecutions', executions, TTL=2min)
            H->>D: recentExecutions (fresh data)
        end
    end

    Note over U,AWX: Renderização dos Componentes

    D->>D: Renderizar Cards de Estatísticas
    D->>D: Renderizar Gráfico Mensal (ApexCharts)
    D->>D: Renderizar Lista de Execuções Recentes

    Note over U,AWX: Auto-refresh (Opcional)

    alt Auto-refresh Habilitado
        loop A cada 60 segundos
            H->>AS: Fetch fresh data (bypass cache)
            AS->>AWX: Fresh API calls
            AWX-->>AS: Updated data
            AS-->>H: New data
            H->>DC: Update cache
            H->>D: Update UI
        end
    end
```

---

## 3. Execução de Job Template

```mermaid
sequenceDiagram
    participant U as Usuário
    participant A as Automations.tsx
    participant JEM as JobExecutionModal
    participant AS as AWXService
    participant AWX as AWX API

    Note over U,AWX: Descoberta e Seleção de Job Template

    U->>A: Acessa /automations
    A->>AS: getJobTemplates()
    AS->>AWX: GET /job_templates/?page_size=2000
    AWX-->>AS: Lista de Job Templates
    AS-->>A: Job Templates processados
    A->>A: parseJobTemplateName() - extrai área/tecnologia/ação
    A->>A: Renderiza cards com filtros

    U->>A: Clica "Executar" em um template
    A->>JEM: Abre modal com jobTemplate + filters
    
    Note over U,AWX: Preparação da Execução

    JEM->>AS: getInventoryForExecution(systemSigla?)
    AS->>AWX: GET /inventories/?name__icontains=SYSTEM
    AWX-->>AS: Lista de inventários
    AS->>AS: Seleciona inventário mais adequado
    AS-->>JEM: Inventário selecionado

    opt Se usuário selecionou grupo específico
        JEM->>AS: getHostsByGroup(inventoryId, groupName)
        AS->>AWX: GET /inventories/{id}/hosts/?groups__name=GROUP
        AWX-->>AS: Hosts do grupo
        AS-->>JEM: Lista de servidores disponíveis
    end

    JEM->>JEM: Mostra preview da execução
    JEM->>JEM: Calcula filtros aplicados (limit)

    Note over U,AWX: Confirmação e Execução

    U->>JEM: Confirma execução
    JEM->>AS: launchJobTemplate(templateId, extraVars, options)
    
    AS->>AS: Prepara payload com inventário e limit
    Note over AS: limit = servidores específicos OU grupo OU vazio (todo inventário)
    
    AS->>AWX: POST /job_templates/{id}/launch/
    Note over AS,AWX: Payload: { inventory: ID, limit: "servers,list", extra_vars: {} }
    
    alt Execução Iniciada com Sucesso
        AWX-->>AS: 201 Created + Job Object
        AS-->>JEM: Job iniciado (ID, status="new")
        JEM->>JEM: Inicia monitoramento do job
        JEM->>U: Mostra "Job iniciado com sucesso"
    else Erro na Execução
        AWX-->>AS: 400/403/500 + Error Details
        AS-->>JEM: Erro detalhado
        JEM->>U: Mostra mensagem de erro específica
    end
```

---

## 4. Monitoramento de Execução

```mermaid
sequenceDiagram
    participant JEM as JobExecutionModal
    participant AS as AWXService
    participant AWX as AWX API
    participant U as Usuário

    Note over JEM,U: Monitoramento em Tempo Real

    JEM->>JEM: Job iniciado - começa polling
    
    loop A cada 3 segundos (enquanto job ativo)
        JEM->>AS: getJobDetail(jobId)
        AS->>AWX: GET /jobs/{id}/
        AWX-->>AS: Job Status + Metadata
        AS-->>JEM: Job atualizado
        
        JEM->>JEM: Atualiza UI com novo status
        
        alt Status = "running"
            JEM->>U: Mostra "Executando..." + animação
        else Status = "successful"
            JEM->>U: Mostra "Concluído com sucesso" + ícone verde
            JEM->>JEM: Para o polling
        else Status = "failed"
            JEM->>U: Mostra "Falha na execução" + ícone vermelho
            JEM->>JEM: Para o polling
        end
    end

    Note over JEM,U: Acesso aos Logs

    U->>JEM: Clica "Ver Logs Detalhados"
    JEM->>AS: getJobStdout(jobId)
    AS->>AWX: GET /jobs/{id}/stdout/
    AWX-->>AS: Logs completos (texto)
    AS-->>JEM: Stdout formatado
    
    alt Logs Disponíveis
        JEM->>JEM: Abre nova aba com logs formatados
        JEM->>U: Nova janela com logs detalhados
    else Logs Não Disponíveis
        JEM->>U: "Logs ainda não disponíveis"
    end

    Note over JEM,U: Resultados da Execução

    opt Job Concluído
        JEM->>AS: getJobEvents(jobId)
        AS->>AWX: GET /jobs/{id}/job_events/
        AWX-->>AS: Eventos estruturados
        AS-->>JEM: Eventos processados
        
        JEM->>JEM: Extrai informações de hosts afetados
        JEM->>JEM: Conta sucessos/falhas por servidor
        JEM->>U: Mostra resumo de resultados por host
    end

    U->>JEM: Fecha modal
    JEM->>JEM: Para todos os timers/polling
```

---

## 5. Sistema de Cache

```mermaid
sequenceDiagram
    participant App as Aplicação
    participant DC as DashboardCache
    participant LS as localStorage
    participant ENV as Environment Variables

    Note over App,ENV: Inicialização do Sistema de Cache

    App->>DC: dashboardCache.init()
    DC->>ENV: Lê configurações (VITE_CACHE_*_TTL)
    ENV-->>DC: TTL por tipo de dados
    
    DC->>DC: Define CACHE_CONFIGS
    Note over DC: dashboardStats: 5min, monthlyData: 60min, recentExecutions: 2min
    
    DC->>LS: Verifica entradas existentes
    DC->>DC: clearExpired() - remove dados antigos
    DC->>App: Cache inicializado

    Note over App,ENV: Operações de Cache

    App->>DC: get('dashboardStats')
    DC->>LS: getItem(prefixed_key)
    
    alt Entrada Existe
        LS-->>DC: JSON string
        DC->>DC: Parse e validação
        DC->>DC: Verifica expiração (timestamp + TTL)
        
        alt Não Expirado
            DC->>DC: Verifica versão do cache
            alt Versão Compatível
                DC-->>App: Dados do cache
            else Versão Incompatível
                DC->>DC: Remove entrada inválida
                DC-->>App: null (cache miss)
            end
        else Expirado
            DC->>DC: Remove entrada expirada
            DC-->>App: null (cache miss)
        end
    else Entrada Não Existe
        LS-->>DC: null
        DC-->>App: null (cache miss)
    end

    Note over App,ENV: Salvando no Cache

    App->>DC: set('dashboardStats', data)
    DC->>DC: Cria CacheEntry com timestamp
    DC->>DC: JSON.stringify(entry)
    DC->>LS: setItem(prefixed_key, json)
    LS-->>DC: Dados salvos
    DC-->>App: Cache atualizado

    Note over App,ENV: Limpeza e Manutenção

    App->>DC: clearExpired()
    DC->>LS: Itera sobre todas as chaves do cache
    DC->>DC: Verifica expiração de cada entrada
    DC->>LS: removeItem() para entradas expiradas
    
    App->>DC: clearAll()
    DC->>LS: Remove todas as entradas do cache AWX
    
    opt Dev Mode
        App->>DC: getInfo() / getConfig()
        DC-->>App: Informações de debug do cache
        App->>App: Mostra CacheInfo component
    end
```

---

## 6. Filtros e Busca de Automações

```mermaid
sequenceDiagram
    participant U as Usuário
    participant A as Automations.tsx
    participant AS as AWXService
    participant AWX as AWX API

    Note over U,AWX: Carregamento Inicial e Setup de Filtros

    U->>A: Acessa /automations
    A->>AS: getJobTemplates()
    AS->>AWX: GET /job_templates/?page_size=2000
    AWX-->>AS: Todos os job templates
    AS-->>A: Job templates processados

    A->>A: getSystemsFromJobTemplates()
    A->>A: Extrai sistemas únicos dos nomes dos templates
    A->>A: Renderiza filtros dinâmicos

    par Carregamento de Inventários
        A->>AS: getInventories()
        AS->>AWX: GET /inventories/?page_size=200
        AWX-->>AS: Lista de inventários
        AS-->>A: Inventários disponíveis
    end

    Note over U,AWX: Aplicação de Filtros

    U->>A: Seleciona Sistema (ex: "SPI")
    A->>A: updateFilters({ systemSigla: "SPI" })
    A->>A: Filtra job templates por nome contendo "SPI"
    A->>A: Atualiza lista de grupos disponíveis
    A->>A: Re-renderiza cards filtrados

    U->>A: Seleciona Grupo (ex: "WEB")
    A->>A: updateFilters({ selectedGroup: "WEB" })
    
    A->>AS: getHostsByGroup(inventoryId, "WEB")
    AS->>AWX: GET /inventories/{id}/hosts/?groups__name=WEB
    AWX-->>AS: Hosts do grupo WEB
    AS-->>A: Lista de servidores disponíveis
    A->>A: Atualiza dropdown de servidores
    A->>A: Re-renderiza cards (mesmo conjunto, mas preview atualizado)

    U->>A: Seleciona Servidores Específicos
    A->>A: updateFilters({ selectedServers: ["server1", "server2"] })
    A->>A: Re-renderiza cards com indicação de servidores específicos

    Note over U,AWX: Busca Textual

    U->>A: Digite na busca (ex: "deploy")
    A->>A: updateSearchTerm("deploy")
    A->>A: Filtra job templates por nome/descrição contendo "deploy"
    A->>A: Aplica filtro combinado (sistema + grupo + busca)
    A->>A: Re-renderiza cards filtrados

    Note over U,AWX: Combinação de Filtros

    A->>A: applyFilters()
    A->>A: Combina filtros: sistema AND grupo AND busca
    A->>A: Calcula templates visíveis
    
    alt Sem Resultados
        A->>U: Mostra "Nenhuma automação encontrada"
        A->>A: Mostra botão "Limpar Filtros"
    else Resultados Encontrados
        A->>A: Renderiza cards filtrados
        A->>A: Mostra contador "X automações encontradas"
    end

    Note over U,AWX: Reset de Filtros

    U->>A: Clica "Limpar Filtros"
    A->>A: clearFilters() - reset para estado inicial
    A->>A: Mostra todos os job templates
    A->>A: Reset dropdowns para valores padrão
    A->>A: Limpa campo de busca

    Note over U,AWX: Execução com Filtros Aplicados

    U->>A: Clica "Executar" em template filtrado
    A->>A: Passa filtros atuais para JobExecutionModal
    Note over A: currentFilters = { systemSigla, selectedGroup, selectedServers }
    A->>A: Modal usa filtros para determinar escopo da execução
```

---

## 🔧 Configurações e Variáveis

### Variáveis de Cache
- `VITE_CACHE_DASHBOARD_STATS_TTL`: TTL para estatísticas (padrão: 5min)
- `VITE_CACHE_MONTHLY_DATA_TTL`: TTL para dados mensais (padrão: 60min)  
- `VITE_CACHE_RECENT_EXECUTIONS_TTL`: TTL para execuções recentes (padrão: 2min)
- `VITE_CACHE_VERSION`: Versão do cache para invalidação

### Timeouts e Intervalos
- **Timeout de Requisições**: 30 segundos
- **Polling de Jobs**: 3 segundos
- **Auto-refresh Dashboard**: 60 segundos
- **Expiração de Sessão**: 10 minutos

### Endpoints AWX Utilizados
- `/api/v2/me/` - Autenticação e dados do usuário
- `/api/v2/job_templates/` - Lista de automações
- `/api/v2/jobs/` - Execuções e monitoramento
- `/api/v2/inventories/` - Inventários e hosts
- `/api/v2/job_templates/{id}/launch/` - Execução de automações

---

## 📊 Fluxos de Dados

### Estados de Job
1. **new** → **pending** → **waiting** → **running** → **successful/failed**
2. Polling contínuo durante estados ativos (new, pending, waiting, running)
3. Logs disponíveis apenas após início da execução (running+)

### Cache Strategy
1. **Cache-first**: Verifica cache antes de API
2. **TTL-based**: Expiração automática por tipo de dados
3. **Version-aware**: Invalida cache em mudanças de versão
4. **Manual override**: Force refresh bypassa cache

### Autenticação
1. **Session-based**: Cookies com expiração de 10min
2. **Auto-renewal**: Verificação contínua de sessão válida
3. **Fallback storage**: sessionStorage como backup
4. **Credential rotation**: Limpeza automática de credenciais inválidas