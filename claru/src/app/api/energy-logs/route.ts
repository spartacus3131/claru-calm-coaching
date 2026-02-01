/**
 * @file route.ts
 * @description Energy Logs API - F024 CRUD operations
 * @module api/energy-logs
 *
 * Per bounded-contexts.mdc: Energy logging belongs to Engagement Tracker
 * Per supabase.mdc: RLS + user_id filtering (defense in depth)
 * Per 005-error-handling.mdc: Log errors with context, user-friendly messages
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  CreateEnergyLogSchema,
  toEnergyLog,
  toDbInsert,
} from '@/modules/engagement/energyLogs';

/**
 * GET /api/energy-logs
 * List energy logs for the authenticated user.
 *
 * @query days - Optional: limit to last N days (default: 7)
 * @query limit - Optional: max results (default: 100)
 * @returns Array of EnergyLog entities
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
    const days = parseInt(searchParams.get('days') ?? '7', 10);
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);

    // Calculate cutoff date
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    // Per supabase.mdc: ALWAYS filter by user_id even with RLS
    const { data, error } = await supabase
      .from('energy_logs')
      .select('*')
      .eq('user_id', user.id)
      .gte('logged_at', cutoff.toISOString())
      .order('logged_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch energy logs:', {
        userId: user.id,
        days,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to fetch energy logs' },
        { status: 500 }
      );
    }

    const logs = data.map(toEnergyLog);
    return NextResponse.json({ data: logs });
  } catch (error) {
    console.error('Energy Logs API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/energy-logs
 * Create a new energy log entry.
 *
 * @body CreateEnergyLogInput
 * @returns Created EnergyLog entity
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
    const parsed = CreateEnergyLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dbData = toDbInsert(parsed.data, user.id);

    const { data, error } = await supabase
      .from('energy_logs')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create energy log:', {
        userId: user.id,
        input: parsed.data,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to create energy log' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: toEnergyLog(data) }, { status: 201 });
  } catch (error) {
    console.error('Energy Logs API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/energy-logs
 * Delete an energy log entry.
 *
 * @query id - Energy log ID (required)
 * @returns Success message
 */
export async function DELETE(request: Request) {
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
    const logId = searchParams.get('id');

    if (!logId) {
      return NextResponse.json(
        { error: 'Log ID is required' },
        { status: 400 }
      );
    }

    // Per supabase.mdc: ALWAYS filter by user_id even with RLS
    const { error } = await supabase
      .from('energy_logs')
      .delete()
      .eq('id', logId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Failed to delete energy log:', {
        userId: user.id,
        logId,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to delete energy log' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Energy Logs API DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
