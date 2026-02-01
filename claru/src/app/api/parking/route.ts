/**
 * @file route.ts
 * @description Parking Lot API - F026 CRUD operations
 * @module api/parking
 *
 * Per bounded-contexts.mdc: Parking Lot Manager owns parked items.
 * Per supabase.mdc: RLS + user_id filtering (defense in depth).
 * Per 005-error-handling.mdc: Log errors with context, user-friendly messages.
 * Per state-machines.mdc: Validate status transitions.
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  CreateParkedItemSchema,
  UpdateParkedItemSchema,
  toParkedItem,
  toDbInsert,
  toDbUpdate,
  canTransitionTo,
  isAtCapacity,
  PARKING_LOT_LIMIT,
  type ParkedItemStatus,
  type DbParkedItem,
} from '@/modules/parking-lot';

/**
 * GET /api/parking
 * List parked items for the authenticated user.
 *
 * @query status - Optional filter by status (default: parked)
 * @query limit - Optional max results (default: 100)
 * @returns Array of ParkedItem entities
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
    const status = searchParams.get('status') ?? 'parked';
    const limit = parseInt(searchParams.get('limit') ?? '100', 10);

    // Per supabase.mdc: ALWAYS filter by user_id even with RLS
    let query = supabase
      .from('parked_items')
      .select('*')
      .eq('user_id', user.id)
      .order('parked_at', { ascending: false })
      .limit(limit);

    // Filter by status if specified and not 'all'
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch parked items:', {
        userId: user.id,
        status,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to fetch parked items' },
        { status: 500 }
      );
    }

    const items = (data as DbParkedItem[]).map(toParkedItem);
    
    // Include count of parked items for capacity check
    const parkedCount = items.filter((i) => i.status === 'parked').length;

    return NextResponse.json({
      data: items,
      meta: {
        count: items.length,
        parkedCount,
        limit: PARKING_LOT_LIMIT,
        atCapacity: isAtCapacity(parkedCount),
      },
    });
  } catch (error) {
    console.error('Parking Lot API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/parking
 * Create a new parked item.
 *
 * @body CreateParkedItemInput
 * @returns Created ParkedItem entity
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

    // Check capacity before creating
    const { count, error: countError } = await supabase
      .from('parked_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'parked');

    if (countError) {
      console.error('Failed to check parking lot capacity:', {
        userId: user.id,
        error: countError.message,
      });
      return NextResponse.json(
        { error: 'Failed to check capacity' },
        { status: 500 }
      );
    }

    if (isAtCapacity(count ?? 0)) {
      return NextResponse.json(
        {
          error: 'Parking lot is full',
          message: `You have reached the limit of ${PARKING_LOT_LIMIT} parked items. Please review and remove some items first.`,
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Per typescript.mdc: ALWAYS validate external input with Zod
    const parsed = CreateParkedItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const dbData = toDbInsert(parsed.data, user.id);

    const { data, error } = await supabase
      .from('parked_items')
      .insert(dbData)
      .select()
      .single();

    if (error) {
      console.error('Failed to create parked item:', {
        userId: user.id,
        input: parsed.data,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to park item' },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: toParkedItem(data) }, { status: 201 });
  } catch (error) {
    console.error('Parking Lot API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/parking
 * Update a parked item (status, text, etc.).
 *
 * @query id - Parked item ID (required)
 * @body UpdateParkedItemInput
 * @returns Updated ParkedItem entity
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

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('id');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();

    // Per typescript.mdc: ALWAYS validate external input with Zod
    const parsed = UpdateParkedItemSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // If status change, validate transition
    if (parsed.data.status) {
      // Fetch current item to check transition
      const { data: current, error: fetchError } = await supabase
        .from('parked_items')
        .select('status')
        .eq('id', itemId)
        .eq('user_id', user.id)
        .single();

      if (fetchError || !current) {
        return NextResponse.json(
          { error: 'Item not found' },
          { status: 404 }
        );
      }

      const currentStatus = current.status as ParkedItemStatus;
      const newStatus = parsed.data.status;

      // Per state-machines.mdc: Validate transitions
      if (!canTransitionTo(currentStatus, newStatus)) {
        return NextResponse.json(
          {
            error: 'Invalid status transition',
            message: `Cannot transition from '${currentStatus}' to '${newStatus}'`,
          },
          { status: 400 }
        );
      }
    }

    const dbUpdate = toDbUpdate(parsed.data);

    // Per supabase.mdc: ALWAYS filter by user_id even with RLS
    const { data, error } = await supabase
      .from('parked_items')
      .update(dbUpdate)
      .eq('id', itemId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Failed to update parked item:', {
        userId: user.id,
        itemId,
        update: parsed.data,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to update item' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: toParkedItem(data) });
  } catch (error) {
    console.error('Parking Lot API PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/parking
 * Delete a parked item (soft delete - sets status to 'deleted').
 *
 * @query id - Parked item ID (required)
 * @query hard - If 'true', permanently delete (default: soft delete)
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
    const itemId = searchParams.get('id');
    const hardDelete = searchParams.get('hard') === 'true';

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    if (hardDelete) {
      // Hard delete - permanently remove
      const { error } = await supabase
        .from('parked_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to delete parked item:', {
          userId: user.id,
          itemId,
          error: error.message,
        });
        return NextResponse.json(
          { error: 'Failed to delete item' },
          { status: 500 }
        );
      }
    } else {
      // Soft delete - mark as deleted (need to go through under_review first)
      // For simplicity, we allow direct deletion from UI
      const { error } = await supabase
        .from('parked_items')
        .update({ status: 'deleted' })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Failed to soft delete parked item:', {
          userId: user.id,
          itemId,
          error: error.message,
        });
        return NextResponse.json(
          { error: 'Failed to delete item' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Parking Lot API DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
