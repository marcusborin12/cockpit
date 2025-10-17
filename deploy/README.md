# 🚀 Deploy da Aplicação Cockpit

Manifests e scripts para deploy da aplicação Cockpit no Kubernetes/K3s.

## 📦 **Configuração Específica**

### **Imagem:** `cockpit-app:1.0.2`
### **Variáveis de Ambiente:**
- `VITE_AWX_API = http://192.168.15.52:8080`
- `VITE_CACHE_DASHBOARD_STATS_TTL = 5`
- `VITE_CACHE_MONTHLY_DATA_TTL = 1440` 
- `VITE_LOG_LEVEL = info`

## 🎯 **Deploy Rápido**

### **Opção 1: Deploy All-in-One (Recomendado)**
```bash
# Deploy completo sem ConfigMap - apenas variáveis de ambiente
kubectl apply -f deploy/cockpit-simple.yaml

# Aguardar ficar pronto
kubectl rollout status deployment/cockpit-automacao -n cockpit
```

### **Opção 2: Scripts Automatizados**

**Windows (PowerShell):**
```powershell
# Deploy padrão
.\deploy\deploy-simple.ps1

# Deploy com imagem customizada
.\deploy\deploy-simple.ps1 -ImageTag "1.0.3"

# Deploy com AWX customizado
.\deploy\deploy-simple.ps1 -AwxApi "http://novo-awx:8080"

# Deploy completo customizado
.\deploy\deploy-simple.ps1 -ImageTag "1.0.3" -AwxApi "http://novo-awx:8080" -Replicas 3
```

**Linux/Mac (Bash):**
```bash
# Deploy padrão
./deploy/deploy-simple.sh

# Deploy com parâmetros customizados
./deploy/deploy-simple.sh "1.0.3" "http://novo-awx:8080" 3
```

## 📁 **Estrutura dos Arquivos**

```
deploy/
├── cockpit-simple.yaml        # ✅ Deploy all-in-one (Namespace + Deployment + Service + Ingress)
├── deploy-simple.ps1          # ✅ Script PowerShell automatizado
├── deploy-simple.sh           # ✅ Script Bash automatizado  
└── README.md                  # Esta documentação
```

### **🎯 Vantagens da Abordagem Simplificada:**
- **✅ Menos complexidade**: Sem ConfigMap para gerenciar
- **✅ Deploy mais rápido**: Apenas 4 recursos K8s (Namespace + Deployment + Service + Ingress)
- **✅ Configuração inline**: Variáveis de ambiente visíveis diretamente no deployment
- **✅ Fácil customização**: Scripts permitem personalizar parâmetros facilmente
- **✅ Menos pontos de falha**: Menor número de recursos reduz chance de erro
- **✅ Manutenção simples**: Um único arquivo YAML para todo o deploy

## 🌐 **Acesso à Aplicação**

Após o deploy bem-sucedido:

### **Via Ingress:**
- **Domínio**: `http://cockpit.local`
- **Path**: `http://cluster-ip/cockpit`

### **Via Port Forward:**
```bash
kubectl port-forward -n cockpit svc/cockpit-service 8080:80
# Acesse: http://localhost:8080
```

### **Via NodePort (se configurado):**
```bash
# Alterar service para NodePort se necessário
kubectl patch svc cockpit-service -n cockpit -p '{"spec":{"type":"NodePort"}}'
```

## 📊 **Monitoramento**

### **Status dos Recursos:**
```bash
# Todos os recursos
kubectl get all -n cockpit

# Apenas pods
kubectl get pods -n cockpit -l app=cockpit-automacao

# Logs em tempo real
kubectl logs -n cockpit -l app=cockpit-automacao -f
```

### **Verificar Configuração:**
```bash
# Variáveis de ambiente no pod
kubectl exec -n cockpit deployment/cockpit-automacao -- env | grep VITE_

# Configuração do deployment
kubectl get deployment cockpit-automacao -n cockpit -o yaml | grep -A 20 env:
```

## 🔧 **Operações Comuns**

### **Atualizar Imagem:**
```bash
kubectl set image deployment/cockpit-automacao cockpit-app=cockpit-app:1.0.3 -n cockpit
kubectl rollout status deployment/cockpit-automacao -n cockpit
```

### **Atualizar Configuração:**
```bash
# Editar deployment para alterar variáveis de ambiente
kubectl edit deployment cockpit-automacao -n cockpit

# Restart para aplicar mudanças
kubectl rollout restart deployment/cockpit-automacao -n cockpit
```

### **Escalar Aplicação:**
```bash
# Aumentar réplicas
kubectl scale deployment cockpit-automacao --replicas=3 -n cockpit

# Verificar status
kubectl get pods -n cockpit
```

## 🛠️ **Troubleshooting**

### **Pod não inicia:**
```bash
# Verificar eventos
kubectl get events -n cockpit --sort-by='.lastTimestamp'

# Descrever pod com problema  
kubectl describe pod <pod-name> -n cockpit

# Logs do pod
kubectl logs <pod-name> -n cockpit
```

### **Aplicação não acessa AWX:**
```bash
# Verificar variáveis de ambiente
kubectl exec -n cockpit deployment/cockpit-automacao -- env | grep VITE_AWX_API

# Testar conectividade com AWX
kubectl exec -n cockpit deployment/cockpit-automacao -- wget -qO- --timeout=5 http://192.168.15.52:8080/api/v2/ping/
```

### **Ingress não funciona:**
```bash
# Verificar se nginx-ingress está rodando
kubectl get pods -n kube-system | grep ingress

# Verificar configuração do ingress
kubectl describe ingress cockpit-ingress -n cockpit
```

## 🗑️ **Remoção Completa**

```bash
# Remover todos os recursos
kubectl delete -f deploy/cockpit-simple.yaml

# OU remover namespace inteiro (remove tudo automaticamente)
kubectl delete namespace cockpit
```

## ⚙️ **Especificações Técnicas**

- **Namespace**: `cockpit`
- **Réplicas**: 2 (configurável)
- **Recursos**: 128Mi RAM / 100m CPU (request), 256Mi RAM / 250m CPU (limit)
- **Porta**: 80 (nginx)
- **Health Checks**: Liveness, Readiness e Startup probes configurados
- **Segurança**: SecurityContext hardened, non-root user
- **Volumes**: EmptyDir para /tmp, cache nginx e PID files