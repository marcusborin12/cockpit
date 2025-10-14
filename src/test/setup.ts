import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// Mock para variáveis de ambiente do Vite
Object.defineProperty(window, 'import', {
  value: {
    meta: {
      env: {
        DEV: true,
        VITE_AWX_API: 'http://localhost:8080',
        VITE_CACHE_DASHBOARD_STATS_TTL: '5',
        VITE_CACHE_MONTHLY_DATA_TTL: '60',
        VITE_CACHE_RECENT_EXECUTIONS_TTL: '2',
        VITE_CACHE_VERSION: '1.0.1'
      }
    }
  }
});

// Mock para fetch API
global.fetch = vi.fn();

// Mock para console.log em testes (opcional)
beforeEach(() => {
  vi.clearAllMocks();
});

// Mock para window.matchMedia (usado pelo Tailwind)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock para ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock para localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
} as Storage;
global.localStorage = localStorageMock;

// Mock para sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
} as Storage;
global.sessionStorage = sessionStorageMock;