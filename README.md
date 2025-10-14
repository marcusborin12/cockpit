# Cockpit de Automação - v1.0.0-beta.1

## 📋 Sobre o Projeto

O **Cockpit de Automação** é uma interface web moderna para gerenciamento e execução de automações através do AWX/Ansible Tower. 

### 🚀 Status: **BETA** - Pronto para Produção

Esta versão beta inclui todas as funcionalidades principais:
- ✅ Filtros avançados (Sistema, Grupo, Servidores múltiplos)
- ✅ Execução de Job Templates
- ✅ Monitoramento em tempo real
- ✅ Interface responsiva e moderna
- ✅ Integração completa com AWX API

## 🛠️ Como Desenvolver

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Git

### Instalação Local
```bash
# Clone o repositório
git clone https://github.com/marcusborin12/cockpit.git

# Navegue para o diretório
cd cockpit

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev
```

### Build para Produção
```bash
# Build da aplicação
npm run build

# Preview do build local
npm run preview
```

### Deploy
Consulte os arquivos de documentação:
- `KUBERNETES.md` - Deploy em Kubernetes/minikube/k3s
- `docker-compose.yml` - Execução local com Docker
- `Dockerfile` - Containerização da aplicação

## 🛠️ Tecnologias

Este projeto foi construído com:

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: shadcn/ui + Tailwind CSS + Lucide Icons
- **Estado**: React Hooks + Custom Hooks
- **API**: AWX/Ansible Tower REST API
- **Roteamento**: React Router
- **Build**: Vite com Hot Reload

## 📦 Funcionalidades Principais

### 🎯 Filtros Inteligentes
- **Sistema**: Filtra automações por sistema (SPI, CRM, etc.)
- **Grupo**: Filtra por grupos de servidores (WEB, APP, DB)
- **Servidores**: Seleção múltipla de servidores específicos
- **Busca textual**: Pesquisa por nome ou descrição

### 🚀 Execução de Automações
- Interface limpa com botões discretos
- Modal de confirmação com preview dos alvos
- Limite automático baseado nos filtros:
  - Servidores específicos → `limit=server1,server2`
  - Grupo completo → `limit=grupo`
  - Todo inventário → sem limit

### 📊 Visualização
- Cards responsivos com informações estruturadas
- Tabela de servidores com scroll (máx 5 linhas)
- Status em tempo real dos jobs
- Badges de filtros ativos

## 🔧 Integração AWX

### Endpoints Utilizados
- `/api/v2/job_templates/` - Listagem de templates
- `/api/v2/inventories/` - Inventários por sistema
- `/api/v2/groups/{id}/hosts/` - Hosts por grupo
- `/api/v2/job_templates/{id}/launch/` - Execução

### Autenticação
Configurado para usar token de autenticação AWX via variáveis de ambiente.


