/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => {
  // Não carrega automaticamente arquivos .env
  // Usa apenas variáveis de ambiente do sistema ou runtime config

  // Para proxy, usa variável de ambiente do sistema se disponível
  const awxApiUrl = process.env.VITE_AWX_API || 'http://192.168.15.52:8080';

  return {
    // Define diretório inexistente para desabilitar carregamento de .env
    envDir: './env-disabled',
    
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: awxApiUrl,
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api/v2'),
          configure: (proxy, options) => {
            console.log('🔧 Proxy configurado para:', options.target);

            proxy.on('proxyReq', (proxyReq, req, res) => {
              console.log('📤 Proxy Request:', req.method, req.url, 'to', options.target + proxyReq.path);
            });

            proxy.on('proxyRes', (proxyRes, req, res) => {
              console.log('📥 Proxy Response:', proxyRes.statusCode, req.url);
            });
          }
        },
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        // Ajuste aqui: usar process.cwd() ao invés de __dirname
        "@": path.resolve(process.cwd(), "src"),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx'] // garante que todas extensões sejam resolvidas
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      reporters: ['verbose'],
      coverage: {
        reporter: ['text', 'json', 'html'],
        exclude: [
          'node_modules/',
          'src/test/',
        ],
      },
    },
  };
});
