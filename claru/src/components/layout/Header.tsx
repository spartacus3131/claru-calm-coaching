/**
 * @file Header.tsx
 * @description App header with logo and streak badge
 * @module components/layout
 *
 * F028: Includes streak badge for tracking visibility.
 */

'use client';

import { StreakBadge } from '@/components/engagement';
import { cn } from '@/lib/utils';

interface HeaderProps {
  className?: string;
}

/**
 * App header component.
 * Shows logo/title and streak badge.
 */
export function Header({ className }: HeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60',
        className
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl font-semibold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Claru
        </span>
      </div>
      <StreakBadge />
    </header>
  );
}
