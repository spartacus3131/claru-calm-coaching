'use client';

/**
 * @file ImpactContent.tsx
 * @description Impact screen with Daily Note, Foundations, and Patterns tabs.
 * @module app/(app)/impact
 * 
 * Ported from old src/screens/ImpactScreen.tsx for Next.js App Router.
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Trophy, Target, ChevronRight } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DailyNotePanel } from '@/components/notes/DailyNotePanel';
import { ChallengeDetailDrawer } from '@/components/challenges/ChallengeDetailDrawer';
import { FOUNDATIONS, PART_INFO, getFoundationsByPart } from '@/data/challenges';
import type { Challenge, ChallengePart } from '@/types/claru';
import { cn } from '@/lib/utils';

export function ImpactContent() {
  const router = useRouter();
  const [selectedFoundation, setSelectedFoundation] = useState<Challenge | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const foundationsByPart = getFoundationsByPart();
  const sortedParts = Object.entries(PART_INFO)
    .sort((a, b) => a[1].order - b[1].order) as [ChallengePart, { title: string; order: number }][];

  const handleFoundationClick = (foundation: Challenge) => {
    setSelectedFoundation(foundation);
    setDrawerOpen(true);
  };

  const handleStartFoundation = () => {
    if (selectedFoundation) {
      // Navigate to chat with foundation intro flow
      const message = encodeURIComponent(`I want to start the ${selectedFoundation.title} foundation`);
      router.push(`/chat?flow=challenge_intro&challengeId=${selectedFoundation.id}&message=${message}`);
      setDrawerOpen(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto pb-safe">
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
            <TabsTrigger value="foundations" className="flex-1">
              <Trophy className="w-4 h-4 mr-1.5" />
              Foundations
            </TabsTrigger>
            <TabsTrigger value="patterns" className="flex-1">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Patterns
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <DailyNotePanel />

            {/* Active Foundations Preview */}
            <div>
              <h3 className="text-base font-semibold text-accent mb-3">Active Foundations</h3>
              <p className="text-base text-muted-foreground">
                Check the Foundations tab to see all {FOUNDATIONS.length} foundations organized by part.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="foundations" className="space-y-8">
            {sortedParts.map(([partId, partInfo]) => {
              const foundations = foundationsByPart[partId];
              if (foundations.length === 0) return null;

              return (
                <div key={partId}>
                  <h3 className="text-base font-semibold text-accent mb-4">
                    Part {partInfo.order}: {partInfo.title}
                  </h3>
                  
                  <div className="space-y-3">
                    {foundations.map((foundation) => {
                      const globalIndex = FOUNDATIONS.findIndex(c => c.id === foundation.id) + 1;
                      
                      return (
                        <button
                          key={foundation.id}
                          onClick={() => handleFoundationClick(foundation)}
                          className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-all text-left group"
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
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-accent" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">Building your insights</h3>
              <p className="text-base text-muted-foreground max-w-xs">
                Complete a few more check-ins so we can spot your patterns.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <ChallengeDetailDrawer
        challenge={selectedFoundation}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStart={handleStartFoundation}
      />
    </div>
  );
}
