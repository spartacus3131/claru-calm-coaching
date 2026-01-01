import { ChallengeCard } from '@/components/challenges/ChallengeCard';
import { mockChallenges } from '@/data/mockData';

export function ChallengesScreen() {
  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Your Journey
          </h2>
          <p className="text-sm text-muted-foreground">
            22 challenges to build your productivity system
          </p>
        </div>

        <div className="space-y-3">
          {mockChallenges.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </div>
      </div>
    </div>
  );
}
