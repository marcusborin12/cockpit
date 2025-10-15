# Arquitetura da Aplicação - Cockpit AWX

Este documento descreve a arquitetura geral da aplicação de automação AWX, incluindo componentes, camadas e fluxos de dados.

## 📐 Visão Geral da Arquitetura

```mermaid
graph TB
    subgraph "Frontend Application"
        subgraph "UI Layer"
            L[Login.tsx]
            D[Dashboard.tsx] 
            A[Automations.tsx]
            E[Execution.tsx]
            Layout[Layout.tsx]
        end
        
        subgraph "Components"
            JEM[JobExecutionModal]
            JDM[JobDetailsModal]
            CT[ConnectionTest]
            CI[CacheInfo]
        end
        
        subgraph "Context & Hooks"
            AC[AuthContext]
            UA[useAwx Hooks]
            UM[useAutomations]
        end
        
        subgraph "Services Layer"
            AS[AWXService]
            AC_LIB[auth-cookies.ts]
            DC[DashboardCache]
        end
        
        subgraph "Configuration"
            AWX_CONFIG[awx.ts Config]
            ENV[Environment Variables]
        end
    end
    
    subgraph "External Systems"
        AWX_API[AWX/Tower API]
        BROWSER[Browser Storage]
    end

    %% Connections
    L --> AC
    D --> UA
    A --> UM
    E --> JEM
    
    AC --> AS
    UA --> AS
    UM --> AS
    
    AS --> AWX_CONFIG
    AS --> AC_LIB
    AS --> DC
    
    AS --> AWX_API
    DC --> BROWSER
    AC_LIB --> BROWSER
    
    AWX_CONFIG --> ENV

    %% Styling
    classDef ui fill:#e1f5fe
    classDef service fill:#f3e5f5
    classDef external fill:#fff3e0
    classDef config fill:#e8f5e8
    
    class L,D,A,E,Layout ui
    class AS,AC_LIB,DC service
    class AWX_API,BROWSER external
    class AWX_CONFIG,ENV config
```

## 🏗️ Camadas da Aplicação

### 1. UI Layer (Páginas Principais)
Componentes de interface que representam as rotas principais da aplicação.

```mermaid
graph LR
    subgraph "Routing Structure"
        LOGIN["/login"] 
        ROOT["/"] --> REDIRECT["Navigate to /dashboard"]
        PROTECTED[ProtectedRoute] --> DASH["/dashboard"]
        PROTECTED --> AUTO["/automations"]
        PROTECTED --> EXEC["/execution/:id"]
        NOTFOUND["*"] --> NF[NotFound Component]
    end
    
    subgraph "Route Protection"
        DASH --> Dashboard
        AUTO --> Automations
        EXEC --> Execution
        ROOT --> REDIRECT
    end
```

**Páginas Implementadas:**
- **Login.tsx**: Tela de autenticação com credenciais AWX
- **Dashboard.tsx**: Métricas, estatísticas e visão geral das execuções
- **Automations.tsx**: Lista e execução de job templates
- **Execution.tsx**: Detalhes de execução específica (rota com parâmetro :id)
- **NotFound.tsx**: Página 404 para rotas não encontradas

**Responsabilidades:**
- Renderização de interfaces
- Gerenciamento de estado local (formulários, modais)
- Orquestração de hooks e contexts
- Navegação entre rotas protegidas

### 2. Components Layer
Componentes reutilizáveis e especializados.

```mermaid
graph TD
    subgraph "Shared Components"
        UI[UI Components]
        MODAL[Modal Components] 
        FORM[Form Components]
    end
    
    subgraph "Business Components"
        JEM[JobExecutionModal]
        JDM[JobDetailsModal]
        CT[AWXConnectionTest]
        DEBUG[AWXDebug]
    end
    
    subgraph "Layout Components"
        LAYOUT[Layout]
        SIDEBAR[Sidebar]
        PROTECTED[ProtectedRoute]
    end
```

### 3. Context & Hooks Layer
Gerenciamento de estado global e lógica de negócio.

```mermaid
graph TD
    AC[AuthContext] --> AS[AWXService]
    UA[useAwxDashboard] --> AS
    UAuto[useAutomations] --> AS
    
    subgraph "Hook Specializations"
        UA --> UAS[useAwxDashboardStats]
        UA --> UAM[useAwxMonthlyData] 
        UA --> UAE[useAwxRecentExecutions]
        UA --> UAC[useAwxConnection]
    end
    
    AS --> AWX_API[AWX API]
```

