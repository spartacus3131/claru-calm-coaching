import { isProtectedPath } from './routeProtection';

describe('User Identity - route protection', () => {
  describe('public routes', () => {
    it('does not protect /auth', () => {
      expect(isProtectedPath('/auth')).toBe(false);
      expect(isProtectedPath('/auth/reset')).toBe(false);
    });

    it('does not protect marketing routes', () => {
      expect(isProtectedPath('/')).toBe(false);
      expect(isProtectedPath('/pricing')).toBe(false);
    });
  });

  describe('protected routes (app route group)', () => {
    it('protects /chat', () => {
      expect(isProtectedPath('/chat')).toBe(true);
    });

    it('protects /notes', () => {
      expect(isProtectedPath('/notes')).toBe(true);
      expect(isProtectedPath('/notes/2026-01-31')).toBe(true);
    });

    it('protects /challenges', () => {
      expect(isProtectedPath('/challenges')).toBe(true);
      expect(isProtectedPath('/challenges/1')).toBe(true);
    });

    it('protects /projects', () => {
      expect(isProtectedPath('/projects')).toBe(true);
      expect(isProtectedPath('/projects/abc-123')).toBe(true);
    });
  });
});

