/**
 * @file useBPTAnalysis.ts
 * @description Hook for fetching and using BPT (Biological Prime Time) analysis
 * @module hooks
 *
 * F025: Provides client-side interface for BPT analysis.
 * Per bounded-contexts.mdc: Insights Engine provides analysis.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { BPTAnalysis, AnalysisReadiness } from '@/modules/insights/bptAnalysis';

/**
 * API response shape.
 */
interface BPTAnalysisResponse {
  data: BPTAnalysis | null;
  readiness: AnalysisReadiness;
  message?: string;
}

/**
 * Hook return type.
 */
interface UseBPTAnalysisResult {
  /** BPT analysis results, null if not ready or loading */
  analysis: BPTAnalysis | null;
  /** Analysis readiness status */
  readiness: AnalysisReadiness | null;
  /** Whether analysis is currently loading */
  isLoading: boolean;
  /** Error message if analysis failed */
  error: string | null;
  /** Refetch analysis from server */
  refetch: () => Promise<void>;
}

/**
 * Hook for fetching and managing BPT analysis.
 *
 * @param days - Number of days to include in analysis (default: 30)
 * @returns BPT analysis state and refetch function
 *
 * @example
 * const { analysis, readiness, isLoading } = useBPTAnalysis();
 *
 * if (isLoading) return <Spinner />;
 * if (!analysis) return <NotEnoughData readiness={readiness} />;
 * return <BPTChart analysis={analysis} />;
 */
export function useBPTAnalysis(days: number = 30): UseBPTAnalysisResult {
  const [analysis, setAnalysis] = useState<BPTAnalysis | null>(null);
  const [readiness, setReadiness] = useState<AnalysisReadiness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch BPT analysis from API.
   */
  const fetchAnalysis = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/insights/bpt?days=${days}`);

      if (response.status === 401) {
        // Not authenticated, don't set error
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const json = await response.json();
        throw new Error(json.error || 'Failed to fetch BPT analysis');
      }

      const json: BPTAnalysisResponse = await response.json();

      setAnalysis(json.data);
      setReadiness(json.readiness);
    } catch (err) {
      console.error('Failed to fetch BPT analysis:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setAnalysis(null);
    } finally {
      setIsLoading(false);
    }
  }, [days]);

  // Fetch on mount and when days changes
  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return {
    analysis,
    readiness,
    isLoading,
    error,
    refetch: fetchAnalysis,
  };
}
