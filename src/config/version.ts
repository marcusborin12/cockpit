export const VERSION_INFO = {
  version: '1.0.1',
  buildDate: new Date().toISOString().split('T')[0],
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  features: [
    'Sistema de autenticação AWX integrado',
    'Perfil de usuário no header superior',
    'Logs detalhados de execução de jobs',
    'Filtros avançados (Sistema, Grupo, Servidores)',
    'Execução de Job Templates AWX',
    'Interface responsiva moderna',
    'Seleção múltipla de servidores',
    'Monitoramento em tempo real',
    'Integração completa AWX API',
    'Exceção para playbooks SERVER (sempre visíveis)',
    'Modal de logs com busca e filtros',
    'Rotas protegidas por autenticação'
  ],
  status: 'STABLE - Versão de Produção'
} as const;

export const getVersionString = () => {
  return `v${VERSION_INFO.version} (${VERSION_INFO.buildDate})`;
};

export const getBuildInfo = () => {
  return {
    version: VERSION_INFO.version,
    buildDate: VERSION_INFO.buildDate,
    environment: VERSION_INFO.environment,
    status: VERSION_INFO.status
  };
};