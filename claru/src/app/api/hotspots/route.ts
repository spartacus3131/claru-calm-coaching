/**
 * @file route.ts
 * @description Hot Spots API - F027 CRUD operations
 * @module api/hotspots
 *
 * Per bounded-contexts.mdc: Engagement Tracker owns hot spots data.
 * Per supabase.mdc: RLS + user_id filtering (defense in depth).
 * Per 005-error-handling.mdc: Log errors with context, user-friendly messages.
 * Per domain-language.mdc: Use "Hot Spots", "life areas", "weekly check-in".
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  UpsertAreasSchema,
  UpsertRatingsSchema,
  toHotSpotArea,
  toDbArea,
  toRating,
  DEFAULT_HOTSPOT_AREAS,
  type DbHotSpotArea,
  type DbHotSpotRating,
} from '@/modules/hotspots';

/**
 * GET /api/hotspots
 * Fetch hot spot areas and/or ratings for the authenticated user.
 *
 * @query type - 'areas' | 'ratings' | 'both' (default: 'both')
 * @query weekStart - Required for ratings, format: YYYY-MM-DD
 * @returns Hot spot areas and/or ratings
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
    const type = searchParams.get('type') ?? 'both';
    const weekStart = searchParams.get('weekStart');

    const result: {
      areas?: ReturnType<typeof toHotSpotArea>[];
      ratings?: ReturnType<typeof toRating>[];
      lastCheckin?: string;
    } = {};

    // Fetch custom areas if requested
    if (type === 'areas' || type === 'both') {
      const { data: areasData, error: areasError } = await supabase
        .from('hotspot_areas')
        .select('*')
        .eq('user_id', user.id)
        .order('position');

      if (areasError) {
        console.error('Failed to fetch hot spot areas:', {
          userId: user.id,
          error: areasError.message,
        });
        return NextResponse.json(
          { error: 'Failed to fetch hot spot areas' },
          { status: 500 }
        );
      }

      // Use custom areas or defaults
      result.areas =
        (areasData as DbHotSpotArea[]).length > 0
          ? (areasData as DbHotSpotArea[]).map(toHotSpotArea)
          : DEFAULT_HOTSPOT_AREAS;
    }

    // Fetch ratings if requested
    if ((type === 'ratings' || type === 'both') && weekStart) {
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('hotspot_ratings')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', weekStart);

      if (ratingsError) {
        console.error('Failed to fetch hot spot ratings:', {
          userId: user.id,
          weekStart,
          error: ratingsError.message,
        });
        return NextResponse.json(
          { error: 'Failed to fetch hot spot ratings' },
          { status: 500 }
        );
      }

      result.ratings = (ratingsData as DbHotSpotRating[]).map(toRating);

      // Get last check-in date
      if ((ratingsData as DbHotSpotRating[]).length > 0) {
        result.lastCheckin = (ratingsData as DbHotSpotRating[])[0].updated_at;
      }
    }

    return NextResponse.json({ data: result });
  } catch (error) {
    console.error('Hot Spots API GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/hotspots/areas
 * Upsert custom hot spot areas.
 *
 * @body UpsertAreasInput
 * @returns Success message
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
    const parsed = UpsertAreasSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { areas } = parsed.data;

    // Convert to database format
    const dbAreas = areas.map((area, index) => toDbArea(area, user.id, index));

    // Upsert areas
    const { error } = await supabase
      .from('hotspot_areas')
      .upsert(dbAreas, { onConflict: 'user_id,area_id' });

    if (error) {
      console.error('Failed to upsert hot spot areas:', {
        userId: user.id,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to save hot spot areas' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hot Spots API POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/hotspots
 * Upsert weekly ratings (check-in).
 *
 * @body UpsertRatingsInput
 * @returns Success message with summary
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

    // Per typescript.mdc: ALWAYS validate external input with Zod
    const parsed = UpsertRatingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { weekStart, ratings } = parsed.data;

    // Convert to database format
    const dbRatings = ratings.map((r) => ({
      user_id: user.id,
      week_start: weekStart,
      area: r.area,
      rating: r.rating,
      notes: r.notes ?? null,
    }));

    // Upsert ratings
    const { error } = await supabase
      .from('hotspot_ratings')
      .upsert(dbRatings, { onConflict: 'user_id,week_start,area' });

    if (error) {
      console.error('Failed to upsert hot spot ratings:', {
        userId: user.id,
        weekStart,
        error: error.message,
      });
      return NextResponse.json(
        { error: 'Failed to save weekly check-in' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Hot Spots API PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
