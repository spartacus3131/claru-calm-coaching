/**
 * @file StreakBadge.tsx
 * @description Displays current streak with visual indicator
 * @module components/engagement
 *
 * F028: Streak Tracking - Visual streak badge for header/UI
 * Per domain-language.mdc: Use "streak", "consecutive days".
 */

'use client';

import { Flame, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStreak } from '@/hooks/useStreak';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface StreakBadgeProps {
  className?: string;
  showLabel?: boolean;
}

/**
 * Compact streak badge component.
 * Shows current streak with flame icon.
 */
export function StreakBadge({ className, showLabel = false }: StreakBadgeProps) {
  const { streak, isLoading, streakLabel, message } = useStreak();

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-1 text-muted-foreground', className)}>
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  const current = streak?.current ?? 0;
  const isActive = streak?.isActive ?? false;
  const isMilestone = streak?.milestone !== null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-1 px-2 py-1 rounded-full transition-colors',
              isActive && current > 0
                ? 'bg-orange-100 dark:bg-orange-900/30'
                : 'bg-muted',
              isMilestone && 'ring-2 ring-orange-400 ring-offset-2 ring-offset-background',
              className
            )}
          >
            <Flame
              className={cn(
                'w-4 h-4',
                isActive && current > 0
                  ? 'text-orange-500'
                  : 'text-muted-foreground'
              )}
            />
            <span
              className={cn(
                'text-sm font-medium',
                isActive && current > 0
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-muted-foreground'
              )}
            >
              {current}
            </span>
            {showLabel && (
              <span className="text-sm text-muted-foreground ml-1">
                {current === 1 ? 'day' : 'days'}
              </span>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          <p className="font-medium">{streakLabel}</p>
          <p className="text-xs text-muted-foreground mt-1">{message}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Full streak card for profile or dedicated section.
 */
export function StreakCard({ className }: { className?: string }) {
  const { streak, isLoading, streakLabel, message, nextMilestone, daysToNextMilestone } =
    useStreak();

  if (isLoading) {
    return (
      <div
        className={cn(
          'rounded-xl border border-border/50 bg-card p-4 animate-pulse',
          className
        )}
      >
        <div className="h-20" />
      </div>
    );
  }

  const current = streak?.current ?? 0;
  const longest = streak?.longest ?? 0;
  const total = streak?.total ?? 0;
  const isActive = streak?.isActive ?? false;

  return (
    <div className={cn('rounded-xl border border-border/50 bg-card p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-12 h-12 rounded-full flex items-center justify-center',
              isActive ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-muted'
            )}
          >
            <Flame
              className={cn(
                'w-6 h-6',
                isActive ? 'text-orange-500' : 'text-muted-foreground'
              )}
            />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{streakLabel}</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
        </div>
        <div className="text-3xl font-bold text-orange-500">{current}</div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-foreground">{current}</div>
          <div className="text-xs text-muted-foreground">Current</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{longest}</div>
          <div className="text-xs text-muted-foreground">Longest</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-foreground">{total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>

      {nextMilestone && daysToNextMilestone && daysToNextMilestone > 0 && (
        <div className="mt-4 pt-4 border-t border-border/50">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Next milestone</span>
            <span className="font-medium text-foreground">
              {nextMilestone} days ({daysToNextMilestone} to go)
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500 rounded-full transition-all"
              style={{
                width: `${Math.min(100, (current / nextMilestone) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
