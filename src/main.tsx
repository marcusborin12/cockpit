import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { installConsoleFilters, installGlobalErrorHandler } from "./lib/console-filter";

// Debug utilities em desenvolvimento
if (import.meta.env.DEV) {
  import('./debug/awx-auth-debug');
}

// Instala filtros para suprimir erros de extensões do navegador
installConsoleFilters();
installGlobalErrorHandler();

createRoot(document.getElementById("root")!).render(<App />);
