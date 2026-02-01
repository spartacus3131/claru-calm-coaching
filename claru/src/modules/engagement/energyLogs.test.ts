/**
 * @file energyLogs.test.ts
 * @description Tests for F024 Energy Logging types and utilities
 * @module engagement
 */

import {
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
} from './energyLogs';

describe('EnergyLogSchema', () => {
  it('should validate a complete energy log', () => {
    const log: EnergyLog = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      loggedAt: '2026-02-01T14:00:00Z',
      hour: 14,
      energyLevel: 8,
      activity: 'Deep work on product strategy',
      procrastinationMinutes: 5,
      challengeId: 4,
      createdAt: '2026-02-01T14:00:00Z',
      updatedAt: '2026-02-01T14:00:00Z',
    };

    const result = EnergyLogSchema.safeParse(log);
    expect(result.success).toBe(true);
  });

  it('should validate minimal energy log', () => {
    const log = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      loggedAt: '2026-02-01T14:00:00Z',
      hour: 14,
      energyLevel: 7,
      createdAt: '2026-02-01T14:00:00Z',
      updatedAt: '2026-02-01T14:00:00Z',
    };

    const result = EnergyLogSchema.safeParse(log);
    expect(result.success).toBe(true);
  });

  it('should reject energy level below 1', () => {
    const log = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      loggedAt: '2026-02-01T14:00:00Z',
      hour: 14,
      energyLevel: 0,
      createdAt: '2026-02-01T14:00:00Z',
      updatedAt: '2026-02-01T14:00:00Z',
    };

    const result = EnergyLogSchema.safeParse(log);
    expect(result.success).toBe(false);
  });

  it('should reject energy level above 10', () => {
    const log = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      loggedAt: '2026-02-01T14:00:00Z',
      hour: 14,
      energyLevel: 11,
      createdAt: '2026-02-01T14:00:00Z',
      updatedAt: '2026-02-01T14:00:00Z',
    };

    const result = EnergyLogSchema.safeParse(log);
    expect(result.success).toBe(false);
  });

  it('should reject invalid hour', () => {
    const log = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      userId: '123e4567-e89b-12d3-a456-426614174001',
      loggedAt: '2026-02-01T14:00:00Z',
      hour: 25,
      energyLevel: 7,
      createdAt: '2026-02-01T14:00:00Z',
      updatedAt: '2026-02-01T14:00:00Z',
    };

    const result = EnergyLogSchema.safeParse(log);
    expect(result.success).toBe(false);
  });
});

