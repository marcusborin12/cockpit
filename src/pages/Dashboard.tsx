import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Activity, 
  CheckCircle2, 
  XCircle, 
  TrendingUp,
  RefreshCw,
  AlertCircle,
  Loader2
} from "lucide-react";
import { Chart } from "@/components/ui/apex-chart";
import { useAwxDashboard } from "@/hooks/useAwx";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AWXConnectionTest } from "@/components/AWXConnectionTest";
import { AWXDebug } from "@/components/AWXDebug";
import { JobDetailsModal } from "@/components/JobDetailsModal";
import { useState } from "react";

const Dashboard = () => {
  const { 
    stats, 
    monthlyData, 
    recentExecutions, 
    connection,
    loading, 
    error, 
    lastUpdated,
    refetch 
  } = useAwxDashboard();

  // Estado para o modal de detalhes
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewDetails = (jobId: number) => {
    setSelectedJobId(jobId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJobId(null);
  };

  // Prepara dados das estatísticas
  const statsData = [
    {
      title: "Total de Execuções",
      value: loading ? "-" : stats.totalExecutions.toLocaleString(),
      change: `${stats.runningExecutions} em execução`,
      icon: Activity,
      color: "text-primary"
    },
    {
      title: "Execuções com Sucesso",
      value: loading ? "-" : stats.successfulExecutions.toLocaleString(),
      change: `${stats.successRate}% taxa`,
      icon: CheckCircle2,
      color: "text-success"
    },
    {
      title: "Execuções com Falha",
      value: loading ? "-" : stats.failedExecutions.toLocaleString(),
      change: `${stats.failureRate}% taxa`,
      icon: XCircle,
      color: "text-destructive"
    },
    {
      title: "Taxa de Sucesso",
      value: loading ? "-" : `${stats.successRate}%`,
      change: stats.successRate >= 95 ? "Excelente" : stats.successRate >= 90 ? "Bom" : "Atenção",
      icon: TrendingUp,
      color: "text-success"
    },
    {
      title: "Taxa de Falha",
      value: loading ? "-" : `${stats.failureRate}%`,
      change: stats.failureRate <= 5 ? "Baixa" : stats.failureRate <= 10 ? "Moderada" : "Alta",
      icon: TrendingUp,
      color: "text-destructive"
    }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Connection Status */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Erro ao conectar com AWX: {error}
            </AlertDescription>
          </Alert>
        )}

        {!connection.connected && !loading && !error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Conectando ao AWX... Verifique as configurações de conexão.
            </AlertDescription>
          </Alert>
        )}

        {/* Componente de teste temporário - só mostra se houver erro */}
        {error && (
          <AWXConnectionTest />
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Visão geral das automações</p>
          </div>
          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-sm text-muted-foreground">
                Última atualização: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <Button 
              className="gap-2" 
              onClick={refetch}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Atualizar Dados
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
          {statsData.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-card hover:shadow-elevated transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between p-3">
                  <CardTitle className="text-xs font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <div className="text-xl font-bold">{stat.value}</div>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {stat.change} vs mês passado
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Execution Chart */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Execuções - Últimos 12 meses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] mt-4">
              <Chart 
                type="line"
                height={400}
                options={{
                  chart: {
                    toolbar: { show: false },
                    animations: { enabled: true },
                    stacked: false,
                  },
                  stroke: {
                    width: [0, 2],
                    curve: 'smooth',
                  },
                  plotOptions: {
                    bar: {
                      columnWidth: '60%',
                    }
                  },
                  xaxis: {
                    type: 'category',
                    categories: monthlyData.labels,
                    labels: {
                      rotate: -45,
                    },
                  },
                  yaxis: [
                    {
                      title: {
                        text: 'Número de Execuções',
                      },
                      seriesName: 'Execuções',
                    },
                    {
                      opposite: true,
                      title: {
                        text: 'Taxa de Falha (%)',
                      },
                      min: 0,
                      max: 100,
                      seriesName: 'Taxa de Falha',
                    },
                  ],
                  colors: ['#00B0F0', '#DC3545'],
                  dataLabels: { enabled: false },
                  legend: {
                    position: 'top',
                    horizontalAlign: 'right',
                  },
                  grid: {
                    borderColor: 'rgba(0,0,0,0.1)',
                  },
                }}
                series={[
                  {
                    name: 'Execuções',
                    type: 'column',
                    data: monthlyData.executions,
                  },
                  {
                    name: 'Taxa de Falha (%)',
                    type: 'line',
                    data: monthlyData.failureRates,
                  },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recent Executions */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Execuções Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentExecutions.map((exec) => (
                <div
                  key={exec.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {exec.status === "success" && (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    )}
                    {exec.status === "failed" && (
                      <XCircle className="w-5 h-5 text-destructive" />
                    )}
                    {exec.status === "running" && (
                      <Activity className="w-5 h-5 text-info animate-pulse" />
                    )}
                    <div>
                      <p className="font-medium text-sm">{exec.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {exec.time} {exec.duration && `• ${exec.duration}`}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleViewDetails(exec.id)}
                  >
                    Ver detalhes
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Modal de Detalhes do Job */}
        {selectedJobId && (
          <JobDetailsModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            jobId={selectedJobId}
          />
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;
