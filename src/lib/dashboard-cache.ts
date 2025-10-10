/**
 * Sistema de cache para dados do dashboard AWX
 * Implementa cache no localStorage com controles de expiração e validação
 */

interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expires: number;
  version: string;
}

interface CacheConfig {
  key: string;
  ttl: number; // Time to live em minutos
  version?: string;
}

class DashboardCache {
  private readonly CACHE_VERSION = '1.0.0';
  private readonly CACHE_PREFIX = 'awx_dashboard_';

  /**
   * Configurações de cache por tipo de dados
   */
  private readonly CACHE_CONFIGS = {
    dashboardStats: {
      key: 'dashboard_stats',
      ttl: 5, // 5 minutos para estatísticas
      version: this.CACHE_VERSION,
    },
    monthlyData: {
      key: 'monthly_data',
      ttl: 60, // 60 minutos para dados mensais (mudam menos)
      version: this.CACHE_VERSION,
    },
    recentExecutions: {
      key: 'recent_executions',
      ttl: 2, // 2 minutos para execuções recentes
      version: this.CACHE_VERSION,
    },
  } as const;

  /**
   * Gera a chave completa do cache
   */
  private getCacheKey(config: CacheConfig): string {
    return `${this.CACHE_PREFIX}${config.key}`;
  }

  /**
   * Verifica se uma entrada de cache é válida
   */
  private isValidCacheEntry<T>(entry: CacheEntry<T>, config: CacheConfig): boolean {
    const now = Date.now();
    
    // Verifica se não expirou
    if (now > entry.expires) {
      console.log(`🗑️ Cache expirado para ${config.key}`);
      return false;
    }

    // Verifica compatibilidade de versão
    if (entry.version !== (config.version || this.CACHE_VERSION)) {
      console.log(`🔄 Versão de cache incompatível para ${config.key}`);
      return false;
    }

    return true;
  }

  /**
   * Obtém dados do cache
   */
  get<T>(type: keyof typeof this.CACHE_CONFIGS): T | null {
    const config = this.CACHE_CONFIGS[type];
    const cacheKey = this.getCacheKey(config);

    try {
      const cached = localStorage.getItem(cacheKey);
      if (!cached) {
        console.log(`📭 Cache miss para ${type}`);
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      if (!this.isValidCacheEntry(entry, config)) {
        // Remove cache inválido
        this.remove(type);
        return null;
      }

      const ageMinutes = Math.round((Date.now() - entry.timestamp) / (1000 * 60));
      console.log(`📦 Cache hit para ${type} (${ageMinutes}min atrás)`);
      
      return entry.data;
    } catch (error) {
      console.error(`❌ Erro ao ler cache para ${type}:`, error);
      this.remove(type);
      return null;
    }
  }

  /**
   * Armazena dados no cache
   */
  set<T>(type: keyof typeof this.CACHE_CONFIGS, data: T): void {
    const config = this.CACHE_CONFIGS[type];
    const cacheKey = this.getCacheKey(config);
    const now = Date.now();

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expires: now + (config.ttl * 60 * 1000), // TTL em milissegundos
      version: config.version || this.CACHE_VERSION,
    };

    try {
      localStorage.setItem(cacheKey, JSON.stringify(entry));
      console.log(`💾 Dados cacheados para ${type} (expira em ${config.ttl}min)`);
    } catch (error) {
      console.error(`❌ Erro ao salvar cache para ${type}:`, error);
      
      // Se localStorage está cheio, tenta limpar cache antigo
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.clearExpired();
        // Tenta novamente após limpeza
        try {
          localStorage.setItem(cacheKey, JSON.stringify(entry));
          console.log(`💾 Dados cacheados para ${type} após limpeza`);
        } catch (retryError) {
          console.error(`❌ Falha ao cachear ${type} mesmo após limpeza:`, retryError);
        }
      }
    }
  }

  /**
   * Remove entrada específica do cache
   */
  remove(type: keyof typeof this.CACHE_CONFIGS): void {
    const config = this.CACHE_CONFIGS[type];
    const cacheKey = this.getCacheKey(config);
    localStorage.removeItem(cacheKey);
    console.log(`🗑️ Cache removido para ${type}`);
  }

  /**
   * Limpa cache expirado
   */
  clearExpired(): void {
    let removedCount = 0;
    const now = Date.now();

    // Verifica todas as chaves que começam com nosso prefixo
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.CACHE_PREFIX)) {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry = JSON.parse(cached);
            if (now > entry.expires) {
              localStorage.removeItem(key);
              removedCount++;
            }
          }
        } catch (error) {
          // Remove entradas corrompidas
          localStorage.removeItem(key);
          removedCount++;
        }
      }
    }

    if (removedCount > 0) {
      console.log(`🧹 Limpeza de cache: ${removedCount} entradas removidas`);
    }
  }

  /**
   * Limpa todo o cache do dashboard
   */
  clearAll(): void {
    Object.keys(this.CACHE_CONFIGS).forEach(type => {
      this.remove(type as keyof typeof this.CACHE_CONFIGS);
    });
    console.log('🧹 Todo o cache do dashboard foi limpo');
  }

  /**
   * Obtém informações sobre o cache
   */
  getInfo(): Record<string, { cached: boolean; age?: number; expires?: number }> {
    const info: Record<string, { cached: boolean; age?: number; expires?: number }> = {};
    const now = Date.now();

    Object.entries(this.CACHE_CONFIGS).forEach(([type, config]) => {
      const cacheKey = this.getCacheKey(config);
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const entry: CacheEntry = JSON.parse(cached);
          const ageMinutes = Math.round((now - entry.timestamp) / (1000 * 60));
          const expiresMinutes = Math.round((entry.expires - now) / (1000 * 60));
          
          info[type] = {
            cached: true,
            age: ageMinutes,
            expires: expiresMinutes,
          };
        } catch (error) {
          info[type] = { cached: false };
        }
      } else {
        info[type] = { cached: false };
      }
    });

    return info;
  }

  /**
   * Inicializa o sistema de cache
   * Remove entradas expiradas na inicialização
   */
  init(): void {
    console.log('🚀 Inicializando sistema de cache do dashboard');
    this.clearExpired();
    
    // Log do estado atual do cache
    const info = this.getInfo();
    console.log('📊 Estado do cache:', info);
  }
}

// Exporta instância singleton
export const dashboardCache = new DashboardCache();

// Inicializa o cache quando o módulo é carregado
dashboardCache.init();