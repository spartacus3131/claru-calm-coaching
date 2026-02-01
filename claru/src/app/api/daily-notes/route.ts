import { createServerSupabase } from '@/lib/supabase/server';
import { extractPlanFromConversation } from '@/modules/context-store/extraction';
import type { Message } from '@/modules/coaching/types';
import {
  type DailyNoteDraft,
  DailyNoteDraftSchema,
  createDefaultMorningPrompts,
  createDefaultOrganizedTasks,
  createDefaultEndOfDay,
} from '@/modules/context-store/types';
import { NextResponse } from 'next/server';

/**
 * Daily Notes API - F005/F006
 *
 * POST: Save/update daily note (plan extraction from chat OR full draft upsert)
 * GET: Get daily note by date (returns full draft structure)
 * PATCH: Update specific fields (mark complete, add reflection, etc.)
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
    const { messages, date } = body as {
      messages: Array<{ role: string; content: string }>;
      date?: string;
    };

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    const typedMessages: Message[] = messages.map((m, i) => ({
      id: `msg-${i}`,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      createdAt: new Date(),
    }));

    const extracted = extractPlanFromConversation(typedMessages);
    const noteDate = date || new Date().toISOString().split('T')[0];

    // Per technical architecture: daily_notes uses "date" column
    // and stores Top 3 in plan JSONB: {top3: [], adminBatch: [], ...}
    const planData = {
      top3: extracted.top3,
      adminBatch: extracted.adminBatch || [],
    };

    const { data, error } = await supabase
      .from('daily_notes')
      .upsert(
        {
          user_id: user.id,
          date: noteDate,
          state: 'plan_set',
          raw_dump: extracted.rawDump,
          plan: planData,
        },
        {
          onConflict: 'user_id,date',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to save daily note:', error);
      return NextResponse.json(
        { error: 'Failed to save daily note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data, extracted });
  } catch (error) {
    console.error('Daily notes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Converts database row to DailyNoteDraft format for UI.
 */
function dbRowToDraft(row: Record<string, unknown>, date: string): DailyNoteDraft {
  // Handle top3 - database stores array of objects, UI expects simpler format
  const dbTop3 = (row.top3 as Array<{ text: string; completed?: boolean }>) || [];
  const top3 = dbTop3.map(item => ({
    text: item.text || '',
    completed: item.completed ?? false,
  }));
  // Pad to 3 items
  while (top3.length < 3) {
    top3.push({ text: '', completed: false });
  }

  return {
    noteDate: date,
    rawDump: (row.raw_dump as string) || '',
    morningPrompts: (row.morning_prompts as DailyNoteDraft['morningPrompts']) || createDefaultMorningPrompts(),
    top3: top3.slice(0, 3),
    organizedTasks: (row.organized_tasks as DailyNoteDraft['organizedTasks']) || createDefaultOrganizedTasks(),
    endOfDay: (row.end_of_day as DailyNoteDraft['endOfDay']) || createDefaultEndOfDay(),
  };
}

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
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    const format = searchParams.get('format'); // 'draft' for DailyNoteDraft format

    const { data, error } = await supabase
      .from('daily_notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', date)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch daily note:', error);
      return NextResponse.json(
        { error: 'Failed to fetch daily note' },
        { status: 500 }
      );
    }

    // If format=draft requested, convert to DailyNoteDraft format
    if (format === 'draft') {
      const draft = data ? dbRowToDraft(data, date) : null;
      return NextResponse.json({ data: draft });
    }

    return NextResponse.json({ data: data || null });
  } catch (error) {
    console.error('Daily notes API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/daily-notes
 * Update specific fields of a daily note.
 * 
 * Body options:
 * - { date, reflection: { wins, learnings, released } } - Save evening reflection
 * - { date, markComplete: { index: number } } - Mark a Top 3 item complete
 * - { date, top3: [...] } - Update Top 3 items
 * - { date, morning_prompts: {...} } - Update morning prompts (F006)
 * - { date, organized_tasks: {...} } - Update organized tasks (F006)
 * - { date, end_of_day: {...} } - Update end of day (F006)
 */
export async function PATCH(request: Request) {
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
    const { 
      date, 
      reflection, 
      markComplete, 
      top3, 
      raw_dump, 
      admin_batch,
      // F006: New rich fields
      morning_prompts,
      organized_tasks,
      end_of_day,
    } = body;

    const noteDate = date || new Date().toISOString().split('T')[0];

    // Build update object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {};

    if (reflection) {
      updates.wins = reflection.wins || [];
      updates.learnings = reflection.learnings || [];
      updates.released = reflection.released || [];
      updates.state = 'reflection_added';
    }

    if (markComplete !== undefined) {
      // Fetch current top3 to update
      const { data: current } = await supabase
        .from('daily_notes')
        .select('top3')
        .eq('user_id', user.id)
        .eq('date', noteDate)
        .single();

      if (current?.top3) {
        const updatedTop3 = [...(current.top3 as Array<{ text: string; workType: string; completed: boolean; completedAt?: string }>)];
        if (updatedTop3[markComplete.index]) {
          updatedTop3[markComplete.index].completed = true;
          updatedTop3[markComplete.index].completedAt = new Date().toISOString();
        }
        updates.top3 = updatedTop3;
      }
    }

    if (top3 !== undefined) {
      updates.top3 = top3;
    }

    if (raw_dump !== undefined) {
      updates.raw_dump = raw_dump;
    }

    if (admin_batch !== undefined) {
      updates.admin_batch = admin_batch;
    }

    // F006: Handle new rich fields
    if (morning_prompts !== undefined) {
      updates.morning_prompts = morning_prompts;
    }

    if (organized_tasks !== undefined) {
      updates.organized_tasks = organized_tasks;
    }

    if (end_of_day !== undefined) {
      updates.end_of_day = end_of_day;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('daily_notes')
      .update(updates)
      .eq('user_id', user.id)
      .eq('date', noteDate)
      .select()
      .single();

    if (error) {
      console.error('Failed to update daily note:', error);
      return NextResponse.json(
        { error: 'Failed to update daily note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Daily notes PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/daily-notes
 * Full upsert of daily note draft (for useDailyNote hook).
 * Creates or updates the note for the given date.
 */
export async function PUT(request: Request) {
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
    
    // Validate with Zod
    const result = DailyNoteDraftSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid draft format', details: result.error.flatten() },
        { status: 400 }
      );
    }

    const draft = result.data;

    const { data, error } = await supabase
      .from('daily_notes')
      .upsert(
        {
          user_id: user.id,
          date: draft.noteDate,
          raw_dump: draft.rawDump,
          top3: draft.top3,
          morning_prompts: draft.morningPrompts,
          organized_tasks: draft.organizedTasks,
          end_of_day: draft.endOfDay,
          // Set state based on content
          state: draft.top3.some(t => t.text) ? 'plan_set' : 'created',
        },
        {
          onConflict: 'user_id,date',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Failed to upsert daily note:', error);
      return NextResponse.json(
        { error: 'Failed to save daily note' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Daily notes PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
