import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Debug utilities em desenvolvimento
if (import.meta.env.DEV) {
  import('./debug/awx-auth-debug');
}

createRoot(document.getElementById("root")!).render(<App />);
