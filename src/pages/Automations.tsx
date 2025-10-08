import React, { useState } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAutomations } from "@/hooks/useAutomations";
import { Play, Search, Filter, RefreshCw, Database, Settings, AlertCircle } from "lucide-react";
import type { AWXJobTemplate } from "@/config/awx";
import { JobExecutionModal } from "@/components/JobExecutionModal";

const Automations = () => {
  const [selectedJobTemplate, setSelectedJobTemplate] = useState<AWXJobTemplate | null>(null);
  const [isExecutionModalOpen, setIsExecutionModalOpen] = useState(false);
  
  const {
    filters,
    updateFilter,
    clearFilters,
    systems,
    inventories,
    groups,
    servers,
    jobTemplates,
    isLoading,
    hasError,
  } = useAutomations();

  // Extrai informações do nome do template (padrão: area-tecnologia-tipo_de_ação)
  const parseJobTemplateName = (name: string) => {
    const parts = name.split('-');
    return {
      area: parts[0]?.toUpperCase() || 'N/A',
      technology: parts[1]?.toUpperCase() || 'N/A',
      action: parts.slice(2).join('-').toUpperCase() || 'N/A',
    };
  };

  // Componente de loading para cards
  const JobTemplateCardSkeleton = () => (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Automações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie e execute job templates do AWX de forma dinâmica e filtrável
          </p>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Buscar job templates..."
              value={filters.searchTerm}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
              className="pl-10 h-11"
            />
          </div>

          {/* Filter Row */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Sistema */}
            <Select 
              value={filters.systemSigla} 
              onValueChange={(value) => updateFilter('systemSigla', value)}
            >
              <SelectTrigger className="w-full sm:w-[200px] h-11">
                <SelectValue placeholder="Selecionar sistema" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os sistemas</SelectItem>
                {systems.systems.map((system) => (
                  <SelectItem key={system} value={system}>
                    {system}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Grupo/Tecnologia */}
            <Select 
              value={filters.selectedGroup} 
              onValueChange={(value) => updateFilter('selectedGroup', value)}
              disabled={filters.systemSigla === 'all' || groups.loading}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="Selecionar grupo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os grupos</SelectItem>
                {groups.groups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group.toUpperCase()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Servidor */}
            <Select 
              value={filters.selectedServer} 
              onValueChange={(value) => updateFilter('selectedServer', value)}
              disabled={filters.systemSigla === 'all' || filters.selectedGroup === '__all__' || servers.loading}
            >
              <SelectTrigger className="w-full sm:w-[180px] h-11">
                <SelectValue placeholder="Selecionar servidor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todos os servidores</SelectItem>
                {servers.servers.map((server) => (
                  <SelectItem key={server} value={server}>
                    {server}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="gap-2 h-11"
                onClick={clearFilters}
                disabled={isLoading}
              >
                <Filter className="w-4 h-4" />
                Limpar
              </Button>
              <Button 
                variant="outline" 
                className="gap-2 h-11"
                onClick={() => {
                  systems.refetch();
                  groups.refetch();
                  jobTemplates.refetch();
                }}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
            </div>
          </div>

          {/* Filter Summary */}
          {(filters.systemSigla !== 'all' || filters.selectedGroup || filters.selectedServer || filters.searchTerm) && (
            <div className="flex flex-wrap gap-2">
              {filters.systemSigla !== 'all' && (
                <Badge variant="secondary" className="gap-1">
                  <Database className="w-3 h-3" />
                  Sistema: {filters.systemSigla}
                </Badge>
              )}
              {filters.selectedGroup && filters.selectedGroup !== '__all__' && (
                <Badge variant="secondary" className="gap-1">
                  <Settings className="w-3 h-3" />
                  Grupo: {filters.selectedGroup.toUpperCase()}
                </Badge>
              )}
              {filters.selectedServer && filters.selectedServer !== '__all__' && (
                <Badge variant="secondary" className="gap-1">
                  <Settings className="w-3 h-3" />
                  Servidor: {filters.selectedServer}
                </Badge>
              )}
              {filters.searchTerm && (
                <Badge variant="secondary" className="gap-1">
                  <Search className="w-3 h-3" />
                  Busca: {filters.searchTerm}
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {hasError && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">Erro ao carregar dados</p>
                  <p className="text-sm text-destructive/80">
                    Verifique a conexão com o AWX e tente novamente.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Job Templates Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, i) => (
              <JobTemplateCardSkeleton key={i} />
            ))
          ) : jobTemplates.jobTemplates.length === 0 ? (
            // Empty state
            <div className="col-span-full">
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Database className="w-12 h-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">Nenhum job template encontrado</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {filters.searchTerm || filters.selectedGroup || filters.systemSigla !== 'all' 
                      ? 'Tente ajustar os filtros para encontrar job templates.'
                      : 'Não há job templates disponíveis no AWX no momento.'
                    }
                  </p>
                  {(filters.searchTerm || filters.selectedGroup || filters.systemSigla !== 'all') && (
                    <Button 
                      variant="outline" 
                      className="mt-4"
                      onClick={clearFilters}
                    >
                      Limpar Filtros
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            // Job Templates Cards
            jobTemplates.jobTemplates.map((template) => {
              const { area, technology, action } = parseJobTemplateName(template.name);
              
              return (
                <Card key={template.id} className="shadow-card hover:shadow-elevated transition-all">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <CardTitle className="text-base leading-tight">
                          {template.name}
                        </CardTitle>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs">
                            {area}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {technology}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0">
                        ID: {template.id}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground overflow-hidden text-ellipsis" 
                         style={{ 
                           display: '-webkit-box', 
                           WebkitLineClamp: 2, 
                           WebkitBoxOrient: 'vertical' 
                         }}>
                        {template.description || 'Sem descrição disponível'}
                      </p>
                      
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex justify-between">
                          <span>Ação:</span>
                          <span className="font-medium">{action}</span>
                        </div>
                        {template.project && (
                          <div className="flex justify-between">
                            <span>Projeto:</span>
                            <span className="font-medium truncate ml-2" title={String(template.project)}>
                              {template.project}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button 
                      className="w-full gap-2"
                      onClick={() => {
                        console.log('🚀 Abrindo modal de execução com filtros:', {
                          systemSigla: filters.systemSigla,
                          selectedGroup: filters.selectedGroup,
                          template: template.name
                        });
                        setSelectedJobTemplate(template);
                        setIsExecutionModalOpen(true);
                      }}
                    >
                      <Play className="w-4 h-4" />
                      Executar
                    </Button>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>

      {/* Modal de Execução */}
      <JobExecutionModal
        isOpen={isExecutionModalOpen}
        onClose={() => {
          setIsExecutionModalOpen(false);
          setSelectedJobTemplate(null);
        }}
        jobTemplate={selectedJobTemplate}
        currentFilters={{
          systemSigla: filters.systemSigla,
          selectedGroup: filters.selectedGroup,
          selectedServer: filters.selectedServer
        }}
        onExecutionStarted={(jobId) => {
          console.log('Job iniciado:', jobId);
          // Aqui você pode adicionar lógica adicional, como navegar para o Dashboard
        }}
      />
    </Layout>
  );
};

export default Automations;
