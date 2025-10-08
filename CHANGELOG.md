# Changelog

Todas as mudanças notáveis deste projeto serão documentadas neste arquivo.

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