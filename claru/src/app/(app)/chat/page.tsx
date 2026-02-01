import { Suspense } from 'react';
import { Metadata } from 'next';
import { Loader2 } from 'lucide-react';
import { ChatInterface } from './ChatInterface';

export const metadata: Metadata = {
  title: 'Check-in | Claru',
  description: 'Your daily check-in with Claru',
};

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
 * Chat Page - F003 Morning Check-In Chat + F019 Challenge Intro
 *
 * Main coaching conversation interface.
 * Uses Suspense to handle useSearchParams() during static generation.
 */
export default function ChatPage() {
  return (
    <Suspense fallback={<ChatLoading />}>
      <ChatInterface />
    </Suspense>
  );
}
