import { useState, useEffect } from 'react';
import { awxService } from '@/services/awx';
import type { AWXJobTemplate } from '@/config/awx';

export interface AutomationFilters {
  systemSigla: string;
  selectedInventory: string;
  selectedGroup: string;
  selectedServers: string[];
  searchTerm: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  description?: string;
}

// Função para verificar se é um playbook server (exceção aos filtros)
// Regra de negócio: Playbooks com "-server-" no nome devem sempre aparecer,
// independente dos filtros de sistema ou grupo aplicados
const isServerPlaybook = (templateName: string): boolean => {
  return templateName.toLowerCase().includes('-server-');
};

// Hook para buscar job templates
export const useJobTemplates = (filters?: Partial<AutomationFilters>) => {
  const [allJobTemplates, setAllJobTemplates] = useState<AWXJobTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carrega todos os job templates uma vez
  const fetchAllJobTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Busca todos os templates disponíveis
      const response = await awxService.getJobTemplates({
        page_size: 500, // Busca muitos templates
      });

      setAllJobTemplates(response.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar job templates');
      setAllJobTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Aplica filtros localmente
  const getFilteredJobTemplates = () => {
    let templates = [...allJobTemplates];

    // IMPORTANTE: Job templates não têm sistema no nome, apenas tecnologia
    // Padrão real: area-TECNOLOGIA-ação (ex: gsti-api-healthcheck)
    // O filtro por sistema é conceitual - quando seleciona um sistema,
    // mostra TODAS as tecnologias + os playbooks "-server-"
    
    // Filtro por sistema - mostra todos os templates quando um sistema é selecionado
    // (O sistema é usado apenas para filtrar inventários/grupos/servidores)
    if (filters?.systemSigla && filters.systemSigla.trim() && filters.systemSigla !== 'all') {
      // Quando há sistema selecionado, mostra TODOS os templates
      // (o filtro real será feito pelos grupos/tecnologias)
    }

    // Filtro por grupo/tecnologia com exceção para playbooks "-server-"
    if (filters?.selectedGroup && filters.selectedGroup.trim() && filters.selectedGroup !== '__all__') {
      const selectedGroup = filters.selectedGroup.toLowerCase();
      
      templates = templates.filter(template => {
        // EXCEÇÃO: Playbooks com "-server-" sempre aparecem
        if (isServerPlaybook(template.name)) {
          return true;
        }
        
        // Filtro por tecnologia (segunda parte do nome: area-TECNOLOGIA-ação)
        const nameParts = template.name.toLowerCase().split('-');
        if (nameParts.length >= 2) {
          const technologyPart = nameParts[1];
          return technologyPart === selectedGroup;
        }
        
        return false;
      });
    }

    // Filtro de busca textual
    if (filters?.searchTerm && filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase().trim();
      
      templates = templates.filter(template => {
        // Busca no nome do template
        const nameMatch = template.name.toLowerCase().includes(searchLower);
        
        // Busca na descrição do template
        const descriptionMatch = template.description && 
          template.description.toLowerCase().includes(searchLower);
        
        // Busca em partes específicas do nome (área, tecnologia, ação)
        const nameParts = template.name.toLowerCase().split('-');
        const partMatch = nameParts.some(part => part.includes(searchLower));
        
        return nameMatch || descriptionMatch || partMatch;
      });
    }

    return templates;
  };

  useEffect(() => {
    fetchAllJobTemplates();
  }, []);

  return {
    jobTemplates: getFilteredJobTemplates(),
    loading,
    error,
    refetch: fetchAllJobTemplates,
  };
};

// Hook para buscar sistemas disponíveis baseado nos inventários
export const useSystems = () => {
  const [systems, setSystems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSystems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Busca todos os inventários
      const response = await awxService.getInventories({
        page_size: 500, // Busca muitos inventários para garantir que pegamos todos
      });

      // Extrai sistemas únicos dos nomes dos inventários
      // Padrão: área-sistema-ambiente-inventario (ex: gsti-spi-producao-inventario)
      const systemsSet = new Set<string>();
      
      response.results.forEach(inventory => {
        const parts = inventory.name.split('-');
        if (parts.length >= 2) {
          const system = parts[1].toUpperCase(); // Segunda parte é o sistema
          systemsSet.add(system);
        }
      });

      // Converte para array e ordena
      const systemsList = Array.from(systemsSet).sort();
      setSystems(systemsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar sistemas');
      setSystems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystems();
  }, []);

  return {
    systems,
    loading,
    error,
    refetch: fetchSystems,
  };
};

// Hook para buscar inventários por sistema
export const useInventories = (systemSigla?: string) => {
  const [inventories, setInventories] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventories = async () => {
    if (!systemSigla || systemSigla === 'all') {
      setInventories([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const inventoriesList = await awxService.getInventoriesBySystem(systemSigla);
      setInventories(inventoriesList.map(inv => ({
        id: inv.id,
        name: inv.name,
        description: inv.description,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar inventários');
      setInventories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, [systemSigla]);

  return {
    inventories,
    loading,
    error,
    refetch: fetchInventories,
  };
};

// Hook para buscar grupos por sistema
export const useGroups = (systemSigla?: string) => {
  const [groups, setGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = async () => {
    if (!systemSigla || systemSigla === 'all') {
      setGroups([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const groupsList = await awxService.getGroupsBySystem(systemSigla);
      setGroups(groupsList);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar grupos');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [systemSigla]);

  return {
    groups,
    loading,
    error,
    refetch: fetchGroups,
  };
};

// Hook para buscar servidores por sistema e grupo
export const useServers = (systemSigla?: string, selectedGroup?: string) => {
  const [servers, setServers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServers = async () => {
    if (!systemSigla || systemSigla === 'all' || !selectedGroup || selectedGroup === '__all__') {
      setServers([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Busca inventários do sistema
      const inventoriesList = await awxService.getInventoriesBySystem(systemSigla);
      
      if (inventoriesList.length === 0) {
        setServers([]);
        return;
      }

      // Usa o primeiro inventário encontrado
      const inventory = inventoriesList[0];
      
      // Busca servidores do grupo específico
      const serversData = await awxService.getInventoryHostsByGroups(
        inventory.id, 
        selectedGroup
      );

      // Extrai nomes dos servidores
      const serverNames: string[] = [];
      Object.values(serversData).forEach(hosts => {
        if (Array.isArray(hosts)) {
          serverNames.push(...hosts);
        }
      });

      // Remove duplicatas e ordena
      const uniqueServers = Array.from(new Set(serverNames)).sort();
      setServers(uniqueServers);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar servidores');
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServers();
  }, [systemSigla, selectedGroup]);

  return {
    servers,
    loading,
    error,
    refetch: fetchServers,
  };
};

// Hook principal que combina todos os dados
export const useAutomations = () => {
  const [filters, setFilters] = useState<AutomationFilters>({
    systemSigla: 'all',
    selectedInventory: '',
    selectedGroup: '__all__',
    selectedServers: [],
    searchTerm: '',
  });

  const systems = useSystems();
  const inventories = useInventories(filters.systemSigla);
  const groups = useGroups(filters.systemSigla);
  const servers = useServers(filters.systemSigla, filters.selectedGroup);
  const jobTemplates = useJobTemplates(filters);

  const updateFilter = (key: keyof AutomationFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset campos dependentes quando sistema muda
      if (key === 'systemSigla') {
        newFilters.selectedInventory = '';
        newFilters.selectedGroup = '__all__';
        newFilters.selectedServers = [];
      }
      
      // Reset grupo quando inventário muda
      if (key === 'selectedInventory') {
        newFilters.selectedGroup = '__all__';
        newFilters.selectedServers = [];
      }

      // Reset servidores quando grupo muda
      if (key === 'selectedGroup') {
        newFilters.selectedServers = [];
      }

      // Mantém "__all__" como está para compatibilidade com JobExecutionModal
      // Não converte para string vazia
      
      return newFilters;
    });
  };

  const updateServersFilter = (servers: string[]) => {
    setFilters(prev => ({
      ...prev,
      selectedServers: servers
    }));
  };

  const clearFilters = () => {
    setFilters({
      systemSigla: 'all',
      selectedInventory: '',
      selectedGroup: '__all__',
      selectedServers: [],
      searchTerm: '',
    });
  };

  return {
    filters,
    updateFilter,
    updateServersFilter,
    clearFilters,
    systems,
    inventories,
    groups,
    servers,
    jobTemplates,
    isLoading: systems.loading || inventories.loading || groups.loading || servers.loading || jobTemplates.loading,
    hasError: !!(systems.error || inventories.error || groups.error || servers.error || jobTemplates.error),
  };
};