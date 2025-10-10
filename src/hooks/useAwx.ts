import { useState, useEffect, useCallback } from 'react';
import { awxService } from '@/services/awx';
import { dashboardCache } from '@/lib/dashboard-cache';

// Hook para estatísticas do dashboard
export const useAwxDashboardStats = (autoRefresh: boolean = true) => {
  const [stats, setStats] = useState({
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    successRate: 0,
    failureRate: 0,
    runningExecutions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setError(null);
      
      // Tenta usar cache primeiro (se não for refresh forçado)
      if (!forceRefresh) {
        const cachedStats = dashboardCache.get('dashboardStats') as typeof stats | null;
        if (cachedStats) {
          setStats(cachedStats);
          setLastUpdated(new Date());
          setLoading(false);
          console.log('📦 Dashboard stats carregadas do cache');
          return;
        }
      }
      
      setLoading(true);
      const data = await awxService.getDashboardStats(); // Últimos 12 meses
      
      // Salva no cache
      dashboardCache.set('dashboardStats', data);
      
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      // Ignore se o erro for de abortar requisição (component unmount)
      if (err instanceof Error && err.name === 'AbortError') return;
      
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      console.error('Erro ao buscar estatísticas do AWX:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadStats = async () => {
      if (mounted) {
        await fetchStats();
      }
    };
    
    loadStats();
    
    return () => {
      mounted = false;
    };
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchStats();
    }, 60000); // Atualiza a cada 60 segundos
    
    return () => clearInterval(interval);
  }, [fetchStats, autoRefresh]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refetch: () => fetchStats(false),
    forceRefresh: () => fetchStats(true),
  };
};

// Hook para dados do gráfico mensal
export const useAwxMonthlyData = () => {
  const [data, setData] = useState({
    labels: [] as string[],
    executions: [] as number[],
    failedExecutions: [] as number[],
    failureRates: [] as number[],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setError(null);
      
      // Tenta usar cache primeiro (se não for refresh forçado)
      if (!forceRefresh) {
        const cachedData = dashboardCache.get('monthlyData') as typeof data | null;
        if (cachedData) {
          setData(cachedData);
          setLoading(false);
          console.log('📦 Dados mensais carregados do cache');
          return;
        }
      }
      
      setLoading(true);
      const monthlyData = await awxService.getMonthlyExecutions(12);
      
      // Salva no cache
      dashboardCache.set('monthlyData', monthlyData);
      
      setData(monthlyData);
    } catch (err) {
      // Ignore se o erro for de abortar requisição (component unmount)
      if (err instanceof Error && err.name === 'AbortError') return;
      
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados mensais');
      console.error('Erro ao buscar dados mensais do AWX:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (mounted) {
        await fetchData();
      }
    };
    
    loadData();
    
    return () => {
      mounted = false;
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(false),
    forceRefresh: () => fetchData(true),
  };
};

// Hook para execuções recentes
export const useAwxRecentExecutions = (limit: number = 10, autoRefresh: boolean = true) => {
  const [executions, setExecutions] = useState<Array<{
    id: number;
    name: string;
    status: 'success' | 'failed' | 'running';
    time: string;
    duration?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExecutions = useCallback(async (forceRefresh: boolean = false) => {
    try {
      setError(null);
      
      // Tenta usar cache primeiro (se não for refresh forçado)
      if (!forceRefresh) {
        const cachedExecutions = dashboardCache.get('recentExecutions') as typeof executions | null;
        if (cachedExecutions) {
          setExecutions(cachedExecutions);
          setLoading(false);
          console.log('📦 Execuções recentes carregadas do cache');
          return;
        }
      }
      
      setLoading(true);
      const data = await awxService.getRecentExecutions(limit);
      
      // Salva no cache
      dashboardCache.set('recentExecutions', data);
      
      setExecutions(data);
    } catch (err) {
      // Ignore se o erro for de abortar requisição (component unmount)
      if (err instanceof Error && err.name === 'AbortError') return;
      
      setError(err instanceof Error ? err.message : 'Erro ao buscar execuções recentes');
      console.error('Erro ao buscar execuções recentes do AWX:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    let mounted = true;
    
    const loadExecutions = async () => {
      if (mounted) {
        await fetchExecutions();
      }
    };
    
    loadExecutions();
    
    return () => {
      mounted = false;
    };
  }, [fetchExecutions]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchExecutions();
    }, 30000); // Atualiza a cada 30 segundos
    
    return () => clearInterval(interval);
  }, [fetchExecutions, autoRefresh]);

  return {
    executions,
    loading,
    error,
    refetch: () => fetchExecutions(false),
    forceRefresh: () => fetchExecutions(true),
  };
};

// Hook para teste de conexão
export const useAwxConnection = () => {
  const [status, setStatus] = useState<{
    connected: boolean;
    version?: string;
    error?: string;
    testing: boolean;
  }>({
    connected: false,
    testing: true,
  });

  const testConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, testing: true }));
    
    try {
      const result = await awxService.testConnection();
      setStatus({
        connected: result.connected,
        version: result.version,
        error: result.error,
        testing: false,
      });
    } catch (err) {
      setStatus({
        connected: false,
        error: err instanceof Error ? err.message : 'Erro de conexão',
        testing: false,
      });
    }
  }, []);

  useEffect(() => {
    testConnection();
  }, [testConnection]);

  return {
    ...status,
    refetch: testConnection,
  };
};

// Hook combinado para todos os dados do dashboard
export const useAwxDashboard = () => {
  const statsHook = useAwxDashboardStats(false); // Desabilita auto-refresh
  const monthlyHook = useAwxMonthlyData();
  const executionsHook = useAwxRecentExecutions(10, false); // Desabilita auto-refresh
  const connectionHook = useAwxConnection();

  const isLoading = statsHook.loading || monthlyHook.loading || executionsHook.loading;
  const hasError = statsHook.error || monthlyHook.error || executionsHook.error || connectionHook.error;

  const refetchAll = useCallback(() => {
    statsHook.refetch();
    monthlyHook.refetch();
    executionsHook.refetch();
    connectionHook.refetch();
  }, [statsHook, monthlyHook, executionsHook, connectionHook]);

  return {
    // Dados
    stats: statsHook.stats,
    monthlyData: monthlyHook.data,
    recentExecutions: executionsHook.executions,
    connection: {
      connected: connectionHook.connected,
      version: connectionHook.version,
    },
    
    // Estados
    loading: isLoading,
    error: hasError,
    lastUpdated: statsHook.lastUpdated,
    
    // Ações
    refetch: refetchAll,
  };
};