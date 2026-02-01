/**
 * @file HotSpotsContent.tsx
 * @description Hot Spots screen content - weekly check-in for 7 life areas
 * @module app/(app)/hotspots
 *
 * F027: Hot Spots - Weekly ratings for 7 life areas
 * Per domain-language.mdc: Use "Hot Spots", "life areas", "weekly check-in".
 * Per ai-coaching-behavior.mdc: Summary is passed to AI for reflection.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  Check,
  Brain,
  Heart,
  Smile,
  Briefcase,
  Wallet,
  Users,
  PartyPopper,
  Loader2,
  Settings2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHotSpots, type HotSpotArea } from '@/hooks/useHotSpots';
import { useStreak } from '@/hooks/useStreak';

/**
 * Icon mapping for hot spot areas.
 */
const ICONS: Record<string, React.ElementType> = {
  mind: Brain,
  body: Heart,
  emotions: Smile,
  career: Briefcase,
  finances: Wallet,
  relationships: Users,
  fun: PartyPopper,
};

/**
 * Color options for customizing hot spot areas.
 */
const COLOR_OPTIONS = [
  { value: 'text-violet-500', label: 'Purple' },
  { value: 'text-rose-500', label: 'Rose' },
  { value: 'text-amber-500', label: 'Amber' },
  { value: 'text-blue-500', label: 'Blue' },
  { value: 'text-emerald-500', label: 'Green' },
  { value: 'text-pink-500', label: 'Pink' },
  { value: 'text-orange-500', label: 'Orange' },
  { value: 'text-cyan-500', label: 'Cyan' },
  { value: 'text-indigo-500', label: 'Indigo' },
];

/**
 * Hot Spots content component.
 * Renders the weekly check-in UI for rating 7 life areas.
 */
export function HotSpotsContent() {
  const router = useRouter();
  const {
    hotSpots,
    isLoading,
    isSaving,
    lastCheckin,
    averageRating,
    lowestSpot,
    updateRating,
    updateArea,
    saveAreas,
    saveCheckin,
    isAuthenticated,
  } = useHotSpots();
  const { recordCheckin } = useStreak();

  const [editingArea, setEditingArea] = useState<HotSpotArea | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [weeklyReflection, setWeeklyReflection] = useState('');

  /**
   * Handle saving the weekly check-in.
   * On success, navigates to chat with the summary for AI reflection.
   * F028: Records engagement for streak tracking.
   */
  const handleSaveCheckin = async () => {
    const result = await saveCheckin(weeklyReflection);
    if (result.success && result.summary) {
      // F028: Record hot spots check-in for streak
      await recordCheckin('hotspots_checkin');
      // Navigate to chat with the summary as a message
      const encodedSummary = encodeURIComponent(result.summary);
      router.push(`/chat?message=${encodedSummary}`);
    }
  };

  /**
   * Handle clicking on an area icon to edit it.
   */
  const handleEditArea = (area: HotSpotArea) => {
    setEditingArea({ ...area });
    setEditDrawerOpen(true);
  };

  /**
   * Handle saving edited area changes.
   */
  const handleSaveEditedArea = async () => {
    if (!editingArea) return;
    updateArea(editingArea.id, editingArea);
    setEditDrawerOpen(false);
    await saveAreas();
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto safe-bottom">
      <div className="p-4">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-1">Hot Spots</h2>
            <p className="text-sm text-muted-foreground">
              Weekly check-in on the 7 key areas of your life
            </p>
            {lastCheckin && (
              <p className="text-xs text-muted-foreground mt-1">
                Last check-in: {lastCheckin.toLocaleDateString()}
              </p>
            )}
          </div>
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground"
              onClick={() => setEditDrawerOpen(true)}
            >
              <Settings2 className="w-5 h-5" />
            </Button>
          )}
        </div>

        {/* Overview Card */}
        <div className="rounded-xl border border-border/50 bg-card p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Overall Balance</span>
            <span className="text-2xl font-semibold text-foreground">
              {averageRating.toFixed(1)}/10
            </span>
          </div>
          {lowestSpot && lowestSpot.rating < 5 && (
            <p className="text-sm text-muted-foreground">
              <span className={lowestSpot.color}>💡 {lowestSpot.name}</span> could use some
              attention this week.
            </p>
          )}
        </div>

        {/* Hot Spots List */}
        <div className="space-y-4">
          {hotSpots.map((spot) => {
            const Icon = ICONS[spot.id] || Brain;
            return (
              <div key={spot.id} className="rounded-xl border border-border/50 bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={() => handleEditArea(spot)}
                    className={cn(
                      'w-10 h-10 rounded-full bg-muted flex items-center justify-center transition-transform hover:scale-105',
                      spot.color
                    )}
                    title="Customize this area"
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                  <div className="flex-1">
                    <h3 className="font-medium text-foreground">{spot.name}</h3>
                    <p className="text-xs text-muted-foreground">{spot.description}</p>
                  </div>
                  <span
                    className={cn(
                      'text-lg font-semibold',
                      spot.rating >= 7
                        ? 'text-emerald-500'
                        : spot.rating >= 4
                          ? 'text-amber-500'
                          : 'text-rose-500'
                    )}
                  >
                    {spot.rating}
                  </span>
                </div>

                <Slider
                  value={[spot.rating]}
                  onValueChange={(value) => updateRating(spot.id, value[0])}
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

        {/* Weekly Reflection */}
        <div className="mt-6 rounded-xl border border-border/50 bg-card p-4">
          <div className="text-sm font-medium text-foreground mb-2">Weekly Reflection</div>
          <Textarea
            value={weeklyReflection}
            onChange={(e) => setWeeklyReflection(e.target.value)}
            placeholder="What's going well? What needs attention? Any patterns you're noticing?"
            className="min-h-[100px]"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This reflection will be shared with Claru for a more personalized response.
          </p>
        </div>

        {/* Save Button */}
        <div className="mt-6 pb-4">
          <Button className="w-full" onClick={handleSaveCheckin} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
            {isSaving ? 'Saving...' : 'Save Weekly Check-in'}
          </Button>
        </div>
      </div>

      {/* Edit Area Drawer */}
      <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Customize Hot Spot</DrawerTitle>
            <DrawerDescription>Personalize this area to match your life</DrawerDescription>
          </DrawerHeader>

          {editingArea && (
            <div className="px-4 pb-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground">Name</label>
                <Input
                  value={editingArea.name}
                  onChange={(e) => setEditingArea({ ...editingArea, name: e.target.value })}
                  placeholder="Area name"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground">Description</label>
                <Input
                  value={editingArea.description}
                  onChange={(e) =>
                    setEditingArea({ ...editingArea, description: e.target.value })
                  }
                  placeholder="What this area covers"
                  className="mt-1"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Color</label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => setEditingArea({ ...editingArea, color: color.value })}
                      className={cn(
                        'w-8 h-8 rounded-full transition-transform',
                        color.value.replace('text-', 'bg-'),
                        editingArea.color === color.value &&
                          'ring-2 ring-offset-2 ring-primary scale-110'
                      )}
                      title={color.label}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <DrawerFooter>
            <Button onClick={handleSaveEditedArea} disabled={!isAuthenticated}>
              {isAuthenticated ? 'Save Changes' : 'Sign in to customize'}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
