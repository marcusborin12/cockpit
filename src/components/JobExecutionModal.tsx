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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Play, 
  AlertTriangle, 
  Info,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCw,
  Server,
  Hourglass
} from "lucide-react";
import { awxService } from '@/services/awx';
import type { AWXJobTemplate, AWXJob } from '@/config/awx';
import { LogsModal } from './LogsModal';

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
          className: `w-5 h-5 ${statusInfo.color} flex-shrink-0 mt-0.5 ${
            statusInfo.animate 
              ? statusInfo.icon === Hourglass 
                ? 'transition-transform duration-1000' 
                : 'animate-spin' 
              : ''
          }`,
          style: statusInfo.icon === Hourglass && statusInfo.animate ? {
            animation: 'pulse 2s ease-in-out infinite, spin 4s linear infinite'
          } : undefined
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
    errorDetails?: {
      status?: number;
      statusText?: string;
      url?: string;
      errorText?: string;
      serverMessage?: string; // Mensagem específica extraída do JSON detail
    };
  } | null>(null);
  const [currentJob, setCurrentJob] = useState<AWXJob | null>(null);
  const [jobStatus, setJobStatus] = useState<string>('');
  const [jobError, setJobError] = useState<string>('');
  const [servers, setServers] = useState<{ [group: string]: string[] }>({});
  const [loadingServers, setLoadingServers] = useState(false);
  const [inventoryInfo, setInventoryInfo] = useState<{ id: number; name: string } | null>(null);
  const [selectedServers, setSelectedServers] = useState<string[]>([]);
  const [showAllServers, setShowAllServers] = useState(false);
  
  // Estados para logs
  const [jobLogs, setJobLogs] = useState<any[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  
  // Estados de autenticação

  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastJobHashRef = useRef<string>('');



  // Limpa todos os estados ao fechar o modal
  const handleModalClose = useCallback(() => {
    // Limpa polling se existir
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Limpa todos os estados
    setExecutionResult(null);
    setCurrentJob(null);
    setJobStatus('');
    setJobError('');
    setIsExecuting(false);
    setJobLogs([]);
    setLoadingLogs(false);
    setShowLogs(false);
    setShowLogsModal(false);
    lastJobHashRef.current = '';
    
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

  // Função para buscar logs do job após conclusão
  const fetchJobLogs = useCallback(async (jobId: number) => {
    try {
      setLoadingLogs(true);
      console.log('🔍 Buscando logs do job:', jobId);
      
      const events = await awxService.getJobEvents(jobId);
      
      // Extrai apenas os dados das mensagens
      const msgData: any[] = [];
      events.forEach(event => {
        if (event.event_data?.res?.msg && Array.isArray(event.event_data.res.msg)) {
          event.event_data.res.msg.forEach((msgItem: any) => {
            msgData.push({
              ...msgItem,
              timestamp: event.created,
              host: event.host_name || 'N/A',
              task: event.task || 'N/A'
            });
          });
        }
      });

      console.log('📋 Dados extraídos dos logs:', msgData);
      setJobLogs(msgData);
      
      // Mostra automaticamente os logs se houver dados
      if (msgData.length > 0) {
        setShowLogs(true);
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error);
      setJobLogs([]);
    } finally {
      setLoadingLogs(false);
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
          
          // Se o job terminou, para o polling e busca os logs
          if (['successful', 'failed', 'error', 'canceled'].includes(job.status)) {
            // Busca logs apenas para jobs bem-sucedidos
            if (job.status === 'successful') {
              await fetchJobLogs(jobId);
            }
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
  }, [executionResult?.jobId, fetchJobStatus, fetchJobLogs]);

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
          return { icon: Hourglass, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', text: 'Aguardando...', animate: true };
        default:
          return { icon: Clock, color: 'text-gray-600', bg: 'bg-gray-50', border: 'border-gray-200', text: 'Iniciando...' };
      }
    };
  }, []);

  const handleExecuteClick = () => {
    executeJob();
  };

  const executeJob = async () => {
    if (!jobTemplate) return;
    
    try {
      setIsExecuting(true);
      setExecutionResult(null);

      // Debug: Verifica se o usuário tem credenciais válidas
      console.log('🔐 Executando job com credenciais do usuário logado...');
      console.log('👤 Job Template ID:', jobTemplate.id);
      console.log('🎯 Filtros atuais:', currentFilters);

      // Verifica se o usuário pode acessar este job template específico
      try {
        console.log('🔍 Verificando se usuário pode acessar job templates...');
        const templatesResponse = await awxService.getJobTemplates();
        const canAccess = templatesResponse.results.some(t => t.id === jobTemplate.id);
        console.log('✅ Usuário pode acessar este job template:', canAccess);
      } catch (permError) {
        console.warn('⚠️ Erro ao verificar acesso aos job templates:', permError);
      }      // Determina qual será o limit aplicado
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

      console.log('🚀 Tentando executar job template...');
      const job = await awxService.launchJobTemplate(
        jobTemplate.id,
        {}, // extra_vars vazias por padrão
        {
          systemSigla: currentFilters?.systemSigla || 'all',
          selectedGroup: currentFilters?.selectedGroup || '',
          selectedServers: currentFilters?.selectedServers || [],
        }
      );
      console.log('✅ Job template executado com sucesso:', job);
      
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
      let errorDetails: any = {};
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        // Tenta extrair detalhes técnicos do erro
        try {
          // Se o erro vem do awx service, pode conter informações estruturadas
          const errorMatch = error.message.match(/(\d{3})\s*-\s*(\w+).*URL:\s*([^\s]+)/);
          if (errorMatch) {
            errorDetails.status = parseInt(errorMatch[1]);
            errorDetails.statusText = errorMatch[2];
            errorDetails.url = errorMatch[3];
          }
          
          // Extrai a mensagem detalhada do JSON errorText (múltiplos formatos)
          const errorTextPatterns = [
            /errorText:\s*'([^']+)'/,           // errorText: '{json}'
            /errorText:\s*"([^"]+)"/,           // errorText: "{json}"
            /"errorText":\s*"([^"]+)"/,         // "errorText": "{json}"
            /errorText['"]*:\s*['"]*([^'"]+)['"]*/ // Formato mais flexível
          ];
          
          for (const pattern of errorTextPatterns) {
            const match = error.message.match(pattern);
            if (match) {
              try {
                const errorJson = JSON.parse(match[1]);
                if (errorJson.detail) {
                  errorDetails.errorText = errorJson.detail;
                  errorDetails.serverMessage = errorJson.detail;
                  break; // Para no primeiro match bem-sucedido
                }
              } catch (jsonError) {
                // Se não conseguir fazer parse do JSON, tenta próximo padrão
                continue;
              }
            }
          }
          
          // Fallback: tenta extrair JSON diretamente da mensagem
          const jsonMatch = error.message.match(/\{"detail":"([^"]+)"\}/);
          if (jsonMatch && !errorDetails.serverMessage) {
            errorDetails.serverMessage = jsonMatch[1];
            errorDetails.errorText = jsonMatch[1];
          }
          
          // Debug: mostra o que foi capturado
          if (errorDetails.serverMessage) {
            console.log('🎯 Mensagem do destino capturada:', errorDetails.serverMessage);
          }
        } catch (parseError) {
          console.warn('Não foi possível extrair detalhes do erro:', parseError);
        }
        
        // Mantém a mensagem original do erro para mostrar detalhes estruturados
        errorMessage = error.message;
      }
      
      setExecutionResult({
        success: false,
        message: errorMessage,
        errorDetails: Object.keys(errorDetails).length > 0 ? errorDetails : undefined
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleClose = useCallback(() => {
    if (!isExecuting) {
      // Usa a função handleModalClose que já limpa tudo
      handleModalClose();
    }
  }, [isExecuting, handleModalClose]);

  if (!jobTemplate) return null;

  // Extrai informações do nome do template (padrão: area-tecnologia-tipo_de_ação)
  const nameParts = jobTemplate.name.split('-');
  const area = nameParts[0]?.toUpperCase() || 'N/A';
  const technology = nameParts[1]?.toUpperCase() || 'N/A';
  const action = nameParts.slice(2).join('-').toUpperCase() || 'N/A';

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleModalClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="w-5 h-5 text-primary" />
            Executar Automação
          </DialogTitle>
{!executionResult && (
            <DialogDescription>
              Confirme os detalhes antes de executar a automação
            </DialogDescription>
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
                  <div className="space-y-3">
                    <div>
                      <Select>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={`Clique para ver ${getServersForTable().length} servidor${getServersForTable().length !== 1 ? 'es' : ''} que receberão a automação`} />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {Object.entries(servers).map(([groupName, groupServers]) => {
                            // Filtra servidores baseado nos filtros atuais
                            const filteredGroupServers = groupServers.filter(serverName => {
                              if (currentFilters?.selectedGroup && currentFilters.selectedGroup !== '__all__') {
                                return groupName.toLowerCase() === currentFilters.selectedGroup.toLowerCase();
                              }
                              return true;
                            });
                            
                            if (filteredGroupServers.length === 0) return null;
                            
                            return filteredGroupServers.map((serverName) => (
                              <SelectItem key={serverName} value={serverName} className="font-mono text-sm cursor-default pointer-events-none">
                                <div className="flex items-center gap-2 w-full">
                                  <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                                  <span className="flex-1">{serverName}</span>
                                  <Badge variant="outline" className="text-xs ml-2">
                                    {groupName.toUpperCase()}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ));
                          })}
                        </SelectContent>
                      </Select>
                    </div>
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

          {/* Erro de Execução - quando falha antes de criar o job */}
          {executionResult && !executionResult.success && (
            <div className="border rounded-lg p-4 bg-red-50 border-red-200">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium mb-3 text-red-800">
                    Falha na Execução
                  </p>
                  
                  {/* Mensagem do servidor destacada */}
                  {executionResult.errorDetails?.serverMessage && (
                    <div className="mb-3">
                      <p className="text-sm text-red-800 font-semibold">
                        🎯 "{executionResult.errorDetails.serverMessage}"
                      </p>
                    </div>
                  )}
                  
                  {/* Detalhes técnicos fluidos */}
                  {executionResult.errorDetails && (
                    <div className="space-y-1 text-sm text-red-600">
                      {executionResult.errorDetails.status && (
                        <div>
                          <span className="font-medium">Status:</span> {executionResult.errorDetails.status} {executionResult.errorDetails.statusText}
                        </div>
                      )}
                      {executionResult.errorDetails.url && (
                        <div>
                          <span className="font-medium">Endpoint:</span> <code className="text-xs font-mono bg-red-100 px-1 py-0.5 rounded">{executionResult.errorDetails.url}</code>
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Horário:</span> {new Date().toLocaleString('pt-BR')}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Botão discreto para visualizar logs após conclusão */}
          {currentJob && ['successful', 'failed', 'error', 'canceled'].includes(jobStatus) && (
            <div className="flex justify-center">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowLogsModal(true)}
                className="text-xs text-muted-foreground hover:text-foreground gap-2 h-8 px-3"
              >
                <FileText className="w-3 h-3" />
                Ver logs detalhados da execução
              </Button>
            </div>
          )}

          {/* Logs da Execução */}
          {(jobLogs.length > 0 || loadingLogs) && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm text-muted-foreground">
                    Resultados da Execução
                    {loadingLogs && (
                      <RefreshCw className="w-3 h-3 animate-spin ml-2 inline" />
                    )}
                  </h3>
                </div>
                {jobLogs.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {jobLogs.length} registro{jobLogs.length !== 1 ? 's' : ''}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowLogs(!showLogs)}
                      className="text-xs h-6"
                    >
                      {showLogs ? 'Ocultar' : 'Mostrar'}
                    </Button>
                  </div>
                )}
              </div>

              {loadingLogs && (
                <div className="flex items-center justify-center py-4 bg-gray-50 border rounded-lg">
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  <span className="text-sm text-muted-foreground">Carregando logs da execução...</span>
                </div>
              )}

              {showLogs && jobLogs.length > 0 && (
                <div className="bg-gray-50 border rounded-lg p-3">
                  <ScrollArea className="h-[300px]">
                    <div className="space-y-2">
                      {jobLogs.map((logItem, index) => (
                        <div key={index} className="bg-white border rounded p-3 text-sm">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2 text-xs text-muted-foreground">
                            <div><strong>Host:</strong> {logItem.host}</div>
                            <div><strong>Task:</strong> {logItem.task}</div>
                          </div>
                          <div className="space-y-1">
                            {Object.entries(logItem).map(([key, value]) => {
                              // Pula campos técnicos
                              if (['timestamp', 'host', 'task'].includes(key)) return null;
                              
                              return (
                                <div key={key} className="flex">
                                  <span className="font-medium text-gray-700 w-24 flex-shrink-0">{key}:</span>
                                  <span className="text-gray-900 font-mono text-xs">
                                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          )}

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
              onClick={handleExecuteClick}
              disabled={isExecuting || !!executionResult}
              className="gap-2"
            >
              {isExecuting ? (
                <>
                  <Hourglass className="w-4 h-4 animate-pulse" />
                  Aguardando...
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



    {/* Modal de Logs Detalhados */}
    <LogsModal
      isOpen={showLogsModal}
      onClose={() => setShowLogsModal(false)}
      jobId={currentJob?.id || null}
      jobName={jobTemplate?.name}
    />
    </>
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