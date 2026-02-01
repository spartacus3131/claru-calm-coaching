import { determineAuthAction, AuthAction } from './authGuard';

describe('User Identity - auth guard', () => {
  describe('protected routes without session', () => {
    it('redirects /chat to /auth when no session', () => {
      const result = determineAuthAction('/chat', null);
      expect(result).toEqual<AuthAction>({
        action: 'redirect',
        destination: '/auth',
      });
    });

    it('redirects /notes to /auth when no session', () => {
      const result = determineAuthAction('/notes', null);
      expect(result).toEqual<AuthAction>({
        action: 'redirect',
        destination: '/auth',
      });
    });

    it('redirects /challenges/1 to /auth when no session', () => {
      const result = determineAuthAction('/challenges/1', null);
      expect(result).toEqual<AuthAction>({
        action: 'redirect',
        destination: '/auth',
      });
    });
  });

  describe('protected routes with session', () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };

    it('allows /chat when session exists', () => {
      const result = determineAuthAction('/chat', mockUser);
      expect(result).toEqual<AuthAction>({ action: 'continue' });
    });

    it('allows /notes when session exists', () => {
      const result = determineAuthAction('/notes', mockUser);
      expect(result).toEqual<AuthAction>({ action: 'continue' });
    });
  });

  describe('public routes', () => {
    it('allows /auth regardless of session', () => {
      expect(determineAuthAction('/auth', null)).toEqual<AuthAction>({
        action: 'continue',
      });
      expect(
        determineAuthAction('/auth', { id: 'user-123', email: 'test@example.com' })
      ).toEqual<AuthAction>({ action: 'continue' });
    });

    it('allows / regardless of session', () => {
      expect(determineAuthAction('/', null)).toEqual<AuthAction>({
        action: 'continue',
      });
    });
  });
});
