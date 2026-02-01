import {
  signUp,
  signIn,
  signOut,
  AuthResult,
  type SupabaseAuthClient,
} from './authService';

describe('User Identity - auth service', () => {
  describe('signUp', () => {
    it('returns user on successful signup', async () => {
      const mockAuthClient: SupabaseAuthClient = {
        signUp: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-123', email: 'test@example.com' },
            session: { access_token: 'token' },
          },
          error: null,
        }),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      };

      const result = await signUp(mockAuthClient, 'test@example.com', 'password123');

      expect(result).toEqual<AuthResult>({
        success: true,
        user: { id: 'user-123', email: 'test@example.com' },
      });
      expect(mockAuthClient.signUp).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('returns error when signup fails', async () => {
      const mockAuthClient: SupabaseAuthClient = {
        signUp: jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Email already registered' },
        }),
        signInWithPassword: jest.fn(),
        signOut: jest.fn(),
      };

      const result = await signUp(mockAuthClient, 'existing@example.com', 'password123');

      expect(result).toEqual<AuthResult>({
        success: false,
        error: 'Email already registered',
      });
    });
  });

  describe('signIn', () => {
    it('returns user on successful login', async () => {
      const mockAuthClient: SupabaseAuthClient = {
        signUp: jest.fn(),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: {
            user: { id: 'user-123', email: 'test@example.com' },
            session: { access_token: 'token' },
          },
          error: null,
        }),
        signOut: jest.fn(),
      };

      const result = await signIn(mockAuthClient, 'test@example.com', 'password123');

      expect(result).toEqual<AuthResult>({
        success: true,
        user: { id: 'user-123', email: 'test@example.com' },
      });
      expect(mockAuthClient.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('returns error on invalid credentials', async () => {
      const mockAuthClient: SupabaseAuthClient = {
        signUp: jest.fn(),
        signInWithPassword: jest.fn().mockResolvedValue({
          data: { user: null, session: null },
          error: { message: 'Invalid login credentials' },
        }),
        signOut: jest.fn(),
      };

      const result = await signIn(mockAuthClient, 'test@example.com', 'wrongpassword');

      expect(result).toEqual<AuthResult>({
        success: false,
        error: 'Invalid login credentials',
      });
    });
  });

  describe('signOut', () => {
    it('returns success on signout', async () => {
      const mockAuthClient: SupabaseAuthClient = {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn().mockResolvedValue({ error: null }),
      };

      const result = await signOut(mockAuthClient);

      expect(result).toEqual<AuthResult>({ success: true });
      expect(mockAuthClient.signOut).toHaveBeenCalled();
    });

    it('returns error when signout fails', async () => {
      const mockAuthClient: SupabaseAuthClient = {
        signUp: jest.fn(),
        signInWithPassword: jest.fn(),
        signOut: jest.fn().mockResolvedValue({ error: { message: 'Session expired' } }),
      };

      const result = await signOut(mockAuthClient);

      expect(result).toEqual<AuthResult>({
        success: false,
        error: 'Session expired',
      });
    });
  });
});
