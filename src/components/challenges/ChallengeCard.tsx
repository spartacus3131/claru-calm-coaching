import { Check, ChevronRight } from 'lucide-react';
import { Challenge } from '@/types/claru';
import { cn } from '@/lib/utils';

interface ChallengeCardProps {
  challenge: Challenge;
  onClick?: () => void;
}

export function ChallengeCard({ challenge, onClick }: ChallengeCardProps) {
  const { id, title, description, status, relevantResearch } = challenge;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border transition-calm animate-fade-in text-left',
        'hover:shadow-md active:scale-[0.99]',
        status === 'current' && 'bg-primary/10 border-primary/30',
        status === 'completed' && 'bg-card border-border/50'
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold',
              status === 'current' && 'bg-primary text-primary-foreground',
              status === 'completed' && 'bg-primary/20 text-primary'
            )}
          >
            {status === 'completed' ? (
              <Check className="w-5 h-5" />
            ) : (
              id
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-[15px] mb-1 text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {description}
            </p>

            {relevantResearch && relevantResearch.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {relevantResearch.slice(0, 2).map((topic) => (
                  <span
                    key={topic}
                    className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary/80"
                  >
                    {topic}
                  </span>
                ))}
                {relevantResearch.length > 2 && (
                  <span className="text-xs text-muted-foreground">
                    +{relevantResearch.length - 2}
                  </span>
                )}
              </div>
            )}
          </div>

          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </div>
    </button>
  );
}
