/**
 * @file primeTimeChallenge.ts
 * @description F023 - Full implementation of Challenge 4 (Prime Time Foundation)
 * @module challenges
 *
 * The Prime Time Foundation helps users discover their Biological Prime Time (BPT),
 * the hours when their energy is naturally highest. This module handles:
 * - Storing energy log entries over time
 * - Calculating BPT peaks from collected data
 * - Providing BPT context to the coaching engine
 * - Tracking progress through the ~1 week challenge
 *
 * Challenge Steps:
 * 1. Prep: Cut out caffeine, alcohol, sugar for accurate tracking
 * 2. Log: Every hour, note energy level (1-10), activity, procrastination
 * 3. Analyze: After a week, identify Biological Prime Time
 *
 * Per domain-language.mdc: Use "Prime Time Foundation", "Biological Prime Time", "BPT".
 * Per bounded-contexts.mdc: Challenge Engine owns this data.
 */

import { z } from 'zod';

/**
 * The Prime Time Foundation challenge ID.
 */
export const PRIME_TIME_CHALLENGE_ID = 4;

/**
 * Minimum number of energy logs required for meaningful BPT calculation.
 * Ideally ~8 logs/day for 3-7 days = 24-56 logs.
 * We set a lower bar to allow partial analysis.
 */
export const MINIMUM_LOGS_FOR_BPT = 8;

/**
 * Time periods for BPT analysis.
 */
const TIME_PERIODS = {
  morning: { start: 6, end: 11 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 18, end: 23 },
} as const;

/**
 * Schema for a single energy log entry.
 *
 * @property timestamp - ISO timestamp when logged
 * @property hour - Hour of day (0-23)
 * @property energyLevel - Self-reported energy (1-10)
 * @property activity - What the user was doing (optional)
 * @property procrastinationMinutes - Minutes spent procrastinating (optional)
 */
export const EnergyLogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  hour: z.number().int().min(0).max(23),
  energyLevel: z.number().int().min(1).max(10),
  activity: z.string().max(200).optional(),
  procrastinationMinutes: z.number().int().min(0).max(60).optional(),
});

export type EnergyLogEntry = z.infer<typeof EnergyLogEntrySchema>;

/**
 * Schema for a peak energy period.
 *
 * @property hour - Hour with highest average energy
 * @property averageEnergy - Average energy level at that hour
 */
export const PeakSchema = z.object({
  hour: z.number().int().min(0).max(23),
  averageEnergy: z.number().min(1).max(10),
});

export type Peak = z.infer<typeof PeakSchema>;

/**
 * Schema for calculated BPT peaks.
 *
 * @property morningPeak - Peak hour in morning (6-11), null if no data
 * @property afternoonPeak - Peak hour in afternoon (12-17), null if no data
 * @property eveningPeak - Peak hour in evening (18-23), null if no data
 * @property overallPeak - Hour with highest energy across all data
 */
export const BPTPeaksSchema = z.object({
  morningPeak: PeakSchema.nullable(),
  afternoonPeak: PeakSchema.nullable(),
  eveningPeak: PeakSchema.nullable(),
  overallPeak: PeakSchema,
});

export type BPTPeaks = z.infer<typeof BPTPeaksSchema>;

/**
 * Schema for storing Prime Time Foundation outcomes.
 *
 * @property energyLogs - Array of energy log entries
 * @property bptPeaks - Calculated BPT peaks (after analysis)
 * @property prepCompleted - Whether user completed prep step
 * @property loggingStartedAt - When user started logging
 * @property stepsCompleted - Which steps (1-3) they've completed
 * @property completedAt - When they finished the challenge
 */
export const PrimeTimeDataSchema = z.object({
  energyLogs: z.array(EnergyLogEntrySchema).default([]),
  bptPeaks: BPTPeaksSchema.optional(),
  prepCompleted: z.boolean().default(false),
  loggingStartedAt: z.string().datetime().optional(),
  stepsCompleted: z
    .array(z.number().int().min(1).max(3))
    .default([]),
  completedAt: z.string().datetime().optional(),
});

