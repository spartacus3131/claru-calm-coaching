import { Check, ChevronRight, Clock, Zap, Target } from 'lucide-react';
import { Challenge } from '@/types/claru';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  onClick?: () => void;
}

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  const { id, title, description, status, time, energy, value } = challenge;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border transition-calm text-left',
        'hover:shadow-md active:scale-[0.99]',
        status === 'current' && 'bg-card border-border/50',
        status === 'completed' && 'bg-primary/5 border-primary/20'
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold',
              status === 'current' && 'bg-muted text-foreground',
              status === 'completed' && 'bg-primary text-primary-foreground'
            )}
          >
            {status === 'completed' ? <Check className="w-4 h-4" /> : id}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm text-foreground mb-0.5">{title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{description}</p>
            
            <div className="flex items-center gap-3 mt-2">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                {time}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Zap className="w-3 h-3" />
                {energy}/10
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Target className="w-3 h-3" />
                {value}/10
              </span>
            </div>
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </button>
  );
}
