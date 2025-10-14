// Configuração para integração (simplificada)
export const AWX_CONFIG = {
  // URL base (usa proxy em desenvolvimento, URL completa em produção)
  BASE_URL: import.meta.env.DEV 
    ? '/api' 
    : `${import.meta.env.VITE_AWX_API}/api/v2`,
  
  // Timeout para requisições (em milissegundos)
  TIMEOUT: 30000,
  
  // Headers padrão para requisições
  DEFAULT_HEADERS: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  
  // Endpoints da API do AWX
  ENDPOINTS: {
    // Jobs (com barra final - importante para o AWX)
    JOBS: '/jobs/',
    JOB_TEMPLATES: '/job_templates/',
    JOB_LAUNCHES: '/job_templates/{id}/launch/',
    
    // Execuções/Jobs executados
    JOB_EXECUTIONS: '/jobs/',
    JOB_EXECUTION_DETAIL: '/jobs/{id}/',
    JOB_EXECUTION_STDOUT: '/jobs/{id}/stdout/',
    
    // Inventários
    INVENTORIES: '/inventories/',
    HOSTS: '/hosts/',
    
    // Projetos
    PROJECTS: '/projects/',
    
    // Organizações
    ORGANIZATIONS: '/organizations/',
    
    // Credenciais
    CREDENTIALS: '/credentials/',
    
    // Usuários
    USERS: '/users/',
    ME: '/me/',
    
    // Estatísticas do Dashboard
    DASHBOARD_JOBS_GRAPH: '/dashboard/graphs/jobs/',
    ACTIVITY_STREAM: '/activity_stream/',
  },
  
  // Status dos jobs no AWX
  JOB_STATUS: {
    NEW: 'new' as const,
    PENDING: 'pending' as const, 
    WAITING: 'waiting' as const,
    RUNNING: 'running' as const,
    SUCCESSFUL: 'successful' as const,
    FAILED: 'failed' as const,
    ERROR: 'error' as const,
    CANCELED: 'canceled' as const,
  },
  
  // Mapeamento de status para nossa aplicação
  STATUS_MAPPING: {
    successful: 'success',
    failed: 'failed',
    error: 'failed',
    canceled: 'failed',
    running: 'running',
    pending: 'running',
    waiting: 'running',
    new: 'running',
  } as const,
  
  // Configurações de paginação (não utilizadas atualmente - queries sem limite para obter todos os dados)
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 2000,
    MAX_PAGE_SIZE: 2000,
  },
  
  // Intervalos de atualização (em milissegundos)
  REFRESH_INTERVALS: {
    DASHBOARD_STATS: 30000, // 30 seconds
    JOB_EXECUTIONS: 10000,  // 10 seconds
    RUNNING_JOBS: 5000,     // 5 seconds
  },
};

// Tipos TypeScript para AWX
export interface AWXJob {
  id: number;
  name: string;
  description: string;
  status: 'new' | 'pending' | 'waiting' | 'running' | 'successful' | 'failed' | 'error' | 'canceled';
  created: string;
  modified: string;
  started: string | null;
  finished: string | null;
  elapsed: number;
  job_template: number;
  job_template_name?: string;
  inventory: number;
  inventory_name?: string;
  project: number;
  project_name?: string;
  playbook: string;
  failed: boolean;
  result_traceback: string;
}

export interface AWXJobTemplate {
  id: number;
  name: string;
  description: string;
  job_type: 'run' | 'check';
  inventory: number;
  project: number;
  playbook: string;
  created: string;
  modified: string;
  last_job_run?: string;
  last_job_failed?: boolean;
  next_job_run?: string;
  status: string;
}

export interface AWXApiResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface AWXDashboardStats {
  jobs: {
    successful: number;
    failed: number;
    total: number;
    running: number;
  };
  hosts: {
    total: number;
    failed: number;
    unreachable: number;
  };
  inventories: {
    total: number;
    inventory_failed: number;
    inventories_total: number;
  };
  projects: {
    total: number;
    failed: number;
  };
}

// Função helper para construir URLs
export const buildAwxUrl = (endpoint: string, params?: Record<string, string | number>) => {
  const baseUrl = AWX_CONFIG.BASE_URL;
  
  console.log('🔍 Debug buildAwxUrl:', {
    isDev: import.meta.env.DEV,
    viteAwxApi: import.meta.env.VITE_AWX_API,
    baseUrl,
    endpoint
  });
  
  // Se o endpoint já é uma URL completa (para casos especiais), usa ela diretamente
  if (endpoint.includes(baseUrl)) {
    return endpoint;
  }
  
  let url;
  
  if (import.meta.env.DEV) {
    // Em desenvolvimento, usa proxy
    // Se o endpoint já começa com /api/v2, remove o /v2 para usar o proxy
    if (endpoint.startsWith('/api/v2/')) {
      url = endpoint.replace('/api/v2/', '/api/');
    } else if (endpoint.startsWith('/api/v2')) {
      url = endpoint.replace('/api/v2', '/api');
    } else if (endpoint.startsWith('/')) {
      url = `/api${endpoint}`;
    } else {
      url = `/api/${endpoint}`;
    }
  } else {
    // Em produção, usa URL completa
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    url = `${baseUrl}/${cleanEndpoint}`;
  }
  
  // Substitui parâmetros como {id}
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`{${key}}`, String(value));
    });  
  }
  
  console.log('🔗 Building URL:', { baseUrl, endpoint, finalUrl: url });
  return url;
};

// Função helper para obter credenciais de autenticação das sessões
export const getAwxAuthHeaders = () => {
  // Importa dinamicamente para evitar problemas de dependência circular
  const { getSessionCredentials } = require('@/lib/auth-cookies');
  const credentials = getSessionCredentials();
  
  if (!credentials) {
    throw new Error('Sessão de autenticação não encontrada. Faça login novamente.');
  }
  
  return {
    ...AWX_CONFIG.DEFAULT_HEADERS,
    'Authorization': `Basic ${credentials}`,
  };
};