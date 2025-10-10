import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DevModeContextType {
  devMode: boolean;
  toggleDevMode: () => void;
}

const DevModeContext = createContext<DevModeContextType | undefined>(undefined);

interface DevModeProviderProps {
  children: ReactNode;
}

export const DevModeProvider: React.FC<DevModeProviderProps> = ({ children }) => {
  const [devMode, setDevMode] = useState<boolean>(() => {
    // Inicializa com base no localStorage ou false como padrão
    const saved = localStorage.getItem('dev-mode-enabled');
    return saved === 'true';
  });

  const toggleDevMode = () => {
    setDevMode(prev => {
      const newValue = !prev;
      // Persiste no localStorage
      localStorage.setItem('dev-mode-enabled', String(newValue));
      console.log(`🔧 Dev Mode ${newValue ? 'ativado' : 'desativado'}`);
      return newValue;
    });
  };

  // Log inicial do estado
  useEffect(() => {
    console.log(`🔧 Dev Mode inicial: ${devMode ? 'ativado' : 'desativado'}`);
  }, []);

  const value = {
    devMode,
    toggleDevMode,
  };

  return (
    <DevModeContext.Provider value={value}>
      {children}
    </DevModeContext.Provider>
  );
};

export const useDevMode = (): DevModeContextType => {
  const context = useContext(DevModeContext);
  if (context === undefined) {
    throw new Error('useDevMode must be used within a DevModeProvider');
  }
  return context;
};