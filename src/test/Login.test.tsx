import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import Login from '../pages/Login';
import { AuthProvider } from '../contexts/AuthContext';

// Mock do toast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <BrowserRouter>
          <AuthProvider>
            {children}
          </AuthProvider>
        </BrowserRouter>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('Login - Test Credentials Button', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show test credentials button when VITE_ENABLE_TEST_CREDENTIALS is true', () => {
    // As variáveis já estão definidas no setup.ts
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const testButton = screen.getByTestId('use-test-credentials-button');
    expect(testButton).toBeInTheDocument();
    expect(testButton).toHaveTextContent('Usar Credenciais de Teste');
  });

  it('should fill username and password when test credentials button is clicked', () => {
    render(
      <TestWrapper>
        <Login />
      </TestWrapper>
    );

    const usernameInput = screen.getByLabelText(/usuário/i);
    const passwordInput = screen.getByLabelText(/senha/i);
    const testButton = screen.getByTestId('use-test-credentials-button');

    // Inicialmente vazios
    expect(usernameInput).toHaveValue('');
    expect(passwordInput).toHaveValue('');

    // Clica no botão de teste
    fireEvent.click(testButton);

    // Verifica se os campos foram preenchidos
    expect(usernameInput).toHaveValue('test_user');
    expect(passwordInput).toHaveValue('test_password');
  });

  // Nota: Os testes negativos (quando o botão NÃO deve aparecer) são implícitos
  // pois em produção/desenvolvimento normal, VITE_ENABLE_TEST_CREDENTIALS não estará definido
});