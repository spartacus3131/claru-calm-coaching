/**
 * @file tokenTracking.ts
 * @description AI token usage tracking and cost calculation.
 * @module coaching
 * 
 * Per ai-claude.mdc: ALWAYS log AI usage for cost monitoring.
 */

/**
 * Token usage data from an AI request.
 */
export interface TokenUsage {
  tokensIn: number;
  tokensOut: number;
}

/**
 * Full usage log entry for database storage.
 */
export interface UsageLogEntry {
  userId: string;
  sessionId?: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  latencyMs: number;
  createdAt: Date;
}

/**
 * Claude Sonnet pricing (as of January 2026).
 * Per ai-claude.mdc: $3/M input, $15/M output.
 */
const PRICING = {
  INPUT_COST_PER_MILLION: 3.0,
  OUTPUT_COST_PER_MILLION: 15.0,
} as const;

/**
 * Daily cost limit per user.
 * Per ai-claude.mdc: $5/day max.
 */
export const MAX_DAILY_COST_USD = 5.0;

/**
 * Calculates the cost of an AI request in USD.
 * 
 * @param usage - Token counts for input and output
 * @returns Cost in USD
 * 
 * @example
 * const cost = calculateCost({ tokensIn: 3000, tokensOut: 700 });
 * // Returns ~$0.0195
 */
export function calculateCost(usage: TokenUsage): number {
  const inputCost = (usage.tokensIn / 1_000_000) * PRICING.INPUT_COST_PER_MILLION;
  const outputCost = (usage.tokensOut / 1_000_000) * PRICING.OUTPUT_COST_PER_MILLION;
  return inputCost + outputCost;
}

/**
 * Creates a usage log entry for database storage.
 * 
 * @param params - Usage parameters
 * @returns Formatted log entry
 */
export function createUsageLogEntry(params: {
  userId: string;
  sessionId?: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
}): UsageLogEntry {
  return {
    userId: params.userId,
    sessionId: params.sessionId,
    model: 'claude-sonnet-4-5-20250514',
    tokensIn: params.tokensIn,
    tokensOut: params.tokensOut,
    costUsd: calculateCost({ tokensIn: params.tokensIn, tokensOut: params.tokensOut }),
    latencyMs: params.latencyMs,
    createdAt: new Date(),
  };
}

/**
 * Checks if a user has exceeded their daily cost limit.
 * 
 * @param totalDailyCost - Total cost spent today
 * @returns True if user should be rate limited
 */
export function isOverDailyLimit(totalDailyCost: number): boolean {
  return totalDailyCost >= MAX_DAILY_COST_USD;
}

/**
 * Gets the percentage of daily budget used.
 * 
 * @param totalDailyCost - Total cost spent today
 * @returns Percentage (0-100+)
 */
export function getDailyBudgetPercentage(totalDailyCost: number): number {
  return (totalDailyCost / MAX_DAILY_COST_USD) * 100;
}

/**
 * Warning thresholds for budget alerts.
 */
export const BUDGET_THRESHOLDS = {
  WARNING: 80, // Show warning at 80%
  CRITICAL: 95, // Show critical warning at 95%
} as const;