### 4. Services Layer
Camada de serviços e utilitários.

```mermaid
graph TB
    subgraph "Core Services"
        AS[AWXService]
        AC[auth-cookies.ts]
        DC[DashboardCache]
    end
    
    subgraph "Configuration"
        AWX_CONFIG[AWX Config]
        VERSION[version.ts]
    end
    
    subgraph "Utilities"
        UTILS[utils.ts]
    end
    
    AS --> AWX_CONFIG
    AS --> AC
    AS --> DC
```

## 🔄 Fluxo de Dados

### Padrão de Comunicação
A aplicação segue um padrão de fluxo unidirecional:

```mermaid
sequenceDiagram
    participant UI as UI Component
    participant Hook as Custom Hook
    participant Service as Service Layer
    participant Cache as Cache Layer
    participant API as External API

    UI->>Hook: Trigger action
    Hook->>Cache: Check cache
    
    alt Cache Hit
        Cache-->>Hook: Cached data
    else Cache Miss
        Hook->>Service: Fetch data
        Service->>API: HTTP request
        API-->>Service: Response
        Service-->>Hook: Processed data
        Hook->>Cache: Store data
    end
    
    Hook-->>UI: Updated state
    UI->>UI: Re-render
```

## 🛡️ Sistema de Roteamento

### Estrutura Real das Rotas
```typescript
// src/App.tsx - Configuração atual das rotas
<Routes>
  <Route path="/login" element={<Login />} />
  
  {/* Rota raiz redireciona para dashboard */}
  <Route path="/" element={
    <ProtectedRoute>
      <Navigate to="/dashboard" replace />
    </ProtectedRoute>
  } />
  
  {/* Rotas protegidas */}
  <Route path="/dashboard" element={
    <ProtectedRoute><Dashboard /></ProtectedRoute>
  } />
  
  <Route path="/automations" element={
    <ProtectedRoute><Automations /></ProtectedRoute>
  } />
  
  <Route path="/execution/:id" element={
    <ProtectedRoute><Execution /></ProtectedRoute>
  } />
  
  {/* Catch-all para 404 */}
  <Route path="*" element={<NotFound />} />
</Routes>
```

### Proteção de Rotas
- **ProtectedRoute**: Verifica autenticação antes de renderizar
- **Navigate**: Redireciona usuários autenticados de "/" para "/dashboard"
- **404 Handler**: Captura todas as rotas não encontradas

## 🗂️ Estrutura de Diretórios

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes base do design system
│   └── *.tsx           # Componentes de negócio
├── contexts/           # Context providers
├── hooks/              # Custom hooks
├── pages/              # Componentes de página (5 páginas)
├── services/           # Camada de serviços
├── lib/                # Utilitários e helpers
├── config/             # Configurações
└── integrations/       # Integrações externas
```

## 🔐 Segurança e Autenticação

### Fluxo de Autenticação
```mermaid
flowchart TD
    START([Usuário acessa app]) --> CHECK{Sessão válida?}
    
    CHECK -->|Sim| DASHBOARD[Dashboard]
    CHECK -->|Não| LOGIN[Tela de Login]
    
    LOGIN --> SUBMIT[Submete credenciais]
    SUBMIT --> VALIDATE{Validação local OK?}
    
    VALIDATE -->|Não| ERROR[Mostra erro]
    ERROR --> LOGIN
    
    VALIDATE -->|Sim| AWX_AUTH[Autentica no AWX]
    AWX_AUTH --> AWX_CHECK{AWX válido?}
    
    AWX_CHECK -->|Não| ERROR
    AWX_CHECK -->|Sim| SET_SESSION[Cria sessão local]
    SET_SESSION --> DASHBOARD
    
    DASHBOARD --> SESSION_CHECK{Verificação contínua}
    SESSION_CHECK -->|Expirada| LOGIN
    SESSION_CHECK -->|Válida| DASHBOARD
