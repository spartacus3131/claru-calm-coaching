import { Challenge } from '@/types/claru';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Play, Check, BookOpen } from 'lucide-react';

interface ChallengeDetailDrawerProps {
  challenge: Challenge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart?: () => void;
}

export function ChallengeDetailDrawer({ challenge, open, onOpenChange, onStart }: ChallengeDetailDrawerProps) {
  if (!challenge) return null;

  const { id, title, description, status, relevantResearch, researchInsight, actionableTip, citation } = challenge;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="overflow-y-auto px-4 pb-6">
          <DrawerHeader className="px-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                  status === 'completed'
                    ? 'bg-primary/20 text-primary'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                {status === 'completed' ? <Check className="w-5 h-5" /> : id}
              </div>
              <DrawerTitle className="text-xl">{title}</DrawerTitle>
            </div>
            <DrawerDescription className="text-left text-base">
              {description}
            </DrawerDescription>
          </DrawerHeader>

          {relevantResearch && relevantResearch.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {relevantResearch.map((topic) => (
                <span
                  key={topic}
                  className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary/80"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          <div className="space-y-4">
            {researchInsight && (
              <div className="rounded-lg border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-medium text-muted-foreground">Research Insight</p>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{researchInsight}</p>
              </div>
            )}

            {actionableTip && (
              <div className="bg-primary/5 rounded-lg p-4">
                <p className="text-xs font-medium text-primary mb-1">Try This</p>
                <p className="text-sm text-foreground/90 leading-relaxed">{actionableTip}</p>
              </div>
            )}

            {citation && (
              <p className="text-xs text-muted-foreground italic">{citation}</p>
            )}
          </div>

          {status !== 'completed' && (
            <div className="mt-6">
              <Button
                variant="calm"
                className="w-full"
                onClick={() => {
                  onStart?.();
                  onOpenChange(false);
                }}
              >
                <Play className="w-4 h-4" />
                Start Challenge
              </Button>
            </div>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
