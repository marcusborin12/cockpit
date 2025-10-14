import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";


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
          target: env.VITE_AWX_API || 'http://localhost:8080',
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
  };
});
