/**
 * @file route.ts
 * @description F029 Try Mode - Chat Message Migration API
 * @module api/chat/migrate
 *
 * Handles migration of trial messages to authenticated user's database.
 * Called after successful signup to preserve trial conversation.
 *
 * Per bounded-contexts.mdc: User Context Store owns chat messages.
 * Per supabase.mdc: Always authenticate and filter by user_id.
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * Trial message from localStorage.
 */
interface TrialMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

/**
 * Request body shape.
 */
interface MigrateRequest {
  messages: TrialMessage[];
}

/**
 * POST /api/chat/migrate
 *
 * Migrates trial messages to the authenticated user's database.
 *
 * @returns { success: boolean, migratedCount: number, error?: string }
 */
export async function POST(request: Request) {
  try {
    // Per supabase.mdc: Always authenticate server-side
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false, migratedCount: 0 },
        { status: 401 }
      );
    }

    // Parse and validate request
    const body: MigrateRequest = await request.json();
    const { messages } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required', success: false, migratedCount: 0 },
        { status: 400 }
      );
    }

    // Fast path: no messages to migrate
    if (messages.length === 0) {
      return NextResponse.json({ success: true, migratedCount: 0 });
    }

    // Validate and transform messages for database insert
    const validMessages = messages.filter(
      (m) =>
        m.id &&
        typeof m.id === 'string' &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        typeof m.createdAt === 'string'
    );

    if (validMessages.length === 0) {
      return NextResponse.json({ success: true, migratedCount: 0 });
    }

    // Transform to database format
    const dbMessages = validMessages.map((m) => ({
      user_id: user.id,
      role: m.role,
      content: m.content,
      created_at: m.createdAt,
      // Mark as migrated from trial
      metadata: { source: 'trial_migration', original_id: m.id },
    }));

    // Insert messages into database
    // Per supabase.mdc: Use batch insert for efficiency
    const { error: insertError } = await supabase
      .from('chat_messages')
      .insert(dbMessages);

    if (insertError) {
      console.error('Failed to migrate messages:', insertError);
      return NextResponse.json(
        { error: 'Failed to save messages', success: false, migratedCount: 0 },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      migratedCount: validMessages.length,
    });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Migration failed',
        success: false,
        migratedCount: 0,
      },
      { status: 500 }
    );
  }
}
