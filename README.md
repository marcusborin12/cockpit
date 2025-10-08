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

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/ff916825-3700-4d42-aa86-71960f062368) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

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

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/ff916825-3700-4d42-aa86-71960f062368) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)
