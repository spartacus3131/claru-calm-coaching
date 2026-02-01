/**
 * @file route.ts
 * @description BPT Analysis API - F025
 * @module api/insights/bpt
 *
 * Calculates and returns Biological Prime Time analysis from energy logs.
 *
 * Per bounded-contexts.mdc: Insights Engine reads from Engagement Tracker.
 * Per supabase.mdc: RLS + user_id filtering (defense in depth).
 * Per 005-error-handling.mdc: Log errors with context, user-friendly messages.
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  analyzeBPT,
  getAnalysisReadiness,
  type EnergyLogForAnalysis,
} from '@/modules/insights/bptAnalysis';

/**
 * Database row shape for energy_logs.
 */
interface DbEnergyLog {
  logged_at: string;
  hour: number;
  energy_level: number;
}

/**
 * Convert database row to analysis format.
 */
function toAnalysisFormat(row: DbEnergyLog): EnergyLogForAnalysis {
  return {
    loggedAt: row.logged_at,
    hour: row.hour,
    energyLevel: row.energy_level,
  };
}

/**
 * GET /api/insights/bpt
 * Calculate and return BPT analysis from user's energy logs.
 *
 * @query days - Optional: limit analysis to last N days (default: 30)
 * @returns BPT analysis results or readiness status
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') ?? '30', 10);

    // Calculate cutoff date
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Fetch energy logs for analysis
    // Per bounded-contexts.mdc: Insights Engine reads from Engagement Tracker
    // Per supabase.mdc: ALWAYS filter by user_id even with RLS
    const { data, error } = await supabase
      .from('energy_logs')
      .select('logged_at, hour, energy_level')
      .eq('user_id', user.id)
      .gte('logged_at', cutoff.toISOString())
      .order('logged_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch energy logs for BPT analysis:', {
        userId: user.id,
        days,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to fetch energy data' },
        { status: 500 }
      );
    }

    // Convert to analysis format
    const logs: EnergyLogForAnalysis[] = (data || []).map(toAnalysisFormat);

    // Check readiness
    const readiness = getAnalysisReadiness(logs);

    // If not ready, return readiness status
    if (!readiness.isReady) {
      return NextResponse.json({
        data: null,
        readiness,
        message: `Need ${readiness.requiredLogs - readiness.currentLogs} more energy logs for analysis`,
      });
    }

    // Run analysis
    const analysis = analyzeBPT(logs);

    if (!analysis) {
      // This shouldn't happen if readiness check passed, but handle gracefully
      console.error('BPT analysis returned null despite passing readiness', {
        userId: user.id,
        logCount: logs.length,
      });
      return NextResponse.json(
        { error: 'Analysis calculation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: analysis,
      readiness,
    });
  } catch (error) {
    console.error('BPT Analysis API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
