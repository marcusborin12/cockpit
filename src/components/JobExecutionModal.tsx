import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Play, 
  AlertTriangle, 
  Info,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCw,
  Server,
  Shield,
  Lock,
  Unlock,
  Eye,
  EyeOff
} from "lucide-react";
import { awxService } from '@/services/awx';
import type { AWXJobTemplate, AWXJob } from '@/config/awx';

// Componente memoizado para status do job
const JobStatusDisplay = React.memo(({ 
  currentJob, 
  jobStatus, 
  jobError, 
  getStatusDisplay 
}: {
  currentJob: AWXJob | null;
  jobStatus: string;
  jobError: string;
  getStatusDisplay: (status: string) => any;
}) => {
  if (!currentJob || !jobStatus) return null;

  const statusInfo = getStatusDisplay(jobStatus);

  return (
    <div className={`border rounded-lg p-4 ${statusInfo.bg} ${statusInfo.border}`}>
      <div className="flex items-start gap-3">
        {React.createElement(statusInfo.icon, {
          className: `w-5 h-5 ${statusInfo.color} flex-shrink-0 mt-0.5 ${statusInfo.animate ? 'animate-spin' : ''}`
        })}
        <div className="flex-1">
          <p className={`font-medium mb-1 ${statusInfo.color.replace('text-', 'text-').replace('-600', '-800')}`}>
            Status: {statusInfo.text}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>
              <span className="font-medium">Job ID:</span> #{currentJob.id}
            </div>
            {currentJob.started && (
              <div>
                <span className="font-medium">Iniciado:</span> {new Date(currentJob.started).toLocaleString('pt-BR')}
              </div>
            )}
            {currentJob.finished && (
              <div>
                <span className="font-medium">Finalizado:</span> {new Date(currentJob.finished).toLocaleString('pt-BR')}
              </div>
            )}
            {currentJob.elapsed > 0 && (
              <div>
                <span className="font-medium">Duração:</span> {Math.floor(currentJob.elapsed / 60)}m {currentJob.elapsed % 60}s
              </div>
            )}
          </div>
          
          {/* Mensagem de erro se o job falhou */}
          {jobError && (jobStatus === 'failed' || jobStatus === 'error') && (
            <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded text-sm">
              <p className="font-medium text-red-800 mb-1">Erro na Execução:</p>
              <pre className="text-red-700 whitespace-pre-wrap text-xs font-mono max-h-32 overflow-y-auto">
                {jobError}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

interface JobExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTemplate: AWXJobTemplate | null;
  onExecutionStarted?: (jobId: number) => void;
  currentFilters?: {
    systemSigla: string;
    selectedGroup: string;
    selectedServers: string[];
  };
}

const JobExecutionModalComponent = ({
  isOpen,
  onClose,
  jobTemplate,
  onExecutionStarted,
  currentFilters
}: JobExecutionModalProps) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    jobId?: number;
    message: string;
  } | null>(null);
  const [currentJob, setCurrentJob] = useState<AWXJob | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [jobError, setJobError] = useState<string>('');
  const [servers, setServers] = useState<{ [group: string]: string[] }>({});
  const [loadingServers, setLoadingServers] = useState(false);
  const [inventoryInfo, setInventoryInfo] = useState<{ id: number; name: string } | null>(null);
  
  // Estados de autenticação
  const [authToken, setAuthToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [isValidatingToken, setIsValidatingToken] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastJobHashRef = useRef<string>('');

  // Função para validar token
  const validateToken = useCallback(async (token: string): Promise<boolean> => {
    try {
      setIsValidatingToken(true);
      setAuthError(null);

      // Faz uma requisição simples para validar o token
      const response = await fetch('/api/inventories/?page_size=1', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setIsAuthenticated(true);
        return true;
      } else {
        setAuthError('Token inválido ou sem permissões adequadas');
        setIsAuthenticated(false);
        return false;
      }
    } catch (error) {
      setAuthError('Erro ao validar token. Verifique sua conexão.');
      setIsAuthenticated(false);
      return false;
    } finally {
      setIsValidatingToken(false);
    }
  }, []);

  // Função para lidar com mudança do token
  const handleTokenChange = useCallback(async (value: string) => {
    setAuthToken(value);
    setAuthError(null);
    
    if (value.trim()) {
      // Validação em tempo real com debounce
      const timeoutId = setTimeout(() => {
        validateToken(value.trim());
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    } else {
      setIsAuthenticated(false);
    }
  }, [validateToken]);

  // Limpa a autenticação ao fechar o modal
  const handleModalClose = useCallback(() => {
    setAuthToken('');
    setIsAuthenticated(false);
    setShowToken(false);
    setAuthError(null);
    onClose();
  }, [onClose]);

  // Função para buscar servidores do inventário
  const fetchServersFromInventory = useCallback(async () => {
    setLoadingServers(true);
    
    try {
      // Busca o inventário adequado para execução (mesma lógica do AWX service)
      const inventory = await awxService.getInventoryForExecution(
        currentFilters?.systemSigla && currentFilters.systemSigla !== 'all' 
          ? currentFilters.systemSigla 
          : undefined
      );
      
      if (!inventory) {
        console.warn('Nenhum inventário encontrado');
        setInventoryInfo(null);
        setServers({
          'exemplo': ['Nenhum inventário encontrado']
        });
        return;
      }

      // Armazena informações do inventário
      setInventoryInfo(inventory);
      console.log('Inventário encontrado:', inventory.name);

      // Busca hosts reais do inventário, agrupados por grupos
      console.log('🎯 Parâmetros de busca recebidos do filtro:', {
        systemSigla: currentFilters?.systemSigla,
        selectedGroup: currentFilters?.selectedGroup,
        selectedServers: currentFilters?.selectedServers,
        inventoryId: inventory.id,
        inventoryName: inventory.name,
        filterGroupActive: currentFilters?.selectedGroup && currentFilters.selectedGroup !== '__all__',
        filterServersActive: currentFilters?.selectedServers && currentFilters.selectedServers.length > 0,
        willFilterByGroup: currentFilters?.selectedGroup && currentFilters.selectedGroup !== '__all__' ? currentFilters.selectedGroup : 'Não (todos os grupos)',
        willFilterByServers: currentFilters?.selectedServers && currentFilters.selectedServers.length > 0 ? currentFilters.selectedServers.join(', ') : 'Não (todos os servidores)'
      });
      
      const realHostsByGroups = await awxService.getInventoryHostsByGroups(
        inventory.id, 
        currentFilters?.selectedGroup && currentFilters.selectedGroup !== '__all__' 
          ? currentFilters.selectedGroup 
          : undefined
      );

      if (Object.keys(realHostsByGroups).length > 0) {
        console.log('✅ Hosts reais encontrados:', realHostsByGroups);
        
        // Aplica filtro de servidores específicos se selecionados
        let filteredServers = realHostsByGroups;
        if (currentFilters?.selectedServers && currentFilters.selectedServers.length > 0) {
          console.log('🎯 Aplicando filtro de servidores específicos:', currentFilters.selectedServers);
          
          filteredServers = {};
          Object.entries(realHostsByGroups).forEach(([groupName, hosts]) => {
            const filteredHosts = hosts.filter(host => 
              currentFilters.selectedServers.some(selectedServer =>
                host.toLowerCase().includes(selectedServer.toLowerCase()) ||
                selectedServer.toLowerCase().includes(host.toLowerCase())
              )
            );
            
            if (filteredHosts.length > 0) {
              filteredServers[groupName] = filteredHosts;
            }
          });
          
          console.log('🔍 Servidores filtrados:', filteredServers);
        }
        
        setServers(filteredServers);
      } else {
        console.log('⚠️ Nenhum host real encontrado. Gerando fallback...');
        
        // Fallback: se não encontrou hosts reais, gera exemplo baseado no inventário
        const inventoryParts = inventory.name.toLowerCase().split('-');
        const systemPrefix = inventoryParts.length >= 2 ? inventoryParts[1] : 'sys';
        
        const fallbackServers: { [group: string]: string[] } = {};
        
        // Se há grupo específico selecionado, mostra apenas esse grupo
        if (currentFilters?.selectedGroup && currentFilters.selectedGroup !== '__all__') {
          const groupName = currentFilters.selectedGroup.toLowerCase();
          const serverCount = groupName === 'web' ? 3 : groupName === 'app' ? 2 : 1;
          let groupServers = [];
          
          for (let i = 1; i <= serverCount; i++) {
            groupServers.push(`${systemPrefix}-${groupName}-${String(i).padStart(2, '0')}`);
          }
          
          // Aplica filtro de servidores específicos no fallback
          if (currentFilters?.selectedServers && currentFilters.selectedServers.length > 0) {
            groupServers = groupServers.filter(server => 
              currentFilters.selectedServers.some(selectedServer =>
                server.toLowerCase().includes(selectedServer.toLowerCase()) ||
                selectedServer.toLowerCase().includes(server.toLowerCase())
              )
            );
            console.log(`🔍 Fallback filtrado por servidores '${currentFilters.selectedServers.join(', ')}':`, groupServers);
          }
          
          if (groupServers.length > 0) {
            fallbackServers[currentFilters.selectedGroup] = groupServers;
            console.log(`📝 Fallback gerado para grupo ${currentFilters.selectedGroup}:`, groupServers);
          }
        } else {
          // Mostra grupos padrão
          let allServers = {
            'web': [`${systemPrefix}-web-01`, `${systemPrefix}-web-02`],
            'app': [`${systemPrefix}-app-01`],
            'db': [`${systemPrefix}-db-01`]
          };
          
          // Aplica filtro de servidores específicos em todos os grupos
          if (currentFilters?.selectedServers && currentFilters.selectedServers.length > 0) {
            Object.entries(allServers).forEach(([groupName, servers]) => {
              const filteredServers = servers.filter(server => 
                currentFilters.selectedServers.some(selectedServer =>
                  server.toLowerCase().includes(selectedServer.toLowerCase()) ||
                  selectedServer.toLowerCase().includes(server.toLowerCase())
                )
              );
              
              if (filteredServers.length > 0) {
                fallbackServers[groupName] = filteredServers;
              }
            });
            console.log(`🔍 Fallback filtrado por servidores '${currentFilters.selectedServers.join(', ')}':`, fallbackServers);
          } else {
            Object.assign(fallbackServers, allServers);
            console.log('📝 Fallback gerado com grupos padrão:', fallbackServers);
          }
        }
        
        setServers(fallbackServers);
      }
    } catch (error) {
      console.error('Erro ao buscar servidores do inventário:', error);
      // Em caso de erro, mantém o inventário encontrado mas mostra erro na lista de servidores
      setServers({
        'erro': [`Erro ao buscar hosts do inventário ${inventoryInfo?.name || 'selecionado'}`]
      });
    } finally {
      setLoadingServers(false);
    }
  }, [currentFilters?.systemSigla, currentFilters?.selectedGroup, currentFilters?.selectedServers]);

  // Effect para buscar servidores quando o sistema ou grupo mudam
  useEffect(() => {
    if (isOpen) {
      console.log('🔄 JobExecutionModal: Modal aberto, buscando servidores...', {
        isOpen,
        currentFilters
      });
      fetchServersFromInventory();
    }
  }, [isOpen, fetchServersFromInventory]);

  // Função para transformar servidores em lista plana para tabela
  const getServersForTable = useCallback(() => {
    const serversList: Array<{ name: string; group: string }> = [];
    
    Object.entries(servers)
      .filter(([groupName, groupServers]) => {
        // Se há um grupo específico selecionado, mostra apenas esse grupo
        if (currentFilters?.selectedGroup && currentFilters.selectedGroup !== '__all__') {
          return groupName.toLowerCase() === currentFilters.selectedGroup.toLowerCase();
        }
        return true; // Mostra todos os grupos se não há filtro específico
      })
      .forEach(([groupName, groupServers]) => {
        groupServers.forEach(serverName => {
          serversList.push({
            name: serverName,
            group: groupName
          });
        });
      });
    
    return serversList;
  }, [servers, currentFilters?.selectedGroup]);

  // Função para buscar status do job (otimizada)
  const fetchJobStatus = useCallback(async (jobId: number) => {
    try {
      const job = await awxService.getJobDetail(jobId);
      
      // Cria hash dos dados importantes para evitar updates desnecessários
      const jobHash = `${job.status}-${job.elapsed}-${job.started}-${job.finished}`;
      
      if (lastJobHashRef.current !== jobHash) {
        lastJobHashRef.current = jobHash;
        
        setCurrentJob(job);
        setJobStatus(job.status);
        
        // Se o job falhou, captura a mensagem de erro
        if ((job.status === 'failed' || job.status === 'error') && job.result_traceback) {
          setJobError(job.result_traceback || 'Erro na execução do job');
        }
      }
      
      return job;
    } catch (error) {
      console.error('Erro ao buscar status do job:', error);
      return null;
    }
  }, []);



  // Effect para polling do status do job (simplificado)
  useEffect(() => {
    let jobId: number | null = null;
    let isActive = true;

    // Só inicia polling se o job foi executado com sucesso
    if (executionResult?.success && executionResult.jobId) {
      jobId = executionResult.jobId;
      
      // Busca inicial
      fetchJobStatus(jobId);
      
      // Configura polling a cada 5 segundos
      const poll = async () => {
        if (!isActive || !jobId) return;
        
        try {
          const job = await fetchJobStatus(jobId);
          if (!job || !isActive) return;
          
          // Se o job terminou, para o polling
          if (['successful', 'failed', 'error', 'canceled'].includes(job.status)) {
            return; // Para o polling
          }
          
          // Agenda próximo poll
          if (isActive) {
            setTimeout(poll, 5000);
          }
        } catch (error) {
          console.error('Erro no polling do job:', error);
        }
      };
      
      // Inicia o polling
      setTimeout(poll, 5000);
    }

    return () => {
      isActive = false;
    };
  }, [executionResult?.jobId, fetchJobStatus]);

  // Removido auto-scroll para evitar re-renderizações

  // Função para obter ícone e cor baseado no status (memoizada)
  const getStatusDisplay = useMemo(() => {
    return (status: string) => {
      switch (status) {
        case 'successful':
          return { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', text: 'Concluído com Sucesso' };
        case 'failed':
        case 'error':
          return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', text: 'Falhou' };
        case 'canceled':
          return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'Cancelado' };
        case 'running':
          return { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', text: 'Executando...', animate: true };
        case 'pending':
        case 'waiting':
          return { icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', text: 'Aguardando...' };
        default:
          return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', text: 'Iniciando...' };
      }
    };
  }, []);

  const executeJob = async () => {
    if (!jobTemplate) return;
    
    // Verifica se está autenticado
    if (!isAuthenticated || !authToken.trim()) {
      setAuthError('Token de autenticação necessário para executar a automação');
      return;
    }

    try {
      setIsExecuting(true);
      setExecutionResult(null);

      // Determina qual será o limit aplicado
      let limitInfo = 'todo inventário (sem limit)';
      if (currentFilters?.selectedServers && currentFilters.selectedServers.length > 0) {
        limitInfo = currentFilters.selectedServers.length === 1 
          ? `servidor específico: ${currentFilters.selectedServers[0]}`
          : `servidores específicos: ${currentFilters.selectedServers.join(', ')}`;
      } else if (currentFilters?.selectedGroup && currentFilters.selectedGroup !== '__all__') {
        limitInfo = `grupo específico: ${currentFilters.selectedGroup}`;
      }

      console.log('🎯 Iniciando execução do job template:', {
        templateId: jobTemplate.id,
        limitWillBe: limitInfo,
        filters: {
          sistema: currentFilters?.systemSigla,
          grupo: currentFilters?.selectedGroup,
          servidores: currentFilters?.selectedServers
        }
      });

      const job = await awxService.launchJobTemplate(
        jobTemplate.id,
        {}, // extra_vars vazias por padrão
        {
          systemSigla: currentFilters?.systemSigla || 'all',
          selectedGroup: currentFilters?.selectedGroup || '',
          selectedServers: currentFilters?.selectedServers || [],
          authToken: authToken,
        }
      );
      
      setExecutionResult({
        success: true,
        jobId: job.id,
        message: `Job #${job.id} iniciado com sucesso usando inventário do sistema!`
      });

      // Notifica o componente pai sobre o início da execução
      if (onExecutionStarted) {
        onExecutionStarted(job.id);
      }

    } catch (error) {
      console.error('❌ Erro na execução do job template:', error);
      
      let errorMessage = 'Erro desconhecido';
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Mensagens de erro mais amigáveis
        if (error.message.includes('inventory is missing')) {
          errorMessage = 'Erro: Inventário não encontrado. Verifique se existe um inventário chamado "sistemas" no AWX.';
        } else if (error.message.includes('Bad Request')) {
          errorMessage = 'Erro na requisição: Verifique se todos os parâmetros estão corretos.';
        } else if (error.message.includes('conectividade')) {
          errorMessage = 'Erro de conexão: Verifique se o AWX está acessível.';
        }
      }
      
      setExecutionResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isExecuting) {
      // Limpa o polling
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      // Reset states em batch para evitar múltiplas re-renderizações
      setTimeout(() => {
        onClose();
        setExecutionResult(null);
        setCurrentJob(null);
        setJobStatus('');
        setJobError('');
        setServers({});
        setLoadingServers(false);
        setInventoryInfo(null);
        lastJobHashRef.current = '';
      }, 0);
    }
  }, [isExecuting, onClose]);

  if (!jobTemplate) return null;

  // Extrai informações do nome do template (padrão: area-tecnologia-tipo_de_ação)
  const nameParts = jobTemplate.name.split('-');
  const area = nameParts[0]?.toUpperCase() || 'N/A';
  const technology = nameParts[1]?.toUpperCase() || 'N/A';
  const action = nameParts.slice(2).join('-').toUpperCase() || 'N/A';

  return (
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-primary" />
              Executar Automação
              {isAuthenticated ? (
                <Lock className="w-4 h-4 text-green-600" />
              ) : (
                <Unlock className="w-4 h-4 text-orange-500" />
              )}
            </DialogTitle>
          </div>
{!executionResult && (
            <DialogDescription>
              Confirme os detalhes antes de executar a automação
            </DialogDescription>
          )}
          
          {/* Campo de Token de Autenticação */}
          {!executionResult && (
            <div className="bg-gray-50/50 border border-gray-200 rounded-lg p-3">
              <Label htmlFor="auth-token" className="text-sm font-medium text-gray-700 flex items-center gap-2">
                {isAuthenticated ? (
                  <Lock className="w-4 h-4 text-green-600" />
                ) : (
                  <Unlock className="w-4 h-4 text-orange-500" />
                )}
                Token de Autenticação AWX
                {isAuthenticated && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Válido
                  </Badge>
                )}
              </Label>
              <div className="relative mt-2">
                <Input
                  id="auth-token"
                  type={showToken ? "text" : "password"}
                  value={authToken}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  placeholder="Insira seu token de acesso AWX"
                  className="pr-10 font-mono text-sm"
                  disabled={isValidatingToken}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                  disabled={isValidatingToken}
                >
                  {showToken ? (
                    <EyeOff className="w-4 h-4 text-gray-500" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-500" />
                  )}
                </Button>
              </div>
              {authError && (
                <p className="text-xs text-red-600 mt-1">{authError}</p>
              )}
              {isValidatingToken && (
                <p className="text-xs text-blue-600 mt-1">🔄 Validando token...</p>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Job Template */}
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">{jobTemplate.name}</h3>
              {!executionResult && jobTemplate.description && (
                <p className="text-sm text-muted-foreground">
                  {jobTemplate.description}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-muted-foreground">Área</h4>
                <Badge variant="outline">{area}</Badge>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-muted-foreground">Tecnologia</h4>
                <Badge variant="outline">{technology}</Badge>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-muted-foreground">Ação</h4>
                <Badge variant="outline">{action}</Badge>
              </div>
              <div className="space-y-1">
                <h4 className="font-medium text-sm text-muted-foreground">Inventário</h4>
                <Badge variant="outline" className="text-xs">
                  {loadingServers ? (
                    <span className="flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      Carregando...
                    </span>
                  ) : (
                    inventoryInfo?.name || 'Não encontrado'
                  )}
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Informações técnicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-muted-foreground">ID do Template:</span>
                <span className="ml-2">{jobTemplate.id}</span>
              </div>
              {jobTemplate.project && (
                <div>
                  <span className="font-medium text-muted-foreground">Projeto:</span>
                  <span className="ml-2">{jobTemplate.project}</span>
                </div>
              )}
              {jobTemplate.inventory && (
                <div>
                  <span className="font-medium text-muted-foreground">Inventário:</span>
                  <span className="ml-2">{jobTemplate.inventory}</span>
                </div>
              )}
              {jobTemplate.playbook && (
                <div>
                  <span className="font-medium text-muted-foreground">Playbook:</span>
                  <span className="ml-2">{jobTemplate.playbook}</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Lista de Servidores */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Servidores que receberão a automação
                    {loadingServers && (
                      <RefreshCw className="w-3 h-3 animate-spin ml-2 inline" />
                    )}
                  </h3>
                </div>
                {!loadingServers && Object.keys(servers).length > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    {getServersForTable().length} servidor{getServersForTable().length !== 1 ? 'es' : ''}
                  </Badge>
                )}
              </div>
              <div className="bg-gray-50 border rounded-lg p-3">
                {loadingServers ? (
                  <div className="flex items-center justify-center py-4">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    <span className="text-sm text-muted-foreground">Carregando servidores do inventário...</span>
                  </div>
                ) : Object.keys(servers).length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">Nenhum servidor encontrado no inventário</p>
                  </div>
                ) : (
                  <div className="bg-white rounded border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs font-medium">Servidor</TableHead>
                          <TableHead className="text-xs font-medium">Grupo</TableHead>
                        </TableRow>
                      </TableHeader>
                    </Table>
                    <ScrollArea className="h-[120px]">
                      <Table>
                        <TableBody>
                          {getServersForTable().map((server, index) => (
                            <TableRow key={index} className="hover:bg-gray-50">
                              <TableCell className="font-mono text-xs py-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                  {server.name}
                                </div>
                              </TableCell>
                              <TableCell className="text-xs py-2 text-muted-foreground">
                                {server.group.toUpperCase()}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                )}
                
                {!loadingServers && Object.keys(servers).length > 0 && (
                  <div className="mt-3 pt-3 border-t">
                    <p className="text-xs text-muted-foreground">
                      {inventoryInfo ? (
                        <>
                          {Object.keys(servers).includes('erro') ? (
                            <span className="text-red-600">Erro ao conectar com o inventário <strong>{inventoryInfo.name}</strong></span>
                          ) : (
                            <>
                              <strong>{getServersForTable().length}</strong> servidor{getServersForTable().length !== 1 ? 'es' : ''} do inventário <strong>{inventoryInfo.name}</strong>
                              {currentFilters?.selectedServers && currentFilters.selectedServers.length > 0 ? (
                                <span> - <strong>FILTRADO</strong> por {currentFilters.selectedServers.length === 1 ? 'servidor' : 'servidores'} <strong>{currentFilters.selectedServers.join(', ')}</strong></span>
                              ) : currentFilters?.selectedGroup && currentFilters.selectedGroup !== '__all__' ? (
                                <span> - <strong>FILTRADO</strong> pelo grupo <strong>{currentFilters.selectedGroup}</strong></span>
                              ) : (
                                <span> - todos os grupos</span>
                              )}
                              <br />
                              {/* Verifica se tem hosts reais (nomes que não seguem padrão de exemplo) */}
                              {Object.values(servers).some((hostList: string[]) => 
                                hostList.some(host => !host.match(/^\w+-\w+-\d+$/) && !host.includes('Erro'))
                              ) ? (
                                <span className="text-green-600">✓ Dados reais obtidos do AWX</span>
                              ) : (
                                <span className="text-yellow-600">⚠ Dados de exemplo (hosts não encontrados no inventário)</span>
                              )}
                            </>
                          )}
                        </>
                      ) : (
                        'Inventário não encontrado ou erro na conexão'
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Aviso de execução - só mostra antes da execução */}
          {!executionResult && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800 mb-1">
                    Atenção - Execução em Ambiente de Produção
                  </p>
                  <p className="text-sm text-amber-700">
                    Esta automação será executada em ambiente de produção. 
                    Certifique-se de que é seguro prosseguir com a execução.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Status da Execução */}
          <JobStatusDisplay 
            currentJob={currentJob}
            jobStatus={jobStatus}
            jobError={jobError}
            getStatusDisplay={getStatusDisplay}
          />

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleModalClose}
              disabled={isExecuting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={executeJob}
              disabled={isExecuting || !!executionResult || !isAuthenticated}
              className="gap-2"
            >
              {isExecuting ? (
                <>
                  <Clock className="w-4 h-4 animate-pulse" />
                  Executando...
                </>
              ) : executionResult?.success ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Executado!
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Executar Agora
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>


    </Dialog>
  );
};

// Memoização do componente para evitar re-renderizações desnecessárias
export const JobExecutionModal = React.memo(JobExecutionModalComponent, (prevProps, nextProps) => {
  // Comparação personalizada para evitar re-renders desnecessários
  return (
    prevProps.isOpen === nextProps.isOpen &&
    prevProps.jobTemplate?.id === nextProps.jobTemplate?.id &&
    prevProps.currentFilters?.systemSigla === nextProps.currentFilters?.systemSigla &&
    prevProps.currentFilters?.selectedGroup === nextProps.currentFilters?.selectedGroup
  );
});