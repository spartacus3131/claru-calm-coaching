import { useState } from 'react';
import { ChevronDown, Heart } from 'lucide-react';
import { BonusTip } from '@/types/claru';
import { cn } from '@/lib/utils';

interface BonusTipCardProps {
  tip: BonusTip;
}

export function BonusTipCard({ tip }: BonusTipCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <button
      onClick={() => setExpanded(!expanded)}
      className={cn(
        'w-full rounded-xl border border-border/50 bg-card transition-calm text-left',
        'hover:shadow-md active:scale-[0.99]'
      )}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center flex-shrink-0">
            <Heart className="w-4 h-4 text-pink-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm text-foreground">{tip.title}</h4>
            <p className="text-xs text-muted-foreground">{tip.description}</p>
          </div>
          <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
        </div>

        {expanded && (
          <div className="mt-3 pt-3 border-t border-border/30">
            <p className="text-sm text-foreground/90 leading-relaxed">{tip.content}</p>
            {tip.tip && (
              <p className="text-xs text-pink-500 mt-2 italic">{tip.tip}</p>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
