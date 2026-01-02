import { useState } from 'react';
import { InsightCard } from '@/components/insights/InsightCard';
import { ChallengeDetailDrawer } from '@/components/challenges/ChallengeDetailDrawer';
import { DailyNotePanel } from '@/components/notes/DailyNotePanel';
import { mockInsights } from '@/data/mockData';
import { CHALLENGES, PART_INFO, getChallengesByPart } from '@/data/challenges';
import { Challenge, ChallengePart } from '@/types/claru';
import { Sparkles, Trophy, Target, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function ImpactScreen() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasInsights = mockInsights.length > 0;
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
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Impact
          </h2>
          <p className="text-sm text-muted-foreground">
            Your progress, goals, and patterns
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="overview" className="flex-1">
              <Target className="w-4 h-4 mr-1.5" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="challenges" className="flex-1">
              <Trophy className="w-4 h-4 mr-1.5" />
              Challenges
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex-1">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Patterns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DailyNotePanel />

            {/* Active Challenges Preview */}
            <div>
              <h3 className="text-base font-semibold text-accent mb-3">Active Challenges</h3>
              <p className="text-base text-muted-foreground">
                Check the Challenges tab to see all {CHALLENGES.length} challenges organized by part.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="challenges" className="space-y-8">
            {sortedParts.map(([partId, partInfo]) => {
              const challenges = challengesByPart[partId];
              if (challenges.length === 0) return null;

              return (
                <div key={partId}>
                  <h3 className="text-base font-semibold text-accent mb-4">
                    Part {partInfo.order}: {partInfo.title}
                  </h3>
                  
                  <div className="space-y-3">
                    {challenges.map((challenge) => {
                      const globalIndex = CHALLENGES.findIndex(c => c.id === challenge.id) + 1;
                      
                      return (
                        <button
                          key={challenge.id}
                          onClick={() => handleChallengeClick(challenge)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-calm text-left group"
                        >
                          {/* Numbered Circle */}
                          <div className={cn(
                            "w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold shrink-0 border-2",
                            challenge.status === 'completed' 
                              ? "bg-primary/10 text-primary border-primary/30" 
                              : "bg-accent/10 text-accent border-accent/30"
                          )}>
                            {globalIndex}
                          </div>
                          
                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <h4 className="text-base font-semibold text-foreground mb-1">
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
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            {hasInsights ? (
              <div className="space-y-4">
                {mockInsights.map((insight) => (
                  <InsightCard key={insight.id} insight={insight} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-accent" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1">Building your insights</h3>
                <p className="text-base text-muted-foreground max-w-xs">
                  Complete a few more check-ins so we can spot your patterns.
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ChallengeDetailDrawer
        challenge={selectedChallenge}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
      />
    </div>
  );
}
