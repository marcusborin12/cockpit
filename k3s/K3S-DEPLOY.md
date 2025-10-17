# Deploy Cockpit AWX no K3s

Este guia mostra como fazer o deploy da aplicação Cockpit AWX no K3s usando ConfigMaps para configuração.

## 📋 Pré-requisitos

- K3s instalado e funcionando
- Docker instalado
- kubectl configurado
- Acesso ao namespace `default` (ou ajustar scripts)

## 🚀 Deploy Rápido

### Opção 1: Script Automatizado (Windows)
```powershell
# Executar o script PowerShell
.\deploy-k3s.ps1
```

### Opção 2: Script Automatizado (Linux/Mac)
```bash
# Dar permissão de execução
chmod +x deploy-k3s.sh

# Executar deploy completo
./deploy-k3s.sh
```

### Opção 3: Deploy Manual

#### 1. Aplicar ConfigMap
```bash
kubectl apply -f k8s-configmap.yaml
```

#### 2. Build com configurações do ConfigMap
```bash
# Linux/Mac
chmod +x build-with-configmap.sh
./build-with-configmap.sh

# Ou manualmente:
VITE_AWX_API=$(kubectl get configmap cockpit-config -o jsonpath='{.data.VITE_AWX_API}')
docker build --build-arg VITE_AWX_API="$VITE_AWX_API" -t cockpit-awx:latest .
```

#### 3. Importar no K3s
```bash
docker save cockpit-awx:latest | sudo k3s ctr images import -
```

#### 4. Deploy da aplicação
```bash
kubectl apply -f k8s-deployment.yaml
```

#### 5. Acessar a aplicação
```bash
kubectl port-forward service/cockpit-awx-service 8080:80
```

Acesse: http://localhost:8080

## ⚙️ Configuração

### Alterar URL do AWX

Edite o arquivo `k8s-configmap.yaml`:

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cockpit-config
  namespace: default
data:
  VITE_AWX_API: "http://SEU-AWX-SERVER:8080"  # <-- Altere aqui
  VITE_CACHE_DASHBOARD_STATS_TTL: "5"
  VITE_CACHE_MONTHLY_DATA_TTL: "1440"
  VITE_CACHE_RECENT_EXECUTIONS_TTL: "2"
  VITE_CACHE_VERSION: "1.0.1"
```

Após alterar, refaça o deploy:
```bash
kubectl apply -f k8s-configmap.yaml
./deploy-k3s.sh  # ou ./deploy-k3s.ps1 no Windows
```

## 🔍 Verificação e Debug

### Verificar se o ConfigMap foi aplicado
```bash
kubectl get configmap cockpit-config -o yaml
```

### Verificar se a imagem foi construída com as variáveis corretas
```bash
# Verificar se as variáveis foram injetadas no build
docker run --rm cockpit-awx:latest cat /usr/share/nginx/html/assets/index-*.js | grep -o "VITE_AWX_API.*" | head -1
```

### Verificar status dos pods
```bash
kubectl get pods -l app=cockpit-awx
kubectl describe pod -l app=cockpit-awx
```

### Verificar logs
```bash
kubectl logs -l app=cockpit-awx -f
```

### Verificar serviço
```bash
kubectl get service cockpit-awx-service
```

## 🔧 Comandos Úteis

### Reiniciar deployment
```bash
kubectl rollout restart deployment cockpit-awx
```

### Escalar aplicação
```bash
kubectl scale deployment cockpit-awx --replicas=3
```

### Deletar tudo
```bash
kubectl delete -f k8s-deployment.yaml
kubectl delete -f k8s-configmap.yaml
```

### Port-forward para acesso
```bash
kubectl port-forward service/cockpit-awx-service 8080:80
```

## 📁 Arquivos Criados

- `k8s-configmap.yaml` - ConfigMap com configurações da aplicação
- `k8s-deployment.yaml` - Deployment e Service do Kubernetes
- `build-with-configmap.sh` - Script para build usando ConfigMap
- `deploy-k3s.sh` - Script completo de deploy (Linux/Mac)
- `deploy-k3s.ps1` - Script completo de deploy (Windows)

## 🚨 Solução de Problemas

### Problema: "ConfigMap não encontrado"
```bash
kubectl apply -f k8s-configmap.yaml
```

### Problema: "Imagem não encontrada"
```bash
# Rebuildar e reimportar
./build-with-configmap.sh
docker save cockpit-awx:latest | sudo k3s ctr images import -
```

### Problema: "Pods não iniciam"
```bash
# Verificar logs
kubectl describe pod -l app=cockpit-awx
kubectl logs -l app=cockpit-awx
```

### Problema: "Aplicação não carrega"
```bash
# Verificar se o port-forward está ativo
kubectl port-forward service/cockpit-awx-service 8080:80

# Verificar se a aplicação está respondendo
curl http://localhost:8080/health
```