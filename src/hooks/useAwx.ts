import { useState, useEffect, useCallback } from 'react';
import { awxService } from '@/services/awx';

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

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await awxService.getDashboardStats(); // Últimos 12 meses
      setStats(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar estatísticas');
      console.error('Erro ao buscar estatísticas do AWX:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchStats, 60000); // Atualiza a cada 60 segundos
    return () => clearInterval(interval);
  }, [fetchStats, autoRefresh]);

  return {
    stats,
    loading,
    error,
    lastUpdated,
    refetch: fetchStats,
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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const monthlyData = await awxService.getMonthlyExecutions(12);
      setData(monthlyData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar dados mensais');
      console.error('Erro ao buscar dados mensais do AWX:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
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

  const fetchExecutions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await awxService.getRecentExecutions(limit);
      setExecutions(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar execuções recentes');
      console.error('Erro ao buscar execuções recentes do AWX:', err);
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchExecutions();
  }, [fetchExecutions]);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchExecutions, 30000); // Atualiza a cada 30 segundos
    return () => clearInterval(interval);
  }, [fetchExecutions, autoRefresh]);

  return {
    executions,
    loading,
    error,
    refetch: fetchExecutions,
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