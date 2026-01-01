import { useState } from 'react';
import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { ChallengeDetailDrawer } from '@/components/challenges/ChallengeDetailDrawer';
import { BonusTipCard } from '@/components/challenges/BonusTipCard';
import { CHALLENGES, PART_INFO, getChallengesByPart } from '@/data/challenges';
import { BONUS_TIPS } from '@/data/bonus-tips';
import { Challenge, ChallengePart } from '@/types/claru';

export function ChallengesScreen() {
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const challengesByPart = getChallengesByPart();
  const parts = Object.entries(PART_INFO).sort((a, b) => a[1].order - b[1].order) as [ChallengePart, { title: string; order: number }][];

  const handleChallengeClick = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setDrawerOpen(true);
  };

  const completedCount = CHALLENGES.filter(c => c.status === 'completed').length;

  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Your Journey
          </h2>
          <p className="text-sm text-muted-foreground">
            {completedCount} of 22 challenges completed
          </p>
        </div>

        <div className="space-y-6">
          {parts.map(([partKey, partInfo]) => (
            <div key={partKey}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
                Part {partInfo.order}: {partInfo.title}
              </h3>
              <div className="space-y-2">
                {challengesByPart[partKey].map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    onClick={() => handleChallengeClick(challenge)}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Bonus Tips Section */}
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-1">
              Bonus: 9 Ways to Be Kinder to Yourself
            </h3>
            <div className="space-y-2">
              {BONUS_TIPS.map((tip) => (
                <BonusTipCard key={tip.id} tip={tip} />
              ))}
            </div>
          </div>
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
