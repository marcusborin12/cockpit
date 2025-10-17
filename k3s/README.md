# 🚀 Cockpit K3s - Estrutura Sanitizada

Esta é a estrutura organizada e sanitizada para deploy do Cockpit Automação no K3s.

## 📁 Estrutura de Diretórios

```
k3s/
├── manifests/          # Manifests Kubernetes organizados
│   ├── 01-namespace.yaml      # Namespace dedicado
│   ├── 02-configmap.yaml      # Configurações da aplicação
│   ├── 03-deployment.yaml     # Deployment principal
│   ├── 04-service.yaml        # Service ClusterIP
│   └── 05-ingress.yaml        # Ingress para acesso externo
├── scripts/            # Scripts de deploy
│   ├── deploy-cockpit.ps1     # Deploy PowerShell (Windows)
│   ├── deploy-cockpit.sh      # Deploy Bash (Linux/Mac)
│   ├── deploy-k3s-simple.ps1 # Script legado (mantido)
│   ├── deploy-k3s.ps1         # Script legado (mantido)
│   └── deploy-k3s.sh          # Script legado (mantido)
└── docs/               # Documentação
    ├── DEPLOYMENT-v1.0.0.md
    ├── K3S-DEPLOY.md
    └── KUBERNETES.md
```

## 🎯 Deploy Rápido

### PowerShell (Windows)
```powershell
# Deploy padrão
.\k3s\scripts\deploy-cockpit.ps1

# Deploy com parâmetros customizados
.\k3s\scripts\deploy-cockpit.ps1 -ImageTag "1.0.3" -AwxApi "http://meu-awx:8080"

# Atualizar apenas configuração
.\k3s\scripts\deploy-cockpit.ps1 -UpdateConfig -AwxApi "http://novo-awx:8080"
```

### Bash (Linux/Mac)
```bash
# Deploy padrão
./k3s/scripts/deploy-cockpit.sh

# Deploy com parâmetros
./k3s/scripts/deploy-cockpit.sh "1.0.3" "http://meu-awx:8080"
```

## 📋 Deploy Manual

Se preferir fazer o deploy manual:

```bash
# 1. Aplicar todos os manifests em ordem
kubectl apply -f k3s/manifests/

# 2. Aguardar deployment
kubectl rollout status deployment/cockpit-automacao -n cockpit

# 3. Verificar status
kubectl get all -n cockpit
```

## 🔧 Configuração Personalizada

### Alterar URL do AWX
```bash
# Método 1: Via script
.\k3s\scripts\deploy-cockpit.ps1 -UpdateConfig -AwxApi "http://nova-url:8080"

# Método 2: Patch manual
kubectl patch configmap cockpit-config -n cockpit --patch='{"data":{"VITE_AWX_API":"http://nova-url:8080"}}'
kubectl rollout restart deployment/cockpit-automacao -n cockpit
```

### Alterar tag da imagem
```bash
# Editar o arquivo k3s/manifests/03-deployment.yaml
# Ou usar o script com -ImageTag
```

## 🌐 Acesso à Aplicação

- **Via Ingress**: `http://cockpit.local` ou `http://localhost/cockpit`
- **Port Forward**: `kubectl port-forward -n cockpit svc/cockpit-service 8080:80`

## 📊 Monitoramento

```bash
# Logs da aplicação
kubectl logs -n cockpit -l app=cockpit-automacao -f

# Status dos pods
kubectl get pods -n cockpit

# Descrição completa
kubectl describe deployment cockpit-automacao -n cockpit
```

## 🛠️ Troubleshooting

### Problemas comuns:
1. **ConfigMap não aplicado**: Restart do deployment
2. **Imagem não encontrada**: Verificar se a imagem existe localmente
3. **Ingress não funciona**: Verificar se nginx-ingress está instalado no cluster

### Comandos úteis:
```bash
# Restart completo
kubectl rollout restart deployment/cockpit-automacao -n cockpit

# Deletar e recriar
kubectl delete -f k3s/manifests/
kubectl apply -f k3s/manifests/

# Verificar eventos
kubectl get events -n cockpit --sort-by='.lastTimestamp'
```

## 🔄 Migração da Estrutura Antiga

Os arquivos antigos foram reorganizados:
- ✅ `k8s-*.yaml` → `manifests/*.yaml` (separados e organizados)
- ✅ Scripts movidos para `scripts/`
- ✅ Namespace dedicado criado
- ✅ Labels padronizados
- ✅ Segurança melhorada
- ✅ Porta corrigida (80 em vez de 8080)

## 📝 Principais Melhorias

1. **Namespace dedicado**: Isolamento dos recursos
2. **Manifests separados**: Mais fácil de manter
3. **Labels consistentes**: Melhor organização
4. **Segurança hardened**: SecurityContext, probes, recursos limitados
5. **Scripts simplificados**: Deploy em um comando
6. **Porta corrigida**: Nginx padrão (80)
7. **Estrutura modular**: Fácil de customizar