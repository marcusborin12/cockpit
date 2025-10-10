# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

## [1.0.0] - 2025-10-09

### 🎉 VERSÃO ESTÁVEL DE PRODUÇÃO

### ✨ Principais Funcionalidades Adicionadas

#### 🔐 Sistema de Autenticação Completo
- **Login AWX integrado** com Basic Authentication
- **Tela de login** moderna e responsiva
- **Contexto de autenticação** global na aplicação
- **Rotas protegidas** - redirecionamento automático para login
- **Gerenciamento de sessão** via sessionStorage
- **Logout automático** em caso de sessão expirada

#### 👤 Perfil de Usuário no Header
- **UserProfile** no canto superior direito
- **Dropdown menu** com informações completas do usuário
- **Avatar com iniciais** calculadas automaticamente
- **Nome completo** extraído da API `/api/v2/me`
- **Email e ID** do usuário visíveis
- **Badge de Admin** para super usuários
- **Botão de logout** integrado

#### 📋 Logs Detalhados de Execução
- **Botão discreto "Ver logs detalhados"** após conclusão do job
- **Modal de logs** com interface completa
- **Busca nos logs** com filtro em tempo real
- **Filtros por nível** (Task, Sucesso, Erro, etc.)
- **Exportação de logs** (copiar/baixar)
- **Visualização estruturada** com cores por tipo
- **Estatísticas** de sucessos/erros/tasks

#### 🔧 Melhorias na API AWX
- **Correção de extração de dados** da API `/api/v2/me`
- **Tratamento robusto** de estruturas paginadas
- **Token de autenticação** na URL de logs
- **Fallback inteligente** para diferentes formatos de resposta
- **Logs de debug** removidos para produção

### 🐛 Correções Críticas
- **UserProfile vazio** - Corrigida extração de dados do `results[0]`
- **Dados não apareciam** - API retornava estrutura paginada
- **Erro de iniciais** - Função robusta para diferentes formatos de nome
- **Layout responsivo** - Header fixo com UserProfile sempre visível

### 🎯 Experiência do Usuário
- **Fluxo de login** intuitivo e rápido
- **Feedback visual** em todas as operações
- **Loading states** para operações assíncronas
- **Error boundaries** para tratamento de erros
- **Animações suaves** em transições

### 🔗 Estrutura de Dados Real
```json
// Dados reais da API /api/v2/me
{
  "results": [{
    "id": 38,
    "username": "9903699",
    "email": "9903699@prestadorserv.com.br", 
    "first_name": "9903699 -",
    "last_name": "Marcus Henrique Bemfica Borin",
    "is_superuser": false,
    "is_system_auditor": true
  }]
}
```

### 📊 Componentes Adicionados
- `AuthProvider` - Contexto global de autenticação
- `ProtectedRoute` - Componente para rotas protegidas  
- `UserProfile` - Perfil completo do usuário
- `LogsModal` - Modal detalhado de logs

### 🚀 Pronto para Produção
- **Código limpo** sem logs de debug
- **Performance otimizada** 
- **Tratamento de erros** robusto
- **Interface profissional** 
- **Segurança implementada**

## [1.0.0-beta.3] - 2025-10-08

### 🔧 CORREÇÃO CRÍTICA - Sistema de Filtros

### 🐛 Problemas Corrigidos
- **Correção do filtro de Sistema** - Agora funciona corretamente
- **Padrão de nomenclatura identificado** - `area-TECNOLOGIA-ação` (não `area-SISTEMA-tecnologia`)
- **Lógica de filtro ajustada** para o padrão real dos job templates
- **Exceção para playbooks "-server-"** mantida e funcional

### 🎯 Comportamento Corrigido

**ANTES (com bug):**
- Filtro Sistema "SPI" → Mostrava apenas playbooks "-server-"
- Filtro Grupo "api" → Não funcionava corretamente

**DEPOIS (corrigido):**
- Filtro Sistema "SPI" → Mostra **TODOS** os templates disponíveis
- Filtro Grupo "api" → Mostra `gsti-api-healthcheck` + playbooks "-server-"
- Filtro Grupo "iis" → Mostra `gsti-iis-healthcheck` + playbooks "-server-"

