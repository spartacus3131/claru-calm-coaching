/**
 * Routes inside the (app) route group that require authentication.
 * These correspond to folders under src/app/(app)/.
 */
const PROTECTED_PREFIXES = [
  '/chat',
  '/notes',
  '/challenges',
  '/projects',
  '/impact',
  '/parking',
  '/hotspots',
];

/**
 * Defines which routes require an authenticated session.
 *
 * F001 requirement:
 * - Protected routes redirect to /auth
 *
 * Route structure:
 * - /auth → public (login/signup page)
 * - /(app)/* → protected (requires auth)
 *   - /chat, /notes, /challenges, /projects
 */
export function isProtectedPath(pathname: string): boolean {
  if (!pathname.startsWith('/')) return false;

  // Auth screens are always public.
  if (pathname === '/auth' || pathname.startsWith('/auth/')) return false;

  // Check if path matches any protected prefix.
  for (const prefix of PROTECTED_PREFIXES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) {
      return true;
    }
  }

  return false;
}

