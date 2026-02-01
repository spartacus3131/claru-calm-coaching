import { NextResponse, type NextRequest } from 'next/server';
import { createMiddlewareSupabase } from '@/lib/supabase/middleware';
import { determineAuthAction } from '@/modules/shared/auth/authGuard';

/**
 * Next.js Middleware for authentication.
 *
 * F001 requirement:
 * - Protected routes redirect to /auth
 *
 * Per nextjs-app-router.mdc: Use middleware for auth redirects.
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get user session from Supabase.
  const { supabaseResponse, user } = await createMiddlewareSupabase(request);

  // Use our pure auth guard logic to decide what to do.
  const authUser = user ? { id: user.id, email: user.email ?? '' } : null;
  const action = determineAuthAction(pathname, authUser);

  if (action.action === 'redirect') {
    const url = request.nextUrl.clone();
    url.pathname = action.destination;
    return NextResponse.redirect(url);
  }

  // Return the supabaseResponse to ensure cookies are properly set.
  return supabaseResponse;
}

/**
 * Configure which routes the middleware runs on.
 * We run on all routes and let the auth guard logic decide.
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
