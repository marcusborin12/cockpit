import { 
  AWX_CONFIG, 
  AWXJob, 
  AWXJobTemplate, 
  AWXApiResponse, 
  AWXDashboardStats,
  buildAwxUrl, 
  getAwxAuthHeaders 
} from '@/config/awx';

class AWXService {
  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = buildAwxUrl(endpoint);
    
    try {
      console.log('🔄 AWX Request:', { url, endpoint, options });
      
      const response = await fetch(url, {
        ...options,
        mode: 'cors', // Explicit CORS mode
        headers: {
          ...getAwxAuthHeaders(),
          ...options.headers,
        },
        signal: AbortSignal.timeout(AWX_CONFIG.TIMEOUT),
      });

      console.log('📡 AWX Response:', { 
        url,
        status: response.status, 
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'No response body');
        console.error('❌ AWX API Error:', { url, status: response.status, errorText });
        throw new Error(`AWX API Error: ${response.status} - ${response.statusText}. URL: ${url}. Response: ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ AWX Success:', { url, dataKeys: Object.keys(data) });
      return data;
    } catch (error) {
      console.error('AWX API Request failed:', {
        url,
        error: error instanceof Error ? error.message : error,
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Tratamento específico para erros CORS
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Erro de conectividade: Verifique se o AWX está acessível e se não há problemas de CORS. URL: ' + url);
      }
      
      throw error;
    }
  }

  // ===== JOBS =====
  
  /**
   * Busca todos os jobs executados
   */
  async getJobs(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    order_by?: string;
    created__gte?: string; // Data início (YYYY-MM-DD)
    created__lte?: string; // Data fim (YYYY-MM-DD)
  }): Promise<AWXApiResponse<AWXJob>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const endpoint = `${AWX_CONFIG.ENDPOINTS.JOBS}?${searchParams.toString()}`;
    return this.makeRequest<AWXApiResponse<AWXJob>>(endpoint);
  }

  /**
   * Busca detalhes de um job específico
   */
  async getJobDetail(jobId: number): Promise<AWXJob> {
    const endpoint = buildAwxUrl(AWX_CONFIG.ENDPOINTS.JOB_EXECUTION_DETAIL, { id: jobId });
    return this.makeRequest<AWXJob>(endpoint);
  }

  /**
   * Busca os logs de execução de um job específico
   */
  async getJobLogs(jobId: number): Promise<string> {
    const endpoint = buildAwxUrl(AWX_CONFIG.ENDPOINTS.JOB_EXECUTION_STDOUT, { id: jobId });
    
    try {
      // Para logs, precisamos buscar como texto, não JSON
      const response = await fetch(endpoint, {
        headers: getAwxAuthHeaders(),
        signal: AbortSignal.timeout(AWX_CONFIG.TIMEOUT),
      });

      if (!response.ok) {
        throw new Error(`Erro ao buscar logs do job ${jobId}: ${response.status} ${response.statusText}`);
      }

      const logs = await response.text();
      return logs;
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error);
      throw error;
    }
  }

  /**
   * Busca jobs em execução
   */
  async getRunningJobs(): Promise<AWXApiResponse<AWXJob>> {
    return this.getJobs({
      status: 'running',
      page_size: AWX_CONFIG.PAGINATION.DEFAULT_PAGE_SIZE,
    });
  }

  // ===== JOB TEMPLATES =====
  
  /**
   * Busca todos os job templates
   */
  async getJobTemplates(params?: {
    page?: number;
    page_size?: number;
    name?: string;
  }): Promise<AWXApiResponse<AWXJobTemplate>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const endpoint = `${AWX_CONFIG.ENDPOINTS.JOB_TEMPLATES}?${searchParams.toString()}`;
    return this.makeRequest<AWXApiResponse<AWXJobTemplate>>(endpoint);
  }

  /**
   * Busca job templates filtrados por tecnologia/grupo
   */
  async getJobTemplatesByTechnology(technology: string): Promise<AWXJobTemplate[]> {
    const allTemplates = await this.getJobTemplates({
      page_size: AWX_CONFIG.PAGINATION.MAX_PAGE_SIZE,
    });
    
    // Filtra templates que contenham a tecnologia no nome
    // Exemplo: tecnologia "iis" deve retornar templates como "gsti-iis-restart"
    return allTemplates.results.filter(template => 
      template.name.toLowerCase().includes(`-${technology.toLowerCase()}-`)
    );
  }

  // ===== INVENTÁRIOS =====
  
  /**
   * Busca todos os inventários
   */
  async getInventories(params?: {
    page?: number;
    page_size?: number;
    name?: string;
  }): Promise<AWXApiResponse<any>> {
    const searchParams = new URLSearchParams();
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
    }
    
    const endpoint = `inventories/?${searchParams.toString()}`;
    return this.makeRequest<AWXApiResponse<any>>(endpoint);
  }

  /**
   * Extrai sistemas únicos dos inventários
   * Padrão: nome_da_area-sigla_de_sistema-tipo_de_ambiente-inventario
   */
  async getSystemsFromInventories(): Promise<string[]> {
    const inventories = await this.getInventories({
      page_size: AWX_CONFIG.PAGINATION.MAX_PAGE_SIZE,
    });
    
    const systems = new Set<string>();
    
    inventories.results.forEach(inventory => {
      // Extrai sigla do sistema do nome do inventário
      // Exemplo: "gsti-spi-producao-inventario" -> "spi"
      const nameParts = inventory.name.toLowerCase().split('-');
      if (nameParts.length >= 4 && nameParts[nameParts.length - 1] === 'inventario') {
        const systemSigla = nameParts[1]; // Segunda parte é a sigla
        systems.add(systemSigla.toUpperCase());
      }
    });
    
    return Array.from(systems).sort();
  }

  /**
   * Busca inventários por sigla de sistema
   */
  async getInventoriesBySystem(systemSigla: string): Promise<any[]> {
    const allInventories = await this.getInventories({
      page_size: AWX_CONFIG.PAGINATION.MAX_PAGE_SIZE,
    });
    
    return allInventories.results.filter(inventory => {
      const nameParts = inventory.name.toLowerCase().split('-');
      return nameParts.length >= 4 && 
             nameParts[1] === systemSigla.toLowerCase() && 
             nameParts[nameParts.length - 1] === 'inventario';
    });
  }

  // ===== GRUPOS =====
  
  /**
   * Busca grupos de um inventário específico
   */
  async getInventoryGroups(inventoryId: number): Promise<AWXApiResponse<any>> {
    const endpoint = `inventories/${inventoryId}/groups/`;
    return this.makeRequest<AWXApiResponse<any>>(endpoint);
  }

  /**
   * Busca grupos únicos de todos os inventários de um sistema
   */
  async getGroupsBySystem(systemSigla: string): Promise<string[]> {
    const inventories = await this.getInventoriesBySystem(systemSigla);
    const allGroups = new Set<string>();
    
    // Para cada inventário do sistema, busca seus grupos
    for (const inventory of inventories) {
      try {
        const groups = await this.getInventoryGroups(inventory.id);
        groups.results.forEach(group => {
          // Adiciona apenas o nome do grupo (ex: "iis", "mq", "db")
          if (group.name && group.name !== 'all') {
            allGroups.add(group.name.toLowerCase());
          }
        });
      } catch (error) {
        console.warn(`Erro ao buscar grupos do inventário ${inventory.id}:`, error);
      }
    }
    
    return Array.from(allGroups).sort();
  }

  /**
   * Busca hosts de um inventário específico
   */
  async getInventoryHosts(inventoryId: number): Promise<AWXApiResponse<any>> {
    const endpoint = `inventories/${inventoryId}/hosts/`;
    return this.makeRequest<AWXApiResponse<any>>(endpoint);
  }

  /**
   * Busca hosts de um grupo específico dentro de um inventário
   */
  async getGroupHosts(inventoryId: number, groupId: number): Promise<AWXApiResponse<any>> {
    const endpoint = `inventories/${inventoryId}/groups/${groupId}/hosts/`;
    return this.makeRequest<AWXApiResponse<any>>(endpoint);
  }

  /**
   * Busca hosts agrupados por grupos de um inventário
   */
  async getInventoryHostsByGroups(inventoryId: number, filterGroup?: string): Promise<{ [group: string]: string[] }> {
    try {
      const hostsByGroup: { [group: string]: string[] } = {};
      
      // Busca todos os grupos do inventário
      const groupsResponse = await this.getInventoryGroups(inventoryId);
      
      for (const group of groupsResponse.results) {
        if (group.name && group.name !== 'all') {
          // Se há filtro de grupo, pula grupos que não correspondem
          if (filterGroup && filterGroup !== '__all__' && group.name.toLowerCase() !== filterGroup.toLowerCase()) {
            continue;
          }
          
          try {
            // Busca hosts deste grupo
            const hostsResponse = await this.getGroupHosts(inventoryId, group.id);
            
            if (hostsResponse.results && hostsResponse.results.length > 0) {
              hostsByGroup[group.name] = hostsResponse.results.map((host: any) => host.name);
            }
          } catch (error) {
            console.warn(`Erro ao buscar hosts do grupo ${group.name}:`, error);
          }
        }
      }
      
      // Se não encontrou hosts em grupos específicos, busca todos os hosts do inventário
      if (Object.keys(hostsByGroup).length === 0) {
        try {
          const allHostsResponse = await this.getInventoryHosts(inventoryId);
          if (allHostsResponse.results && allHostsResponse.results.length > 0) {
            hostsByGroup['all'] = allHostsResponse.results.map((host: any) => host.name);
          }
        } catch (error) {
          console.warn('Erro ao buscar todos os hosts do inventário:', error);
        }
      }
      
      return hostsByGroup;
    } catch (error) {
      console.error('Erro ao buscar hosts agrupados:', error);
      return {};
    }
  }

  /**
   * Extrai sistemas únicos dos job templates baseado no padrão de nomenclatura
   * Padrão esperado: area-sistema-acao (ex: gsti-spi-restart)
   * Baseado no padrão de inventário: area-sistema-ambiente-inventario (ex: gsti-spi-producao-inventario)
   */
  getSystemsFromJobTemplates(jobTemplates: AWXJobTemplate[]): string[] {
    const systems = new Set<string>();
    
    jobTemplates.forEach(template => {
      // Extrai a segunda parte do nome (sistema) seguindo o padrão área-sistema-ação
      const nameParts = template.name.split('-');
      if (nameParts.length >= 2) {
        const system = nameParts[1].toUpperCase().trim();
        if (system && system.length > 0) {
          systems.add(system);
        }
      }
    });
    
    return Array.from(systems).sort();
  }

  /**
   * Busca um inventário adequado para execução baseado no sistema
   */
  async getInventoryForExecution(systemSigla?: string): Promise<{ id: number; name: string } | null> {
    try {
      const inventories = await this.getInventories({
        page_size: 500,
      });

      console.log('🔍 Buscando inventário adequado entre', inventories.results.length, 'inventários');

      let targetInventory = null;

      // Se um sistema específico foi selecionado, busca inventário desse sistema
      if (systemSigla && systemSigla !== 'all') {
        console.log('🎯 Buscando inventário para sistema:', systemSigla);
        
        targetInventory = inventories.results.find(inv => {
          const parts = inv.name.toLowerCase().split('-');
          const isSystemMatch = parts.length >= 2 && parts[1] === systemSigla.toLowerCase();
          
          console.log('🔎 Verificando inventário:', inv.name, '- Sistema match:', isSystemMatch);
          return isSystemMatch;
        });
        
        if (targetInventory) {
          console.log('✅ Inventário do sistema encontrado:', {
            id: targetInventory.id,
            name: targetInventory.name,
            system: systemSigla
          });
          return { id: targetInventory.id, name: targetInventory.name };
        }
      }

      // Fallback: busca o primeiro inventário disponível que parece ser de sistema
      console.log('🔄 Buscando inventário padrão...');
      
      // Prioriza inventários que terminam com 'inventario'
      const systemInventories = inventories.results.filter(inv => {
        const name = inv.name.toLowerCase();
        return name.includes('inventario') || name.includes('inventory');
      });

      if (systemInventories.length > 0) {
        targetInventory = systemInventories[0];
        console.log('✅ Inventário padrão encontrado:', {
          id: targetInventory.id,
          name: targetInventory.name
        });
        return { id: targetInventory.id, name: targetInventory.name };
      }

      // Último fallback: primeiro inventário disponível
      if (inventories.results.length > 0) {
        targetInventory = inventories.results[0];
        console.log('⚠️ Usando primeiro inventário disponível:', {
          id: targetInventory.id,
          name: targetInventory.name
        });
        return { id: targetInventory.id, name: targetInventory.name };
      }

      console.error('❌ Nenhum inventário encontrado');
      return null;
    } catch (error) {
      console.error('❌ Erro ao buscar inventário:', error);
      return null;
    }
  }

  /**
   * Executa um job template com inventário adequado selecionado automaticamente
   */
  async launchJobTemplate(
    templateId: number, 
    extraVars?: Record<string, any>,
    options?: {
      systemSigla?: string;
      selectedGroup?: string;
    }
  ): Promise<AWXJob> {
    const endpoint = buildAwxUrl(AWX_CONFIG.ENDPOINTS.JOB_LAUNCHES, { id: templateId });
    
    // Busca o inventário adequado baseado no sistema
    const inventory = await this.getInventoryForExecution(options?.systemSigla);
    
    if (!inventory) {
      throw new Error('Nenhum inventário encontrado para executar a automação. Verifique se existem inventários configurados no AWX.');
    }

    const launchData: any = {
      inventory: inventory.id,
      extra_vars: extraVars || {},
    };

    // Se há um grupo selecionado, adiciona como limit
    if (options?.selectedGroup && options.selectedGroup !== '__all__') {
      launchData.limit = options.selectedGroup;
      console.log('🎯 Executando com limite de grupo:', options.selectedGroup);
    }

    console.log('🚀 Executando job template:', {
      templateId,
      inventoryId: inventory.id,
      inventoryName: inventory.name,
      limit: launchData.limit,
      extraVars: extraVars || {}
    });
    
    return this.makeRequest<AWXJob>(endpoint, {
      method: 'POST',
      body: JSON.stringify(launchData),
    });
  }

  // ===== ESTATÍSTICAS =====
  
  /**
   * Calcula estatísticas do dashboard
   */
  async getDashboardStats(periodDays: number = 30): Promise<{
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
    successRate: number;
    failureRate: number;
    runningExecutions: number;
  }> {
    // Data de início (X dias atrás)
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);
    const startDateStr = startDate.toISOString().split('T')[0];

    // Busca todos os jobs do período
    const allJobs = await this.getJobs({
      page_size: AWX_CONFIG.PAGINATION.MAX_PAGE_SIZE,
      created__gte: startDateStr,
      order_by: '-created',
    });

    // Busca jobs em execução
    const runningJobs = await this.getRunningJobs();

    const totalExecutions = allJobs.count;
    const successfulExecutions = allJobs.results.filter(
      job => job.status === 'successful'
    ).length;
    const failedExecutions = allJobs.results.filter(
      job => ['failed', 'error', 'canceled'].includes(job.status)
    ).length;
    const runningExecutions = runningJobs.count;

    const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions) * 100 : 0;
    const failureRate = totalExecutions > 0 ? (failedExecutions / totalExecutions) * 100 : 0;

    return {
      totalExecutions,
      successfulExecutions,
      failedExecutions,
      successRate: Number(successRate.toFixed(1)),
      failureRate: Number(failureRate.toFixed(1)),
      runningExecutions,
    };
  }

  /**
   * Busca dados para o gráfico de execuções mensais
   */
  async getMonthlyExecutions(months: number = 12): Promise<{
    labels: string[];
    executions: number[];
    failureRates: number[];
  }> {
    try {
      // Primeiro, vamos pegar todos os jobs para entender o período disponível
      const allJobs = await this.getJobs({
        page_size: AWX_CONFIG.PAGINATION.MAX_PAGE_SIZE,
        order_by: '-created',
      });

      console.log('📊 Total jobs encontrados:', allJobs.count);

      if (allJobs.count === 0) {
        // Se não há jobs, retorna dados zerados
        const emptyData = Array.from({ length: months }, (_, i) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (months - 1 - i));
          return {
            label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
            executions: 0,
            failureRate: 0,
          };
        });

        return {
          labels: emptyData.map(d => d.label),
          executions: emptyData.map(d => d.executions),
          failureRates: emptyData.map(d => d.failureRate),
        };
      }

      // Agrupa jobs por mês
      const jobsByMonth = new Map<string, AWXJob[]>();
      
      allJobs.results.forEach(job => {
        const jobDate = new Date(job.created);
        const monthKey = `${jobDate.getFullYear()}-${String(jobDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (!jobsByMonth.has(monthKey)) {
          jobsByMonth.set(monthKey, []);
        }
        jobsByMonth.get(monthKey)!.push(job);
      });

      console.log('📈 Jobs agrupados por mês:', Object.fromEntries(jobsByMonth));

      // Gera dados para os últimos N meses
      const monthlyData = [];
      
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const jobsInMonth = jobsByMonth.get(monthKey) || [];
        
        const successful = jobsInMonth.filter(job => job.status === 'successful').length;
        const failed = jobsInMonth.filter(job => ['failed', 'error', 'canceled'].includes(job.status)).length;
        
        const totalInMonth = jobsInMonth.length;
        const failureRate = totalInMonth > 0 ? (failed / totalInMonth) * 100 : 0;

        monthlyData.push({
          label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          executions: totalInMonth,
          failureRate: Number(failureRate.toFixed(1)),
        });

        console.log(`📅 ${monthKey}:`, { total: totalInMonth, successful, failed, failureRate: failureRate.toFixed(1) });
      }

      return {
        labels: monthlyData.map(d => d.label),
        executions: monthlyData.map(d => d.executions),
        failureRates: monthlyData.map(d => d.failureRate),
      };

    } catch (error) {
      console.error('❌ Erro ao buscar dados mensais:', error);
      
      // Em caso de erro, retorna dados de fallback
      const fallbackData = Array.from({ length: months }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (months - 1 - i));
        return {
          label: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          executions: 0,
          failureRate: 0,
        };
      });

