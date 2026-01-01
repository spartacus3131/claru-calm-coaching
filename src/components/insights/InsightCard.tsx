import { Insight } from '@/types/claru';
import { Brain, Battery, Lightbulb, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: Insight;
}

const iconMap = {
  Brain,
  Battery,
  Lightbulb,
  Target,
};

export function InsightCard({ insight }: InsightCardProps) {
  const { type, title, insight: insightText, recommendation, icon } = insight;
  const Icon = iconMap[icon as keyof typeof iconMap] || Lightbulb;

  return (
    <div
      className={cn(
        'p-4 rounded-xl animate-fade-in',
        type === 'focus' && 'insight-focus',
        type === 'energy' && 'insight-energy',
        type === 'habit' && 'insight-habit',
        type === 'productivity' && 'insight-productivity'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
            type === 'focus' && 'bg-claru-focus/20 text-claru-focus',
            type === 'energy' && 'bg-claru-energy/20 text-claru-energy',
            type === 'habit' && 'bg-claru-habit/20 text-claru-habit',
            type === 'productivity' && 'bg-claru-productivity/20 text-claru-productivity'
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground mb-1">{title}</h3>
          <p className="text-sm text-foreground/70">{insightText}</p>
        </div>
      </div>

      <div className="bg-background/30 rounded-lg p-3 mb-3">
        <p className="text-sm text-foreground/80">{recommendation}</p>
      </div>

      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
        Try it this week →
      </Button>
    </div>
  );
}
