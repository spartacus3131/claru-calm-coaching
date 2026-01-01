import { InsightCard } from '@/components/insights/InsightCard';
import { mockInsights } from '@/data/mockData';
import { Sparkles } from 'lucide-react';

export function InsightsScreen() {
  const hasInsights = mockInsights.length > 0;

  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Your Patterns
          </h2>
          <p className="text-sm text-muted-foreground">
            Insights from your check-ins and reflections
          </p>
        </div>

        {hasInsights ? (
          <div className="space-y-4">
            {mockInsights.map((insight) => (
              <InsightCard key={insight.id} insight={insight} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="font-medium text-foreground mb-1">Building your insights</h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              Complete a few more check-ins so we can spot your patterns.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