```

### Mecanismos de Segurança
- **Basic Authentication**: Credenciais enviadas via header Authorization
- **Session Management**: Cookies com expiração de 10 minutos
- **Auto-renewal**: Verificação contínua de sessão válida
- **Credential Storage**: Armazenamento seguro em localStorage/sessionStorage
- **Route Protection**: ProtectedRoute component para rotas autenticadas

## 💾 Sistema de Cache

### Estratégia de Cache
```mermaid
graph TD
    REQUEST[Request] --> CACHE_CHECK{Cache válido?}
    
    CACHE_CHECK -->|Sim| RETURN_CACHE[Retorna do cache]
    CACHE_CHECK -->|Não| API_CALL[Chama API]
    
    API_CALL --> PROCESS[Processa resposta]
    PROCESS --> STORE_CACHE[Armazena no cache]
    STORE_CACHE --> RETURN_DATA[Retorna dados]
    
    subgraph "Cache Validation"
        TTL_CHECK[Verifica TTL]
        VERSION_CHECK[Verifica versão]
        STRUCTURE_CHECK[Verifica estrutura]
    end
    
    CACHE_CHECK --> TTL_CHECK
    TTL_CHECK --> VERSION_CHECK
    VERSION_CHECK --> STRUCTURE_CHECK
```

### Tipos de Cache
| Tipo | TTL | Uso |
|------|-----|-----|
| Dashboard Stats | 5 min | Estatísticas gerais |
| Monthly Data | 60 min | Dados históricos mensais |
| Recent Executions | 2 min | Execuções recentes |

## 🚀 Performance e Otimizações

### Otimizações Implementadas
- **Code Splitting**: Lazy loading de rotas
- **Memoization**: React.memo e useMemo em componentes críticos
- **Debounced Search**: Busca com delay para evitar requisições excessivas
- **Pagination**: Controle de quantidade de dados por requisição
- **Cache Inteligente**: TTL diferenciado por tipo de dados
- **Bundle Optimization**: Tree shaking e chunk splitting

### Monitoramento de Performance
```mermaid
graph LR
    subgraph "Métricas Coletadas"
        LCP[Largest Contentful Paint]
        FID[First Input Delay] 
        CLS[Cumulative Layout Shift]
        TTI[Time to Interactive]
    end
    
    subgraph "Cache Metrics"
        HIT_RATE[Cache Hit Rate]
        MISS_RATE[Cache Miss Rate]
        TTL_EFF[TTL Effectiveness]
    end
```

## 🔧 Configurações por Ambiente

### Variáveis de Ambiente
```typescript
// Desenvolvimento
VITE_AWX_API=/api (proxy)
VITE_CACHE_VERSION=1.0.1
VITE_TEST_USERNAME=test_user
VITE_TEST_PASSWORD=test_pass

// Produção  
VITE_AWX_API=https://awx.company.com/api/v2
VITE_CACHE_VERSION=1.0.1
// Sem variáveis de teste
```

### Build e Deploy
```mermaid
graph LR
    DEV[Development] --> BUILD[Build Process]
    BUILD --> DIST[Distribution]
    
    DIST --> DOCKER[Docker Image]
    DIST --> K8S[Kubernetes Deploy]
    DIST --> STATIC[Static Hosting]
    
    subgraph "Build Optimizations"
        TREE_SHAKE[Tree Shaking]
        MINIFY[Minification]
        GZIP[Compression]
    end
    
    BUILD --> TREE_SHAKE
    TREE_SHAKE --> MINIFY
    MINIFY --> GZIP
```

## 📊 Monitoramento e Observabilidade

### Logs Estruturados
```javascript
// Padrão de logs da aplicação
console.log('🔐 Login successful:', { username, timestamp });
console.log('📊 Cache hit:', { type: 'dashboardStats', age: '2min' });
console.log('🚀 Job execution started:', { templateId, jobId });
console.error('❌ API Error:', { endpoint, status, error });
```

### Health Checks
- Conectividade com AWX API
- Validade da sessão do usuário  
- Status do cache (hit rate, expiração)
- Performance de requisições

### Métricas de Negócio
- Taxa de sucesso de execuções
- Tempo médio de execução
- Templates mais utilizados
- Usuários mais ativos

## 🔮 Extensibilidade

### Pontos de Extensão
1. **Novos Providers**: Suporte a outras ferramentas além do AWX
2. **Plugin System**: Extensões para funcionalidades específicas
3. **Custom Hooks**: Hooks especializados para novos casos de uso
4. **Theme System**: Personalização visual por empresa/departamento
5. **Notification System**: Integração com Slack, Teams, email

### Padrões Arquiteturais
- **Dependency Injection**: Services podem ser substituídos
- **Observer Pattern**: Hooks reagentes a mudanças de estado
- **Strategy Pattern**: Diferentes estratégias de cache/autenticação
- **Factory Pattern**: Criação dinâmica de componentes por contexto