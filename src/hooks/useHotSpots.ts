import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { startOfWeek, format } from 'date-fns';

export interface HotSpot {
  id: string;
  name: string;
  description: string;
  rating: number;
  color: string;
}

const HOTSPOT_AREAS = [
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
  const [hotSpots, setHotSpots] = useState<HotSpot[]>(
    HOTSPOT_AREAS.map(a => ({ ...a, rating: 5 }))
  );
  const [loading, setLoading] = useState(true);
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);

  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  // Load ratings from database
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const loadRatings = async () => {
      const { data, error } = await supabase
        .from('hotspot_ratings')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', currentWeekStart);

      if (error) {
        console.error('Error loading hotspot ratings:', error);
      } else if (data && data.length > 0) {
        // Update ratings from database
        setHotSpots(prev => prev.map(spot => {
          const dbRating = data.find(d => d.area === spot.id);
          return dbRating ? { ...spot, rating: dbRating.rating } : spot;
        }));
        setLastCheckin(new Date(data[0].updated_at));
      }
      setLoading(false);
    };

    loadRatings();
  }, [user, currentWeekStart]);

  const updateRating = (id: string, rating: number) => {
    setHotSpots(prev =>
      prev.map(spot => (spot.id === id ? { ...spot, rating } : spot))
    );
  };

  const saveCheckin = async () => {
    if (!user) {
      toast.error('Please sign in to save your check-in');
      return;
    }

    try {
      // Upsert all ratings for this week
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
      toast.success('Hot Spots check-in saved!', {
        description: 'Great job reflecting on your life balance.'
      });
    } catch (error) {
      console.error('Error saving check-in:', error);
      toast.error('Failed to save check-in');
    }
  };

  return { hotSpots, loading, lastCheckin, updateRating, saveCheckin };
}
