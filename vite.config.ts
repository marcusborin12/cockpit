import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega variáveis de ambiente
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: {
        '/api': {
          target: env.VITE_PORTAL_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api/v2'),
          configure: (proxy, options) => {
            console.log('🔧 Proxy configurado para:', options.target);
            
            // Log de requisições proxy
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
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
