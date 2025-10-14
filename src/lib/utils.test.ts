import { describe, it, expect } from 'vitest';
import { cn } from '../lib/utils';

describe('Utils', () => {
  describe('cn function', () => {
    it('should merge class names correctly', () => {
      const result = cn('base-class', 'additional-class');
      expect(result).toContain('base-class');
      expect(result).toContain('additional-class');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const result = cn('base-class', isActive && 'active-class');
      expect(result).toContain('base-class');
      expect(result).toContain('active-class');
    });

    it('should filter out falsy values', () => {
      const result = cn('base-class', false && 'hidden-class', null, undefined, '');
      expect(result).toContain('base-class');
      expect(result).not.toContain('hidden-class');
    });

    it('should handle Tailwind variants correctly', () => {
      const result = cn('p-4 bg-red-500', 'bg-blue-500');
      // Should prioritize the last bg class (bg-blue-500)
      expect(result).toContain('p-4');
      expect(result).toContain('bg-blue-500');
    });
  });
});