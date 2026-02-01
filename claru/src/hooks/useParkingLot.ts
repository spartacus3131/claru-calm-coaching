/**
 * @file useParkingLot.ts
 * @description Hook for managing parking lot state with optimistic updates
 * @module hooks
 *
 * F026: Provides client-side interface for parking lot.
 * Per bounded-contexts.mdc: Parking Lot Manager owns parked items.
 * Per domain-language.mdc: Use "parked" not "deferred" or "backlog".
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type {
  ParkedItem,
  CreateParkedItemInput,
  UpdateParkedItemInput,
  ParkedItemStatus,
} from '@/modules/parking-lot';
import {
  getDaysParked,
  isStale,
  formatDaysParkedLabel,
  PARKING_LOT_LIMIT,
} from '@/modules/parking-lot';

/**
 * API response metadata.
 */
interface ParkingLotMeta {
  count: number;
  parkedCount: number;
  limit: number;
  atCapacity: boolean;
}

/**
 * Hook return type.
 */
interface UseParkingLotResult {
  // State
  items: ParkedItem[];
  isLoading: boolean;
  error: string | null;
  // Metadata
  meta: ParkingLotMeta | null;
  // Computed
  parkedItems: ParkedItem[];
  staleItems: ParkedItem[];
  isAtCapacity: boolean;
  // Actions
  parkItem: (input: CreateParkedItemInput) => Promise<ParkedItem | null>;
  updateItem: (id: string, input: UpdateParkedItemInput) => Promise<boolean>;
  deleteItem: (id: string, hard?: boolean) => Promise<boolean>;
  reactivateItem: (id: string) => Promise<boolean>;
  refetch: () => Promise<void>;
  // Utilities (re-exported for convenience)
  getDaysParked: typeof getDaysParked;
  isStale: typeof isStale;
  formatDaysParkedLabel: typeof formatDaysParkedLabel;
}

/**
 * Hook for fetching and managing parking lot items.
 *
 * @param statusFilter - Status to filter by (default: 'parked')
 * @returns Parking lot state and mutation functions
 *
 * @example
 * const { items, parkItem, isAtCapacity } = useParkingLot();
 */
export function useParkingLot(statusFilter: ParkedItemStatus | 'all' = 'parked'): UseParkingLotResult {
  const [items, setItems] = useState<ParkedItem[]>([]);
  const [meta, setMeta] = useState<ParkingLotMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch parking lot items from API.
   */
  const fetchItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/parking?status=${statusFilter}`);

      if (response.status === 401) {
        // Not authenticated
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to fetch parking lot');
      }

      const json = await response.json();
      setItems(json.data || []);
      setMeta(json.meta || null);
    } catch (err) {
      console.error('Failed to fetch parking lot:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  // Fetch on mount and when filter changes
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  /**
   * Park a new item.
   *
   * @param input - Item data
   * @returns Created item or null on error
   */
  const parkItem = useCallback(
    async (input: CreateParkedItemInput): Promise<ParkedItem | null> => {
      try {
        const response = await fetch('/api/parking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const json = await response.json();
          if (json.message) {
            toast.error(json.message);
          } else {
            toast.error(json.error || 'Failed to park item');
          }
          return null;
        }

        const { data } = await response.json();

        // Optimistic update
        setItems((prev) => [data, ...prev]);
        setMeta((prev) =>
          prev
            ? {
                ...prev,
                count: prev.count + 1,
                parkedCount: prev.parkedCount + 1,
                atCapacity: prev.parkedCount + 1 >= PARKING_LOT_LIMIT,
              }
            : null
        );

        toast.success('Item parked');
        return data;
      } catch (err) {
        console.error('Failed to park item:', err);
        toast.error('Failed to park item');
        return null;
      }
    },
    []
  );

  /**
   * Update a parked item.
   *
   * @param id - Item ID
   * @param input - Update data
   * @returns True if successful
   */
  const updateItem = useCallback(
    async (id: string, input: UpdateParkedItemInput): Promise<boolean> => {
      try {
        const response = await fetch(`/api/parking?id=${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const json = await response.json();
          toast.error(json.message || json.error || 'Failed to update item');
          return false;
        }

        const { data } = await response.json();

        // Optimistic update
        setItems((prev) => prev.map((item) => (item.id === id ? data : item)));

        return true;
      } catch (err) {
        console.error('Failed to update item:', err);
        toast.error('Failed to update item');
        return false;
      }
    },
    []
  );

  /**
   * Delete a parked item.
   *
   * @param id - Item ID
   * @param hard - If true, permanently delete
   * @returns True if successful
   */
  const deleteItem = useCallback(async (id: string, hard: boolean = false): Promise<boolean> => {
    try {
      const response = await fetch(`/api/parking?id=${id}${hard ? '&hard=true' : ''}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete item');
      }

      // Optimistic update
      if (hard) {
        setItems((prev) => prev.filter((item) => item.id !== id));
      } else {
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'deleted' as ParkedItemStatus } : item))
        );
      }

      setMeta((prev) =>
        prev
          ? {
              ...prev,
              parkedCount: Math.max(0, prev.parkedCount - 1),
              atCapacity: prev.parkedCount - 1 >= PARKING_LOT_LIMIT,
            }
          : null
      );

      toast.success('Item removed');
      return true;
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast.error('Failed to remove item');
      return false;
    }
  }, []);

  /**
   * Reactivate a parked item (move back to active planning).
   * Requires going through under_review state first.
   *
   * @param id - Item ID
   * @returns True if successful
   */
  const reactivateItem = useCallback(
    async (id: string): Promise<boolean> => {
      // First transition to under_review, then to reactivated
      const reviewSuccess = await updateItem(id, { status: 'under_review' });
      if (!reviewSuccess) return false;

      const reactivateSuccess = await updateItem(id, { status: 'reactivated' });
      if (reactivateSuccess) {
        toast.success('Item reactivated');
        // Remove from list since it's no longer parked
        setItems((prev) => prev.filter((item) => item.id !== id));
      }
      return reactivateSuccess;
    },
    [updateItem]
  );

  // Computed: only parked items (not deleted/reactivated)
  const parkedItems = useMemo(() => items.filter((i) => i.status === 'parked'), [items]);

  // Computed: stale items (not reviewed in 30+ days)
  const staleItems = useMemo(() => parkedItems.filter(isStale), [parkedItems]);

  // Computed: at capacity
  const isAtCapacityComputed = useMemo(
    () => meta?.atCapacity ?? parkedItems.length >= PARKING_LOT_LIMIT,
    [meta, parkedItems.length]
  );

  return {
    // State
    items,
    isLoading,
    error,
    // Metadata
    meta,
    // Computed
    parkedItems,
    staleItems,
    isAtCapacity: isAtCapacityComputed,
    // Actions
    parkItem,
    updateItem,
    deleteItem,
    reactivateItem,
    refetch: fetchItems,
    // Utilities
    getDaysParked,
    isStale,
    formatDaysParkedLabel,
  };
}
