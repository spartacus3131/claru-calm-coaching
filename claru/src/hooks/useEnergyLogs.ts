/**
 * @file useEnergyLogs.ts
 * @description Hook for managing energy log state with optimistic updates
 * @module hooks
 *
 * F024: Provides client-side interface for energy logging.
 * Per bounded-contexts.mdc: Engagement Tracker owns energy logging.
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import type { EnergyLog, CreateEnergyLogInput } from '@/modules/engagement/energyLogs';

/**
 * Hook for fetching and managing energy logs.
 *
 * @param days - Number of days to fetch (default: 7)
 * @returns Energy log state and mutation functions
 *
 * @example
 * const { logs, addLog, todayAverage, isLoading } = useEnergyLogs(7);
 */
export function useEnergyLogs(days: number = 7) {
  const [logs, setLogs] = useState<EnergyLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch energy logs from API.
   */
  const fetchLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/energy-logs?days=${days}`);

      if (response.status === 401) {
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch energy logs');
      }

      const json = await response.json();
      setLogs(json.data || []);
    } catch (err) {
      console.error('Failed to fetch energy logs:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  // Fetch on mount and when days changes
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  /**
   * Add a new energy log entry.
   *
   * @param input - Energy log data
   * @returns Created log or null on error
   */
  const addLog = useCallback(
    async (input: CreateEnergyLogInput): Promise<EnergyLog | null> => {
      try {
        const response = await fetch('/api/energy-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        });

        if (!response.ok) {
          const json = await response.json();
          throw new Error(json.error || 'Failed to add energy log');
        }

        const { data } = await response.json();

        // Optimistic update
        setLogs((prev) => [data, ...prev]);

        toast.success('Energy logged');
        return data;
      } catch (err) {
        console.error('Failed to add energy log:', err);
        toast.error('Failed to log energy');
        return null;
      }
    },
    []
  );

  /**
   * Delete an energy log entry.
   *
   * @param logId - ID of log to delete
   * @returns True if successful
   */
  const deleteLog = useCallback(async (logId: string): Promise<boolean> => {
    try {
      const response = await fetch(`/api/energy-logs?id=${logId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete energy log');
      }

      // Optimistic update
      setLogs((prev) => prev.filter((log) => log.id !== logId));

      return true;
    } catch (err) {
      console.error('Failed to delete energy log:', err);
      toast.error('Failed to delete energy log');
      return false;
    }
  }, []);

  // Computed: today's logs
  const todayLogs = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return logs.filter((log) => log.loggedAt.startsWith(today));
  }, [logs]);

  // Computed: today's average energy
  const todayAverage = useMemo(() => {
    if (todayLogs.length === 0) return null;
    const sum = todayLogs.reduce((acc, log) => acc + log.energyLevel, 0);
    return Math.round((sum / todayLogs.length) * 10) / 10;
  }, [todayLogs]);

  // Computed: logs grouped by day
  const logsByDay = useMemo(() => {
    const grouped = new Map<string, EnergyLog[]>();
    for (const log of logs) {
      const day = log.loggedAt.split('T')[0];
      const existing = grouped.get(day) ?? [];
      existing.push(log);
      grouped.set(day, existing);
    }
    return grouped;
  }, [logs]);

  // Computed: total logs count
  const totalLogs = logs.length;

  // Computed: unique days with logs
  const uniqueDays = logsByDay.size;

  return {
    // State
    logs,
    isLoading,
    error,
    // Computed
    todayLogs,
    todayAverage,
    logsByDay,
    totalLogs,
    uniqueDays,
    // Actions
    refetch: fetchLogs,
    addLog,
    deleteLog,
  };
}
