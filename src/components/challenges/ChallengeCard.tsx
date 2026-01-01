import { Check, Lock, Play } from 'lucide-react';
import { Challenge } from '@/types/claru';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  onStart?: () => void;
}

export function ChallengeCard({ challenge, onStart }: ChallengeCardProps) {
  const { id, title, description, status } = challenge;

  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-calm animate-fade-in',
        status === 'current' && 'bg-primary/10 border-primary/30',
        status === 'completed' && 'bg-card border-border/50',
        status === 'locked' && 'bg-card/50 border-border/30 opacity-60'
      )}
    >
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

          {status === 'current' && (
            <Button
              variant="calm"
              size="sm"
              className="mt-3"
              onClick={onStart}
            >
              <Play className="w-4 h-4" />
              Start Challenge
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
