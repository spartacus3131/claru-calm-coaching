/**
 * @file bptAnalysis.ts
 * @description F025 - BPT (Biological Prime Time) Analysis
 * @module insights
 *
 * Calculates a user's Biological Prime Time from their energy log data.
 * BPT represents the hours when a user's energy is naturally highest,
 * helping them schedule high-impact work during peak productivity periods.
 *
 * Per bounded-contexts.mdc: Insights Engine reads from Engagement Tracker (energy_logs).
 * Per domain-language.mdc: Use "Biological Prime Time", "BPT", "energy level".
 */

import { z } from 'zod';

/**
 * Minimum number of energy logs required for meaningful BPT analysis.
 * Ideally ~8 logs/day for 3-7 days = 24-56 logs.
 * We set a lower bar (8) to allow early partial analysis while
 * encouraging more data collection for accuracy.
 */
export const MINIMUM_LOGS_FOR_ANALYSIS = 8;

/**
 * Time periods for BPT analysis.
 * Divides the day into morning, afternoon, and evening segments.
 */
export const TIME_PERIODS = {
  morning: { start: 6, end: 11 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 18, end: 23 },
} as const;

export type TimePeriod = keyof typeof TIME_PERIODS;

/**
 * Minimal energy log data needed for analysis.
 * Subset of full EnergyLog to decouple from database schema.
 */
export interface EnergyLogForAnalysis {
  loggedAt: string;
  hour: number;
  energyLevel: number;
}

/**
 * Schema for hourly average energy.
 *
 * @property hour - Hour of day (0-23)
 * @property averageEnergy - Average energy level at that hour (1-10)
 * @property sampleCount - Number of logs contributing to this average
 */
export const HourlyAverageSchema = z.object({
  hour: z.number().int().min(0).max(23),
  averageEnergy: z.number().min(1).max(10),
  sampleCount: z.number().int().min(1),
});

export type HourlyAverage = z.infer<typeof HourlyAverageSchema>;

/**
 * Schema for a peak energy period.
 *
 * @property period - Which time period (morning/afternoon/evening)
 * @property peakHour - Hour with highest average energy in period
 * @property averageEnergy - Average energy level at peak hour
 * @property sampleCount - Number of logs at peak hour
 */
export const TimePeriodPeakSchema = z.object({
  period: z.enum(['morning', 'afternoon', 'evening']),
  peakHour: z.number().int().min(0).max(23),
  averageEnergy: z.number().min(1).max(10),
  sampleCount: z.number().int().min(1),
});

export type TimePeriodPeak = z.infer<typeof TimePeriodPeakSchema>;

/**
 * Schema for complete BPT analysis results.
 *
 * @property overallPeak - Hour with highest energy across all data
 * @property morningPeak - Peak hour in morning (6-11), null if no data
 * @property afternoonPeak - Peak hour in afternoon (12-17), null if no data
 * @property eveningPeak - Peak hour in evening (18-23), null if no data
 * @property hourlyAverages - Average energy for each logged hour
 * @property totalLogs - Total number of logs analyzed
 * @property uniqueDays - Number of unique days with logs
 * @property analyzedAt - ISO timestamp when analysis was performed
 */
export const BPTAnalysisSchema = z.object({
  overallPeak: HourlyAverageSchema,
  morningPeak: TimePeriodPeakSchema.nullable(),
  afternoonPeak: TimePeriodPeakSchema.nullable(),
  eveningPeak: TimePeriodPeakSchema.nullable(),
  hourlyAverages: z.array(HourlyAverageSchema),
  totalLogs: z.number().int().min(1),
  uniqueDays: z.number().int().min(1),
  analyzedAt: z.string().datetime(),
});

export type BPTAnalysis = z.infer<typeof BPTAnalysisSchema>;

/**
 * Analysis readiness status.
 */
export interface AnalysisReadiness {
  isReady: boolean;
  currentLogs: number;
  requiredLogs: number;
  percentComplete: number;
  uniqueDays: number;
}

/**
 * Groups energy logs by hour of day.
 *
 * @param logs - Array of energy logs
 * @returns Map of hour (0-23) to logs at that hour
 */
