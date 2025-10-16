# 🔧 Gestão Simplificada de Variáveis de Ambiente

Este documento explica como gerenciar facilmente as variáveis de ambiente da aplicação Cockpit no K3s através do **ConfigMap**, sem necessidade de rebuild da aplicação.

## 🚀 **Deploy Inicial**

### Opção 1: Deploy Completo (Recomendado)
```powershell
# Deploy com configurações padrão
.\deploy-k3s-simple.ps1

# Deploy com URL customizada do AWX
.\deploy-k3s-simple.ps1 -AWX_API "http://meu-awx.interno:8080"

# Deploy com tag específica da imagem
.\deploy-k3s-simple.ps1 -ImageTag "v1.2.0"
```

### Opção 2: Deploy Manual
```powershell
# 1. Build da aplicação
docker build -t cockpit:latest .

# 2. Aplicar ConfigMap e Deployment
kubectl apply -f k8s-configmap.yaml
kubectl apply -f k8s-deployment.yaml
```

## ⚙️ **Gestão de Variáveis (Runtime)**

### ✅ **Método Simples: Apenas ConfigMap**
```powershell
# Atualizar apenas as configurações (sem rebuild)
.\deploy-k3s-simple.ps1 -UpdateConfig -AWX_API "http://nova-url:8080"
```

### ✅ **Método Manual: Editando ConfigMap**
```powershell
# 1. Editar o ConfigMap diretamente
kubectl edit configmap cockpit-config

# 2. Reiniciar os pods para aplicar as mudanças
kubectl rollout restart deployment/cockpit-deployment
```

### ✅ **Método Arquivo: Atualizando k8s-configmap.yaml**
```powershell
# 1. Editar o arquivo k8s-configmap.yaml
# 2. Aplicar as mudanças
kubectl apply -f k8s-configmap.yaml

# 3. Reiniciar os pods
kubectl rollout restart deployment/cockpit-deployment
```

## 📊 **Variáveis Disponíveis**

| Variável | Descrição | Valor Padrão | Exemplo |
|----------|-----------|--------------|---------|
| `VITE_AWX_API` | URL da API do AWX | `http://awx-service.awx.svc.cluster.local:8080` | `http://awx.empresa.com:8080` |
| `VITE_CACHE_TTL` | TTL geral do cache (ms) | `300000` | `600000` |
| `VITE_CACHE_MAX_SIZE` | Tamanho máximo do cache | `100` | `200` |
| `VITE_CACHE_DASHBOARD_STATS_TTL` | TTL stats dashboard (min) | `5` | `10` |
| `VITE_CACHE_MONTHLY_DATA_TTL` | TTL dados mensais (min) | `1440` | `2880` |
| `VITE_CACHE_RECENT_EXECUTIONS_TTL` | TTL execuções recentes (min) | `2` | `5` |
| `VITE_ENABLE_TEST_CREDENTIALS` | Habilitar credenciais de teste | `false` | `true` |
| `VITE_LOG_LEVEL` | Nível de log | `info` | `debug` |

## 🔍 **Verificação e Monitoramento**

### Status dos Pods
```powershell
kubectl get pods -l app=cockpit
kubectl describe pod <nome-do-pod>
```

### Verificar ConfigMap
```powershell
kubectl get configmap cockpit-config -o yaml
```

### Logs da Aplicação
```powershell
kubectl logs -l app=cockpit -f
```

### Verificar Configuração Runtime
1. Acesse a aplicação no navegador
2. Abra DevTools (F12)
3. No Console, digite: `console.log(window.__RUNTIME_CONFIG__)`

## 🛠️ **Cenários Comuns**

### 🔄 **Mudança de URL do AWX**
```powershell
# Método mais simples
.\deploy-k3s-simple.ps1 -UpdateConfig -AWX_API "http://novo-awx:8080"
```

### ⚡ **Ajustar Performance do Cache**
```powershell
# Editar ConfigMap manualmente
kubectl edit configmap cockpit-config

# Modificar:
# VITE_CACHE_DASHBOARD_STATS_TTL: "10"  # Aumentar para 10 minutos
# VITE_CACHE_MAX_SIZE: "200"            # Dobrar o tamanho do cache

# Aplicar mudanças
kubectl rollout restart deployment/cockpit-deployment
```

### 🧪 **Habilitar Modo Debug**
```powershell
kubectl patch configmap cockpit-config --patch='{"data":{"VITE_LOG_LEVEL":"debug","VITE_ENABLE_TEST_CREDENTIALS":"true"}}'
kubectl rollout restart deployment/cockpit-deployment
```

### 🔒 **Modo Produção (Desabilitar Debug)**
```powershell
kubectl patch configmap cockpit-config --patch='{"data":{"VITE_LOG_LEVEL":"info","VITE_ENABLE_TEST_CREDENTIALS":"false"}}'
kubectl rollout restart deployment/cockpit-deployment
```

## 📱 **Acesso à Aplicação**

### Port Forward (Desenvolvimento)
```powershell
kubectl port-forward svc/cockpit-service 8080:80
# Acesse: http://localhost:8080
```

### Ingress (Produção)
```yaml
# Exemplo de Ingress para produção
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: cockpit-ingress
spec:
  rules:
  - host: cockpit.empresa.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: cockpit-service
            port:
              number: 80
```

## 💡 **Vantagens do Sistema Runtime**

✅ **Sem Rebuild**: Mudanças de configuração não precisam recompilar a aplicação  
✅ **Flexibilidade**: Diferentes ambientes podem usar a mesma imagem Docker  
✅ **Velocidade**: Mudanças aplicadas em segundos, não minutos  
✅ **Simplicidade**: Um comando PowerShell para atualizar tudo  
✅ **Auditoria**: Todas as mudanças ficam registradas no histórico do Kubernetes  

## 🆘 **Troubleshooting**

### Configuração não aplicou?
```powershell
# Verificar se o ConfigMap foi atualizado
kubectl get configmap cockpit-config -o yaml

# Verificar se os pods foram reiniciados
kubectl get pods -l app=cockpit

# Forçar restart se necessário
kubectl delete pods -l app=cockpit
```

### Aplicação não carrega configuração?
```powershell
# Verificar logs do container
kubectl logs -l app=cockpit

# Verificar se o script de runtime está sendo executado
kubectl exec -it <nome-do-pod> -- cat /usr/share/nginx/html/runtime-config.js
```

### Error: "Failed to fetch"
- Verificar se a URL do AWX está correta no ConfigMap
- Testar conectividade: `kubectl exec -it <pod> -- wget -O- <AWX_URL>/api/v2`