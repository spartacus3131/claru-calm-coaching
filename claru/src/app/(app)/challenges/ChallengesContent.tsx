/**
 * @file ChallengesContent.tsx
 * @description Client component for challenges page content
 * @module app/challenges
 *
 * Handles the interactive parts of the challenges page:
 * - Fetching challenges with user status
 * - Opening challenge detail drawer
 * - Starting challenges via AI coach
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Loader2, CheckCircle2, PlayCircle } from 'lucide-react';
import { ChallengeDetailDrawer } from '@/components/challenges';
import { useChallenges, ChallengeWithStatus } from '@/hooks/useChallenges';
import { PART_INFO } from '@/modules/challenges/data';
import type { JourneyPart } from '@/modules/challenges/types';
import { cn } from '@/lib/utils';

/**
 * Part info with ordering for display.
 */
const SORTED_PARTS: [JourneyPart, { title: string; order: number; description: string }][] = [
  ['clarity', PART_INFO.clarity],
  ['systems', PART_INFO.systems],
  ['capacity', PART_INFO.capacity],
];

export function ChallengesContent() {
  const router = useRouter();
  const {
    challenges,
    challengesByPart,
    isLoading,
    error,
    startChallenge,
  } = useChallenges();

  const [selectedChallenge, setSelectedChallenge] = useState<ChallengeWithStatus | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  /**
   * Handle clicking on a challenge card.
   * Opens the detail drawer.
   */
  const handleChallengeClick = (challenge: ChallengeWithStatus) => {
    setSelectedChallenge(challenge);
    setDrawerOpen(true);
  };

  /**
   * Handle starting a challenge.
   * Navigates to chat with challenge intro flow (F019).
   */
  const handleStartChallenge = async () => {
    if (!selectedChallenge) return;

    try {
      // Start the challenge (updates status to active)
      await startChallenge(selectedChallenge.id);

      // Navigate to chat with challenge_intro flow
      // F019: Pass challengeId for AI-guided introduction
      const message = encodeURIComponent(
        `I want to start the "${selectedChallenge.title}" foundation`
      );
      router.push(`/chat?flow=challenge_intro&challengeId=${selectedChallenge.id}&message=${message}`);
    } catch (err) {
      console.error('Failed to start challenge:', err);
      // Still navigate to chat even if status update fails
      const message = encodeURIComponent(
        `I want to start the "${selectedChallenge.title}" foundation`
      );
      router.push(`/chat?flow=challenge_intro&challengeId=${selectedChallenge.id}&message=${message}`);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-2">Failed to load challenges</p>
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-1">
            {challenges.length} Foundations
          </h2>
          <p className="text-base text-muted-foreground">
            A three-part journey to sustainable productivity
          </p>
        </div>

        {/* Challenges by Part */}
        <div className="space-y-8">
          {SORTED_PARTS.map(([partId, partInfo]) => {
            const partChallenges = challengesByPart[partId];
            if (!partChallenges || partChallenges.length === 0) return null;

            return (
              <div key={partId}>
                <h3 className="text-base font-semibold text-primary mb-1">
                  {partInfo.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {partInfo.description}
                </p>

                <div className="space-y-3">
                  {partChallenges.map((challenge) => (
                    <ChallengeListItem
                      key={challenge.id}
                      challenge={challenge}
                      onClick={() => handleChallengeClick(challenge)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Challenge Detail Drawer */}
      <ChallengeDetailDrawer
        challenge={selectedChallenge}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onStart={handleStartChallenge}
      />
    </div>
  );
}

/**
 * Individual challenge list item.
 */
function ChallengeListItem({
  challenge,
  onClick,
}: {
  challenge: ChallengeWithStatus;
  onClick: () => void;
}) {
  const { id, title, whatYouGet, userStatus } = challenge;

  const isCompleted = userStatus === 'completed';
  const isActive = userStatus === 'active';

  // Find global index (1-22)
  const globalIndex = id;

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border/30 hover:border-border/50 transition-all text-left group"
    >
      {/* Numbered Circle */}
      <div
        className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center text-base font-semibold shrink-0 border-2',
          isCompleted
            ? 'bg-green-500/10 text-green-600 border-green-500/30'
            : isActive
              ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
              : 'bg-primary/10 text-primary border-primary/30'
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="w-5 h-5" />
        ) : isActive ? (
          <PlayCircle className="w-5 h-5" />
        ) : (
          globalIndex
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4 className="text-base font-semibold text-foreground mb-1 flex items-center gap-2">
          {title}
          {isActive && (
            <span className="text-xs font-normal bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
              In Progress
            </span>
          )}
          {isCompleted && (
            <span className="text-xs font-normal bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
              Completed
            </span>
          )}
        </h4>
        <p className="text-sm text-muted-foreground line-clamp-2">{whatYouGet}</p>
      </div>

      {/* Chevron */}
      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
    </button>
  );
}
