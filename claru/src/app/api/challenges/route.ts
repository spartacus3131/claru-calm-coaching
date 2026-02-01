/**
 * @file route.ts
 * @description API routes for user challenges
 * @module api/challenges
 *
 * Handles CRUD operations for user challenge progress.
 * Challenge definitions are static (in code), but user progress is stored in DB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CHALLENGES } from '@/modules/challenges/data';
import {
  ChallengeStatus,
  ChallengeStatusSchema,
  UserChallengeSchema,
  canTransition,
  isCooldownExpired,
  getCooldownDaysRemaining,
} from '@/modules/challenges/stateMachine';
import { z } from 'zod';

/**
 * Combined challenge with definition and user status.
 */
export interface ChallengeWithStatus {
  id: number;
  title: string;
  description: string;
  part: string;
  partTitle: string;
  time: string;
  energy: number;
  value: number;
  whatYouGet: string;
  steps: { title?: string; content: string }[];
  tips?: string[];
  worksheetPrompts?: string[];
  researchInsight?: string;
  actionableTip?: string;
  citation?: string;
  // User-specific fields
  userStatus: ChallengeStatus;
  startedAt: string | null;
  completedAt: string | null;
  declinedAt: string | null;
  data: Record<string, unknown> | null;
}

/**
 * GET /api/challenges
 *
 * Returns all 22 challenges with the user's status for each.
 * If user has no record for a challenge, status defaults to 'available'.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's challenge records
    const { data: userChallenges, error: fetchError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', user.id);

    if (fetchError) {
      console.error('Failed to fetch user challenges:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch challenges' },
        { status: 500 }
      );
    }

    // Create a map of user challenge records by challenge_id
    const userChallengeMap = new Map<number, typeof userChallenges[0]>();
    for (const uc of userChallenges || []) {
      userChallengeMap.set(uc.challenge_id, uc);
    }

    // Merge static definitions with user status
    const challengesWithStatus: ChallengeWithStatus[] = CHALLENGES.map(
      (challenge) => {
        const userRecord = userChallengeMap.get(challenge.id);

        return {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          part: challenge.part,
          partTitle: challenge.partTitle,
          time: challenge.time,
          energy: challenge.energy,
          value: challenge.value,
          whatYouGet: challenge.whatYouGet,
          steps: challenge.steps,
          tips: challenge.tips,
          worksheetPrompts: challenge.worksheetPrompts,
          researchInsight: challenge.researchInsight,
          actionableTip: challenge.actionableTip,
          citation: challenge.citation,
          // User status (default to 'available' if no record)
          userStatus: (userRecord?.status as ChallengeStatus) || 'available',
          startedAt: userRecord?.started_at || null,
          completedAt: userRecord?.completed_at || null,
          declinedAt: userRecord?.declined_at || null,
          data: userRecord?.data || null,
        };
      }
    );

    return NextResponse.json({ data: challengesWithStatus });
  } catch (error) {
    console.error('Unexpected error in GET /api/challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Schema for updating challenge status.
 */
const UpdateChallengeSchema = z.object({
  challengeId: z.number().int().min(1).max(22),
  status: ChallengeStatusSchema,
  data: z.record(z.string(), z.any()).optional(),
});

/**
 * POST /api/challenges
 *
 * Update a user's challenge status (start, complete, decline, etc.)
 * Validates state machine transitions.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const parseResult = UpdateChallengeSchema.safeParse(body);

    if (!parseResult.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { challengeId, status: newStatus, data: challengeData } = parseResult.data;

    // Fetch current user challenge record (if exists)
    const { data: existingRecord, error: fetchError } = await supabase
      .from('user_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .single();

    // Determine current status
    const currentStatus: ChallengeStatus =
      fetchError?.code === 'PGRST116' // No rows returned
        ? 'available'
        : existingRecord?.status || 'available';

    // Validate state transition
    if (!canTransition(currentStatus, newStatus)) {
      return NextResponse.json(
        {
          error: `Invalid transition from '${currentStatus}' to '${newStatus}'`,
        },
        { status: 400 }
      );
    }

    // Special case: declined → offered requires cooldown check
    if (currentStatus === 'declined' && newStatus === 'offered') {
      if (existingRecord?.declined_at && !isCooldownExpired(existingRecord.declined_at)) {
        const daysRemaining = getCooldownDaysRemaining(existingRecord.declined_at);
        return NextResponse.json(
          {
            error: `Must wait ${daysRemaining} more day(s) before re-offering this challenge`,
          },
          { status: 400 }
        );
      }
    }

    // Build update payload
    const now = new Date().toISOString();
    const updatePayload: Record<string, unknown> = {
      user_id: user.id,
      challenge_id: challengeId,
      status: newStatus,
      updated_at: now,
    };

    // Set timestamps based on status
    if (newStatus === 'active' && currentStatus !== 'active') {
      updatePayload.started_at = now;
    }
    if (newStatus === 'completed') {
      updatePayload.completed_at = now;
    }
    if (newStatus === 'declined') {
      updatePayload.declined_at = now;
    }

    // Merge challenge data if provided
    if (challengeData) {
      updatePayload.data = {
        ...(existingRecord?.data || {}),
        ...challengeData,
      };
    }

    // Upsert the record
    const { data: updatedRecord, error: upsertError } = await supabase
      .from('user_challenges')
      .upsert(updatePayload, {
        onConflict: 'user_id,challenge_id',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Failed to update challenge:', upsertError);
      return NextResponse.json(
        { error: 'Failed to update challenge' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updatedRecord });
  } catch (error) {
    console.error('Unexpected error in POST /api/challenges:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
