import { streamText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { createServerSupabase } from '@/lib/supabase/server';
import { buildSystemPrompt, type ActiveChallengeContext } from '@/modules/coaching/systemPrompt';
import { buildChallengeIntroPrompt } from '@/modules/coaching/challengeIntroPrompts';
import { TURN_LIMITS, type SessionFlow } from '@/modules/coaching/types';
import { getCarryoverItems, formatParkedItemsForPrompt } from '@/modules/context-store/carryover';
import { calculateCost, MAX_DAILY_COST_USD } from '@/modules/coaching/tokenTracking';
import { getChallengeById } from '@/modules/challenges/data';
import { VALUES_CHALLENGE_ID, parseValuesData, type ValuesData } from '@/modules/challenges/valuesChallenge';
import { getFallbackResponse, inferPhaseFromContext } from '@/modules/coaching/fallbacks';
import { withRetry, isRetryableError } from '@/modules/coaching/retry';
import type { DailyNote } from '@/modules/context-store/types';

/**
 * Chat API Route - F003 Morning Check-In + F009 Carryover + F010/F011 Rate Limiting + F030 Fallbacks
 *
 * Handles AI coaching conversations with streaming responses.
 *
 * Per ai-claude.mdc:
 * - Use Claude 4.5 Sonnet
 * - Use Vercel AI SDK streamText
 * - Include fallback responses (F030)
 * - ALWAYS log AI usage for cost monitoring
 * - Check cost limits before AI calls
 * - Retry transient failures with exponential backoff
 *
 * Per nextjs-app-router.mdc:
 * - Use Node.js runtime for AI routes (need longer execution)
 */
export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * Request body shape.
 */
interface ChatRequest {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  flow?: SessionFlow;
  /** Challenge ID for challenge_intro flow (F019) */
  challengeId?: number;
}

/**
 * Gets yesterday's date in YYYY-MM-DD format.
 */
function getYesterdayDate(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
}

/**
 * Gets today's date in YYYY-MM-DD format.
 */
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

export async function POST(request: Request) {
  const startTime = Date.now();
  
  try {
    // Authenticate user (per supabase.mdc: ALWAYS get user from server-side)
    // F029: Allow unauthenticated requests for Try Mode
    const supabase = await createServerSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // User may be null in Try Mode - that's OK
    const isAuthenticated = !!user;

    // F011: Check rate limit before processing (only for authenticated users)
    if (isAuthenticated && user) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { data: usageLogs } = await supabase
        .from('ai_usage_logs')
        .select('cost_usd')
        .eq('user_id', user.id)
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      const totalDailyCost = usageLogs?.reduce((sum, row) => sum + Number(row.cost_usd), 0) ?? 0;

      if (totalDailyCost >= MAX_DAILY_COST_USD) {
        // F030: Return fallback response when rate limited
        return Response.json(
          {
            error: 'Daily usage limit reached',
            message: "You've reached your daily AI usage limit. It resets at midnight.",
            fallback: getFallbackResponse('morning', 'default'),
          },
          { status: 429 }
        );
      }
    }

    // Parse request
    const body: ChatRequest = await request.json();
    const { messages, flow = 'morning', challengeId } = body;

    if (!messages || !Array.isArray(messages)) {
      return Response.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // F019: Validate challengeId for challenge_intro flow
    if (flow === 'challenge_intro') {
      if (!challengeId || challengeId < 1 || challengeId > 22) {
        return Response.json(
          { error: 'Valid challengeId (1-22) required for challenge_intro flow' },
          { status: 400 }
        );
      }
    }

    // F009: Load context for morning check-in
    // F015: Load active projects for AI context
    // F020: Load active challenge for nudges
    // F029: Skip user context for Try Mode (unauthenticated)
    let carryoverItems: string[] = [];
    let yesterdayPlan: string | undefined;
    let parkedItemsContext: string | undefined;
    let activeProjectsContext: string[] | undefined;
    let activeChallengeContext: ActiveChallengeContext | undefined;
    let completedValuesData: ValuesData | undefined;

    // Only load user-specific context for authenticated users
    if (isAuthenticated && user && (flow === 'morning' || flow === 'evening')) {
      const yesterday = getYesterdayDate();
      const today = getTodayDate();

      // Per supabase.mdc: Always filter by user_id even with RLS
      const { data: yesterdayNote } = await supabase
        .from('daily_notes')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', yesterday)
        .single();

      if (yesterdayNote) {
        // Calculate carryover from incomplete Top 3
        const carryover = getCarryoverItems({
          yesterdayNote: yesterdayNote as DailyNote,
          today,
        });
        
        if (carryover.length > 0) {
          carryoverItems = carryover.map((item) => item.text);
        }

        // Format yesterday's plan for context
        if (yesterdayNote.plan?.top3) {
          yesterdayPlan = yesterdayNote.plan.top3
            .map((item: { text: string; completed: boolean }) => 
              `- ${item.text} ${item.completed ? '✓' : '○'}`
            )
            .join('\n');
        }
      }

      // Load parking lot items
      const { data: parkedItems } = await supabase
        .from('parked_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'parked')
        .order('created_at', { ascending: false })
        .limit(10);

      if (parkedItems && parkedItems.length > 0) {
        parkedItemsContext = formatParkedItemsForPrompt(
          parkedItems.map((item: Record<string, unknown>) => ({
            id: item.id as string,
            userId: item.user_id as string,
            text: item.text as string,
            reason: item.reason as string | undefined,
            status: item.status as 'parked',
            createdAt: new Date(item.created_at as string),
            updatedAt: new Date(item.updated_at as string),
          }))
        );
      }

      // F015: Load active projects for context
      const { data: projects } = await supabase
        .from('projects')
        .select('name, description')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);

      if (projects && projects.length > 0) {
        activeProjectsContext = projects.map((p) =>
          p.description ? `${p.name}: ${p.description}` : p.name
        );
      }

      // F020: Load active challenge for nudges
      const { data: activeChallenge } = await supabase
        .from('user_challenges')
        .select('challenge_id, started_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('started_at', { ascending: false })
        .limit(1)
        .single();

      if (activeChallenge && activeChallenge.challenge_id) {
        const challengeDef = getChallengeById(activeChallenge.challenge_id);
        if (challengeDef) {
          // Calculate days since started
          const startedAt = new Date(activeChallenge.started_at);
          const now = new Date();
          const daysSinceStarted = Math.floor(
            (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60 * 24)
          );

          activeChallengeContext = {
            challenge: challengeDef,
            daysSinceStarted,
          };
        }
      }

      // F021: Load completed Values Foundation data for coaching context
      const { data: completedValuesChallenge } = await supabase
        .from('user_challenges')
        .select('data')
        .eq('user_id', user.id)
        .eq('challenge_id', VALUES_CHALLENGE_ID)
        .eq('status', 'completed')
        .single();

      if (completedValuesChallenge?.data) {
        const parsedValues = parseValuesData(completedValuesChallenge.data);
        if (parsedValues) {
          completedValuesData = parsedValues;
        }
      }
    }

    // Build system prompt based on flow type
    // F029: Use "there" as username for Try Mode
    const userName = user?.email?.split('@')[0] ?? 'there';
    let systemPrompt: string;

    if (flow === 'challenge_intro' && challengeId) {
      // F019: Challenge Introduction Flow
      const challenge = getChallengeById(challengeId);
      if (!challenge) {
        return Response.json(
          { error: `Challenge ${challengeId} not found` },
          { status: 404 }
        );
      }

      // Check if this is user's first challenge (count completed challenges)
      // F029: For Try Mode, assume it's their first challenge
      let isFirstChallenge = true;
      if (isAuthenticated && user) {
        const { data: completedChallenges } = await supabase
          .from('user_challenges')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'completed');

        isFirstChallenge = !completedChallenges || completedChallenges.length === 0;
      }

      systemPrompt = buildChallengeIntroPrompt({
        userName,
        challenge,
        isFirstChallenge,
      });
    } else {
      // Standard morning/evening flow with user context
      // F015: includes active projects
      // F020: includes active challenge for nudges
      // F021: includes completed Values Foundation
      // F029: No user context for Try Mode
      systemPrompt = buildSystemPrompt({
        userName,
        flow,
        turnNumber: messages.filter((m) => m.role === 'user').length,
        maxTurns: TURN_LIMITS[flow],
        yesterdayPlan,
        carryover: carryoverItems.length > 0 ? carryoverItems : undefined,
        parkedItems: parkedItemsContext,
        activeProjects: activeProjectsContext,
        activeChallenge: activeChallengeContext,
        completedValues: completedValuesData,
      });
    }

    // Stream AI response with retry logic for transient failures
    // Per ai-claude.mdc: Use Claude 4.5 Sonnet for coaching
    // F030: Wrap with retry for connection/initialization errors
    const result = await withRetry(
      async () => {
        return streamText({
          model: anthropic('claude-sonnet-4-20250514'),
          system: systemPrompt,
          messages,
          maxOutputTokens: 1024,
          onFinish: async ({ usage }) => {
            // F010: Log usage after stream completes
            // F029: Skip logging for Try Mode (no user to associate with)
            if (!isAuthenticated || !user) return;

            const latencyMs = Date.now() - startTime;
            const tokensIn = usage?.inputTokens ?? 0;
            const tokensOut = usage?.outputTokens ?? 0;

            if (tokensIn > 0 || tokensOut > 0) {
              const costUsd = calculateCost({ tokensIn, tokensOut });

              // Log usage (fire and forget - don't block response)
              supabase
                .from('ai_usage_logs')
                .insert({
                  user_id: user.id,
                  tokens_in: tokensIn,
                  tokens_out: tokensOut,
                  cost_usd: costUsd,
                  latency_ms: latencyMs,
                })
                .then(({ error }) => {
                  if (error) {
                    console.error('Failed to log AI usage:', error);
                  }
                });
            }
          },
        });
      },
      {
        maxRetries: 2,
        baseDelayMs: 500,
        maxDelayMs: 2000,
        onRetry: (error, attempt) => {
          console.warn(`AI call retry attempt ${attempt}:`, error.message);
        },
      }
    );

    // Return streaming response
    return result.toTextStreamResponse();
  } catch (error) {
    console.error('Chat API error:', error);

    // F030: Use phase-aware fallback responses on error
    // Per ai-claude.mdc: Always have fallback responses for API failures
    // Determine flow from error context if possible, default to morning
    const fallbackFlow: SessionFlow = 'morning';
    const fallbackPhase = inferPhaseFromContext(0, fallbackFlow);

    return Response.json(
      {
        error: 'AI service unavailable',
        fallback: getFallbackResponse(fallbackFlow, fallbackPhase),
        retryable: error instanceof Error && isRetryableError(error),
      },
      { status: 503 }
    );
  }
}
