import { useState } from 'react';
import { InsightCard } from '@/components/insights/InsightCard';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { ChallengeDetailDrawer } from '@/components/challenges/ChallengeDetailDrawer';
import { mockInsights } from '@/data/mockData';
import { CHALLENGES } from '@/data/challenges';
import { Challenge } from '@/types/claru';
import { Sparkles, Trophy, Target, Calendar } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function ImpactScreen() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const hasInsights = mockInsights.length > 0;
  const completedChallenges = CHALLENGES.filter(c => c.status === 'completed');
  const currentChallenges = CHALLENGES.filter(c => c.status === 'current');

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
            {/* Daily Summary Placeholder */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-foreground">Today's Summary</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Complete your daily check-in to see your summary here.
              </p>
            </div>

            {/* Weekly Goals Placeholder */}
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-primary" />
                <h3 className="font-medium text-foreground">Weekly Goals</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Set goals during your check-ins to track them here.
              </p>
            </div>

            {/* Active Challenges */}
            {currentChallenges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Active Challenges</h3>
                <div className="space-y-3">
                  {currentChallenges.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClick={() => handleChallengeClick(challenge)}
                    />
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="challenges" className="space-y-4">
            {/* Current/Active */}
            {currentChallenges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Current</h3>
                <div className="space-y-3">
                  {currentChallenges.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClick={() => handleChallengeClick(challenge)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedChallenges.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-3">Completed</h3>
                <div className="space-y-3">
                  {completedChallenges.map(challenge => (
                    <ChallengeCard
                      key={challenge.id}
                      challenge={challenge}
                      onClick={() => handleChallengeClick(challenge)}
                    />
                  ))}
                </div>
              </div>
            )}
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
                <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-medium text-foreground mb-1">Building your insights</h3>
                <p className="text-sm text-muted-foreground max-w-xs">
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
