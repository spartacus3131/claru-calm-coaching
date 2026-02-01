/**
 * @file route.ts
 * @description Streak Tracking API - F028
 * @module api/streaks
 *
 * Per bounded-contexts.mdc: Engagement Tracker owns streak data.
 * Per supabase.mdc: RLS + user_id filtering (defense in depth).
 * Per 005-error-handling.mdc: Log errors with context, user-friendly messages.
 * Per domain-language.mdc: Use "streak", "check-in", "consecutive days".
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  RecordEngagementSchema,
  toStreakSummary,
  toStreakDisplay,
  toEngagementDbInsert,
  type DbStreakSummary,
  type DbEngagementRecord,
} from '@/modules/engagement';

/**
 * GET /api/streaks
 * Get streak summary for the authenticated user.
 *
 * @returns StreakDisplay with current, longest, milestone, etc.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch cached streak summary
    const { data: summaryData, error: summaryError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      // PGRST116 = no rows found (expected for new users)
      console.error('Failed to fetch streak summary:', {
        userId: user.id,
        error: summaryError.message,
      });
      return NextResponse.json(
        { error: 'Failed to fetch streak data' },
        { status: 500 }
      );
    }

    // Convert to display format
    const summary = summaryData ? toStreakSummary(summaryData as DbStreakSummary) : null;
    const display = toStreakDisplay(summary);

    return NextResponse.json({ data: display });
  } catch (error) {
    console.error('Streaks API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/streaks
 * Record a new engagement (check-in) for today.
 *
 * @body RecordEngagementInput
 * @returns Updated StreakDisplay
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Per typescript.mdc: ALWAYS validate external input with Zod
    const parsed = RecordEngagementSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const today = new Date().toISOString().split('T')[0];

    // Check if already checked in today for this type
    const { data: existingRecord } = await supabase
      .from('engagement_records')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .eq('engagement_type', parsed.data.engagementType)
      .single();

    if (existingRecord) {
      // Already recorded for today - just return current streak
      const { data: summaryData } = await supabase
        .from('user_streaks')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const summary = summaryData ? toStreakSummary(summaryData as DbStreakSummary) : null;
      return NextResponse.json({
        data: toStreakDisplay(summary),
        alreadyRecorded: true,
      });
    }

    // Insert new engagement record
    const dbInsert = toEngagementDbInsert(parsed.data, user.id, today);

    const { error: insertError } = await supabase
      .from('engagement_records')
      .insert(dbInsert);

    if (insertError) {
      // Handle unique constraint violation gracefully
      if (insertError.code === '23505') {
        // Already exists - race condition, just fetch current streak
        const { data: summaryData } = await supabase
          .from('user_streaks')
          .select('*')
          .eq('user_id', user.id)
          .single();

        const summary = summaryData ? toStreakSummary(summaryData as DbStreakSummary) : null;
        return NextResponse.json({
          data: toStreakDisplay(summary),
          alreadyRecorded: true,
        });
      }

      console.error('Failed to record engagement:', {
        userId: user.id,
        input: parsed.data,
        error: insertError.message,
      });
      return NextResponse.json(
        { error: 'Failed to record check-in' },
        { status: 500 }
      );
    }

    // Fetch updated streak summary (trigger should have updated it)
    const { data: summaryData, error: summaryError } = await supabase
      .from('user_streaks')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (summaryError) {
      console.error('Failed to fetch updated streak:', {
        userId: user.id,
        error: summaryError.message,
      });
    }

    const summary = summaryData ? toStreakSummary(summaryData as DbStreakSummary) : null;
    const display = toStreakDisplay(summary);

    return NextResponse.json({
      data: display,
      recorded: true,
    });
  } catch (error) {
    console.error('Streaks API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/streaks/history
 * Get engagement history for the authenticated user.
 *
 * @query days - Number of days to fetch (default: 30)
 * @returns Array of engagement records
 */
export async function OPTIONS() {
  // This could be expanded to a proper history endpoint
  return NextResponse.json({ message: 'History endpoint coming soon' });
}
