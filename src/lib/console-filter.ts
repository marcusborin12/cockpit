/**
 * Filtros para suprimir mensagens de erro desnecessárias do console
 * Especialmente útil para filtrar erros de extensões do navegador
 */

// Lista de padrões de erro que devem ser filtrados
const ERROR_PATTERNS_TO_SUPPRESS = [
  /runtime\.lastError/i,
  /message channel closed/i,
  /listener indicated an asynchronous response/i,
  /Extension context invalidated/i,
  /The message port closed before a response was received/i,
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
  window.addEventListener('error', (event) => {
    if (shouldSuppressMessage(event.message)) {
      event.preventDefault();
      return false;
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    const message = event.reason?.message || event.reason?.toString() || '';
    if (shouldSuppressMessage(message)) {
      event.preventDefault();
      return false;
    }
  });
}