/**
 * @file energyLogs.ts
 * @description F024 - Energy Logging types and utilities
 * @module engagement
 *
 * The Energy Logging feature allows users to track their energy levels
 * throughout the day. This data feeds into BPT (Biological Prime Time)
 * discovery and overall engagement tracking.
 *
 * Per bounded-contexts.mdc: Engagement Tracker owns energy logging.
 * Per domain-language.mdc: Use "energy level", "energy log".
 */

import { z } from 'zod';

/**
 * Schema for an energy log entity (domain model).
 *
 * @property id - Unique identifier
 * @property userId - Owner of this log
 * @property loggedAt - When the energy was logged
 * @property hour - Hour of day (0-23)
 * @property energyLevel - Self-reported energy (1-10)
 * @property activity - What the user was doing (optional)
 * @property procrastinationMinutes - Minutes procrastinating (optional)
 * @property challengeId - Link to challenge if part of BPT tracking (optional)
 */
export const EnergyLogSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  loggedAt: z.string().datetime(),
  hour: z.number().int().min(0).max(23),
  energyLevel: z.number().int().min(1).max(10),
  activity: z.string().max(200).optional(),
  procrastinationMinutes: z.number().int().min(0).max(60).optional(),
  challengeId: z.number().int().min(1).max(22).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type EnergyLog = z.infer<typeof EnergyLogSchema>;

/**
 * Schema for creating a new energy log.
 * User ID, hour, and timestamps are set server-side.
 */
export const CreateEnergyLogSchema = z.object({
  energyLevel: z.number().int().min(1).max(10),
  activity: z.string().max(200).optional(),
  procrastinationMinutes: z.number().int().min(0).max(60).optional(),
  challengeId: z.number().int().min(1).max(22).optional(),
});

export type CreateEnergyLogInput = z.infer<typeof CreateEnergyLogSchema>;

/**
 * Database row shape (snake_case).
 */
export interface DbEnergyLog {
  id: string;
  user_id: string;
  logged_at: string;
  hour: number;
  energy_level: number;
  activity: string | null;
  procrastination_minutes: number | null;
  challenge_id: number | null;
  created_at: string;
  updated_at: string;
}

/**
 * Database insert shape.
 */
export interface DbEnergyLogInsert {
  user_id: string;
  logged_at: string;
  hour: number;
  energy_level: number;
  activity?: string;
  procrastination_minutes?: number;
  challenge_id?: number;
}

/**
 * Convert database row to domain entity.
 *
 * @param row - Database row
 * @returns EnergyLog domain entity
 */
export function toEnergyLog(row: DbEnergyLog): EnergyLog {
  return {
    id: row.id,
    userId: row.user_id,
    loggedAt: row.logged_at,
    hour: row.hour,
    energyLevel: row.energy_level,
    activity: row.activity ?? undefined,
    procrastinationMinutes: row.procrastination_minutes ?? undefined,
    challengeId: row.challenge_id ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Convert create input to database insert format.
 * Sets current timestamp and hour.
 *
 * @param input - Create input from client
 * @param userId - Authenticated user ID
 * @returns Database insert object
 */
export function toDbInsert(input: CreateEnergyLogInput, userId: string): DbEnergyLogInsert {
  const now = new Date();
  const loggedAt = now.toISOString();
  const hour = now.getUTCHours();

  return {
    user_id: userId,
    logged_at: loggedAt,
    hour,
    energy_level: input.energyLevel,
    activity: input.activity,
    procrastination_minutes: input.procrastinationMinutes,
    challenge_id: input.challengeId,
  };
}

/**
 * Extract hour from an ISO timestamp.
 *
 * @param timestamp - ISO timestamp string
 * @returns Hour (0-23)
 */
export function getHourFromTimestamp(timestamp: string): number {
  return new Date(timestamp).getUTCHours();
}

/**
 * Group energy logs by hour of day.
 *
 * @param logs - Array of energy logs
 * @returns Map of hour to logs
 */
export function groupLogsByHour(logs: EnergyLog[]): Map<number, EnergyLog[]> {
  const grouped = new Map<number, EnergyLog[]>();

  for (const log of logs) {
    const existing = grouped.get(log.hour) ?? [];
    existing.push(log);
    grouped.set(log.hour, existing);
  }

  return grouped;
}

/**
 * Calculate average energy level for a specific date.
 *
 * @param logs - Array of energy logs
 * @param date - Date string (YYYY-MM-DD)
 * @returns Average energy or null if no logs for date
 */
export function calculateDailyAverage(logs: EnergyLog[], date: string): number | null {
  const dayLogs = logs.filter((log) => log.loggedAt.startsWith(date));

  if (dayLogs.length === 0) {
    return null;
  }

  const sum = dayLogs.reduce((acc, log) => acc + log.energyLevel, 0);
  return Math.round(sum / dayLogs.length);
}

/**
 * Count logs from the last N days.
 *
 * @param logs - Array of energy logs
 * @param days - Number of days to look back
 * @returns Count of logs within the period
 */
export function getRecentLogsCount(logs: EnergyLog[], days: number): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return logs.filter((log) => new Date(log.loggedAt) >= cutoff).length;
}
