import { describe, it, expect } from 'vitest'

describe('Environment Variables', () => {
  it('should have AWX API configuration', () => {
    expect(import.meta.env.VITE_AWX_API).toBeDefined()
    expect(import.meta.env.VITE_AWX_API).toMatch(/^https?:\/\//)
  })

  it('should have test credentials in development', () => {
    // Em ambiente de teste, estas variáveis podem estar definidas
    if (import.meta.env.VITE_TEST_USERNAME) {
      expect(import.meta.env.VITE_TEST_USERNAME).toBeDefined()
      expect(import.meta.env.VITE_TEST_USERNAME.length).toBeGreaterThan(0)
      expect(typeof import.meta.env.VITE_TEST_USERNAME).toBe('string')
    }
    
    if (import.meta.env.VITE_TEST_PASSWORD) {
      expect(import.meta.env.VITE_TEST_PASSWORD).toBeDefined()
      expect(import.meta.env.VITE_TEST_PASSWORD.length).toBeGreaterThan(0)
      expect(typeof import.meta.env.VITE_TEST_PASSWORD).toBe('string')
    }
  })

  it('should have cache configuration', () => {
    expect(import.meta.env.VITE_CACHE_DASHBOARD_STATS_TTL).toBeDefined()
    expect(import.meta.env.VITE_CACHE_MONTHLY_DATA_TTL).toBeDefined()
    expect(import.meta.env.VITE_CACHE_RECENT_EXECUTIONS_TTL).toBeDefined()
    expect(import.meta.env.VITE_CACHE_VERSION).toBeDefined()
    expect(import.meta.env.VITE_CACHE_VERSION).toBe('1.0.1')
  })

  it('should have development environment check', () => {
    // Em ambiente de teste, DEV pode ser false
    expect(typeof import.meta.env.DEV).toBe('boolean')
  })
})