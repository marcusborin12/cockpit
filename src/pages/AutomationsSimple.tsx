import React from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AutomationsSimple = () => {
  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Automações - Teste</h1>
          <p className="text-muted-foreground mt-1">
            Teste básico para verificar se a página renderiza
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Teste de Renderização</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Se você está vendo esta mensagem, a página está renderizando corretamente.</p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AutomationsSimple;