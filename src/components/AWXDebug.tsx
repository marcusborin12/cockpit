import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { getSessionCredentials, getSessionUsername, hasValidAuthSession } from '@/lib/auth-cookies';

export const AWXDebug = () => {
  const [results, setResults] = useState<string[]>([]);
  
  const testSpecificEndpoint = async () => {
    const logs: string[] = [];
    
    try {
      // Teste direto do endpoint de jobs
      const baseUrl = '/api';
      const credentials = getSessionCredentials();
      const username = getSessionUsername();
      
      logs.push(`🔍 Base URL: ${baseUrl}`);
      logs.push(`� Username: ${username || 'N/A'}`);
      logs.push(`🔑 Has credentials: ${!!credentials}`);
      logs.push(`🔒 Session valid: ${hasValidAuthSession()}`);
      
      if (!credentials) {
        logs.push(`❌ Nenhuma credencial de sessão encontrada. Faça login primeiro.`);
        setResults(logs);
        return;
      }
      
      // Teste 1: Jobs básico
      const jobsUrl = `${baseUrl}/jobs/`;
      logs.push(`📡 Testando: ${jobsUrl}`);
      
      const response = await fetch(jobsUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json',
        },
      });
      
      logs.push(`📊 Status: ${response.status} - ${response.statusText}`);
      logs.push(`✅ OK: ${response.ok}`);
      
      if (response.ok) {
        const data = await response.json();
        logs.push(`📈 Count: ${data.count}`);
        logs.push(`📋 Results length: ${data.results?.length || 0}`);
        
        if (data.results && data.results.length > 0) {
          const firstJob = data.results[0];
          logs.push(`🔍 First job: ID=${firstJob.id}, Status=${firstJob.status}, Name=${firstJob.name}`);
        }
      } else {
        const errorText = await response.text();
        logs.push(`❌ Error response: ${errorText}`);
      }
      
    } catch (error) {
      logs.push(`💥 Exception: ${error instanceof Error ? error.message : error}`);
    }
    
    setResults(logs);
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>🐛 AWX Debug - Teste Específico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={testSpecificEndpoint}>
          Testar Endpoint Jobs Diretamente
        </Button>
        
        {results.length > 0 && (
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-sm">
            {results.map((log, index) => (
              <div key={index}>{log}</div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};