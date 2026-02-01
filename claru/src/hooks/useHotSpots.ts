/**
 * @file useHotSpots.ts
 * @description Hook for managing Hot Spots state with optimistic updates
 * @module hooks
 *
 * F027: Hot Spots - Weekly ratings for 7 life areas
 * Per bounded-contexts.mdc: Engagement Tracker owns hot spots data.
 * Per domain-language.mdc: Use "Hot Spots", "life areas", "weekly check-in".
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { startOfWeek, format } from 'date-fns';
import type { HotSpotArea, HotSpot } from '@/modules/hotspots';
import {
  DEFAULT_HOTSPOT_AREAS,
  mergeAreasWithRatings,
  calculateBalance,
  findLowestSpot,
  findHighestSpot,
  generateHotSpotsSummary,
} from '@/modules/hotspots';

/**
 * Hook return type.
 */
interface UseHotSpotsResult {
  // State
  hotSpots: HotSpot[];
  areas: HotSpotArea[];
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  lastCheckin: Date | null;
  // Computed
  averageRating: number;
  lowestSpot: HotSpot | null;
  highestSpot: HotSpot | null;
  currentWeekStart: string;
  // Actions
  updateRating: (areaId: string, rating: number) => void;
  updateArea: (areaId: string, updates: Partial<HotSpotArea>) => void;
  saveAreas: () => Promise<boolean>;
  saveCheckin: (weeklyReflection?: string) => Promise<{ success: boolean; summary?: string }>;
  refetch: () => Promise<void>;
  // Auth status
  isAuthenticated: boolean;
}

/**
 * Hook for fetching and managing Hot Spots (7 life areas).
 *
 * @returns Hot spots state and mutation functions
 *
 * @example
 * const { hotSpots, updateRating, saveCheckin } = useHotSpots();
 */
export function useHotSpots(): UseHotSpotsResult {
  const [areas, setAreas] = useState<HotSpotArea[]>(DEFAULT_HOTSPOT_AREAS);
  const [hotSpots, setHotSpots] = useState<HotSpot[]>(
    DEFAULT_HOTSPOT_AREAS.map((a) => ({ ...a, rating: 5 }))
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheckin, setLastCheckin] = useState<Date | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Calculate current week start (Monday)
  const currentWeekStart = useMemo(
    () => format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd'),
    []
  );

  /**
   * Fetch hot spots data from API.
   */
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/hotspots?type=both&weekStart=${currentWeekStart}`);

      if (response.status === 401) {
        // Not authenticated - use defaults
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to fetch hot spots');
      }

      setIsAuthenticated(true);
      const { data } = await response.json();

      // Set areas (custom or defaults)
      const areasToUse = data.areas?.length > 0 ? data.areas : DEFAULT_HOTSPOT_AREAS;
      setAreas(areasToUse);

      // Merge areas with ratings
      const ratings = data.ratings || [];
      const mergedHotSpots = mergeAreasWithRatings(areasToUse, ratings);
      setHotSpots(mergedHotSpots);

      // Set last check-in date
      if (data.lastCheckin) {
        setLastCheckin(new Date(data.lastCheckin));
      }
    } catch (err) {
      console.error('Failed to fetch hot spots:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [currentWeekStart]);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /**
   * Update a single rating (local state only).
   *
   * @param areaId - Area ID to update
   * @param rating - New rating (1-10)
   */
  const updateRating = useCallback((areaId: string, rating: number) => {
    setHotSpots((prev) =>
      prev.map((spot) => (spot.id === areaId ? { ...spot, rating } : spot))
    );
  }, []);

  /**
   * Update an area's properties (local state only).
   *
   * @param areaId - Area ID to update
   * @param updates - Partial updates
   */
  const updateArea = useCallback((areaId: string, updates: Partial<HotSpotArea>) => {
    setAreas((prev) =>
      prev.map((area) => (area.id === areaId ? { ...area, ...updates } : area))
    );
    setHotSpots((prev) =>
      prev.map((spot) => (spot.id === areaId ? { ...spot, ...updates } : spot))
    );
  }, []);

  /**
   * Save custom areas to database.
   *
   * @returns True if successful
   */
  const saveAreas = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Sign in to save custom areas');
      return false;
    }

    try {
      setIsSaving(true);

      const response = await fetch('/api/hotspots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ areas }),
      });

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to save areas');
      }

      toast.success('Hot Spot areas saved!');
      return true;
    } catch (err) {
      console.error('Failed to save areas:', err);
      toast.error('Failed to save areas');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [areas, isAuthenticated]);

  /**
   * Save weekly check-in (ratings).
   *
   * @param weeklyReflection - Optional reflection text
   * @returns Success status and AI summary
   */
  const saveCheckin = useCallback(
    async (weeklyReflection?: string): Promise<{ success: boolean; summary?: string }> => {
      if (!isAuthenticated) {
        toast.error('Create an account to save your check-in', {
          action: {
            label: 'Sign up',
            onClick: () => {
              window.location.href = '/auth';
            },
          },
        });
        return { success: false };
      }

      try {
        setIsSaving(true);

        const ratings = hotSpots.map((spot) => ({
          area: spot.id,
          rating: spot.rating,
          notes: spot.notes,
        }));

        const response = await fetch('/api/hotspots', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            weekStart: currentWeekStart,
            ratings,
            weeklyReflection,
          }),
        });

        if (!response.ok) {
          const json = await response.json();
          throw new Error(json.error || 'Failed to save check-in');
        }

        setLastCheckin(new Date());

        // Generate summary for AI coach
        const summary = generateHotSpotsSummary(hotSpots, weeklyReflection);

        toast.success('Hot Spots check-in saved!', {
          description: 'Your life balance snapshot has been recorded.',
        });

        return { success: true, summary };
      } catch (err) {
        console.error('Failed to save check-in:', err);
        toast.error('Failed to save check-in');
        return { success: false };
      } finally {
        setIsSaving(false);
      }
    },
    [hotSpots, currentWeekStart, isAuthenticated]
  );

  // Computed values
  const averageRating = useMemo(() => calculateBalance(hotSpots), [hotSpots]);
  const lowestSpot = useMemo(() => findLowestSpot(hotSpots), [hotSpots]);
  const highestSpot = useMemo(() => findHighestSpot(hotSpots), [hotSpots]);

  return {
    // State
    hotSpots,
    areas,
    isLoading,
    isSaving,
    error,
    lastCheckin,
    // Computed
    averageRating,
    lowestSpot,
    highestSpot,
    currentWeekStart,
    // Actions
    updateRating,
    updateArea,
    saveAreas,
    saveCheckin,
    refetch: fetchData,
    // Auth
    isAuthenticated,
  };
}

// Re-export types for convenience
export type { HotSpotArea, HotSpot };