### 📋 Padrão Real Identificado
```
Job Templates encontrados:
- gsti-api-healthcheck
- gsti-ibmmq-healthcheck  
- gsti-iis-healthcheck
- gsti-oneagent-healthcheck
- gsti-redis-healthcheck
- gsti-server-healthcheck (exceção)
- gsti-tomcat-healthcheck
- gsti-workers-healthcheck
- testa-portas
```

### 🔓 Exceções Mantidas
- Playbooks com "-server-" continuam aparecendo sempre
- `gsti-server-healthcheck` visível em qualquer filtro

### 🧹 Limpeza de Código
- **Removidos logs de debug** para produção
- **Código otimizado** e limpo
- **Performance melhorada** sem logs excessivos

## [1.0.0-beta.2] - 2025-10-08

### 🔓 Exceção de Filtros para Playbooks SERVER

### ✨ Funcionalidades Adicionadas
- **Exceção de filtros** para playbooks com "-server-" no nome
- **Visibilidade universal** - playbooks server sempre aparecem
- **Bypass automático** de filtros de Sistema e Grupo
- **Logs detalhados** para debugging de exceções

### 🎯 Regra de Negócio
Playbooks que contêm "-server-" no nome são considerados de **infraestrutura geral** e devem estar sempre visíveis, independente dos filtros aplicados.

**Exemplos de playbooks afetados:**
- `infra-server-restart`
- `manutencao-server-update`
- `backup-server-config`

### 🔧 Implementação Técnica
- Função `isServerPlaybook()` para verificação consistente
- Exceção aplicada em filtros de sistema e grupo
- Código limpo e reutilizável
- Performance otimizada com verificação prévia

### 🎨 Interface
- **Botão de execução** com maior destaque visual
- **Cor de fundo verde** (`bg-green-600`) para identificação
- **Sombra e hover** para melhor interatividade
- **Ícone preenchido** para maior visibilidade

## [1.0.0-beta.1] - 2025-10-08

### 🚀 Primeira versão Beta - Pronta para Produção

### ✨ Funcionalidades Adicionadas
- **Interface principal de automações** com filtros avançados
- **Filtro de Sistema** - Seleção por sistema (SPI, CRM, etc.)
- **Filtro de Grupo** - Filtragem por grupos de servidores
- **Filtro de Servidores** - Seleção múltipla de servidores específicos
- **Execução de Job Templates** via AWX API
- **Modal de confirmação** com preview dos alvos
- **Tabela de servidores** com visualização compacta (máx 5 linhas + scroll)
- **Botões de execução discretos** no canto superior dos cards
- **Monitoramento de status** em tempo real

### 🔧 Integrações
- **AWX API** completa integração
- **Inventários dinâmicos** baseados em sistemas
- **Grupos e hosts** em tempo real
- **Limite automático** baseado nos filtros aplicados

### 🎨 Interface
- **Design responsivo** com Tailwind CSS
- **Componentes shadcn/ui** para consistência
- **Tema moderno** com cores corporativas
- **Animações suaves** e transições
- **Feedback visual** para todas as ações

### 📊 Lógica de Negócio
- **Filtros em cascata**: Sistema → Grupo → Servidor
- **Reset automático** de filtros dependentes
- **Validação de dados** em tempo real
- **Tratamento de erros** robusto
- **Logs detalhados** para debugging

### 🔐 Segurança
- **Autenticação AWX** via token
- **Validação de permissões** 
- **Sanitização de inputs**
- **HTTPS only** em produção

### 📝 Documentação
- README completo com guias de instalação
- Documentação de APIs integradas
- Exemplos de uso
- Guia de deployment

---

## Próximas Versões

### [1.0.0] - Planejado
- Testes automatizados completos
- Melhorias de performance
- Logs centralizados
- Métricas de uso

### [1.1.0] - Futuro
- Dashboard de estatísticas
- Histórico de execuções
- Notificações em tempo real
- Integração com Slack/Teams