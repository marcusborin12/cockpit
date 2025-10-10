import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { awxService } from '@/services/awx';

interface User {
  id?: number;
  username: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  is_superuser?: boolean;
  is_staff?: boolean;
  // Campos adicionais que podem vir da API
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Verifica se o usuário está autenticado ao carregar a aplicação
  const checkAuth = async () => {
    try {
      setIsLoading(true);
      
      if (awxService.isLoggedIn()) {
        const userData = await awxService.getCurrentUser();
        setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      // Se houver erro, remove credenciais inválidas
      awxService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Função de login
  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true);
      const userData = await awxService.login(username, password);
      setUser(userData);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Função de logout
  const logout = () => {
    awxService.logout();
    setUser(null);
  };

  // Verifica autenticação ao montar o componente
  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado para usar o contexto de autenticação
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};