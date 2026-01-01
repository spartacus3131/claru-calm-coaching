import { useState } from 'react';
import { ChevronDown, ChevronUp, Circle, CheckCircle2 } from 'lucide-react';
import { TodayPriority } from '@/types/claru';
import { cn } from '@/lib/utils';

interface TodayPlanProps {
  priorities: TodayPriority[];
  onToggle: (id: string) => void;
}

export function TodayPlan({ priorities, onToggle }: TodayPlanProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const completedCount = priorities.filter((p) => p.completed).length;

  return (
    <div className="glass rounded-xl border border-border/50">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-foreground">Today's Plan</span>
          <span className="text-xs text-muted-foreground">
            {completedCount}/{priorities.length}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {priorities.map((priority) => (
            <button
              key={priority.id}
              onClick={() => onToggle(priority.id)}
              className="w-full flex items-center gap-3 py-2 transition-calm"
            >
              {priority.completed ? (
                <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              )}
              <span
                className={cn(
                  'text-sm text-left',
                  priority.completed && 'text-muted-foreground line-through'
                )}
              >
                {priority.text}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