describe('CreateEnergyLogSchema', () => {
  it('should validate create input with all fields', () => {
    const input: CreateEnergyLogInput = {
      energyLevel: 8,
      activity: 'Writing code',
      procrastinationMinutes: 10,
      challengeId: 4,
    };

    const result = CreateEnergyLogSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate minimal create input', () => {
    const input = {
      energyLevel: 7,
    };

    const result = CreateEnergyLogSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid energy level in create input', () => {
    const input = {
      energyLevel: 15,
    };

    const result = CreateEnergyLogSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject negative procrastination minutes', () => {
    const input = {
      energyLevel: 7,
      procrastinationMinutes: -5,
    };

    const result = CreateEnergyLogSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should reject procrastination minutes over 60', () => {
    const input = {
      energyLevel: 7,
      procrastinationMinutes: 65,
    };

    const result = CreateEnergyLogSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe('toEnergyLog', () => {
  it('should convert database row to domain entity', () => {
    const dbRow: DbEnergyLog = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      logged_at: '2026-02-01T14:00:00Z',
      hour: 14,
      energy_level: 8,
      activity: 'Deep work',
      procrastination_minutes: 5,
      challenge_id: 4,
      created_at: '2026-02-01T14:00:00Z',
      updated_at: '2026-02-01T14:00:00Z',
    };

    const result = toEnergyLog(dbRow);

    expect(result.id).toBe(dbRow.id);
    expect(result.userId).toBe(dbRow.user_id);
    expect(result.loggedAt).toBe(dbRow.logged_at);
    expect(result.hour).toBe(dbRow.hour);
    expect(result.energyLevel).toBe(dbRow.energy_level);
    expect(result.activity).toBe(dbRow.activity);
    expect(result.procrastinationMinutes).toBe(dbRow.procrastination_minutes);
    expect(result.challengeId).toBe(dbRow.challenge_id);
  });

  it('should handle null optional fields', () => {
    const dbRow: DbEnergyLog = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      logged_at: '2026-02-01T14:00:00Z',
      hour: 14,
      energy_level: 7,
      activity: null,
      procrastination_minutes: null,
      challenge_id: null,
      created_at: '2026-02-01T14:00:00Z',
      updated_at: '2026-02-01T14:00:00Z',
    };

    const result = toEnergyLog(dbRow);

    expect(result.activity).toBeUndefined();
    expect(result.procrastinationMinutes).toBeUndefined();
    expect(result.challengeId).toBeUndefined();
  });
});

describe('toDbInsert', () => {
  it('should convert create input to database insert format', () => {
    const input: CreateEnergyLogInput = {
      energyLevel: 8,
      activity: 'Writing code',
      procrastinationMinutes: 10,
      challengeId: 4,
    };
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    const result = toDbInsert(input, userId);

    expect(result.user_id).toBe(userId);
    expect(result.energy_level).toBe(8);
    expect(result.activity).toBe('Writing code');
    expect(result.procrastination_minutes).toBe(10);
    expect(result.challenge_id).toBe(4);
    expect(result.hour).toBeDefined();
    expect(result.logged_at).toBeDefined();
  });

  it('should set current hour from timestamp', () => {
    const input: CreateEnergyLogInput = {
      energyLevel: 7,
    };
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    const result = toDbInsert(input, userId);

    // Hour should be set based on current time
    expect(typeof result.hour).toBe('number');
    expect(result.hour).toBeGreaterThanOrEqual(0);
    expect(result.hour).toBeLessThanOrEqual(23);
  });

  it('should handle undefined optional fields', () => {
    const input: CreateEnergyLogInput = {
      energyLevel: 7,
    };
    const userId = '123e4567-e89b-12d3-a456-426614174001';

    const result = toDbInsert(input, userId);

    expect(result.activity).toBeUndefined();
    expect(result.procrastination_minutes).toBeUndefined();
    expect(result.challenge_id).toBeUndefined();
  });
});

describe('getHourFromTimestamp', () => {
  it('should extract hour from ISO timestamp', () => {
    expect(getHourFromTimestamp('2026-02-01T14:30:00Z')).toBe(14);
    expect(getHourFromTimestamp('2026-02-01T00:00:00Z')).toBe(0);
    expect(getHourFromTimestamp('2026-02-01T23:59:59Z')).toBe(23);
  });
});

describe('groupLogsByHour', () => {
  it('should group logs by hour', () => {
    const logs: EnergyLog[] = [
      createMockLog({ hour: 9, energyLevel: 7 }),
      createMockLog({ hour: 9, energyLevel: 8 }),
      createMockLog({ hour: 14, energyLevel: 6 }),
    ];

    const grouped = groupLogsByHour(logs);

    expect(grouped.get(9)).toHaveLength(2);
    expect(grouped.get(14)).toHaveLength(1);
    expect(grouped.get(10)).toBeUndefined();
  });

  it('should return empty map for empty logs', () => {
    const grouped = groupLogsByHour([]);
    expect(grouped.size).toBe(0);
  });
});

describe('calculateDailyAverage', () => {
  it('should calculate average energy for a day', () => {
    const logs: EnergyLog[] = [
      createMockLog({ energyLevel: 6, loggedAt: '2026-02-01T09:00:00Z' }),
      createMockLog({ energyLevel: 8, loggedAt: '2026-02-01T10:00:00Z' }),
      createMockLog({ energyLevel: 7, loggedAt: '2026-02-01T14:00:00Z' }),
      createMockLog({ energyLevel: 5, loggedAt: '2026-02-02T09:00:00Z' }), // Different day
    ];

    const avg = calculateDailyAverage(logs, '2026-02-01');

    expect(avg).toBe(7); // (6 + 8 + 7) / 3
  });

  it('should return null for no logs on date', () => {
    const logs: EnergyLog[] = [
      createMockLog({ energyLevel: 7, loggedAt: '2026-02-02T09:00:00Z' }),
    ];

    const avg = calculateDailyAverage(logs, '2026-02-01');

    expect(avg).toBeNull();
  });

  it('should return null for empty logs', () => {
    const avg = calculateDailyAverage([], '2026-02-01');
    expect(avg).toBeNull();
  });
});

describe('getRecentLogsCount', () => {
  it('should count logs from recent days', () => {
    const today = new Date().toISOString().split('T')[0];
    const logs: EnergyLog[] = [
      createMockLog({ loggedAt: `${today}T09:00:00Z` }),
      createMockLog({ loggedAt: `${today}T10:00:00Z` }),
      createMockLog({ loggedAt: `${today}T14:00:00Z` }),
    ];

    const count = getRecentLogsCount(logs, 7);

    expect(count).toBe(3);
  });

  it('should exclude logs older than specified days', () => {
    const today = new Date();
    const tenDaysAgo = new Date(today);
    tenDaysAgo.setDate(today.getDate() - 10);
    
    const logs: EnergyLog[] = [
      createMockLog({ loggedAt: today.toISOString() }),
      createMockLog({ loggedAt: tenDaysAgo.toISOString() }),
    ];

    const count = getRecentLogsCount(logs, 7);

    expect(count).toBe(1);
  });

  it('should return 0 for empty logs', () => {
    const count = getRecentLogsCount([], 7);
    expect(count).toBe(0);
  });
});

// Helper to create mock logs
function createMockLog(overrides: Partial<EnergyLog>): EnergyLog {
  return {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: '123e4567-e89b-12d3-a456-426614174001',
    loggedAt: '2026-02-01T14:00:00Z',
    hour: 14,
    energyLevel: 7,
    createdAt: '2026-02-01T14:00:00Z',
    updatedAt: '2026-02-01T14:00:00Z',
    ...overrides,
  };
}
