import { Challenge } from '@/types/claru';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Play, Check, Clock, Zap, Target, BookOpen, Lightbulb } from 'lucide-react';

interface ChallengeDetailDrawerProps {
  challenge: Challenge | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart?: () => void;
}

export function ChallengeDetailDrawer({ challenge, open, onOpenChange, onStart }: ChallengeDetailDrawerProps) {
  if (!challenge) return null;

  const { id, title, description, status, time, energy, value, whatYouGet, steps, tips, worksheetPrompts, researchInsight, actionableTip, citation } = challenge;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <div className="overflow-y-auto px-4 pb-6">
          <DrawerHeader className="px-0">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                  status === 'completed'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
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

          {/* Stats */}
          <div className="flex items-center gap-4 mb-4 text-sm">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-4 h-4" /> {time}
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Zap className="w-4 h-4" /> Energy: {energy}/10
            </span>
            <span className="flex items-center gap-1.5 text-muted-foreground">
              <Target className="w-4 h-4" /> Value: {value}/10
            </span>
          </div>

          <div className="space-y-5">
            {/* What You'll Get */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">What You'll Get</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">{whatYouGet}</p>
            </div>

            {/* Steps */}
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">The Challenge</h4>
              <ol className="space-y-2">
                {steps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-foreground/90">{step.content}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Tips */}
            {tips && tips.length > 0 && (
              <div className="bg-muted/50 rounded-lg p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5" /> Tips
                </h4>
                <ul className="space-y-1.5">
                  {tips.map((tip, i) => (
                    <li key={i} className="text-sm text-foreground/80">• {tip}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Research Insight */}
            {researchInsight && (
              <div className="rounded-lg border border-border/50 p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Research Insight
                </h4>
                <p className="text-sm text-foreground/90">{researchInsight}</p>
                {citation && <p className="text-xs text-muted-foreground mt-2 italic">— {citation}</p>}
              </div>
            )}

            {/* Actionable Tip */}
            {actionableTip && (
              <div className="bg-primary/5 rounded-lg p-3">
                <p className="text-xs font-medium text-primary mb-1">Try This</p>
                <p className="text-sm text-foreground/90">{actionableTip}</p>
              </div>
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
