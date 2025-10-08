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
import { 
  Play, 
  AlertTriangle, 
  Info,
  Clock,
  CheckCircle2,
  FileText,
  RefreshCw,
  Hourglass
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
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastJobHashRef = useRef<string>('');

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

    try {
      setIsExecuting(true);
      setExecutionResult(null);

      console.log('🎯 Iniciando execução do job template:', jobTemplate.id);
      const job = await awxService.launchJobTemplate(
        jobTemplate.id,
        {}, // extra_vars vazias por padrão
        {
          systemSigla: currentFilters?.systemSigla || 'all',
          selectedGroup: currentFilters?.selectedGroup || '',
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>

          {/* Aviso sobre inventário */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 mb-1">
                  Inventário Automático
                </p>
                <p className="text-sm text-blue-700">
                  O inventário será selecionado automaticamente baseado no sistema escolhido
                  {currentFilters?.systemSigla && currentFilters.systemSigla !== 'all' && (
                    <span className="font-medium"> ({currentFilters.systemSigla})</span>
                  )}
                  {currentFilters?.selectedGroup && currentFilters.selectedGroup !== '__all__' && (
                    <span>, limitado ao grupo <span className="font-medium">{currentFilters.selectedGroup}</span></span>
                  )}.
                </p>
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

          {/* Resultado da execução */}
          {executionResult && (
            <div className={`border rounded-lg p-4 ${
              executionResult.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                {executionResult.success ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <p className={`font-medium mb-1 ${
                    executionResult.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {executionResult.success ? 'Execução Iniciada!' : 'Erro na Execução'}
                  </p>
                  <p className={`text-sm ${
                    executionResult.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {executionResult.message}
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

          {/* Indicador de Execução */}
          {executionResult?.success && jobStatus && ['running', 'pending', 'waiting'].includes(jobStatus) && (
            <div className="border rounded-lg p-6 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-center gap-3">
                <Hourglass className="w-6 h-6 text-blue-600 animate-pulse" />
                <div className="text-center">
                  <p className="font-medium text-blue-800 mb-1">
                    Automação em Execução
                  </p>
                  <p className="text-sm text-blue-700">
                    Por favor, aguarde enquanto a automação está sendo processada...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isExecuting}
            >
              Cancelar
            </Button>
            <Button 
              onClick={executeJob}
              disabled={isExecuting || !!executionResult}
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