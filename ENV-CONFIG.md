# 🔧 Configuração de Variáveis de Ambiente

A aplicação Cockpit foi configurada para **NÃO usar arquivos `.env`** e utilizar exclusivamente **variáveis de ambiente do sistema**.

## 🎯 **Como funciona:**

### **Prioridade das configurações:**
1. **🥇 Runtime Config** (container/K3s): `window.__RUNTIME_CONFIG__`
2. **🥈 Variáveis do Sistema**: `process.env.VITE_*`
3. **🥉 Padrões hardcoded**: Valores fallback no código

## ⚙️ **Variáveis Disponíveis:**

| Variável | Descrição | Valor Padrão | Exemplo |
|----------|-----------|--------------|---------|
| `VITE_AWX_API` | URL da API do AWX | `http://192.168.15.52:8080` | `http://awx.empresa.com:8080` |
| `VITE_CACHE_DASHBOARD_STATS_TTL` | TTL stats dashboard (min) | `5` | `10` |
| `VITE_CACHE_MONTHLY_DATA_TTL` | TTL dados mensais (min) | `1440` | `2880` |
| `VITE_CACHE_RECENT_EXECUTIONS_TTL` | TTL execuções recentes (min) | `2` | `5` |
| `VITE_CACHE_VERSION` | Versão do cache | `1.0.2` | `1.0.3` |
| `VITE_ENABLE_TEST_CREDENTIALS` | Habilitar credenciais de teste | `false` | `true` |
| `VITE_LOG_LEVEL` | Nível de log | `info` | `debug` |

## 🚀 **Desenvolvimento Local:**

### **PowerShell (Windows):**
```powershell
# Definir variáveis para a sessão
$env:VITE_AWX_API = "http://192.168.15.52:8080"
$env:VITE_LOG_LEVEL = "debug"

# Iniciar desenvolvimento
npm run dev

# OU usar script automático
.\start-with-env-vars.ps1
```

### **Bash (Linux/Mac):**
```bash
# Definir variáveis para a sessão
export VITE_AWX_API="http://192.168.15.52:8080"
export VITE_LOG_LEVEL="debug"

# Iniciar desenvolvimento
npm run dev

# OU usar script automático
./start-with-env-vars.sh
```

### **Permanente no Sistema:**
```powershell
# Windows (PowerShell como Admin)
[Environment]::SetEnvironmentVariable("VITE_AWX_API", "http://192.168.15.52:8080", "User")

# Linux/Mac (adicionar ao ~/.bashrc ou ~/.zshrc)
echo 'export VITE_AWX_API="http://192.168.15.52:8080"' >> ~/.bashrc
```

## 🐳 **Container/Produção:**

### **Docker Run:**
```bash
docker run -e VITE_AWX_API="http://awx:8080" \
           -e VITE_LOG_LEVEL="info" \
           -p 8080:80 \
           cockpit-app:1.0.2
```

### **Docker Compose:**
```yaml
services:
  cockpit:
    image: cockpit-app:1.0.2
    environment:
      - VITE_AWX_API=http://awx:8080
      - VITE_LOG_LEVEL=info
    ports:
      - "8080:80"
```

### **Kubernetes/K3s:**
```yaml
# Já configurado no ConfigMap em k3s/manifests/02-configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: cockpit-config
data:
  VITE_AWX_API: "http://awx-service:8080"
  VITE_LOG_LEVEL: "info"
```

## 🔍 **Verificação:**

### **No Browser (Runtime):**
```javascript
// Console do navegador
console.log(window.__RUNTIME_CONFIG__);
```

### **Durante Development:**
```bash
# As variáveis são mostradas no console do Vite
# Verificar logs do proxy para confirmar URL do AWX
```

## 📁 **Arquivos Relacionados:**

- ✅ **`.env.backup`**: Backup do arquivo .env original (não usado)
- ✅ **`.env.example`**: Exemplo de variáveis (apenas referência)
- ✅ **`vite.config.ts`**: Configurado para não usar .env
- ✅ **`src/config/awx.ts`**: Lógica de prioridade das variáveis
- ✅ **`start-with-env-vars.ps1/.sh`**: Scripts de teste

## ⚠️ **Importante:**

- **Arquivos `.env` são ignorados** pelo Vite e Docker
- **Use apenas variáveis de ambiente do sistema**
- **Em produção, use ConfigMap do K3s** para gerenciar configurações
- **Não commite arquivos `.env`** com credenciais reais

## 🛠️ **Troubleshooting:**

### **Variáveis não carregam:**
```bash
# Verificar se as variáveis estão definidas
echo $VITE_AWX_API  # Linux/Mac
echo $env:VITE_AWX_API  # Windows

# Reiniciar o servidor após definir variáveis
```

### **Proxy não funciona:**
```bash
# Verificar se VITE_AWX_API está correta
# Logs do Vite mostram o target do proxy
```

### **Container não acessa AWX:**
```bash
# Verificar se as variáveis estão no container
kubectl exec -it <pod> -- env | grep VITE_
```