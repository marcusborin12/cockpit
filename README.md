# Cockpit de Automação AWX

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![React](https://img.shields.io/badge/react-18.3.1-blue.svg)
![TypeScript](https://img.shields.io/badge/typescript-5.8.3-blue.svg)
![Vite](https://img.shields.io/badge/vite-5.4.19-purple.svg)

**Interface web moderna para gerenciamento e execução de automações AWX/Ansible Tower**

[Demonstração](#demonstração) • [Instalação](#instalação) • [Configuração](#configuração) • [API](#api) • [Deploy](#deploy)

</div>

---

## 📋 Visão Geral

O **Cockpit de Automação AWX** é uma aplicação web React que oferece uma interface intuitiva e moderna para interação com servidores AWX/Ansible Tower. Desenvolvida para simplificar o gerenciamento de automações, oferece funcionalidades avançadas de filtragem, execução em tempo real e monitoramento de jobs.

### ✨ Características Principais

- 🎯 **Filtros Inteligentes** - Sistema, Grupo e Servidores específicos
- 🚀 **Execução Segura** - Confirmação visual com preview de alvos
- 📊 **Dashboard Analytics** - Estatísticas e métricas em tempo real
- 🔍 **Monitoramento** - Acompanhamento de jobs e logs detalhados
- 🔐 **Autenticação Segura** - Login via credenciais AWX com sessões temporárias
- 📱 **Interface Responsiva** - Design adaptativo para desktop e mobile
- ⚡ **Performance** - Cache inteligente e requisições otimizadas

---

## 🚀 Tecnologias

### Frontend Core
- **React 18.3.1** - Biblioteca principal com Hooks modernos
- **TypeScript 5.8.3** - Tipagem estática e desenvolvimento seguro
- **Vite 5.4.19** - Build tool rápido com HMR
- **React Router 6.30.1** - Roteamento SPA

### Interface & Design
- **Tailwind CSS 3.4.17** - Framework CSS utilitário
- **shadcn/ui** - Componentes acessíveis com Radix UI
- **Lucide React** - Ícones consistentes e modernos
- **Recharts 2.15.4** - Gráficos e visualizações
- **ApexCharts 5.3.5** - Charts avançados

### Estado & API
- **TanStack Query 5.83.0** - Gerenciamento de estado servidor
- **Zod 3.25.76** - Validação de schemas
- **Custom Hooks** - Lógica de negócio reutilizável

---

## 📦 Funcionalidades

### 🎛️ Dashboard
- **Métricas em Tempo Real**: Total de execuções, taxa de sucesso, jobs ativos
- **Gráficos Mensais**: Visualização de tendências e padrões
- **Execuções Recentes**: Lista das últimas automações executadas
- **Cache Inteligente**: Otimização de performance com TTL configurável

### 🔍 Filtros Avançados
- **Por Sistema**: SPI, CRM, Portal, etc.
- **Por Grupo**: WEB, APP, DB, PROXY
- **Por Servidores**: Seleção múltipla específica
- **Busca Textual**: Nome ou descrição de templates
- **Filtros Combinados**: Aplicação simultânea de múltiplos filtros

### ⚙️ Execução de Automações
- **Preview de Alvos**: Visualização dos servidores que serão afetados
- **Confirmação Segura**: Modal com detalhes antes da execução
- **Logs em Tempo Real**: Acompanhamento do progresso
- **Histórico Completo**: Acesso a execuções anteriores

### 🔐 Segurança & Autenticação
- **Login Seguro**: Autenticação via credenciais AWX
- **Sessões Temporárias**: Cookies com expiração de 10 minutos
- **Basic Authentication**: Integração nativa com AWX
- **Logout Automático**: Limpeza de sessão ao expirar

---

## 🛠️ Instalação

### Pré-requisitos
- **Node.js** 18.0.0 ou superior
- **npm** 9.0.0 ou superior
- **Git** 2.30.0 ou superior
- **Servidor AWX** acessível na rede

### Desenvolvimento Local

```bash
# 1. Clone o repositório
git clone https://github.com/marcusborin12/cockpit.git
cd cockpit

# 2. Instale as dependências
npm install

# 3. Configure as variáveis de ambiente
cp .env.example .env
# Edite o arquivo .env com suas configurações

# 4. Execute em modo desenvolvimento
npm run dev
```

A aplicação estará disponível em `http://localhost:8080`

### Build para Produção

```bash
# Build otimizado
npm run build

# Preview local do build
npm run preview

# Linting
npm run lint
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Configuração do AWX API
VITE_AWX_API=http://seu-awx-server:8080

# Configuração de Cache (tempo em minutos)
VITE_CACHE_DASHBOARD_STATS_TTL=5
VITE_CACHE_MONTHLY_DATA_TTL=60
VITE_CACHE_RECENT_EXECUTIONS_TTL=2
VITE_CACHE_VERSION=1.0.1
```

### Proxy de Desenvolvimento

O Vite está configurado para proxy automático em desenvolvimento:
- `localhost:8080/api/*` → `VITE_AWX_API/api/v2/*`

---

## 🔌 API Integration

### Endpoints AWX Utilizados

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/api/v2/me/` | GET | Informações do usuário autenticado |
| `/api/v2/job_templates/` | GET | Lista de templates disponíveis |
| `/api/v2/inventories/` | GET | Inventários por sistema |
| `/api/v2/groups/{id}/hosts/` | GET | Hosts por grupo específico |
| `/api/v2/job_templates/{id}/launch/` | POST | Execução de template |
| `/api/v2/jobs/` | GET | Lista e monitoramento de jobs |
| `/api/v2/jobs/{id}/stdout/` | GET | Logs detalhados de execução |

### Autenticação

A aplicação utiliza **Basic Authentication** com:
- Credenciais do usuário AWX
- Sessões temporárias via cookies (10 min)
- Renovação automática de sessão
- Logout seguro com limpeza de dados

### Tratamento de Erros

- **401 Unauthorized**: Redirecionamento para login
- **403 Forbidden**: Permissões insuficientes
- **404 Not Found**: Recurso não encontrado
- **500 Server Error**: Erro interno do AWX
- **Timeout**: Requisições com limite de 30s

---

## 🚀 Deploy

### Docker Compose

```bash
# Execução com Docker
docker-compose up -d

# Logs
docker-compose logs -f cockpit-automacao
```

### Kubernetes

```bash
# Deploy no cluster
kubectl apply -f k8s-manifests.yaml

# Verificar status
kubectl get pods -l app=cockpit-automacao
```

Para configurações detalhadas, consulte:
- [`KUBERNETES.md`](KUBERNETES.md) - Deploy em Kubernetes
- [`DEPLOYMENT-v1.0.0.md`](DEPLOYMENT-v1.0.0.md) - Guia completo de deploy

---

## 📊 Performance

### Métricas de Build
- **Bundle Size**: ~1.15MB (330KB gzipped)
- **Build Time**: ~10s
- **Chunks**: Otimizado para cache
- **Tree Shaking**: Código não utilizado removido

### Otimizações
- **Code Splitting**: Carregamento lazy de rotas
- **API Caching**: Cache com TTL configurável
- **Image Optimization**: Lazy loading de imagens
- **Bundle Analysis**: Análise de dependências

---

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm run test

# Cobertura
npm run test:coverage

# Linting
npm run lint
```

### Teste de Conectividade

A aplicação inclui uma ferramenta de debug integrada:
1. Acesse `/debug` na aplicação
2. Execute os testes de conectividade AWX
3. Verifique logs detalhados no console

---

## 📈 Monitoramento

### Logs da Aplicação
- **Console**: Logs estruturados em desenvolvimento
- **Network**: Monitoramento de requisições
- **Performance**: Métricas de carregamento
- **Errors**: Captura e tratamento de erros

### Health Check
- **Endpoint**: `/health` (quando disponível)
- **Docker**: Health check integrado
- **Kubernetes**: Liveness e readiness probes

---

## 🤝 Contribuição

### Padrões de Desenvolvimento
- **ESLint**: Linting automático
- **TypeScript**: Tipagem obrigatória
- **Prettier**: Formatação consistente
- **Conventional Commits**: Padronização de commits

### Estrutura do Projeto
```
src/
├── components/     # Componentes reutilizáveis
├── pages/         # Páginas/rotas da aplicação
├── services/      # Serviços e API calls
├── hooks/         # Custom hooks
├── lib/           # Utilitários e helpers
├── config/        # Configurações
└── types/         # Definições TypeScript
```

---

## 📄 Licença

Este projeto está licenciado sob a [MIT License](LICENSE).

---

## 🔗 Links Úteis

- **Documentação Técnica**: [Wiki do Projeto](../../wiki)
- **Issues**: [GitHub Issues](../../issues)
- **Releases**: [GitHub Releases](../../releases)
- **AWX Documentation**: [AWX Project](https://github.com/ansible/awx)

---

<div align="center">

**Desenvolvido com ❤️ para automação eficiente**

</div>


