import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Check, Brain, Heart, Smile, Briefcase, Wallet, Users, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface HotSpot {
  id: string;
  name: string;
  icon: React.ElementType;
  description: string;
  rating: number;
  color: string;
}

const DEFAULT_HOT_SPOTS: HotSpot[] = [
  { id: 'mind', name: 'Mind', icon: Brain, description: 'Learning, growth, mental clarity', rating: 5, color: 'text-violet-500' },
  { id: 'body', name: 'Body', icon: Heart, description: 'Physical health, energy, exercise', rating: 5, color: 'text-rose-500' },
  { id: 'emotions', name: 'Emotions', icon: Smile, description: 'Mood, stress, emotional balance', rating: 5, color: 'text-amber-500' },
  { id: 'career', name: 'Career', icon: Briefcase, description: 'Work, projects, professional growth', rating: 5, color: 'text-blue-500' },
  { id: 'finances', name: 'Finances', icon: Wallet, description: 'Money, savings, financial health', rating: 5, color: 'text-emerald-500' },
  { id: 'relationships', name: 'Relationships', icon: Users, description: 'Family, friends, connections', rating: 5, color: 'text-pink-500' },
  { id: 'fun', name: 'Fun', icon: PartyPopper, description: 'Hobbies, leisure, enjoyment', rating: 5, color: 'text-orange-500' },
];

export function HotSpotsScreen() {
  const [hotSpots, setHotSpots] = useState<HotSpot[]>(DEFAULT_HOT_SPOTS);
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);

  const handleRatingChange = (id: string, value: number[]) => {
    setHotSpots(prev => 
      prev.map(spot => 
        spot.id === id ? { ...spot, rating: value[0] } : spot
      )
    );
  };

  const handleSaveCheckin = () => {
    setLastCheckin(new Date());
    toast.success('Hot Spots check-in saved!', {
      description: 'Great job reflecting on your life balance.'
    });
  };

  const averageRating = hotSpots.reduce((acc, spot) => acc + spot.rating, 0) / hotSpots.length;
  const lowestSpot = hotSpots.reduce((lowest, spot) => 
    spot.rating < lowest.rating ? spot : lowest
  , hotSpots[0]);

  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Hot Spots
          </h2>
          <p className="text-sm text-muted-foreground">
            Weekly check-in on the 7 key areas of your life
          </p>
          {lastCheckin && (
            <p className="text-xs text-muted-foreground mt-1">
              Last check-in: {lastCheckin.toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Overview Card */}
        <div className="rounded-xl border border-border/50 bg-card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Overall Balance</span>
            <span className="text-2xl font-semibold text-foreground">{averageRating.toFixed(1)}/10</span>
          </div>
          {lowestSpot.rating < 5 && (
            <p className="text-sm text-muted-foreground">
              <span className={lowestSpot.color}>💡 {lowestSpot.name}</span> could use some attention this week.
            </p>
          )}
        </div>

        {/* Hot Spots List */}
        <div className="space-y-4">
          {hotSpots.map((spot) => {
            const Icon = spot.icon;
            return (
              <div
                key={spot.id}
                className="rounded-xl border border-border/50 bg-card p-4"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn('w-10 h-10 rounded-full bg-muted flex items-center justify-center', spot.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{spot.name}</h3>
                    <p className="text-xs text-muted-foreground">{spot.description}</p>
                  </div>
                  <span className={cn(
                    'text-lg font-semibold',
                    spot.rating >= 7 ? 'text-emerald-500' :
                    spot.rating >= 4 ? 'text-amber-500' : 'text-rose-500'
                  )}>
                    {spot.rating}
                  </span>
                </div>
                
                <Slider
                  value={[spot.rating]}
                  onValueChange={(value) => handleRatingChange(spot.id, value)}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted-foreground">Needs work</span>
                  <span className="text-xs text-muted-foreground">Thriving</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <div className="mt-6 pb-4">
          <Button
            variant="calm"
            className="w-full"
            onClick={handleSaveCheckin}
          >
            <Check className="w-4 h-4" />
            Save Weekly Check-in
          </Button>
        </div>
      </div>
    </div>
  );
}
