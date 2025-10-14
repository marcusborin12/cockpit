import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogIn, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { z } from "zod";

const usernameSchema = z.string().min(1, "Nome de usuário é obrigatório");
const passwordSchema = z.string().min(1, "Senha é obrigatória");

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login, isAuthenticated, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Se já estiver autenticado, redireciona para dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validação dos campos
      const usernameValidation = usernameSchema.safeParse(username);
      if (!usernameValidation.success) {
        toast({
          title: "Erro",
          description: usernameValidation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      const passwordValidation = passwordSchema.safeParse(password);
      if (!passwordValidation.success) {
        toast({
          title: "Erro",
          description: passwordValidation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      // Faz login usando o contexto de autenticação
      await login(username, password);

      toast({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });

      // Navega para dashboard
      navigate("/dashboard");

    } catch (error: any) {
      toast({
        title: "Erro no Login",
        description: error.message || "Credenciais inválidas. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Se ainda está carregando a verificação inicial de auth, mostra loading
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-lg">
            <LogIn className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">Crefisa Automation Hub</CardTitle>
          <CardDescription>
            Acesse a plataforma de automação e orquestração
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Seu nome de usuário"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="h-11"
                required
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
                required
                autoComplete="current-password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full h-11 text-base font-semibold" 
              disabled={loading || isLoading}
            >
              {(loading || isLoading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Entrar
            </Button>
            
            {/* Botão de teste - apenas em desenvolvimento */}
            {import.meta.env.DEV && import.meta.env.VITE_TEST_USERNAME && import.meta.env.VITE_TEST_PASSWORD && (
              <Button 
                type="button"
                variant="outline"
                className="w-full h-11 text-base font-medium" 
                disabled={loading || isLoading}
                onClick={() => {
                  setUsername(import.meta.env.VITE_TEST_USERNAME);
                  setPassword(import.meta.env.VITE_TEST_PASSWORD);
                }}
              >
                Usar Credenciais de Teste
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
