import * as React from 'react';
import { cn } from '@/lib/utils';

interface AppFrameProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Mobile: full-bleed (native-feeling)
 * Desktop/tablet: centered "app canvas" with rounded corners + subtle shadow
 */
export function AppFrame({ children, className }: AppFrameProps) {
  return (
    <div className="min-h-[100dvh] bg-background md:bg-muted/30 md:p-6 md:flex md:items-center md:justify-center">
      <div
        className={cn(
          'flex w-full flex-col bg-background h-[100dvh]',
          'md:h-[calc(100dvh-48px)] md:max-w-[640px] md:rounded-3xl md:border md:border-border/50 md:shadow-2xl md:overflow-hidden',
          className
        )}
      >
        {children}
      </div>
    </div>
  );
}
