import { useState, useEffect } from 'react';
import { awxService } from '@/services/awx';
import type { AWXJobTemplate } from '@/config/awx';

export interface AutomationFilters {
  systemSigla: string;
  selectedInventory: string;
  selectedGroup: string;
  searchTerm: string;
}

export interface InventoryItem {
  id: number;
  name: string;
  description?: string;
}

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

    // Filtro por grupo/tecnologia
    if (filters?.selectedGroup && filters.selectedGroup.trim()) {
      const selectedGroup = filters.selectedGroup.toLowerCase();
      templates = templates.filter(template => 
        template.name.toLowerCase().includes(`-${selectedGroup}-`)
      );
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

      console.log('🔍 Sistemas extraídos dos inventários:', systemsList);
    } catch (err) {
      console.error('❌ Erro ao buscar sistemas dos inventários:', err);
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

// Hook principal que combina todos os dados
export const useAutomations = () => {
  const [filters, setFilters] = useState<AutomationFilters>({
    systemSigla: 'all',
    selectedInventory: '',
    selectedGroup: '',
    searchTerm: '',
  });

  const systems = useSystems();
  const inventories = useInventories(filters.systemSigla);
  const groups = useGroups(filters.systemSigla);
  const jobTemplates = useJobTemplates(filters);

  const updateFilter = (key: keyof AutomationFilters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Reset campos dependentes quando sistema muda
      if (key === 'systemSigla') {
        newFilters.selectedInventory = '';
        newFilters.selectedGroup = '';
      }
      
      // Reset grupo quando inventário muda
      if (key === 'selectedInventory') {
        newFilters.selectedGroup = '';
      }

      // Converte "__all__" para string vazia para compatibilidade
      if (key === 'selectedGroup' && value === '__all__') {
        newFilters.selectedGroup = '';
      }
      
      return newFilters;
    });
  };

  const clearFilters = () => {
    setFilters({
      systemSigla: 'all',
      selectedInventory: '',
      selectedGroup: '',
      searchTerm: '',
    });
  };

  return {
    filters,
    updateFilter,
    clearFilters,
    systems,
    inventories,
    groups,
    jobTemplates,
    isLoading: systems.loading || inventories.loading || groups.loading || jobTemplates.loading,
    hasError: !!(systems.error || inventories.error || groups.error || jobTemplates.error),
  };
};