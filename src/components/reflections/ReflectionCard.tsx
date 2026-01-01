import { Reflection } from '@/types/claru';
import { format } from 'date-fns';
import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReflectionCardProps {
  reflection: Reflection;
}

export function ReflectionCard({ reflection }: ReflectionCardProps) {
  const { type, date, preview } = reflection;
  const isMorning = type === 'morning';

  return (
    <div className="p-4 rounded-xl bg-card border border-border/50 transition-calm hover:border-border animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        <span
          className={cn(
            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
            isMorning
              ? 'bg-accent/20 text-accent'
              : 'bg-primary/20 text-primary'
          )}
        >
          {isMorning ? (
            <Sun className="w-3 h-3" />
          ) : (
            <Moon className="w-3 h-3" />
          )}
          {isMorning ? 'Morning' : 'Evening'}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(date, 'h:mm a')}
        </span>
      </div>
      <p className="text-sm text-foreground/80 line-clamp-2">{preview}</p>
    </div>
  );
}
