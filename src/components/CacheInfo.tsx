import { useState, useEffect } from 'react';
import { dashboardCache } from '@/lib/dashboard-cache';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2, Database } from 'lucide-react';
import { useDevMode } from '@/contexts/DevModeContext';

export const CacheInfo = () => {
  const { devMode } = useDevMode();
  const [cacheInfo, setCacheInfo] = useState<Record<string, any>>({});
  const [cacheConfig, setCacheConfig] = useState<Record<string, any>>({});
  
  const updateCacheInfo = () => {
    const info = dashboardCache.getInfo();
    const config = dashboardCache.getConfig();
    setCacheInfo(info);
    setCacheConfig(config);
  };

  useEffect(() => {
    if (devMode) {
      updateCacheInfo();
      const interval = setInterval(updateCacheInfo, 5000); // Atualiza a cada 5 segundos
      return () => clearInterval(interval);
    }
  }, [devMode]);

  const handleClearCache = () => {
    dashboardCache.clearAll();
    updateCacheInfo();
  };

  const handleClearExpired = () => {
    dashboardCache.clearExpired();
    updateCacheInfo();
  };

  if (!devMode) return null;

  return (
    <Card className="mt-4 border-dashed border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-orange-800 flex items-center gap-2">
          <Database className="w-4 h-4" />
          Cache Info (Dev Mode)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2 text-xs">
          {Object.entries(cacheInfo).map(([key, info]) => (
            <div key={key} className="flex justify-between items-center py-1 px-2 bg-white rounded border">
              <span className="font-mono text-gray-600">{key}</span>
              <div className="text-right">
                {info.cached ? (
                  <div className="text-green-600">
                    <span className="text-xs">✓ Cache</span>
                    {info.age !== undefined && (
                      <span className="ml-1 text-gray-500">
                        {info.age}min atrás
                      </span>
                    )}
                    {info.expires !== undefined && (
                      <span className="ml-1 text-gray-500">
                        (exp: {info.expires}min)
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="text-gray-400">✗ Não cacheado</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Configurações de TTL */}
        <div className="mt-3 pt-3 border-t">
          <h4 className="text-xs font-medium text-gray-700 mb-2">Configurações de TTL (minutos)</h4>
          <div className="space-y-1">
            {Object.entries(cacheConfig).map(([key, config]) => (
              <div key={key} className="flex justify-between text-xs py-1 px-2 bg-gray-50 rounded">
                <span className="font-mono text-gray-600">{key}</span>
                <span className="text-gray-500">{config.ttl}min</span>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex gap-2 mt-3 pt-3 border-t">
          <Button
            size="sm"
            variant="outline"
            onClick={updateCacheInfo}
            className="text-xs"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Atualizar
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearExpired}
            className="text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Limpar Expirados
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={handleClearCache}
            className="text-xs"
          >
            <Trash2 className="w-3 h-3 mr-1" />
            Limpar Tudo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};