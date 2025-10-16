# Cockpit de Automação - Deployment Kubernetes

Este documento descreve como fazer o deploy do Cockpit de Automação em clusters Kubernetes (minikube, k3s, etc.).

## 📋 Pré-requisitos

- Docker instalado e funcionando
- kubectl configurado para seu cluster
- Cluster Kubernetes rodando (minikube, k3s, etc.)

## 🚀 Deploy Rápido

### Opção 1: Script Automatizado
```bash
# Torna o script executável
chmod +x deploy.sh

# Executa o deploy completo
./deploy.sh
```

### Opção 2: Manual

#### 1. Build da imagem
```bash
docker build -t cockpit-automacao:1.0.2 .
```

#### 2. Carregar no cluster

**Para minikube:**
```bash
# Configura Docker para usar daemon do minikube
eval $(minikube docker-env)
docker build -t cockpit-automacao:1.0.2 .
```

**Para k3s:**
```bash
# Importa imagem no k3s
docker save cockpit-automacao:1.0.2 | k3s ctr images import -
```

**Para clusters remotos:**
```bash
# Tag para registry
docker tag cockpit-automacao:1.0.2 your-registry/cockpit-automacao:1.0.2
# Push para registry
docker push your-registry/cockpit-automacao:1.0.2
# Atualizar image no k8s-manifests.yaml
```

#### 3. Deploy
```bash
kubectl apply -f k8s-manifests.yaml
```

#### 4. Verificar status
```bash
kubectl get pods -l app=cockpit-automacao
kubectl get services -l app=cockpit-automacao
kubectl get ingress cockpit-automacao-ingress
```

## 🌐 Acessando a Aplicação

### Via Ingress (Recomendado)
1. Adicione ao `/etc/hosts` (Linux/Mac) ou `C:\Windows\System32\drivers\etc\hosts` (Windows):
   ```
   127.0.0.1 cockpit.local
   ```

2. Acesse: http://cockpit.local

### Via Port Forward
```bash
kubectl port-forward service/cockpit-automacao-service 8080:8080
```
Acesse: http://localhost:8080

### Via NodePort (para clusters sem Ingress Controller)
```bash
# Editar service para usar NodePort
kubectl patch service cockpit-automacao-service -p '{"spec":{"type":"NodePort"}}'
# Ver porta atribuída
kubectl get service cockpit-automacao-service
```

## ⚙️ Configurações

### Variáveis de Ambiente
Edite o arquivo `k8s-manifests.yaml` para ajustar:

```yaml
env:
- name: VITE_AWX_API
  value: "http://SEU-AWX-SERVER:8080"
```

### Recursos
Ajuste recursos conforme necessário:
```yaml
resources:
  requests:
    memory: "128Mi"
    cpu: "100m"
  limits:
    memory: "256Mi"
    cpu: "250m"
```

### Réplicas
Para alta disponibilidade:
```yaml
spec:
  replicas: 3  # Ajuste conforme necessário
```

## 🔧 Comandos Úteis

### Logs
```bash
# Ver logs em tempo real
kubectl logs -l app=cockpit-automacao -f

# Logs de pod específico
kubectl logs pod-name -f
```

### Scaling
```bash
# Escalar para 3 réplicas
kubectl scale deployment cockpit-automacao --replicas=3
```

### Atualização
```bash
# Atualizar imagem
kubectl set image deployment/cockpit-automacao cockpit-automacao=cockpit-automacao:1.0.3

# Restart deployment
kubectl rollout restart deployment/cockpit-automacao
```

### Debug
```bash
# Describe deployment
kubectl describe deployment cockpit-automacao

# Describe pods
kubectl describe pods -l app=cockpit-automacao

# Exec no container
kubectl exec -it deployment/cockpit-automacao -- /bin/sh
```

### Remover
```bash
# Remover tudo
kubectl delete -f k8s-manifests.yaml

# Remover apenas deployment
kubectl delete deployment cockpit-automacao

# Remover apenas service
kubectl delete service cockpit-automacao-service
```

## 🐛 Troubleshooting

### Pod não inicia
```bash
# Ver eventos
kubectl get events --sort-by=.metadata.creationTimestamp

# Describe pod
kubectl describe pod POD-NAME

# Ver logs de inicialização
kubectl logs POD-NAME --previous
```

### Problema de rede
```bash
# Testar conectividade interna
kubectl run debug --image=busybox -it --rm -- /bin/sh
# Dentro do pod:
# nslookup cockpit-automacao-service
# wget -qO- http://cockpit-automacao-service:8080/health
```

### Ingress não funciona
```bash
# Verificar ingress controller
kubectl get pods -n ingress-nginx

# Para minikube, habilitar ingress
minikube addons enable ingress

# Para k3s, verificar traefik
kubectl get pods -n kube-system | grep traefik
```

## 📊 Monitoramento

### Health Checks
A aplicação expõe endpoint de health em `/health`:
```bash
curl http://localhost:8080/health
```

### Métricas
Para monitoramento avançado, considere adicionar:
- Prometheus metrics
- Grafana dashboards
- Jaeger tracing

## 🔒 Segurança

O deployment inclui várias práticas de segurança:
- ✅ Non-root user
- ✅ ReadOnlyRootFilesystem
- ✅ Security contexts
- ✅ Resource limits
- ✅ Health checks
- ✅ Network policies (opcional)

## 📝 Notas

- A aplicação roda na porta 8080 (não privilegiada)
- Usa nginx para servir arquivos estáticos
- Proxy reverso para API do AWX
- Suporte a CORS configurado
- Cache otimizado para assets estáticos