import { useState } from 'react';
import { ChallengeDetailDrawer } from '@/components/challenges/ChallengeDetailDrawer';
import { CHALLENGES, PART_INFO, getChallengesByPart } from '@/data/challenges';
import { Challenge, ChallengePart } from '@/types/claru';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChallengesScreen() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const challengesByPart = getChallengesByPart();
  const sortedParts = Object.entries(PART_INFO)
    .sort((a, b) => a[1].order - b[1].order) as [ChallengePart, { title: string; order: number }][];

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setDrawerOpen(true);
  };

  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-foreground mb-1">
            {CHALLENGES.length} Challenges
          </h2>
          <p className="text-sm text-muted-foreground">
            A journey of growth and self-discovery
          </p>
        </div>

        <div className="space-y-6">
          {sortedParts.map(([partId, partInfo]) => {
            const challenges = challengesByPart[partId];
            if (challenges.length === 0) return null;

            return (
              <div key={partId}>
                <h3 className="text-sm font-medium text-accent mb-3">
                  Part {partInfo.order}: {partInfo.title}
                </h3>
                
                <div className="space-y-2">
                  {challenges.map((challenge) => {
                    const globalIndex = CHALLENGES.findIndex(c => c.id === challenge.id) + 1;
                    
                    return (
                      <button
                        key={challenge.id}
                        onClick={() => handleChallengeClick(challenge)}
                        className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/30 hover:border-border/60 transition-calm text-left group"
                      >
                        {/* Numbered Circle */}
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium shrink-0",
                          challenge.status === 'completed' 
                            ? "bg-primary/20 text-primary" 
                            : "bg-accent/20 text-accent"
                        )}>
                          {globalIndex}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-foreground mb-0.5">
                            {challenge.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {challenge.whatYouGet}
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
        challenge={selectedChallenge}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