export type PrimeTimeData = z.infer<typeof PrimeTimeDataSchema>;

/**
 * Validates and parses Prime Time Foundation data.
 *
 * @param data - Raw data to validate
 * @returns Parsed PrimeTimeData or null if invalid
 */
export function parsePrimeTimeData(data: unknown): PrimeTimeData | null {
  const result = PrimeTimeDataSchema.safeParse(data);
  if (!result.success) {
    return null;
  }
  return result.data;
}

/**
 * Adds a new energy log entry to the challenge data.
 *
 * @param entry - New energy log entry
 * @param existing - Existing prime time data to merge with
 * @returns Updated PrimeTimeData
 */
export function addEnergyLog(
  entry: EnergyLogEntry,
  existing?: Partial<PrimeTimeData>
): Partial<PrimeTimeData> {
  const updated: Partial<PrimeTimeData> = {
    ...existing,
    energyLogs: [...(existing?.energyLogs ?? []), entry],
    stepsCompleted: [...(existing?.stepsCompleted ?? [])],
  };

  // Set loggingStartedAt on first log
  if (!updated.loggingStartedAt) {
    updated.loggingStartedAt = entry.timestamp;
  }

  // Mark step 2 as started when first log is added
  if (!updated.stepsCompleted!.includes(2)) {
    updated.stepsCompleted!.push(2);
  }

  return updated;
}

/**
 * Calculates Biological Prime Time from energy logs.
 * Groups logs by hour and finds peaks for each time period.
 *
 * @param logs - Array of energy log entries
 * @returns BPTPeaks or null if insufficient data
 */
export function calculateBPT(logs: EnergyLogEntry[]): BPTPeaks | null {
  if (logs.length < MINIMUM_LOGS_FOR_BPT) {
    return null;
  }

  // Group logs by hour and calculate averages
  const hourlyData: Map<number, number[]> = new Map();
  for (const log of logs) {
    const existing = hourlyData.get(log.hour) ?? [];
    existing.push(log.energyLevel);
    hourlyData.set(log.hour, existing);
  }

  // Calculate average energy for each hour
  const hourlyAverages: Map<number, number> = new Map();
  for (const [hour, levels] of hourlyData) {
    const avg = levels.reduce((a, b) => a + b, 0) / levels.length;
    hourlyAverages.set(hour, avg);
  }

  // Find peak for each time period
  const findPeakInRange = (start: number, end: number): Peak | null => {
    let bestHour: number | null = null;
    let bestAvg = 0;

    for (const [hour, avg] of hourlyAverages) {
      if (hour >= start && hour <= end && avg > bestAvg) {
        bestHour = hour;
        bestAvg = avg;
      }
    }

    if (bestHour === null) {
      return null;
    }

    return { hour: bestHour, averageEnergy: bestAvg };
  };

  // Find overall peak
  let overallBestHour = 0;
  let overallBestAvg = 0;
  for (const [hour, avg] of hourlyAverages) {
    if (avg > overallBestAvg) {
      overallBestHour = hour;
      overallBestAvg = avg;
    }
  }

  return {
    morningPeak: findPeakInRange(TIME_PERIODS.morning.start, TIME_PERIODS.morning.end),
    afternoonPeak: findPeakInRange(TIME_PERIODS.afternoon.start, TIME_PERIODS.afternoon.end),
    eveningPeak: findPeakInRange(TIME_PERIODS.evening.start, TIME_PERIODS.evening.end),
    overallPeak: { hour: overallBestHour, averageEnergy: overallBestAvg },
  };
}

/**
 * Formats hour number as readable time string.
 *
 * @param hour - Hour (0-23)
 * @returns Formatted time string (e.g., "10am", "2pm")
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

/**
 * Formats user's BPT data for inclusion in a coaching system prompt.
 *
 * @param data - PrimeTimeData with user's BPT analysis
 * @returns Formatted string for system prompt
 */
