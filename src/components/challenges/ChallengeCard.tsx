import { useState } from 'react';
import { Check, Lock, Play, ChevronDown, BookOpen } from 'lucide-react';
import { Challenge } from '@/types/claru';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  onStart?: () => void;
}

export function ChallengeCard({ challenge, onStart }: ChallengeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const { id, title, description, status, relevantResearch, researchInsight, actionableTip, citation } = challenge;

  const showResearch = status !== 'locked' && (researchInsight || actionableTip);

  return (
    <div
      className={cn(
        'rounded-xl border transition-calm animate-fade-in overflow-hidden',
        status === 'current' && 'bg-primary/10 border-primary/30',
        status === 'completed' && 'bg-card border-border/50',
        status === 'locked' && 'bg-card/50 border-border/30 opacity-60'
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold',
              status === 'current' && 'bg-primary text-primary-foreground',
              status === 'completed' && 'bg-primary/20 text-primary',
              status === 'locked' && 'bg-muted text-muted-foreground'
            )}
          >
            {status === 'completed' ? (
              <Check className="w-5 h-5" />
            ) : status === 'locked' ? (
              <Lock className="w-4 h-4" />
            ) : (
              id
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className={cn(
                'font-medium text-[15px] mb-1',
                status === 'locked' ? 'text-muted-foreground' : 'text-foreground'
              )}
            >
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {description}
            </p>

            {relevantResearch && relevantResearch.length > 0 && status !== 'locked' && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {relevantResearch.map((topic) => (
                  <span
                    key={topic}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary/80"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              {status === 'current' && (
                <Button
                  variant="calm"
                  size="sm"
                  onClick={onStart}
                >
                  <Play className="w-4 h-4" />
                  Start Challenge
                </Button>
              )}

              {showResearch && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => setExpanded(!expanded)}
                >
                  <BookOpen className="w-4 h-4" />
                  Research
                  <ChevronDown className={cn('w-4 h-4 transition-transform', expanded && 'rotate-180')} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && showResearch && (
        <div className="px-4 pb-4 pt-0 border-t border-border/30 mt-2">
          <div className="pt-3 space-y-3">
            {researchInsight && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">Research Insight</p>
                <p className="text-sm text-foreground/90">{researchInsight}</p>
              </div>
            )}
            {actionableTip && (
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-xs font-medium text-primary mb-1">Try This</p>
                <p className="text-sm text-foreground/90">{actionableTip}</p>
              </div>
            )}
            {citation && (
              <p className="text-xs text-muted-foreground italic">{citation}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
