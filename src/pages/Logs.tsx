import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, Download, Calendar } from "lucide-react";

const Logs = () => {
  const logs = [
    {
      id: 1,
      timestamp: "29/09/2024 14:25:03",
      user: "admin@crefisa.com",
      automation: "Restart Apache",
      status: "success",
      duration: "5.2s",
      target: "app01.crefisa.local"
    },
    {
      id: 2,
      timestamp: "29/09/2024 14:20:15",
      user: "system",
      automation: "Self-Healing DNS",
      status: "success",
      duration: "2.1s",
      target: "dns01.crefisa.local"
    },
    {
      id: 3,
      timestamp: "29/09/2024 14:15:47",
      user: "joao.silva@crefisa.com",
      automation: "Health Check Databases",
      status: "failed",
      duration: "8.7s",
      target: "db01.crefisa.local"
    },
    {
      id: 4,
      timestamp: "29/09/2024 14:10:22",
      user: "admin@crefisa.com",
      automation: "Backup PostgreSQL",
      status: "success",
      duration: "45.3s",
      target: "db02.crefisa.local"
    },
    {
      id: 5,
      timestamp: "29/09/2024 14:05:11",
      user: "system",
      automation: "Hard Reset Tomcat",
      status: "success",
      duration: "12.1s",
      target: "app02.crefisa.local"
    },
    {
      id: 6,
      timestamp: "29/09/2024 13:58:33",
      user: "maria.santos@crefisa.com",
      automation: "Health Check Web Servers",
      status: "success",
      duration: "3.4s",
      target: "web01.crefisa.local"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-success/10 text-success border-success/20";
      case "failed":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "running":
        return "bg-info/10 text-info border-info/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Logs e Auditoria</h1>
            <p className="text-muted-foreground mt-1">
              Histórico completo de execuções
            </p>
          </div>
          <Button className="gap-2">
            <Download className="w-4 h-4" />
            Exportar CSV
          </Button>
        </div>

        {/* Filters */}
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  className="pl-10 h-11"
                />
              </div>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-10 h-11"
                />
              </div>
              <Button variant="outline" className="h-11">
                <Filter className="w-4 h-4 mr-2" />
                Todos os status
              </Button>
              <Button variant="outline" className="h-11">
                <Filter className="w-4 h-4 mr-2" />
                Todas as automações
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Execuções Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">324</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Sucessos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">306</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Falhas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">18</div>
            </CardContent>
          </Card>
        </div>

        {/* Logs Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Histórico de Execuções</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-semibold text-sm">Timestamp</th>
                    <th className="pb-3 font-semibold text-sm">Usuário</th>
                    <th className="pb-3 font-semibold text-sm">Automação</th>
                    <th className="pb-3 font-semibold text-sm">Alvo</th>
                    <th className="pb-3 font-semibold text-sm">Status</th>
                    <th className="pb-3 font-semibold text-sm">Duração</th>
                    <th className="pb-3 font-semibold text-sm">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-border hover:bg-muted/50">
                      <td className="py-3 text-sm font-mono">{log.timestamp}</td>
                      <td className="py-3 text-sm">{log.user}</td>
                      <td className="py-3 text-sm font-medium">{log.automation}</td>
                      <td className="py-3 text-sm text-muted-foreground">{log.target}</td>
                      <td className="py-3">
                        <Badge 
                          variant="outline" 
                          className={getStatusColor(log.status)}
                        >
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm">{log.duration}</td>
                      <td className="py-3">
                        <Button variant="ghost" size="sm">
                          Ver detalhes
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Logs;
