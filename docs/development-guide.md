# Guia de Desenvolvimento - Cockpit AWX

Este guia fornece instruções detalhadas para desenvolvedores que desejam contribuir, personalizar ou estender a aplicação Cockpit AWX.

## 🚀 Setup do Ambiente de Desenvolvimento

### Pré-requisitos
- **Node.js**: 18+ (recomendado: 20.x LTS)
- **npm**: 9+ ou **bun**: 1.0+
- **Git**: Para controle de versão
- **VSCode**: Editor recomendado com extensões TypeScript/React

### Instalação
```bash
# Clone o repositório
git clone <repository-url>
cd cockpit

# Instale dependências
npm install
# ou
bun install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações
```

### Configuração do .env
```bash
# Conexão AWX
VITE_AWX_API="http://your-awx-server:8080"

# Credenciais de teste (apenas dev)
VITE_TEST_USERNAME="test_user"
VITE_TEST_PASSWORD="test_password"

# Cache settings
VITE_CACHE_DASHBOARD_STATS_TTL=5
VITE_CACHE_MONTHLY_DATA_TTL=60
VITE_CACHE_RECENT_EXECUTIONS_TTL=2
VITE_CACHE_VERSION=1.0.1
```

### Iniciar Desenvolvimento
```bash
# Servidor de desenvolvimento
npm run dev

# Executar testes
npm run test

# Build para produção
npm run build
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes React
│   ├── ui/             # Design System base
│   └── *.tsx           # Componentes específicos do domínio
├── contexts/           # React Contexts (estado global)
├── hooks/              # Custom Hooks
├── pages/              # Componentes de página/rota
├── services/           # Camada de serviços/API
├── lib/                # Utilitários e helpers
├── config/             # Configurações e constantes
└── integrations/       # Integrações externas
```

### Design Patterns Utilizados

#### 1. Custom Hooks Pattern
```typescript
// hooks/useAutomations.ts
export const useAutomations = () => {
  const [templates, setTemplates] = useState<AWXJobTemplate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await awxService.getJobTemplates();
      setTemplates(data.results);
    } finally {
      setLoading(false);
    }
  }, []);

  return { templates, loading, fetchTemplates };
};
```

#### 2. Service Layer Pattern
```typescript
// services/awx.ts
class AWXService {
  private async makeAuthenticatedRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Lógica centralizada para autenticação e tratamento de erros
  }

  async getJobTemplates(): Promise<AWXApiResponse<AWXJobTemplate>> {
    return this.makeAuthenticatedRequest('/job_templates/');
  }
}
```

#### 3. Context Provider Pattern
```typescript
// contexts/AuthContext.tsx
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  
  const login = async (username: string, password: string) => {
    const userData = await awxService.login(username, password);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 🎨 Sistema de Design

### Componentes Base (shadcn/ui)
A aplicação usa shadcn/ui como base do design system:

```typescript
// components/ui/button.tsx
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground",
        outline: "border border-input hover:bg-accent",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
      },
    },
  }
)
```

### Customização de Temas
```css
/* src/index.css */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    /* ... outras variáveis */
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... variáveis para modo escuro */
  }
}
```

### Componentes Customizados
```typescript
// components/JobStatusBadge.tsx
interface JobStatusBadgeProps {
  status: 'successful' | 'failed' | 'running' | 'pending';
  size?: 'sm' | 'md' | 'lg';
}

export const JobStatusBadge: React.FC<JobStatusBadgeProps> = ({ 
  status, 
  size = 'md' 
}) => {
  const variants = {
    successful: 'bg-green-100 text-green-800 border-green-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    running: 'bg-blue-100 text-blue-800 border-blue-200 animate-pulse',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  };

  return (
    <Badge className={cn(variants[status], sizeVariants[size])}>
      {status}
    </Badge>
  );
};
```

## 🔌 Integração com APIs

### Client HTTP Customizado
```typescript
// lib/api-client.ts
class ApiClient {
  constructor(private baseURL: string) {}

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
        ...options.headers,
      },
      signal: AbortSignal.timeout(30000), // 30s timeout
    });

    if (!response.ok) {
      throw new ApiError(response.status, response.statusText);
    }

    return response.json();
  }

  private getAuthHeaders() {
    const credentials = getSessionCredentials();
    return credentials ? { Authorization: `Basic ${credentials}` } : {};
  }
}
```

### Tratamento de Erros
```typescript
// lib/error-handling.ts
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public details?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
  }
}

