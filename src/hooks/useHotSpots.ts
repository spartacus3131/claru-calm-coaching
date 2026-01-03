import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { startOfWeek, format } from 'date-fns';

export interface HotSpotArea {
  id: string;
  name: string;
  description: string;
  color: string;
  notes?: string; // Weekly reflection for this area
}

export interface HotSpot extends HotSpotArea {
  rating: number;
}

const DEFAULT_HOTSPOT_AREAS: HotSpotArea[] = [
  { id: 'mind', name: 'Mind', description: 'Learning, growth, mental clarity', color: 'text-violet-500' },
  { id: 'body', name: 'Body', description: 'Physical health, energy, exercise', color: 'text-rose-500' },
  { id: 'emotions', name: 'Emotions', description: 'Mood, stress, emotional balance', color: 'text-amber-500' },
  { id: 'career', name: 'Career', description: 'Work, projects, professional growth', color: 'text-blue-500' },
  { id: 'finances', name: 'Finances', description: 'Money, savings, financial health', color: 'text-emerald-500' },
  { id: 'relationships', name: 'Relationships', description: 'Family, friends, connections', color: 'text-pink-500' },
  { id: 'fun', name: 'Fun', description: 'Hobbies, leisure, enjoyment', color: 'text-orange-500' },
];

export function useHotSpots() {
  const { user } = useAuth();
  const [areas, setAreas] = useState<HotSpotArea[]>(DEFAULT_HOTSPOT_AREAS);
  const [hotSpots, setHotSpots] = useState<HotSpot[]>(
    DEFAULT_HOTSPOT_AREAS.map(a => ({ ...a, rating: 5 }))
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);

  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Load custom areas and ratings from database if logged in
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      // Load custom areas
      const { data: customAreas, error: areasError } = await supabase
        .from('hotspot_areas')
        .select('*')
        .eq('user_id', user.id)
        .order('position');

      if (areasError) {
        console.error('Error loading custom areas:', areasError);
      }

      const userAreas: HotSpotArea[] = customAreas && customAreas.length > 0
        ? customAreas.map(a => ({
            id: a.area_id,
            name: a.name,
            description: a.description,
            color: a.color
          }))
        : DEFAULT_HOTSPOT_AREAS;

      setAreas(userAreas);

      // Load ratings
      const { data: ratings, error: ratingsError } = await supabase
        .from('hotspot_ratings')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', currentWeekStart);

      if (ratingsError) {
        console.error('Error loading hotspot ratings:', ratingsError);
      }

      // Merge areas with ratings
      const mergedHotSpots = userAreas.map(area => {
        const rating = ratings?.find(r => r.area === area.id);
        return { ...area, rating: rating?.rating ?? 5 };
      });

      setHotSpots(mergedHotSpots);
      
      if (ratings && ratings.length > 0) {
        setLastCheckin(new Date(ratings[0].updated_at));
      }
      
      setLoading(false);
    };

    loadData();
  }, [user, currentWeekStart]);

  const updateRating = (id: string, rating: number) => {
    setHotSpots(prev =>
      prev.map(spot => (spot.id === id ? { ...spot, rating } : spot))
    );
  };

  const updateArea = (id: string, updates: Partial<HotSpotArea>) => {
    setAreas(prev =>
      prev.map(area => (area.id === id ? { ...area, ...updates } : area))
    );
    setHotSpots(prev =>
      prev.map(spot => (spot.id === id ? { ...spot, ...updates } : spot))
    );
  };

  const saveAreas = async (): Promise<boolean> => {
    if (!user) {
      toast.error('Sign in to save custom areas');
      return false;
    }

    try {
      const upserts = areas.map((area, index) => ({
        user_id: user.id,
        area_id: area.id,
        name: area.name,
        description: area.description,
        color: area.color,
        position: index
      }));

      const { error } = await supabase
        .from('hotspot_areas')
        .upsert(upserts, { onConflict: 'user_id,area_id' });

      if (error) throw error;

      toast.success('Hot Spot areas saved!');
      return true;
    } catch (error) {
      console.error('Error saving areas:', error);
      toast.error('Failed to save areas');
      return false;
    }
  };

  const saveCheckin = async (weeklyReflection?: string): Promise<{ success: boolean; summary?: string }> => {
    if (!user) {
      toast.error('Create an account to save your check-in', {
        action: {
          label: 'Sign up',
          onClick: () => window.location.href = '/auth'
        }
      });
      return { success: false };
    }

    setSaving(true);

    try {
      const upserts = hotSpots.map(spot => ({
        user_id: user.id,
        week_start: currentWeekStart,
        area: spot.id,
        rating: spot.rating
      }));

      const { error } = await supabase
        .from('hotspot_ratings')
        .upsert(upserts, { 
          onConflict: 'user_id,week_start,area'
        });

      if (error) throw error;

      setLastCheckin(new Date());

      // Generate a summary for the coach
      const summary = generateHotSpotsSummary(hotSpots, weeklyReflection);

      toast.success('Hot Spots check-in saved!', {
        description: 'Generating your reflection...'
      });

      return { success: true, summary };
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast.error('Failed to save check-in');
      return { success: false };
    } finally {
      setSaving(false);
    }
  };

  return { 
    hotSpots, 
    areas,
    loading, 
    saving,
    lastCheckin, 
    updateRating, 
    updateArea,
    saveAreas,
    saveCheckin, 
    isAuthenticated: !!user 
  };
}

function generateHotSpotsSummary(hotSpots: HotSpot[], weeklyReflection?: string): string {
  const average = hotSpots.reduce((acc, s) => acc + s.rating, 0) / hotSpots.length;
  const lowest = hotSpots.reduce((min, s) => s.rating < min.rating ? s : min, hotSpots[0]);
  const highest = hotSpots.reduce((max, s) => s.rating > max.rating ? s : max, hotSpots[0]);

  const ratingsText = hotSpots
    .map(s => `${s.name}: ${s.rating}/10`)
    .join(', ');

  const reflectionSection = weeklyReflection?.trim()
    ? `\n\nMy reflection:\n${weeklyReflection.trim()}`
    : '';

  return `[Hot Spots Weekly Check-in]
My ratings this week: ${ratingsText}

Overall balance: ${average.toFixed(1)}/10
Strongest area: ${highest.name} (${highest.rating}/10)
Area needing attention: ${lowest.name} (${lowest.rating}/10)${reflectionSection}

Please give me a brief, supportive reflection on my life balance this week.`;
}
