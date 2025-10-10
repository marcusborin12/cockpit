/**
 * Utilitários para gerenciamento de cookies de sessão
 */

export interface AuthCookie {
  credentials: string; // Base64 encoded user:pass
  username: string;
  expiresAt: number; // timestamp
}

const COOKIE_NAME = 'awx_auth_session';
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000; // 8 horas em milissegundos

/**
 * Salva as credenciais de autenticação em cookie de sessão
 */
export const setAuthCookie = (credentials: string, username: string): void => {
  const expiresAt = Date.now() + COOKIE_MAX_AGE;
  
  const authData: AuthCookie = {
    credentials,
    username,
    expiresAt
  };

  const cookieValue = btoa(JSON.stringify(authData));
  const expiresDate = new Date(expiresAt);

  // Define o cookie com configurações seguras
  document.cookie = `${COOKIE_NAME}=${cookieValue}; expires=${expiresDate.toUTCString()}; path=/; secure=false; samesite=strict`;
  
  console.log('🍪 Cookie de autenticação salvo:', { username, expiresAt: expiresDate });
};

/**
 * Recupera as credenciais de autenticação do cookie
 */
export const getAuthCookie = (): AuthCookie | null => {
  try {
    const cookies = document.cookie.split(';');
    const authCookie = cookies.find(cookie => 
      cookie.trim().startsWith(`${COOKIE_NAME}=`)
    );

    if (!authCookie) {
      console.log('🍪 Cookie de autenticação não encontrado');
      return null;
    }

    const cookieValue = authCookie.split('=')[1];
    const authData: AuthCookie = JSON.parse(atob(cookieValue));

    // Verifica se o cookie não expirou
    if (authData.expiresAt < Date.now()) {
      console.log('🍪 Cookie de autenticação expirado');
      removeAuthCookie();
      return null;
    }

    console.log('🍪 Cookie de autenticação recuperado:', { 
      username: authData.username, 
      expiresAt: new Date(authData.expiresAt) 
    });
    
    return authData;
  } catch (error) {
    console.error('❌ Erro ao ler cookie de autenticação:', error);
    removeAuthCookie();
    return null;
  }
};

/**
 * Remove o cookie de autenticação
 */
export const removeAuthCookie = (): void => {
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
  console.log('🍪 Cookie de autenticação removido');
};

/**
 * Verifica se existe uma sessão de autenticação válida
 */
export const hasValidAuthSession = (): boolean => {
  const authCookie = getAuthCookie();
  return authCookie !== null;
};

/**
 * Obtém as credenciais Basic Auth da sessão atual
 */
export const getSessionCredentials = (): string | null => {
  const authCookie = getAuthCookie();
  return authCookie?.credentials || null;
};

/**
 * Obtém o username da sessão atual
 */
export const getSessionUsername = (): string | null => {
  const authCookie = getAuthCookie();
  return authCookie?.username || null;
};