import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Clock, 
  Calendar, 
  Play,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { awxService } from '@/services/awx';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number;
}

export const JobDetailsModal = ({ isOpen, onClose, jobId }: JobDetailsModalProps) => {
  const [jobDetails, setJobDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchJobDetails = async () => {
    if (!jobId || jobDetails?.id === jobId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const details = await awxService.getJobDetail(jobId);
      setJobDetails(details);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar detalhes do job');
    } finally {
      setLoading(false);
    }
  };

  // Busca detalhes quando o modal abre
  React.useEffect(() => {
    if (isOpen && jobId) {
      fetchJobDetails();
    }
  }, [isOpen, jobId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'successful':
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'failed':
      case 'error':
      case 'canceled':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'running':
      case 'pending':
      case 'waiting':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      successful: "default",
      failed: "destructive", 
      error: "destructive",
      canceled: "secondary",
      running: "outline",
      pending: "outline",
      waiting: "outline",
    };

    const labels: Record<string, string> = {
      successful: "Sucesso",
      failed: "Falha",
      error: "Erro", 
      canceled: "Cancelado",
      running: "Executando",
      pending: "Pendente",
      waiting: "Aguardando",
    };

    return (
      <Badge variant={variants[status] || "secondary"}>
        {labels[status] || status}
      </Badge>
    );
  };

  const formatDuration = (elapsed: number) => {
    if (!elapsed) return 'N/A';
    
    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDateTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {jobDetails && getStatusIcon(jobDetails.status)}
            Detalhes do Job #{jobId}
          </DialogTitle>
          <DialogDescription>
            Informações detalhadas sobre a execução do job
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Carregando detalhes...
          </div>
        )}

        {error && (
          <div className="text-red-500 text-sm bg-red-50 p-3 rounded">
            Erro: {error}
          </div>
        )}

        {jobDetails && !loading && (
          <div className="space-y-6">
            {/* Status e Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Status</h3>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(jobDetails.status)}
                    {getStatusBadge(jobDetails.status)}
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Nome</h3>
                  <p className="text-sm">
                    {typeof jobDetails.name === 'string' ? jobDetails.name :
                     jobDetails.summary_fields?.job_template?.name || 
                     `Job ${jobDetails.id}`}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Template</h3>
                  <p className="text-sm">
                    {jobDetails.summary_fields?.job_template?.name || 
                     jobDetails.job_template_name || 
                     'N/A'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Executado por</h3>
                  <p className="text-sm font-medium text-blue-600">
                    {typeof jobDetails.launched_by === 'string' ? jobDetails.launched_by : 
                     typeof jobDetails.launched_by === 'object' && jobDetails.launched_by?.name ? jobDetails.launched_by.name :
                     'N/A'}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Duração</h3>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">{formatDuration(jobDetails.elapsed)}</span>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Projeto</h3>
                  <p className="text-sm">
                    {jobDetails.summary_fields?.project?.name || 
                     jobDetails.project_name || 
                     'N/A'}
                  </p>
                </div>

                <div>
                  <h3 className="font-semibold text-sm text-gray-600 mb-1">Inventário</h3>
                  <p className="text-sm">
                    {jobDetails.summary_fields?.inventory?.name || 
                     jobDetails.inventory_name || 
                     'N/A'}
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Timestamps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-1">Criado</h3>
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{formatDateTime(jobDetails.created)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-1">Iniciado</h3>
                <div className="flex items-center gap-1">
                  <Play className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{formatDateTime(jobDetails.started)}</span>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-1">Finalizado</h3>
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{formatDateTime(jobDetails.finished)}</span>
                </div>
              </div>
            </div>

            <Separator />

            {/* Playbook */}
            {jobDetails.playbook && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Playbook</h3>
                <div className="bg-gray-100 p-3 rounded text-sm font-mono">
                  {jobDetails.playbook}
                </div>
              </div>
            )}

            {/* Descrição */}
            {jobDetails.description && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Descrição</h3>
                <p className="text-sm text-gray-700">{jobDetails.description}</p>
              </div>
            )}

            {/* Erro (se houver) */}
            {jobDetails.result_traceback && (
              <div>
                <h3 className="font-semibold text-sm text-gray-600 mb-2">Erro</h3>
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-auto max-h-32">
                    {jobDetails.result_traceback}
                  </pre>
                </div>
              </div>
            )}

            {/* Ações */}
            <div className="flex justify-between pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchJobDetails}
                disabled={loading}
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Atualizar
              </Button>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(`${import.meta.env.VITE_AWX_API}/#/jobs/playbook/${jobDetails.id}`, '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Ver no AWX
                </Button>
                <Button size="sm" onClick={onClose}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};