      return {
        labels: fallbackData.map(d => d.label),
        executions: fallbackData.map(d => d.executions),
        failureRates: fallbackData.map(d => d.failureRate),
      };
    }
  }

  /**
   * Busca execuções recentes
   */
  async getRecentExecutions(limit: number = 10): Promise<{
    id: number;
    name: string;
    status: 'success' | 'failed' | 'running';
    time: string;
    duration?: string;
  }[]> {
    const jobs = await this.getJobs({
      page_size: limit,
      order_by: '-created',
    });

    return jobs.results.map(job => {
      const status = AWX_CONFIG.STATUS_MAPPING[job.status] || 'running';
      
      // Calcula tempo relativo
      const createdDate = new Date(job.created);
      const now = new Date();
      const diffMinutes = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60));
      
      let timeText = '';
      if (status === 'running') {
        timeText = 'Executando...';
      } else if (diffMinutes < 1) {
        timeText = 'Agora mesmo';
      } else if (diffMinutes < 60) {
        timeText = `${diffMinutes} min atrás`;
      } else if (diffMinutes < 1440) {
        const hours = Math.floor(diffMinutes / 60);
        timeText = `${hours}h atrás`;
      } else {
        const days = Math.floor(diffMinutes / 1440);
        timeText = `${days}d atrás`;
      }

      // Calcula duração se o job terminou
      let duration;
      if (job.started && job.finished) {
        const startTime = new Date(job.started);
        const endTime = new Date(job.finished);
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationMinutes = Math.floor(durationMs / (1000 * 60));
        const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);
        
        if (durationMinutes > 0) {
          duration = `${durationMinutes}m ${durationSeconds}s`;
        } else {
          duration = `${durationSeconds}s`;
        }
      }

      return {
        id: job.id,
        name: job.job_template_name || job.name || `Job ${job.id}`,
        status,
        time: timeText,
        duration,
      };
    });
  }

  // ===== TESTES DE CONEXÃO =====
  
  /**
   * Testa a conexão com o AWX
   */
  async testConnection(): Promise<{ connected: boolean; version?: string; error?: string }> {
    try {
      const response = await this.makeRequest<any>(AWX_CONFIG.ENDPOINTS.ME);
      return {
        connected: true,
        version: response.version || 'Unknown',
      };
    } catch (error) {
      return {
        connected: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Exporta instância singleton
export const awxService = new AWXService();