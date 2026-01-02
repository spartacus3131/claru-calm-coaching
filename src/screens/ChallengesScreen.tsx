import { useState } from 'react';
import { ChallengeDetailDrawer } from '@/components/challenges/ChallengeDetailDrawer';
import { FOUNDATIONS, PART_INFO, getFoundationsByPart } from '@/data/challenges';
import { Foundation, JourneyPart } from '@/types/claru';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChallengesScreen() {
  const [selectedFoundation, setSelectedFoundation] = useState<Foundation | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const foundationsByPart = getFoundationsByPart();
  const sortedParts = Object.entries(PART_INFO)
    .sort((a, b) => a[1].order - b[1].order) as [JourneyPart, { title: string; order: number; description: string }][];

  const handleFoundationClick = (foundation: Foundation) => {
    setSelectedFoundation(foundation);
    setDrawerOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {FOUNDATIONS.length} Foundations
          </h2>
          <p className="text-base text-muted-foreground">
            A three-part journey
          </p>
        </div>

        <div className="space-y-8">
          {sortedParts.map(([partId, partInfo]) => {
            const foundations = foundationsByPart[partId];
            if (foundations.length === 0) return null;

            return (
              <div key={partId}>
                <h3 className="text-base font-semibold text-accent mb-1">
                  {partInfo.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">{partInfo.description}</p>
                
                <div className="space-y-3">
                  {foundations.map((foundation) => {
                    const globalIndex = FOUNDATIONS.findIndex(f => f.id === foundation.id) + 1;

                    return (
                      <button
                        key={foundation.id}
                        onClick={() => handleFoundationClick(foundation)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-calm text-left group"
                      >
                        {/* Numbered Circle */}
                        <div className={cn(
                          "w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold shrink-0 border-2",
                          foundation.status === 'completed'
                            ? "bg-primary/10 text-primary border-primary/30"
                            : "bg-accent/10 text-accent border-accent/30"
                        )}>
                          {globalIndex}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-semibold text-foreground mb-1">
                            {foundation.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {foundation.whatYouGet}
                          </p>
                        </div>

                        {/* Chevron */}
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <ChallengeDetailDrawer
        challenge={selectedFoundation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
