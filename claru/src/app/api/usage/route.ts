/**
 * @file route.ts
 * @description AI Usage API - F010/F011 Token tracking and rate limiting
 * @module api/usage
 * 
 * GET: Get today's usage and budget status
 * POST: Log a new usage entry
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import {
  calculateCost,
  MAX_DAILY_COST_USD,
  getDailyBudgetPercentage,
  isOverDailyLimit,
  BUDGET_THRESHOLDS,
} from '@/modules/coaching/tokenTracking';

/**
 * GET /api/usage
 * Returns today's usage summary and budget status.
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

    // Get today's date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Sum today's costs
    const { data, error } = await supabase
      .from('ai_usage_logs')
      .select('cost_usd')
      .eq('user_id', user.id)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString());

    if (error) {
      console.error('Failed to fetch usage:', error);
      return NextResponse.json({ error: 'Failed to fetch usage' }, { status: 500 });
    }

    const totalCost = data?.reduce((sum, row) => sum + Number(row.cost_usd), 0) ?? 0;
    const percentUsed = getDailyBudgetPercentage(totalCost);
    const isLimited = isOverDailyLimit(totalCost);

    return NextResponse.json({
      totalCostUsd: totalCost,
      budgetUsd: MAX_DAILY_COST_USD,
      percentUsed,
      isLimited,
      showWarning: percentUsed >= BUDGET_THRESHOLDS.WARNING,
      showCritical: percentUsed >= BUDGET_THRESHOLDS.CRITICAL,
      requestsToday: data?.length ?? 0,
    });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/usage
 * Log a new AI usage entry.
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
    const { tokensIn, tokensOut, latencyMs, sessionId } = body as {
      tokensIn: number;
      tokensOut: number;
      latencyMs: number;
      sessionId?: string;
    };

    if (typeof tokensIn !== 'number' || typeof tokensOut !== 'number') {
      return NextResponse.json({ error: 'Invalid token counts' }, { status: 400 });
    }

    const costUsd = calculateCost({ tokensIn, tokensOut });

    const { data, error } = await supabase
      .from('ai_usage_logs')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        tokens_in: tokensIn,
        tokens_out: tokensOut,
        cost_usd: costUsd,
        latency_ms: latencyMs || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to log usage:', error);
      return NextResponse.json({ error: 'Failed to log usage' }, { status: 500 });
    }

    return NextResponse.json({ data, costUsd });
  } catch (error) {
    console.error('Usage API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
