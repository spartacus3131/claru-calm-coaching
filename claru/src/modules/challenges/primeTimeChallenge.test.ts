/**
 * @file primeTimeChallenge.test.ts
 * @description Tests for F023 Prime Time Foundation implementation
 * @module challenges
 */

import {
  PRIME_TIME_CHALLENGE_ID,
  EnergyLogEntrySchema,
  PrimeTimeDataSchema,
  BPTPeaksSchema,
  parsePrimeTimeData,
  addEnergyLog,
  calculateBPT,
  formatPrimeTimeForPrompt,
  isPrimeTimeComplete,
  getNextPrimeTimeStep,
  getLoggingProgress,
  PRIME_TIME_STEP_INSTRUCTIONS,
  MINIMUM_LOGS_FOR_BPT,
  type EnergyLogEntry,
  type PrimeTimeData,
  type BPTPeaks,
} from './primeTimeChallenge';

describe('PRIME_TIME_CHALLENGE_ID', () => {
  it('should be 4', () => {
    expect(PRIME_TIME_CHALLENGE_ID).toBe(4);
  });
});

describe('EnergyLogEntrySchema', () => {
  it('should validate a complete energy log entry', () => {
    const entry = {
      timestamp: '2026-02-01T14:00:00Z',
      hour: 14,
      energyLevel: 8,
      activity: 'Deep work on product strategy',
      procrastinationMinutes: 5,
    };

    const result = EnergyLogEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it('should validate minimal entry (just timestamp, hour, energy)', () => {
    const entry = {
      timestamp: '2026-02-01T14:00:00Z',
      hour: 14,
      energyLevel: 7,
    };

    const result = EnergyLogEntrySchema.safeParse(entry);
    expect(result.success).toBe(true);
  });

  it('should reject energy level below 1', () => {
    const entry = {
      timestamp: '2026-02-01T14:00:00Z',
      hour: 14,
      energyLevel: 0,
    };

    const result = EnergyLogEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it('should reject energy level above 10', () => {
    const entry = {
      timestamp: '2026-02-01T14:00:00Z',
      hour: 14,
      energyLevel: 11,
    };

    const result = EnergyLogEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it('should reject invalid hour (below 0)', () => {
    const entry = {
      timestamp: '2026-02-01T14:00:00Z',
      hour: -1,
      energyLevel: 7,
    };

    const result = EnergyLogEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it('should reject invalid hour (above 23)', () => {
    const entry = {
      timestamp: '2026-02-01T14:00:00Z',
      hour: 24,
      energyLevel: 7,
    };

    const result = EnergyLogEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });

  it('should reject negative procrastination minutes', () => {
    const entry = {
      timestamp: '2026-02-01T14:00:00Z',
      hour: 14,
      energyLevel: 7,
      procrastinationMinutes: -5,
    };

    const result = EnergyLogEntrySchema.safeParse(entry);
    expect(result.success).toBe(false);
  });
});

describe('BPTPeaksSchema', () => {
  it('should validate complete BPT peaks', () => {
    const peaks = {
      morningPeak: { hour: 10, averageEnergy: 8.5 },
      afternoonPeak: { hour: 15, averageEnergy: 7.2 },
      eveningPeak: { hour: 20, averageEnergy: 6.8 },
      overallPeak: { hour: 10, averageEnergy: 8.5 },
    };

    const result = BPTPeaksSchema.safeParse(peaks);
    expect(result.success).toBe(true);
  });

  it('should allow null peaks when no data for time period', () => {
    const peaks = {
      morningPeak: { hour: 10, averageEnergy: 8.5 },
      afternoonPeak: null,
      eveningPeak: null,
      overallPeak: { hour: 10, averageEnergy: 8.5 },
    };

    const result = BPTPeaksSchema.safeParse(peaks);
    expect(result.success).toBe(true);
  });
});

describe('PrimeTimeDataSchema', () => {
  it('should validate complete prime time data', () => {
    const data = {
      energyLogs: [
        { timestamp: '2026-02-01T10:00:00Z', hour: 10, energyLevel: 8 },
        { timestamp: '2026-02-01T14:00:00Z', hour: 14, energyLevel: 6 },
      ],
      bptPeaks: {
        morningPeak: { hour: 10, averageEnergy: 8 },
        afternoonPeak: { hour: 14, averageEnergy: 6 },
        eveningPeak: null,
        overallPeak: { hour: 10, averageEnergy: 8 },
      },
      prepCompleted: true,
      loggingStartedAt: '2026-02-01T08:00:00Z',
      stepsCompleted: [1, 2, 3],
      completedAt: '2026-02-08T12:00:00Z',
    };

    const result = PrimeTimeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('should validate minimal data (empty logs)', () => {
    const data = {
      energyLogs: [],
    };

    const result = PrimeTimeDataSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stepsCompleted).toEqual([]);
      expect(result.data.prepCompleted).toBe(false);
    }
  });
});

describe('parsePrimeTimeData', () => {
  it('should return parsed data for valid input', () => {
    const data = { energyLogs: [] };
    const result = parsePrimeTimeData(data);
    expect(result).not.toBeNull();
    expect(result?.energyLogs).toEqual([]);
  });

  it('should return null for invalid input', () => {
    const result = parsePrimeTimeData({ energyLogs: 'not an array' });
    expect(result).toBeNull();
  });

  it('should return null for non-object input', () => {
    const result = parsePrimeTimeData('not an object');
    expect(result).toBeNull();
  });
});

describe('addEnergyLog', () => {
  it('should add a new energy log entry', () => {
    const entry: EnergyLogEntry = {
      timestamp: '2026-02-01T10:00:00Z',
      hour: 10,
      energyLevel: 8,
    };
    const result = addEnergyLog(entry);
    expect(result.energyLogs).toHaveLength(1);
    expect(result.energyLogs![0].energyLevel).toBe(8);
  });

  it('should append to existing logs', () => {
    const existing = {
      energyLogs: [
        { timestamp: '2026-02-01T09:00:00Z', hour: 9, energyLevel: 6 },
      ],
      stepsCompleted: [1],
    };
    const entry: EnergyLogEntry = {
      timestamp: '2026-02-01T10:00:00Z',
      hour: 10,
      energyLevel: 8,
    };
    const result = addEnergyLog(entry, existing);
    expect(result.energyLogs).toHaveLength(2);
  });

  it('should set loggingStartedAt on first log', () => {
    const entry: EnergyLogEntry = {
      timestamp: '2026-02-01T10:00:00Z',
      hour: 10,
      energyLevel: 8,
    };
    const result = addEnergyLog(entry);
    expect(result.loggingStartedAt).toBeDefined();
  });

  it('should not overwrite loggingStartedAt on subsequent logs', () => {
    const existing = {
      energyLogs: [
        { timestamp: '2026-02-01T09:00:00Z', hour: 9, energyLevel: 6 },
      ],
      loggingStartedAt: '2026-02-01T08:00:00Z',
    };
    const entry: EnergyLogEntry = {
      timestamp: '2026-02-01T10:00:00Z',
      hour: 10,
      energyLevel: 8,
    };
    const result = addEnergyLog(entry, existing);
    expect(result.loggingStartedAt).toBe('2026-02-01T08:00:00Z');
  });

  it('should mark step 2 as completed when logging starts', () => {
    const existing = { energyLogs: [], stepsCompleted: [1] };
    const entry: EnergyLogEntry = {
      timestamp: '2026-02-01T10:00:00Z',
      hour: 10,
      energyLevel: 8,
    };
    const result = addEnergyLog(entry, existing);
    expect(result.stepsCompleted).toContain(2);
  });
});

describe('calculateBPT', () => {
  it('should return null with insufficient logs', () => {
    const logs: EnergyLogEntry[] = [
      { timestamp: '2026-02-01T10:00:00Z', hour: 10, energyLevel: 8 },
    ];
    const result = calculateBPT(logs);
    expect(result).toBeNull();
  });

  it('should calculate overall peak from logs', () => {
    const logs: EnergyLogEntry[] = [
      { timestamp: '2026-02-01T09:00:00Z', hour: 9, energyLevel: 7 },
      { timestamp: '2026-02-01T10:00:00Z', hour: 10, energyLevel: 9 },
      { timestamp: '2026-02-01T11:00:00Z', hour: 11, energyLevel: 8 },
      { timestamp: '2026-02-01T14:00:00Z', hour: 14, energyLevel: 6 },
      { timestamp: '2026-02-01T15:00:00Z', hour: 15, energyLevel: 7 },
      { timestamp: '2026-02-02T09:00:00Z', hour: 9, energyLevel: 8 },
      { timestamp: '2026-02-02T10:00:00Z', hour: 10, energyLevel: 9 },
      { timestamp: '2026-02-02T14:00:00Z', hour: 14, energyLevel: 5 },
    ];
    const result = calculateBPT(logs);
    expect(result).not.toBeNull();
    expect(result?.overallPeak.hour).toBe(10);
    expect(result?.overallPeak.averageEnergy).toBe(9);
  });

  it('should calculate morning peak (6-11)', () => {
    const logs: EnergyLogEntry[] = [
      { timestamp: '2026-02-01T08:00:00Z', hour: 8, energyLevel: 6 },
      { timestamp: '2026-02-01T09:00:00Z', hour: 9, energyLevel: 8 },
      { timestamp: '2026-02-01T10:00:00Z', hour: 10, energyLevel: 9 },
      { timestamp: '2026-02-01T14:00:00Z', hour: 14, energyLevel: 5 },
      { timestamp: '2026-02-01T15:00:00Z', hour: 15, energyLevel: 6 },
      { timestamp: '2026-02-02T09:00:00Z', hour: 9, energyLevel: 7 },
      { timestamp: '2026-02-02T10:00:00Z', hour: 10, energyLevel: 8 },
      { timestamp: '2026-02-02T14:00:00Z', hour: 14, energyLevel: 4 },
    ];
    const result = calculateBPT(logs);
    expect(result?.morningPeak).not.toBeNull();
    expect(result?.morningPeak?.hour).toBe(10);
  });

  it('should calculate afternoon peak (12-17)', () => {
    const logs: EnergyLogEntry[] = [
      { timestamp: '2026-02-01T09:00:00Z', hour: 9, energyLevel: 5 },
      { timestamp: '2026-02-01T13:00:00Z', hour: 13, energyLevel: 7 },
      { timestamp: '2026-02-01T14:00:00Z', hour: 14, energyLevel: 8 },
      { timestamp: '2026-02-01T15:00:00Z', hour: 15, energyLevel: 9 },
      { timestamp: '2026-02-02T09:00:00Z', hour: 9, energyLevel: 4 },
      { timestamp: '2026-02-02T14:00:00Z', hour: 14, energyLevel: 7 },
      { timestamp: '2026-02-02T15:00:00Z', hour: 15, energyLevel: 8 },
      { timestamp: '2026-02-02T16:00:00Z', hour: 16, energyLevel: 6 },
    ];
    const result = calculateBPT(logs);
    expect(result?.afternoonPeak).not.toBeNull();
    expect(result?.afternoonPeak?.hour).toBe(15);
  });

  it('should calculate evening peak (18-23)', () => {
    const logs: EnergyLogEntry[] = [
      { timestamp: '2026-02-01T09:00:00Z', hour: 9, energyLevel: 5 },
      { timestamp: '2026-02-01T14:00:00Z', hour: 14, energyLevel: 5 },
      { timestamp: '2026-02-01T19:00:00Z', hour: 19, energyLevel: 7 },
      { timestamp: '2026-02-01T20:00:00Z', hour: 20, energyLevel: 8 },
      { timestamp: '2026-02-02T09:00:00Z', hour: 9, energyLevel: 4 },
      { timestamp: '2026-02-02T19:00:00Z', hour: 19, energyLevel: 6 },
      { timestamp: '2026-02-02T20:00:00Z', hour: 20, energyLevel: 9 },
      { timestamp: '2026-02-02T21:00:00Z', hour: 21, energyLevel: 7 },
    ];
    const result = calculateBPT(logs);
    expect(result?.eveningPeak).not.toBeNull();
    expect(result?.eveningPeak?.hour).toBe(20);
  });

  it('should return null for time periods with no data', () => {
    // Only morning data
    const logs: EnergyLogEntry[] = [
      { timestamp: '2026-02-01T09:00:00Z', hour: 9, energyLevel: 7 },
      { timestamp: '2026-02-01T10:00:00Z', hour: 10, energyLevel: 8 },
      { timestamp: '2026-02-02T09:00:00Z', hour: 9, energyLevel: 6 },
      { timestamp: '2026-02-02T10:00:00Z', hour: 10, energyLevel: 9 },
      { timestamp: '2026-02-03T09:00:00Z', hour: 9, energyLevel: 7 },
      { timestamp: '2026-02-03T10:00:00Z', hour: 10, energyLevel: 8 },
      { timestamp: '2026-02-03T11:00:00Z', hour: 11, energyLevel: 7 },
      { timestamp: '2026-02-04T10:00:00Z', hour: 10, energyLevel: 8 },
    ];
    const result = calculateBPT(logs);
    expect(result?.morningPeak).not.toBeNull();
    expect(result?.afternoonPeak).toBeNull();
    expect(result?.eveningPeak).toBeNull();
  });
});

describe('formatPrimeTimeForPrompt', () => {
  it('should format complete BPT data', () => {
    const data: PrimeTimeData = {
      energyLogs: [],
      bptPeaks: {
        morningPeak: { hour: 10, averageEnergy: 8.5 },
        afternoonPeak: { hour: 15, averageEnergy: 7.0 },
        eveningPeak: { hour: 20, averageEnergy: 6.5 },
        overallPeak: { hour: 10, averageEnergy: 8.5 },
      },
      stepsCompleted: [1, 2, 3],
    };
    const formatted = formatPrimeTimeForPrompt(data);
    expect(formatted).toContain('10');
    expect(formatted).toContain('Biological Prime Time');
    expect(formatted).toContain('morning');
  });

  it('should handle missing peaks gracefully', () => {
    const data: PrimeTimeData = {
      energyLogs: [],
      bptPeaks: {
        morningPeak: { hour: 10, averageEnergy: 8.5 },
        afternoonPeak: null,
        eveningPeak: null,
        overallPeak: { hour: 10, averageEnergy: 8.5 },
      },
      stepsCompleted: [1, 2, 3],
    };
    const formatted = formatPrimeTimeForPrompt(data);
    expect(formatted).toContain('10');
    expect(formatted).not.toContain('afternoon peak');
  });

  it('should indicate when BPT not yet calculated', () => {
    const data: PrimeTimeData = {
      energyLogs: [],
      stepsCompleted: [1],
    };
    const formatted = formatPrimeTimeForPrompt(data);
    expect(formatted).toContain('has not yet');
  });

  it('should include coaching guidance about scheduling', () => {
    const data: PrimeTimeData = {
      energyLogs: [],
      bptPeaks: {
        morningPeak: { hour: 10, averageEnergy: 8 },
        afternoonPeak: null,
        eveningPeak: null,
        overallPeak: { hour: 10, averageEnergy: 8 },
      },
      stepsCompleted: [1, 2, 3],
    };
    const formatted = formatPrimeTimeForPrompt(data);
    expect(formatted).toContain('high-impact');
  });
});

describe('isPrimeTimeComplete', () => {
  it('should return true when all steps completed', () => {
    const data = { stepsCompleted: [1, 2, 3] };
    expect(isPrimeTimeComplete(data)).toBe(true);
  });

  it('should return true regardless of step order', () => {
    const data = { stepsCompleted: [3, 1, 2] };
    expect(isPrimeTimeComplete(data)).toBe(true);
  });

  it('should return false when steps missing', () => {
    const data = { stepsCompleted: [1, 2] };
    expect(isPrimeTimeComplete(data)).toBe(false);
  });

  it('should return false for empty steps', () => {
    const data = { stepsCompleted: [] };
    expect(isPrimeTimeComplete(data)).toBe(false);
  });

  it('should handle undefined stepsCompleted', () => {
    const data = {};
    expect(isPrimeTimeComplete(data)).toBe(false);
  });
});

describe('getNextPrimeTimeStep', () => {
  it('should return 1 for empty progress', () => {
    const data = {};
    expect(getNextPrimeTimeStep(data)).toBe(1);
  });

  it('should return 2 after step 1 (prep)', () => {
    const data = { stepsCompleted: [1] };
    expect(getNextPrimeTimeStep(data)).toBe(2);
  });

  it('should return 3 after steps 1 and 2', () => {
    const data = { stepsCompleted: [1, 2] };
    expect(getNextPrimeTimeStep(data)).toBe(3);
  });

  it('should return null when all complete', () => {
    const data = { stepsCompleted: [1, 2, 3] };
    expect(getNextPrimeTimeStep(data)).toBeNull();
  });

  it('should find gaps in non-sequential completion', () => {
    const data = { stepsCompleted: [2, 3] };
    expect(getNextPrimeTimeStep(data)).toBe(1);
  });
});

describe('getLoggingProgress', () => {
  it('should return 0 for no logs', () => {
    const data = { energyLogs: [] };
    const progress = getLoggingProgress(data);
    expect(progress.totalLogs).toBe(0);
    expect(progress.uniqueDays).toBe(0);
    expect(progress.percentComplete).toBe(0);
  });

  it('should count unique days', () => {
    const data = {
      energyLogs: [
        { timestamp: '2026-02-01T10:00:00Z', hour: 10, energyLevel: 8 },
        { timestamp: '2026-02-01T14:00:00Z', hour: 14, energyLevel: 6 },
        { timestamp: '2026-02-02T10:00:00Z', hour: 10, energyLevel: 7 },
      ],
    };
    const progress = getLoggingProgress(data);
    expect(progress.totalLogs).toBe(3);
    expect(progress.uniqueDays).toBe(2);
  });

  it('should calculate percent complete based on minimum logs', () => {
    const logs = Array.from({ length: MINIMUM_LOGS_FOR_BPT }, (_, i) => ({
      timestamp: `2026-02-0${(i % 7) + 1}T10:00:00Z`,
      hour: 10,
      energyLevel: 7,
    }));
    const data = { energyLogs: logs };
    const progress = getLoggingProgress(data);
    expect(progress.percentComplete).toBe(100);
  });

  it('should cap percent at 100', () => {
    const logs = Array.from({ length: MINIMUM_LOGS_FOR_BPT + 10 }, (_, i) => ({
      timestamp: `2026-02-0${(i % 7) + 1}T10:00:00Z`,
      hour: 10,
      energyLevel: 7,
    }));
    const data = { energyLogs: logs };
    const progress = getLoggingProgress(data);
    expect(progress.percentComplete).toBe(100);
  });

  it('should indicate if ready for analysis', () => {
    const logs = Array.from({ length: MINIMUM_LOGS_FOR_BPT }, (_, i) => ({
      timestamp: `2026-02-0${(i % 7) + 1}T10:00:00Z`,
      hour: 10,
      energyLevel: 7,
    }));
    const data = { energyLogs: logs };
    const progress = getLoggingProgress(data);
    expect(progress.readyForAnalysis).toBe(true);
  });
});

describe('PRIME_TIME_STEP_INSTRUCTIONS', () => {
  it('should have instructions for all 3 steps', () => {
    expect(PRIME_TIME_STEP_INSTRUCTIONS[1]).toBeDefined();
    expect(PRIME_TIME_STEP_INSTRUCTIONS[2]).toBeDefined();
    expect(PRIME_TIME_STEP_INSTRUCTIONS[3]).toBeDefined();
  });

  it('should mention caffeine/stimulants in step 1', () => {
    expect(PRIME_TIME_STEP_INSTRUCTIONS[1].toLowerCase()).toContain('caffeine');
  });

  it('should mention energy level in step 2', () => {
    expect(PRIME_TIME_STEP_INSTRUCTIONS[2].toLowerCase()).toContain('energy');
  });

  it('should mention biological prime time in step 3', () => {
    expect(PRIME_TIME_STEP_INSTRUCTIONS[3].toLowerCase()).toContain('biological prime time');
  });
});

describe('MINIMUM_LOGS_FOR_BPT', () => {
  it('should require at least 8 logs for meaningful BPT calculation', () => {
    expect(MINIMUM_LOGS_FOR_BPT).toBeGreaterThanOrEqual(8);
  });
});
