import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  FileText,
  RefreshCw,
  Search,
  X,
  Download,
  Copy,
  Filter
} from "lucide-react";
import { awxService } from '@/services/awx';

interface LogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobId: number | null;
  jobName?: string;
}

interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  host?: string;
  task?: string;
  module?: string;
  changed?: boolean;
  ok?: boolean;
  failed?: boolean;
}

export const LogsModal: React.FC<LogsModalProps> = ({
  isOpen,
  onClose,
  jobId,
  jobName = "Job"
}) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLevel, setFilterLevel] = useState<string>('all');

  // Função para buscar logs
  const fetchLogs = async () => {
    if (!jobId) return;

    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Buscando logs do job:', jobId);
      
      // Busca o stdout do job
      const stdout = await awxService.getJobStdout(jobId);
      
      // Processa o stdout para extrair informações estruturadas
      const processedLogs = processStdoutLogs(stdout);
      
      console.log('📋 Logs processados:', processedLogs);
      setLogs(processedLogs);
      
    } catch (error) {
      console.error('❌ Erro ao buscar logs:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao buscar logs');
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para processar logs do stdout
  const processStdoutLogs = (stdout: string): LogEntry[] => {
    const lines = stdout.split('\n');
    const logEntries: LogEntry[] = [];
    
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      // Tenta extrair timestamp
      const timestampMatch = line.match(/^\[([^\]]+)\]/);
      const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
      
      // Detecta nível/tipo da mensagem
      let level = 'info';
      if (line.includes('TASK [') || line.includes('PLAY [')) {
        level = 'task';
      } else if (line.includes('ERROR') || line.includes('FAILED')) {
        level = 'error';
      } else if (line.includes('WARNING') || line.includes('WARN')) {
        level = 'warning';
      } else if (line.includes('changed:') || line.includes('ok:')) {
        level = 'success';
      } else if (line.includes('PLAY RECAP')) {
        level = 'recap';
      }
      
      // Extrai informações adicionais
      const hostMatch = line.match(/(?:changed:|ok:|failed:)\s+\[([^\]]+)\]/);
      const taskMatch = line.match(/TASK \[([^\]]+)\]/);
      const moduleMatch = line.match(/=> \{[^}]*"module_name":\s*"([^"]+)"/);
      
      logEntries.push({
        timestamp,
        level,
        message: line.trim(),
        host: hostMatch ? hostMatch[1] : undefined,
        task: taskMatch ? taskMatch[1] : undefined,
        module: moduleMatch ? moduleMatch[1] : undefined,
        changed: line.includes('changed:'),
        ok: line.includes('ok:'),
        failed: line.includes('failed:')
      });
    });
    
    return logEntries;
  };

  // Função para filtrar logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.host?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.task?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLevel = filterLevel === 'all' || log.level === filterLevel;
    
    return matchesSearch && matchesLevel;
  });

  // Função para copiar logs
  const copyLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    navigator.clipboard.writeText(logText);
  };

  // Função para baixar logs
  const downloadLogs = () => {
    const logText = filteredLogs.map(log => 
      `[${log.timestamp}] ${log.level.toUpperCase()}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-${jobId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Função para obter cor baseada no nível
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'success': return 'text-green-600 bg-green-50';
      case 'task': return 'text-blue-600 bg-blue-50';
      case 'recap': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  // Effect para buscar logs quando modal abre
  useEffect(() => {
    if (isOpen && jobId) {
      fetchLogs();
    }
  }, [isOpen, jobId]);

  // Limpa dados ao fechar
  const handleClose = () => {
    setLogs([]);
    setSearchTerm('');
    setFilterLevel('all');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Logs de Execução - {jobName} #{jobId}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {logs.length > 0 && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyLogs}
                    className="gap-2"
                  >
                    <Copy className="w-4 h-4" />
                    Copiar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={downloadLogs}
                    className="gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Baixar
                  </Button>
                </>
              )}
            </div>
          </div>
          <DialogDescription>
            Logs detalhados da execução da automação
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Controles de Filtro */}
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nos logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">Todos os níveis</option>
              <option value="task">Tasks</option>
              <option value="success">Sucessos</option>
              <option value="error">Erros</option>
              <option value="warning">Avisos</option>
              <option value="recap">Resumo</option>
            </select>
            {(searchTerm || filterLevel !== 'all') && (
              <Badge variant="secondary" className="gap-1">
                <Filter className="w-3 h-3" />
                {filteredLogs.length} de {logs.length}
              </Badge>
            )}
          </div>

          {/* Área de Logs */}
          <div className="border rounded-lg">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="w-6 h-6 animate-spin mr-3" />
                <span>Carregando logs da execução...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-8 text-red-600">
                <X className="w-8 h-8 mb-2" />
                <p className="font-medium">Erro ao carregar logs</p>
                <p className="text-sm text-muted-foreground">{error}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchLogs}
                  className="mt-3"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar novamente
                </Button>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-muted-foreground">
                <FileText className="w-8 h-8 mb-2" />
                <p>Nenhum log encontrado</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="p-4 space-y-1">
                  {filteredLogs.map((log, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded text-sm font-mono border-l-4 ${getLevelColor(log.level)}`}
                      style={{
                        borderLeftColor: 
                          log.level === 'error' ? '#dc2626' :
                          log.level === 'warning' ? '#d97706' :
                          log.level === 'success' ? '#16a34a' :
                          log.level === 'task' ? '#2563eb' :
                          log.level === 'recap' ? '#9333ea' : '#6b7280'
                      }}
                    >
                      {log.message}
                      {(log.host || log.task) && (
                        <div className="mt-1 text-xs opacity-75">
                          {log.host && <span>Host: {log.host}</span>}
                          {log.host && log.task && <span> | </span>}
                          {log.task && <span>Task: {log.task}</span>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Footer com informações */}
          {logs.length > 0 && (
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div>
                Total: {logs.length} entradas
                {filteredLogs.length !== logs.length && ` (${filteredLogs.length} filtradas)`}
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span>Sucessos: {logs.filter(l => l.level === 'success').length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span>Erros: {logs.filter(l => l.level === 'error').length}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-blue-500 rounded"></div>
                  <span>Tasks: {logs.filter(l => l.level === 'task').length}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};