import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Loader2, StopCircle, RefreshCw } from "lucide-react";

const Execution = () => {
  const steps = [
    { id: 1, name: "Conectar ao servidor", status: "success", time: "0.5s" },
    { id: 2, name: "Verificar serviço Apache", status: "success", time: "1.2s" },
    { id: 3, name: "Coletar logs de erro", status: "success", time: "2.1s" },
    { id: 4, name: "Reiniciar serviço", status: "running", time: "executando..." },
    { id: 5, name: "Validar reinicialização", status: "pending", time: "aguardando..." },
    { id: 6, name: "Gerar relatório", status: "pending", time: "aguardando..." }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold">Execução em Tempo Real</h1>
            <p className="text-muted-foreground mt-1">Restart Apache - Servidor App01</p>
          </div>
          <div className="flex gap-2">
            <Button variant="destructive" className="gap-2">
              <StopCircle className="w-4 h-4" />
              Abortar
            </Button>
            <Button variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Reexecutar
            </Button>
          </div>
        </div>

        {/* Execution Info */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge className="bg-info/10 text-info border-info/20">
                Em Execução
              </Badge>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Duração
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4.2s</div>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">50%</div>
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Timeline de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  {/* Icon */}
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center border-2 bg-card">
                      {step.status === "success" && (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      )}
                      {step.status === "running" && (
                        <Loader2 className="w-5 h-5 text-info animate-spin" />
                      )}
                      {step.status === "failed" && (
                        <XCircle className="w-5 h-5 text-destructive" />
                      )}
                      {step.status === "pending" && (
                        <div className="w-3 h-3 rounded-full bg-muted" />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-0.5 h-12 bg-border mt-2" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pt-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{step.name}</h3>
                      <span className="text-sm text-muted-foreground">{step.time}</span>
                    </div>
                    {step.status === "running" && (
                      <div className="mt-2 w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full animate-pulse" 
                          style={{ width: "60%" }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Logs de Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs space-y-1 max-h-64 overflow-y-auto">
              <div className="text-muted-foreground">[2024-09-29 14:23:01] Iniciando execução...</div>
              <div className="text-success">[2024-09-29 14:23:01] ✓ Conexão estabelecida com app01.crefisa.local</div>
              <div className="text-success">[2024-09-29 14:23:02] ✓ Serviço Apache detectado (PID: 12345)</div>
              <div className="text-success">[2024-09-29 14:23:03] ✓ Coletando logs: /var/log/apache2/error.log</div>
              <div className="text-info">[2024-09-29 14:23:04] → Executando: systemctl restart apache2</div>
              <div className="text-muted-foreground">[2024-09-29 14:23:05] Aguardando conclusão...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Execution;