export const handleApiError = (error: ApiError) => {
  switch (error.status) {
    case 401:
      // Redirecionar para login
      window.location.href = '/login';
      break;
    case 403:
      toast.error('Você não tem permissão para esta ação');
      break;
    case 500:
      toast.error('Erro interno do servidor');
      break;
    default:
      toast.error(`Erro ${error.status}: ${error.statusText}`);
  }
};
```

## 🧪 Testes

### Configuração do Vitest
```typescript
// vite.config.ts
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  }
});
```

### Setup de Testes
```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock do localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
});

// Mock do fetch
global.fetch = vi.fn();
```

### Exemplo de Teste Unitário
```typescript
// src/lib/utils.test.ts
import { describe, it, expect } from 'vitest';
import { cn } from './utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('bg-red-500', 'text-white', 'p-4');
      expect(result).toBe('bg-red-500 text-white p-4');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toBe('base-class active-class');
    });
  });
});
```

### Exemplo de Teste de Componente
```typescript
// src/components/ui/button.test.tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('should render button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('should apply variant classes correctly', () => {
    render(<Button variant="destructive">Delete</Button>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });
});
```

### Teste de Integração
```typescript
// src/services/awx.test.ts
import { describe, it, expect, vi } from 'vitest';
import { awxService } from './awx';

describe('AWXService', () => {
  it('should handle login successfully', async () => {
    const mockResponse = {
      ok: true,
      json: () => Promise.resolve({
        results: [{ id: 1, username: 'test' }]
      })
    };
    
    vi.mocked(fetch).mockResolvedValueOnce(mockResponse as any);

    const result = await awxService.login('test', 'password');
    expect(result).toEqual({ id: 1, username: 'test' });
  });
});
```

## 📦 Sistema de Cache

### Implementação do Cache
```typescript
// lib/cache.ts
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expires: number;
  version: string;
}

class Cache {
  private readonly prefix = 'awx_cache_';
  private readonly version = '1.0.1';

  set<T>(key: string, data: T, ttlMinutes: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      expires: Date.now() + (ttlMinutes * 60 * 1000),
      version: this.version
    };

