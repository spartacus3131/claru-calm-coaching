import { createServerSupabase } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppFrame } from '@/components/layout/AppFrame';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';

/**
 * Protected App Layout - F001 User Authentication + F002 App Shell
 *
 * All routes under (app)/* require authentication.
 * Uses the ported AppFrame component for mobile-first design.
 * F028: Includes Header with streak badge.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  // Defense in depth - middleware should redirect, but double-check here.
  if (!user) {
    redirect('/auth');
  }

  return (
    <AppFrame>
      {/* Header with streak badge */}
      <Header />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </main>

      {/* Bottom navigation */}
      <BottomNav />
    </AppFrame>
  );
}
