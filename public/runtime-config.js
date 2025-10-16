// Configuração runtime para desenvolvimento local (opcional)
window.__RUNTIME_CONFIG__ = {
  VITE_AWX_API: "http://localhost:8080",
  VITE_CACHE_TTL: "300000",
  VITE_CACHE_MAX_SIZE: "100", 
  VITE_ENABLE_TEST_CREDENTIALS: "true",
  VITE_LOG_LEVEL: "debug"
};

console.log('🔧 Runtime Config carregado (local):', window.__RUNTIME_CONFIG__);