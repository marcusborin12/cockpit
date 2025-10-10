// Utilitário para debug da autenticação AWX
// Este arquivo pode ser usado temporariamente para testar a conexão

import { awxService } from '@/services/awx';

// Função para testar a conexão AWX (pode ser chamada no console do navegador)
(window as any).testAWXAuth = async (username: string, password: string) => {
  try {
    console.log('🔍 Testando login AWX...', { username });
    const user = await awxService.login(username, password);
    console.log('✅ Login bem-sucedido:', user);
    return user;
  } catch (error) {
    console.error('❌ Erro no login:', error);
    throw error;
  }
};

// Função para testar se está logado
(window as any).checkAWXAuth = async () => {
  try {
    console.log('🔍 Verificando autenticação atual...');
    const isLoggedIn = awxService.isLoggedIn();
    console.log('📊 Status de login:', isLoggedIn);
    
    if (isLoggedIn) {
      const currentUser = await awxService.getCurrentUser();
      console.log('👤 Usuário atual:', currentUser);
      return currentUser;
    }
    
    return null;
  } catch (error) {
    console.error('❌ Erro ao verificar autenticação:', error);
    throw error;
  }
};

// Função para logout
(window as any).logoutAWX = () => {
  awxService.logout();
  console.log('👋 Logout realizado');
};

console.log('🔧 Debug AWX Auth carregado. Use as funções:');
console.log('- testAWXAuth("username", "password") - Testa login');
console.log('- checkAWXAuth() - Verifica se está logado');  
console.log('- logoutAWX() - Faz logout');