/**
 * @file route.ts
 * @description Chat Context API - Returns context for contextual welcome messages
 * @module api/chat-context
 *
 * Determines the appropriate chat mode based on:
 * - Time of day (before/after 5pm user's time)
 * - Whether morning check-in was done today
 * - Whether evening check-in was done today
 */

import { createServerSupabase } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export type ChatContextType = 
  | 'morning_checkin'      // Morning, no check-in yet
  | 'need_help'            // Check-in done, before 5pm
  | 'evening_prompt'       // After 5pm, no evening reflection
  | 'all_done';            // Both check-ins done

export interface ChatContextResponse {
  context: ChatContextType;
  morningDone: boolean;
  eveningDone: boolean;
  isAfternoon: boolean;  // After 5pm
  userName?: string;
}

/**
 * GET /api/chat-context
 * Get contextual info for chat welcome message.
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      // For unauthenticated users, default to morning check-in
      return NextResponse.json({
        data: {
          context: 'morning_checkin' as ChatContextType,
          morningDone: false,
          eveningDone: false,
          isAfternoon: false,
        },
      });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentHour = new Date().getHours();
    const isAfternoon = currentHour >= 17; // 5pm or later

    // Check today's engagements
    const { data: engagements } = await supabase
      .from('engagement_records')
      .select('engagement_type')
      .eq('user_id', user.id)
      .eq('date', today);

    const engagementTypes = engagements?.map(e => e.engagement_type) || [];
    const morningDone = engagementTypes.includes('morning_checkin');
    const eveningDone = engagementTypes.includes('evening_checkin');

    // Get user's name for personalization
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('name')
      .eq('user_id', user.id)
      .single();

    // Determine context
    let context: ChatContextType;
    
    if (!morningDone) {
      context = 'morning_checkin';
    } else if (eveningDone) {
      context = 'all_done';
    } else if (isAfternoon) {
      context = 'evening_prompt';
    } else {
      context = 'need_help';
    }

    return NextResponse.json({
      data: {
        context,
        morningDone,
        eveningDone,
        isAfternoon,
        userName: profile?.name || undefined,
      },
    });
  } catch (error) {
    console.error('Chat context API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
