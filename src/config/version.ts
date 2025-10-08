export const VERSION_INFO = {
  version: '1.0.0-beta.2',
  buildDate: new Date().toISOString().split('T')[0],
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  features: [
    'Filtros avançados (Sistema, Grupo, Servidores)',
    'Execução de Job Templates AWX',
    'Interface responsiva moderna',
    'Seleção múltipla de servidores',
    'Monitoramento em tempo real',
    'Integração completa AWX API',
    'Exceção para playbooks SERVER (sempre visíveis)'
  ],
  status: 'BETA - Pronto para Produção'
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