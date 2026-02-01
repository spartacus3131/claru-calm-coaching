import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a Supabase client for client-side use (React components with "use client").
 *
 * Per supabase.mdc: Use this for client components that need to interact with Supabase.
 */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
