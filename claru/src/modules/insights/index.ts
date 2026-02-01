/**
 * @file index.ts
 * @description Insights Engine module exports
 * @module insights
 *
 * The Insights Engine analyzes user data to derive patterns and recommendations.
 * Per bounded-contexts.mdc: Insights Engine reads from User Context Store,
 * Engagement Tracker, and Challenge Engine but doesn't write to them.
 *
 * Features:
 * - F025: BPT Analysis (Biological Prime Time calculation)
 */

// F025: BPT Analysis
export {
  // Schemas
  BPTAnalysisSchema,
  HourlyAverageSchema,
  TimePeriodPeakSchema,
  // Functions
  analyzeBPT,
  groupLogsByHour,
  calculateHourlyAverages,
  findPeakInPeriod,
  getAnalysisReadiness,
  formatBPTSummary,
  formatBPTForPrompt,
  // Constants
  MINIMUM_LOGS_FOR_ANALYSIS,
  TIME_PERIODS,
  // Types
  type BPTAnalysis,
  type HourlyAverage,
  type TimePeriodPeak,
  type TimePeriod,
  type EnergyLogForAnalysis,
  type AnalysisReadiness,
} from './bptAnalysis';
