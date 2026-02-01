import { isProtectedPath } from './routeProtection';

/**
 * Minimal user shape for auth guard decisions.
 */
export type AuthUser = {
  id: string;
  email: string;
} | null;

/**
 * Result of auth guard evaluation.
 */
export type AuthAction =
  | { action: 'continue' }
  | { action: 'redirect'; destination: string };

/**
 * Determines whether a request should continue or redirect based on auth state.
 *
 * F001 requirement:
 * - Protected routes redirect to /auth when no session
 *
 * This is a pure function to make it easily testable.
 * The actual middleware calls this and performs the redirect.
 */
export function determineAuthAction(
  pathname: string,
  user: AuthUser
): AuthAction {
  // If the route is protected and there's no user, redirect to /auth.
  if (isProtectedPath(pathname) && !user) {
    return { action: 'redirect', destination: '/auth' };
  }

  // Otherwise, allow the request to continue.
  return { action: 'continue' };
}
