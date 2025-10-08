import { Layout } from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Server, Plug, Settings2, Plus, Search, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  last_sign_in_at: string | null;
}

const Admin = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  // Função para carregar usuários do Supabase
  const loadUsers = async () => {
    try {
      const { data: { users }, error } = await supabase.auth.admin.listUsers();
      if (error) throw error;
      
      setUsers(users.map(user => ({
        id: user.id,
        email: user.email || "",
        role: user.role || "Viewer",
        status: user.banned ? "inactive" : "active",
        created_at: user.created_at,
        last_sign_in_at: user.last_sign_in_at
      })));
    } catch (error) {
      console.error("Erro ao carregar usuários:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de usuários.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Carrega usuários quando o componente monta
  useEffect(() => {
    loadUsers();
  }, []);

  const integrations = [
    { name: "AWX / Ansible Tower", status: "connected", lastSync: "2 min atrás" },
    { name: "Jenkins", status: "connected", lastSync: "5 min atrás" },
    { name: "ServiceNow ITSM", status: "connected", lastSync: "1 min atrás" },
    { name: "Jira", status: "disconnected", lastSync: "2h atrás" }
  ];

  const environments = [
    { name: "Produção", servers: 45, status: "healthy" },
    { name: "Homologação", servers: 12, status: "healthy" },
    { name: "Desenvolvimento", servers: 8, status: "warning" }
  ];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie usuários, integrações e configurações
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Usuários
              </CardTitle>
              <Users className="w-5 h-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Servidores
              </CardTitle>
              <Server className="w-5 h-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">65</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Integrações
              </CardTitle>
              <Plug className="w-5 h-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
            </CardContent>
          </Card>
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Configurações
              </CardTitle>
              <Settings2 className="w-5 h-5 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
            </CardContent>
          </Card>
        </div>

        {/* Users Management */}
        <Card className="shadow-card">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Gerenciamento de Usuários</CardTitle>
            <Button 
              className="gap-2"
              onClick={() => {
                // TODO: Implementar modal de criação de usuário
                toast({
                  title: "Em desenvolvimento",
                  description: "Funcionalidade de criar usuário será implementada em breve.",
                });
              }}
            >
              <Plus className="w-4 h-4" />
              Novo Usuário
            </Button>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuários..."
                  className="pl-10 h-11"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-left">
                      <th className="pb-3 font-semibold text-sm">Email</th>
                      <th className="pb-3 font-semibold text-sm">Perfil</th>
                      <th className="pb-3 font-semibold text-sm">Status</th>
                      <th className="pb-3 font-semibold text-sm">Último Acesso</th>
                      <th className="pb-3 font-semibold text-sm">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(user => 
                        user.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((user) => (
                        <tr key={user.id} className="border-b border-border hover:bg-muted/50">
                          <td className="py-3 text-sm text-muted-foreground">{user.email}</td>
                          <td className="py-3">
                            <Badge variant="outline">{user.role}</Badge>
                          </td>
                          <td className="py-3">
                            <Badge 
                              variant="outline"
                              className={user.status === "active" 
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                              }
                            >
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-sm text-muted-foreground">
                            {user.last_sign_in_at 
                              ? new Date(user.last_sign_in_at).toLocaleString('pt-BR')
                              : 'Nunca acessou'
                            }
                          </td>
                          <td className="py-3">
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                  // TODO: Implementar modal de edição
                                  toast({
                                    title: "Em desenvolvimento",
                                    description: "Funcionalidade de editar usuário será implementada em breve.",
                                  });
                                }}
                              >
                                Editar
                              </Button>
                              <Button 
                                variant={user.status === "active" ? "destructive" : "default"}
                                size="sm"
                                onClick={async () => {
                                  try {
                                    const { error } = await supabase.auth.admin.updateUserById(
                                      user.id,
                                      { banned: user.status === "active" }
                                    );
                                    
                                    if (error) throw error;
                                    
                                    loadUsers();
                                    toast({
                                      title: "Sucesso",
                                      description: `Usuário ${user.status === "active" ? "desativado" : "ativado"} com sucesso.`,
                                    });
                                  } catch (error) {
                                    console.error("Erro ao atualizar usuário:", error);
                                    toast({
                                      title: "Erro",
                                      description: "Não foi possível atualizar o status do usuário.",
                                      variant: "destructive",
                                    });
                                  }
                                }}
                              >
                                {user.status === "active" ? "Desativar" : "Ativar"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Integrações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {integrations.map((integration) => (
                <div 
                  key={integration.name}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold">{integration.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Última sincronização: {integration.lastSync}
                    </p>
                  </div>
                  <Badge 
                    variant="outline"
                    className={integration.status === "connected"
                      ? "bg-success/10 text-success border-success/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                    }
                  >
                    {integration.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Environments */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Ambientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {environments.map((env) => (
                <div 
                  key={env.name}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold">{env.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {env.servers} servidores
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge 
                      variant="outline"
                      className={env.status === "healthy"
                        ? "bg-success/10 text-success border-success/20"
                        : "bg-warning/10 text-warning border-warning/20"
                      }
                    >
                      {env.status}
                    </Badge>
                    <Button variant="ghost" size="sm">Configurar</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Admin;