export function groupLogsByHour(
  logs: EnergyLogForAnalysis[]
): Map<number, EnergyLogForAnalysis[]> {
  const grouped = new Map<number, EnergyLogForAnalysis[]>();

  for (const log of logs) {
    const existing = grouped.get(log.hour) ?? [];
    existing.push(log);
    grouped.set(log.hour, existing);
  }

  return grouped;
}

/**
 * Calculates average energy level for each hour.
 *
 * @param logs - Array of energy logs
 * @returns Array of hourly averages, sorted by hour
 */
export function calculateHourlyAverages(logs: EnergyLogForAnalysis[]): HourlyAverage[] {
  const grouped = groupLogsByHour(logs);
  const averages: HourlyAverage[] = [];

  for (const [hour, hourLogs] of grouped) {
    const sum = hourLogs.reduce((acc, log) => acc + log.energyLevel, 0);
    const avg = sum / hourLogs.length;
    // Round to one decimal place
    const roundedAvg = Math.round(avg * 10) / 10;

    averages.push({
      hour,
      averageEnergy: roundedAvg,
      sampleCount: hourLogs.length,
    });
  }

  // Sort by hour
  return averages.sort((a, b) => a.hour - b.hour);
}

/**
 * Finds the peak energy hour within a time period.
 *
 * @param averages - Array of hourly averages
 * @param period - Time period to search
 * @returns Peak for the period, or null if no data
 */
export function findPeakInPeriod(
  averages: HourlyAverage[],
  period: TimePeriod
): TimePeriodPeak | null {
  const { start, end } = TIME_PERIODS[period];

  let bestHour: number | null = null;
  let bestAvg = 0;
  let bestCount = 0;

  for (const avg of averages) {
    if (avg.hour >= start && avg.hour <= end) {
      if (avg.averageEnergy > bestAvg) {
        bestHour = avg.hour;
        bestAvg = avg.averageEnergy;
        bestCount = avg.sampleCount;
      }
    }
  }

  if (bestHour === null) {
    return null;
  }

  return {
    period,
    peakHour: bestHour,
    averageEnergy: bestAvg,
    sampleCount: bestCount,
  };
}

/**
 * Analyzes energy logs to calculate Biological Prime Time.
 *
 * @param logs - Array of energy logs to analyze
 * @returns BPT analysis results, or null if insufficient data
 */
