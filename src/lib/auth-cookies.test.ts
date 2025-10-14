import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  setAuthCookie, 
  getAuthCookie, 
  removeAuthCookie, 
  hasValidAuthSession,
  getSessionCredentials,
  getSessionUsername 
} from '../lib/auth-cookies';

// Mock do document.cookie
const mockCookie = {
  value: '',
  get cookie() { return this.value; },
  set cookie(val) { this.value = val; }
};

Object.defineProperty(document, 'cookie', {
  get: () => mockCookie.cookie,
  set: (val) => { mockCookie.cookie = val; },
  configurable: true
});

describe('Auth Cookies', () => {
  beforeEach(() => {
    mockCookie.value = '';
    vi.clearAllMocks();
  });

  describe('setAuthCookie', () => {
    it('should set authentication cookie correctly', () => {
      const credentials = btoa('user:password');
      const username = 'testuser';
      
      setAuthCookie(credentials, username);
      
      expect(document.cookie).toContain('awx_auth_session=');
    });
  });

  describe('getAuthCookie', () => {
    it('should return null when no cookie exists', () => {
      const result = getAuthCookie();
      expect(result).toBeNull();
    });

    it('should return auth data when valid cookie exists', () => {
      const credentials = btoa('user:password');
      const username = 'testuser';
      
      // Simular um cookie válido
      const authData = {
        credentials,
        username,
        expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutos no futuro
      };
      
      const cookieValue = btoa(JSON.stringify(authData));
      mockCookie.value = `awx_auth_session=${cookieValue}`;
      
      const result = getAuthCookie();
      expect(result).not.toBeNull();
      expect(result?.username).toBe(username);
      expect(result?.credentials).toBe(credentials);
    });

    it('should return null when cookie is expired', () => {
      const authData = {
        credentials: btoa('user:password'),
        username: 'testuser',
        expiresAt: Date.now() - 1000 // 1 segundo no passado
      };
      
      const cookieValue = btoa(JSON.stringify(authData));
      mockCookie.value = `awx_auth_session=${cookieValue}`;
      
      const result = getAuthCookie();
      expect(result).toBeNull();
    });
  });

  describe('hasValidAuthSession', () => {
    it('should return false when no session exists', () => {
      expect(hasValidAuthSession()).toBe(false);
    });

    it('should return true when valid session exists', () => {
      const authData = {
        credentials: btoa('user:password'),
        username: 'testuser',
        expiresAt: Date.now() + 10 * 60 * 1000
      };
      
      const cookieValue = btoa(JSON.stringify(authData));
      mockCookie.value = `awx_auth_session=${cookieValue}`;
      
      expect(hasValidAuthSession()).toBe(true);
    });
  });

  describe('getSessionCredentials', () => {
    it('should return credentials when valid session exists', () => {
      const credentials = btoa('user:password');
      const authData = {
        credentials,
        username: 'testuser',
        expiresAt: Date.now() + 10 * 60 * 1000
      };
      
      const cookieValue = btoa(JSON.stringify(authData));
      mockCookie.value = `awx_auth_session=${cookieValue}`;
      
      expect(getSessionCredentials()).toBe(credentials);
    });

    it('should return null when no session exists', () => {
      expect(getSessionCredentials()).toBeNull();
    });
  });

  describe('getSessionUsername', () => {
    it('should return username when valid session exists', () => {
      const username = 'testuser';
      const authData = {
        credentials: btoa('user:password'),
        username,
        expiresAt: Date.now() + 10 * 60 * 1000
      };
      
      const cookieValue = btoa(JSON.stringify(authData));
      mockCookie.value = `awx_auth_session=${cookieValue}`;
      
      expect(getSessionUsername()).toBe(username);
    });

    it('should return null when no session exists', () => {
      expect(getSessionUsername()).toBeNull();
    });
  });

  describe('removeAuthCookie', () => {
    it('should remove the authentication cookie', () => {
      // Primeiro define um cookie
      const authData = {
        credentials: btoa('user:password'),
        username: 'testuser',
        expiresAt: Date.now() + 10 * 60 * 1000
      };
      
      const cookieValue = btoa(JSON.stringify(authData));
      mockCookie.value = `awx_auth_session=${cookieValue}`;
      
      // Verifica que existe
      expect(hasValidAuthSession()).toBe(true);
      
      // Remove o cookie
      removeAuthCookie();
      
      // O cookie deve ser definido para expirar (data no passado)
      expect(document.cookie).toContain('expires=Thu, 01 Jan 1970');
    });
  });
});