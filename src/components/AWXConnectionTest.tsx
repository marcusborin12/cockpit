import { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { hasValidAuthSession, getSessionCredentials, getSessionUsername } from '@/lib/auth-cookies';

interface ConnectionTestResult {
  step: string;
  success: boolean;
  message: string;
  details?: any;
}

export const AWXConnectionTest = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<ConnectionTestResult[]>([]);

  const runTest = async () => {
    setTesting(true);
    setResults([]);

    const testResults: ConnectionTestResult[] = [];

    // Teste 1: Verificar autenticação por sessão
    try {
      if (!hasValidAuthSession()) {
        testResults.push({
          step: 'Autenticação',
          success: false,
          message: 'Sessão de autenticação não encontrada ou expirada',
        });
      } else {
        const username = getSessionUsername();
        testResults.push({
          step: 'Autenticação',
          success: true,
          message: `Usuário: ${username || 'N/A'}`,
          details: { username, hasCredentials: !!getSessionCredentials() }
        });
      }
      setResults([...testResults]);
    } catch (error) {
      testResults.push({
        step: 'Autenticação',
        success: false,
        message: 'Erro ao verificar autenticação',
        details: error
      });
      setResults([...testResults]);
    }

    // Teste 2: Verificar conectividade básica
    try {
      const baseUrl = import.meta.env.DEV ? '/awx-api' : import.meta.env.VITE_AWX_BASE_URL;
      if (baseUrl) {
        const testUrl = baseUrl.includes('/awx-api') ? '/awx-api' : baseUrl.replace('/api/v2', '/api/');
        const response = await fetch(testUrl, {
          method: 'GET',
          mode: 'cors',
        });

        testResults.push({
          step: 'Conectividade Básica',
          success: response.ok,
          message: `Status: ${response.status} - ${response.statusText}`,
          details: {
            status: response.status,
            headers: Object.fromEntries(response.headers.entries())
          }
        });
      }
      setResults([...testResults]);
    } catch (error) {
      testResults.push({
        step: 'Conectividade Básica',
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error
      });
      setResults([...testResults]);
    }

    // Teste 3: Verificar endpoint /me/ com autenticação por sessão
    try {
      const baseUrl = import.meta.env.DEV ? '/awx-api' : import.meta.env.VITE_AWX_BASE_URL;
      const credentials = getSessionCredentials();
      
      if (baseUrl && credentials) {
        const response = await fetch(`${baseUrl}/me/`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          testResults.push({
            step: 'Endpoint /me/',
            success: true,
            message: `Usuário: ${data.username || 'N/A'}`,
            details: data
          });
        } else {
          const errorText = await response.text().catch(() => 'No response body');
          testResults.push({
            step: 'Endpoint /me/',
            success: false,
            message: `${response.status} - ${response.statusText}`,
            details: { errorText, status: response.status }
          });
        }
      } else {
        testResults.push({
          step: 'Endpoint /me/',
          success: false,
          message: 'URL base ou credenciais não disponíveis',
        });
      }
      setResults([...testResults]);
    } catch (error) {
      testResults.push({
        step: 'Endpoint /me/',
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error
      });
      setResults([...testResults]);
    }

    // Teste 4: Verificar endpoint de jobs
    try {
      const baseUrl = import.meta.env.DEV ? '/awx-api' : import.meta.env.VITE_AWX_BASE_URL;
      const credentials = getSessionCredentials();
      
      if (baseUrl && credentials) {
        const response = await fetch(`${baseUrl}/jobs/?page_size=1`, {
          method: 'GET',
          mode: 'cors',
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          testResults.push({
            step: 'Endpoint Jobs',
            success: true,
            message: `Total de jobs: ${data.count || 0}`,
            details: data
          });
        } else {
          const errorText = await response.text().catch(() => 'No response body');
          testResults.push({
            step: 'Endpoint Jobs',
            success: false,
            message: `${response.status} - ${response.statusText}`,
            details: { errorText, status: response.status }
          });
        }
      } else {
        testResults.push({
          step: 'Endpoint Jobs',
          success: false,
          message: 'URL base ou credenciais não disponíveis',
        });
      }
      setResults([...testResults]);
    } catch (error) {
      testResults.push({
        step: 'Endpoint Jobs',
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error
      });
      setResults([...testResults]);
    }

    setTesting(false);
  };

  const getIcon = (success: boolean) => {
    if (success) return <CheckCircle2 className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Teste de Conectividade AWX
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runTest} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testando...
            </>
          ) : (
            'Executar Teste de Conectividade'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <Alert key={index} variant={result.success ? "default" : "destructive"}>
                <div className="flex items-start gap-3">
                  {getIcon(result.success)}
                  <div className="flex-1">
                    <div className="font-medium">{result.step}</div>
                    <div className="text-sm">{result.message}</div>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs cursor-pointer text-muted-foreground">
                          Ver detalhes
                        </summary>
                        <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            <strong>Possíveis soluções para "Failed to fetch":</strong>
            <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
              <li>Verificar se o AWX está acessível na rede (ping {import.meta.env.VITE_AWX_BASE_URL?.split('//')[1]?.split(':')[0]})</li>
              <li>Verificar se o AWX tem CORS configurado para permitir requisições do frontend</li>
              <li>Verificar se suas credenciais de autenticação ainda são válidas</li>
              <li>Verificar se há firewall bloqueando a conexão</li>
              <li>Tentar acessar {import.meta.env.VITE_AWX_BASE_URL} diretamente no navegador</li>
              <li>Fazer login novamente para renovar a sessão de autenticação</li>
            </ul>
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};