export function analyzeBPT(logs: EnergyLogForAnalysis[]): BPTAnalysis | null {
  if (logs.length < MINIMUM_LOGS_FOR_ANALYSIS) {
    return null;
  }

  const hourlyAverages = calculateHourlyAverages(logs);

  // Find overall peak
  let overallBestHour = 0;
  let overallBestAvg = 0;
  let overallBestCount = 0;

  for (const avg of hourlyAverages) {
    if (avg.averageEnergy > overallBestAvg) {
      overallBestHour = avg.hour;
      overallBestAvg = avg.averageEnergy;
      overallBestCount = avg.sampleCount;
    }
  }

  // Find period peaks
  const morningPeak = findPeakInPeriod(hourlyAverages, 'morning');
  const afternoonPeak = findPeakInPeriod(hourlyAverages, 'afternoon');
  const eveningPeak = findPeakInPeriod(hourlyAverages, 'evening');

  // Count unique days
  const uniqueDates = new Set(logs.map((log) => log.loggedAt.split('T')[0]));

  return {
    overallPeak: {
      hour: overallBestHour,
      averageEnergy: overallBestAvg,
      sampleCount: overallBestCount,
    },
    morningPeak,
    afternoonPeak,
    eveningPeak,
    hourlyAverages,
    totalLogs: logs.length,
    uniqueDays: uniqueDates.size,
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Checks if there is enough data for BPT analysis.
 *
 * @param logs - Array of energy logs
 * @returns Readiness status with progress metrics
 */
export function getAnalysisReadiness(logs: EnergyLogForAnalysis[]): AnalysisReadiness {
  const currentLogs = logs.length;
  const uniqueDates = new Set(logs.map((log) => log.loggedAt.split('T')[0]));
  const uniqueDays = uniqueDates.size;

  const percentComplete = Math.min(
    100,
    Math.round((currentLogs / MINIMUM_LOGS_FOR_ANALYSIS) * 100)
  );

  return {
    isReady: currentLogs >= MINIMUM_LOGS_FOR_ANALYSIS,
    currentLogs,
    requiredLogs: MINIMUM_LOGS_FOR_ANALYSIS,
    percentComplete,
    uniqueDays,
  };
}

/**
 * Formats hour number as readable time string.
 *
 * @param hour - Hour (0-23)
 * @returns Formatted time (e.g., "10am", "2pm")
 */
function formatHour(hour: number): string {
  if (hour === 0) return '12am';
  if (hour === 12) return '12pm';
  if (hour < 12) return `${hour}am`;
  return `${hour - 12}pm`;
}

/**
 * Formats BPT analysis as human-readable summary.
 * Suitable for display in UI or inclusion in AI prompts.
 *
 * @param analysis - BPT analysis results
 * @returns Formatted summary string
 */
export function formatBPTSummary(analysis: BPTAnalysis): string {
  const { overallPeak, morningPeak, afternoonPeak, eveningPeak, totalLogs, uniqueDays } = analysis;

  const lines: string[] = [
    `Your Biological Prime Time (BPT) is around ${formatHour(overallPeak.hour)}.`,
    `Average energy at peak: ${overallPeak.averageEnergy}/10 (based on ${totalLogs} logs over ${uniqueDays} days).`,
    '',
  ];

  const periodLines: string[] = [];
  if (morningPeak) {
    periodLines.push(
      `Morning peak: ${formatHour(morningPeak.peakHour)} (${morningPeak.averageEnergy}/10)`
    );
  }
  if (afternoonPeak) {
    periodLines.push(
      `Afternoon peak: ${formatHour(afternoonPeak.peakHour)} (${afternoonPeak.averageEnergy}/10)`
    );
  }
  if (eveningPeak) {
    periodLines.push(
      `Evening peak: ${formatHour(eveningPeak.peakHour)} (${eveningPeak.averageEnergy}/10)`
    );
  }

  if (periodLines.length > 0) {
    lines.push(...periodLines);
    lines.push('');
  }

  lines.push(
    `Schedule your most important work around ${formatHour(overallPeak.hour)} to align with your natural energy.`
  );

  return lines.join('\n');
}

/**
 * Formats BPT analysis for inclusion in AI coaching prompts.
 *
 * @param analysis - BPT analysis results, or null if not yet analyzed
 * @returns Formatted string for system prompt
 */
export function formatBPTForPrompt(analysis: BPTAnalysis | null): string {
  if (!analysis) {
    return 'The user has not yet completed their Biological Prime Time analysis.';
  }

  const { overallPeak, morningPeak, afternoonPeak, eveningPeak } = analysis;

  const peakParts: string[] = [];

  if (morningPeak) {
    peakParts.push(
      `morning peak at ${formatHour(morningPeak.peakHour)} (avg ${morningPeak.averageEnergy}/10)`
    );
  }
  if (afternoonPeak) {
    peakParts.push(
      `afternoon peak at ${formatHour(afternoonPeak.peakHour)} (avg ${afternoonPeak.averageEnergy}/10)`
    );
  }
  if (eveningPeak) {
    peakParts.push(
      `evening peak at ${formatHour(eveningPeak.peakHour)} (avg ${eveningPeak.averageEnergy}/10)`
    );
  }

  const peaksText =
    peakParts.length > 0 ? `Time-specific peaks: ${peakParts.join(', ')}.` : '';

  return `The user has discovered their Biological Prime Time (BPT).

Overall peak energy: ${formatHour(overallPeak.hour)} with average energy ${overallPeak.averageEnergy}/10.
${peaksText}

When setting their Top 3 or scheduling high-impact work, suggest they protect their BPT hours (around ${formatHour(overallPeak.hour)}) for their most important tasks.`;
}
