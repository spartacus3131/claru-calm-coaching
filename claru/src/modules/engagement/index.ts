/**
 * @file index.ts
 * @description Engagement Tracker module exports
 * @module engagement
 *
 * The Engagement Tracker owns energy logging, streak tracking,
 * and habit strength scoring.
 */

// F024: Energy Logging
export {
  EnergyLogSchema,
  CreateEnergyLogSchema,
  toEnergyLog,
  toDbInsert,
  getHourFromTimestamp,
  groupLogsByHour,
  calculateDailyAverage,
  getRecentLogsCount,
  type EnergyLog,
  type CreateEnergyLogInput,
  type DbEnergyLog,
  type DbEnergyLogInsert,
} from './energyLogs';

// F028: Streak Tracking
export {
  RecordEngagementSchema,
  toEngagementRecord,
  toStreakSummary,
  toDbInsert as toEngagementDbInsert,
  isStreakActive,
  hasCheckedInToday,
  getCurrentMilestone,
  getNextMilestone,
  getDaysToNextMilestone,
  formatStreakLabel,
  getStreakMessage,
  toStreakDisplay,
  calculateStreakFromDates,
  ENGAGEMENT_TYPES,
  STREAK_MILESTONES,
  type EngagementType,
  type EngagementRecord,
  type DbEngagementRecord,
  type StreakSummary,
  type DbStreakSummary,
  type StreakDisplay,
  type StreakMilestone,
  type RecordEngagementInput,
} from './streaks';
