/**
 * Filtros para suprimir mensagens de erro desnecessárias do console
 * Especialmente útil para filtrar erros de extensões do navegador
 */

// Tipagem para Chrome API (se disponível)
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        lastError?: { message: string };
      };
    };
  }
}

// Lista de padrões de erro que devem ser filtrados
const ERROR_PATTERNS_TO_SUPPRESS = [
  /runtime\.lastError/i,
  /message channel closed/i,
  /listener indicated an asynchronous response/i,
  /Extension context invalidated/i,
  /The message port closed before a response was received/i,
  /Unchecked runtime\.lastError/i,
  /A listener indicated an asynchronous response by returning true/i,
  /but the message channel closed before a response was received/i,
  // Padrões para erros de extensões específicas
  /chrome-extension:\/\//i,
  /moz-extension:\/\//i,
  /extension\//i,
];

// Backup das funções originais do console
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

/**
 * Verifica se uma mensagem deve ser suprimida
 */
function shouldSuppressMessage(message: string): boolean {
  return ERROR_PATTERNS_TO_SUPPRESS.some(pattern => pattern.test(message));
}

/**
 * Instala os filtros de console
 */
export function installConsoleFilters() {
  // Substitui console.error
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppressMessage(message)) {
      originalConsoleError.apply(console, args);
    }
  };

  // Substitui console.warn
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppressMessage(message)) {
      originalConsoleWarn.apply(console, args);
    }
  };
}

/**
 * Remove os filtros de console (restaura o comportamento original)
 */
export function uninstallConsoleFilters() {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
}

/**
 * Intercepta erros globais não tratados para filtrar erros de extensão
 */
export function installGlobalErrorHandler() {
  // Intercepta erros de JavaScript
  window.addEventListener('error', (event) => {
    if (shouldSuppressMessage(event.message)) {
      event.preventDefault();
      return false;
    }
  });

  // Intercepta promises rejeitadas
  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    if (shouldSuppressMessage(message)) {
      event.preventDefault();
      return false;
    }
  });

  // Intercepta erros específicos do Chrome runtime
  if (typeof (window as any).chrome !== 'undefined' && (window as any).chrome.runtime) {
    const chrome = (window as any).chrome;
    const originalGetLastError = chrome.runtime.lastError;
    Object.defineProperty(chrome.runtime, 'lastError', {
      get: function() {
        const error = originalGetLastError;
        if (error && shouldSuppressMessage(error.message || '')) {
          return undefined; // Suprime o erro
        }
        return error;
      },
      configurable: true
    });
  }

  // Intercepta erros do console que aparecem diretamente no DevTools
  const originalConsoleDir = console.dir;
  console.dir = (...args: any[]) => {
    const message = args.join(' ');
    if (!shouldSuppressMessage(message)) {
      originalConsoleDir.apply(console, args);
    }
  };
}