    localStorage.setItem(
      this.getKey(key), 
      JSON.stringify(entry)
    );
  }

  get<T>(key: string): T | null {
    const item = localStorage.getItem(this.getKey(key));
    if (!item) return null;

    try {
      const entry: CacheEntry<T> = JSON.parse(item);
      
      // Verifica versão e expiração
      if (entry.version !== this.version || Date.now() > entry.expires) {
        this.remove(key);
        return null;
      }

      return entry.data;
    } catch {
      this.remove(key);
      return null;
    }
  }

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }
}
```

### Uso do Cache em Hooks
```typescript
// hooks/useAwxData.ts
export const useAwxData = <T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (bypassCache = false) => {
    if (!bypassCache) {
      const cached = cache.get<T>(key);
      if (cached) {
        setData(cached);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    try {
      const result = await fetcher();
      cache.set(key, result, ttl);
      setData(result);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, ttl]);

  return { data, loading, fetchData };
};
```

## 🔐 Gerenciamento de Estado

### Context para Autenticação
```typescript
// contexts/AuthContext.tsx
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const AuthContext = createContext<AuthState & AuthActions | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Estado Local com useState
```typescript
// Para estado local simples
const [filters, setFilters] = useState({
  system: '',
  group: '',
  servers: []
});

// Para estado complexo
const [state, dispatch] = useReducer(filtersReducer, initialState);
```

### Estado Derivado com useMemo
```typescript
// Cálculos caros que dependem de props/state
const filteredTemplates = useMemo(() => {
  return templates.filter(template => 
    template.name.includes(searchTerm) &&
    (selectedSystem === '' || template.name.includes(selectedSystem))
  );
}, [templates, searchTerm, selectedSystem]);
```

## 🚀 Build e Deploy

### Configuração de Build
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: process.env.NODE_ENV !== 'production',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-select'],
          charts: ['apexcharts', 'react-apexcharts'],
        },
      },
    },
  },
});
```

### Docker Multi-stage
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage  
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

### Configuração de Proxy (Production)
```nginx
# nginx.conf
server {
    listen 8080;
    
    # Serve static files
    location / {
        root /usr/share/nginx/html;
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy AWX API
    location /api/ {
        proxy_pass ${AWX_API_URL}/api/v2/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 🔍 Debug e Desenvolvimento

### Logging Estruturado
```typescript
// lib/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  constructor(private level: LogLevel = LogLevel.INFO) {}

  debug(message: string, data?: any) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(`🔍 ${message}`, data);
    }
  }

  info(message: string, data?: any) {
    if (this.level <= LogLevel.INFO) {
      console.log(`ℹ️ ${message}`, data);
    }
  }

  error(message: string, error?: Error) {
    console.error(`❌ ${message}`, error);
  }
}

export const logger = new Logger(
  import.meta.env.DEV ? LogLevel.DEBUG : LogLevel.WARN
);
```

### DevTools e Debug
```typescript
// lib/dev-tools.ts
if (import.meta.env.DEV) {
  // Expor funções globais para debug
  (window as any).debugAWX = {
    clearCache: () => cache.clearAll(),
    testConnection: () => awxService.testConnection(),
    getCurrentUser: () => awxService.getCurrentUser(),
    forceRefresh: () => window.location.reload(),
  };
}
```

### Error Boundary
```typescript
// components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<
  PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Error Boundary caught an error', error);
    // Enviar para serviço de monitoramento
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Ops! Algo deu errado</h2>
              <p className="text-muted-foreground mb-4">
                Ocorreu um erro inesperado. Por favor, recarregue a página.
              </p>
              <Button onClick={() => window.location.reload()}>
                Recarregar Página
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🔧 Ferramentas de Desenvolvimento

### ESLint Configuration
```json
// .eslintrc.json
{
  "extends": [
    "@typescript-eslint/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### Prettier Configuration
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "tabWidth": 2,
  "printWidth": 80
}
```

### VSCode Settings
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
```

## 📈 Performance

### Code Splitting
```typescript
// Lazy loading de páginas
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Automations = lazy(() => import('@/pages/Automations'));

// Uso no router
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/automations" element={<Automations />} />
  </Routes>
</Suspense>
```

### Memoization
```typescript
// Componentes pesados
const ExpensiveComponent = memo(({ data, onAction }) => {
  const processedData = useMemo(() => {
    return data.map(item => complexProcessing(item));
  }, [data]);

  const handleAction = useCallback((id: string) => {
    onAction(id);
  }, [onAction]);

  return <div>{/* render */}</div>;
});
```

### Bundle Analysis
```bash
# Analisar bundle
npm run build
npx vite-bundle-analyzer dist

# Ou usando webpack-bundle-analyzer para CRA
npm install -g webpack-bundle-analyzer
webpack-bundle-analyzer dist/static/js/*.js
```

## 🤝 Contribuição

### Git Workflow
```bash
# Feature branch
git checkout -b feature/new-automation-filter
git commit -m "feat: add advanced filtering for automations"
git push origin feature/new-automation-filter

# Pull request e merge
```

### Commit Convention
```
feat: nova funcionalidade
fix: correção de bug
docs: documentação
style: formatação
refactor: refatoração
test: testes
chore: tarefas de manutenção
```

### Code Review Checklist
- [ ] Código segue padrões estabelecidos
- [ ] Testes unitários incluídos
- [ ] Documentação atualizada
- [ ] Performance considerada
- [ ] Acessibilidade verificada
- [ ] Responsividade testada
- [ ] Error handling implementado