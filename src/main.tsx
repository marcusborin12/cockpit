import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installConsoleFilters, installGlobalErrorHandler } from "./lib/console-filter";

// Intercepta especificamente o erro "Unchecked runtime.lastError"
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
  const message = args.join(' ');
  
  // Suprime especificamente o erro que você está vendo
  if (message.includes('Unchecked runtime.lastError') ||
      message.includes('listener indicated an asynchronous response by returning true') ||
      message.includes('message channel closed before a response was received')) {
    return; // Não exibe o erro
  }
  
  // Para outros erros, usa o comportamento normal
  originalConsoleError.apply(console, args);
};

// Debug utilities em desenvolvimento
if (import.meta.env.DEV) {
  import('./debug/awx-auth-debug');
}

// Instala filtros para suprimir erros de extensões do navegador
installConsoleFilters();
installGlobalErrorHandler();

createRoot(document.getElementById("root")!).render(<App />);
