/**
 * Auth Service - F001 User Authentication
 *
 * Provides signUp, signIn, signOut operations.
 * Uses dependency injection for the Supabase auth client to enable testing.
 *
 * Per supabase.mdc: ALWAYS get user from server-side, never trust client.
 */

/**
 * Minimal interface for Supabase auth operations.
 * This allows us to mock the client in tests while being compatible
 * with the real Supabase auth client types.
 */
export interface SupabaseAuthClient {
  signUp: (params: { email: string; password: string }) => Promise<{
    data: { user: { id: string; email?: string | null } | null; session: unknown };
    error: { message: string } | null;
  }>;
  signInWithPassword: (params: { email: string; password: string }) => Promise<{
    data: { user: { id: string; email?: string | null } | null; session: unknown };
    error: { message: string } | null;
  }>;
  signOut: () => Promise<{ error: { message: string } | null }>;
}

/**
 * Auth operation result.
 */
export type AuthResult =
  | { success: true; user?: { id: string; email: string } }
  | { success: false; error: string };

/**
 * Sign up a new user with email and password.
 *
 * F001 requirement: Sign up with email/password
 */
export async function signUp(
  authClient: SupabaseAuthClient,
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await authClient.signUp({ email, password });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'Signup failed' };
  }

  return {
    success: true,
    user: { id: data.user.id, email: data.user.email ?? '' },
  };
}

/**
 * Sign in an existing user with email and password.
 *
 * F001 requirement: Sign in
 */
export async function signIn(
  authClient: SupabaseAuthClient,
  email: string,
  password: string
): Promise<AuthResult> {
  const { data, error } = await authClient.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data.user) {
    return { success: false, error: 'Login failed' };
  }

  return {
    success: true,
    user: { id: data.user.id, email: data.user.email ?? '' },
  };
}

/**
 * Sign out the current user.
 *
 * F001 requirement: Sign out
 */
export async function signOut(
  authClient: SupabaseAuthClient
): Promise<AuthResult> {
  const { error } = await authClient.signOut();

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
