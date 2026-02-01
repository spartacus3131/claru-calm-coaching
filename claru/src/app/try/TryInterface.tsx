'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2, MessageCircle, Sparkles, FolderKanban, Inbox, Gauge, LogIn } from 'lucide-react';
import { ChatInterface } from '@/app/(app)/chat/ChatInterface';
import { AppFrame } from '@/components/layout/AppFrame';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

/**
 * Loading fallback for ChatInterface Suspense boundary.
 */
function ChatLoading() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

/**
 * Bottom nav tabs for Try Mode.
 * Chat is active, other tabs prompt to sign up.
 */
const tabs = [
  { id: 'chat', label: 'Chat', icon: MessageCircle, active: true },
  { id: 'impact', label: 'Impact', icon: Sparkles, active: false },
  { id: 'projects', label: 'Projects', icon: FolderKanban, active: false },
  { id: 'parking', label: 'Parking Lot', icon: Inbox, active: false },
  { id: 'hotspots', label: 'Hot Spots', icon: Gauge, active: false },
];

/**
 * Trial Mode Interface
 * 
 * Wraps the chat interface with a minimal header for trial users.
 * Uses AppFrame for consistent mobile/desktop layout.
 * Uses Suspense to handle useSearchParams() during static generation.
 */
export function TryInterface() {
  const router = useRouter();
  const [showSignUpDialog, setShowSignUpDialog] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');

  const handleNavClick = (tabId: string, isActive: boolean) => {
    if (isActive) return; // Chat tab - do nothing, already there
    
    // Show sign-up dialog
    const tab = tabs.find(t => t.id === tabId);
    setSelectedFeature(tab?.label || 'This feature');
    setShowSignUpDialog(true);
  };

  return (
    <AppFrame>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-background">
        <Link href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <span className="font-semibold text-foreground">Claru</span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild className="text-muted-foreground hover:text-foreground">
            <Link href="/auth">
              <LogIn className="w-4 h-4 mr-1.5" />
              Sign in
            </Link>
          </Button>
        </div>
      </header>

      {/* Chat Interface in trial mode - wrapped in Suspense for useSearchParams */}
      <Suspense fallback={<ChatLoading />}>
        <ChatInterface isAuthenticated={false} />
      </Suspense>

      {/* Bottom Nav for Try Mode */}
      <nav className="glass border-t border-border/50 pb-safe shrink-0">
        <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-1 px-2 py-2">
          {tabs.map((tab) => (
            <Button
              key={tab.id}
              variant="nav"
              data-active={tab.active}
              aria-current={tab.active ? 'page' : undefined}
              onClick={() => handleNavClick(tab.id, tab.active)}
              className="flex-1"
            >
              <tab.icon className={cn('w-5 h-5', tab.active && 'stroke-[2]')} />
              <span className="font-medium leading-none truncate">{tab.label}</span>
            </Button>
          ))}
        </div>
      </nav>

      {/* Sign-up prompt dialog */}
      <Dialog open={showSignUpDialog} onOpenChange={setShowSignUpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedFeature} requires an account</DialogTitle>
            <DialogDescription>
              Sign up free to access all features and save your progress. Your conversations will be preserved.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowSignUpDialog(false)}>
              Continue trying
            </Button>
            <Button onClick={() => router.push('/auth')}>
              Sign up free
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppFrame>
  );
}