export function formatPrimeTimeForPrompt(data: PrimeTimeData): string {
  if (!data.bptPeaks) {
    return 'The user has not yet completed their Biological Prime Time analysis.';
  }

  const { morningPeak, afternoonPeak, eveningPeak, overallPeak } = data.bptPeaks;

  const peakParts: string[] = [];

  if (morningPeak) {
    peakParts.push(`morning peak at ${formatHour(morningPeak.hour)} (avg ${morningPeak.averageEnergy.toFixed(1)}/10)`);
  }
  if (afternoonPeak) {
    peakParts.push(`afternoon peak at ${formatHour(afternoonPeak.hour)} (avg ${afternoonPeak.averageEnergy.toFixed(1)}/10)`);
  }
  if (eveningPeak) {
    peakParts.push(`evening peak at ${formatHour(eveningPeak.hour)} (avg ${eveningPeak.averageEnergy.toFixed(1)}/10)`);
  }

  const peaksText = peakParts.length > 0
    ? `Time-specific peaks: ${peakParts.join(', ')}.`
    : '';

  return `The user has discovered their Biological Prime Time (BPT).

Overall peak energy: ${formatHour(overallPeak.hour)} with average energy ${overallPeak.averageEnergy.toFixed(1)}/10.
${peaksText}

When setting their Top 3 or scheduling high-impact work, suggest they protect their BPT hours (around ${formatHour(overallPeak.hour)}) for their most important tasks.
This aligns with their natural energy patterns for maximum productivity.`;
}

/**
 * Checks if the user has completed all 3 steps of the Prime Time Foundation.
 *
 * @param data - PrimeTimeData to check
 * @returns True if all steps completed
 */
export function isPrimeTimeComplete(data: Partial<PrimeTimeData>): boolean {
  const steps = data.stepsCompleted ?? [];
  return steps.includes(1) && steps.includes(2) && steps.includes(3);
}

/**
 * Gets the next incomplete step for the Prime Time Foundation.
 *
 * @param data - Current PrimeTimeData
 * @returns Next step number (1, 2, or 3) or null if complete
 */
export function getNextPrimeTimeStep(
  data: Partial<PrimeTimeData>
): 1 | 2 | 3 | null {
  const steps = data.stepsCompleted ?? [];
  if (!steps.includes(1)) return 1;
  if (!steps.includes(2)) return 2;
  if (!steps.includes(3)) return 3;
  return null;
}

/**
 * Progress tracking for the logging phase.
 */
export interface LoggingProgress {
  totalLogs: number;
  uniqueDays: number;
  percentComplete: number;
  readyForAnalysis: boolean;
}

/**
 * Gets progress through the energy logging phase.
 *
 * @param data - Current PrimeTimeData
 * @returns Progress metrics
 */
export function getLoggingProgress(data: Partial<PrimeTimeData>): LoggingProgress {
  const logs = data.energyLogs ?? [];
  const totalLogs = logs.length;

  // Count unique days
  const uniqueDates = new Set(
    logs.map((log) => log.timestamp.split('T')[0])
  );
  const uniqueDays = uniqueDates.size;

  // Calculate percent complete based on minimum logs
  const percentComplete = Math.min(100, Math.round((totalLogs / MINIMUM_LOGS_FOR_BPT) * 100));

  // Ready for analysis if we have minimum logs
  const readyForAnalysis = totalLogs >= MINIMUM_LOGS_FOR_BPT;

  return {
    totalLogs,
    uniqueDays,
    percentComplete,
    readyForAnalysis,
  };
}

/**
 * Gets step instructions for the Prime Time Foundation.
 */
export const PRIME_TIME_STEP_INSTRUCTIONS: Record<1 | 2 | 3, string> = {
  1: 'Cut out caffeine, alcohol, sugar, and other stimulants if possible for accurate tracking. This helps you get an honest read on your natural energy patterns.',
  2: "Every hour, note: what time it is, your energy level (1-10), what you're doing, and how many minutes you procrastinated. Track for 3-7 days.",
  3: "After tracking, analyze your logs to identify your Biological Prime Time, when your energy is naturally highest. This is when you should schedule your most important work.",
};
