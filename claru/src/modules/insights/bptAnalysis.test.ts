/**
 * @file bptAnalysis.test.ts
 * @description Tests for F025 BPT (Biological Prime Time) Analysis
 * @module insights
 *
 * Per 001-tdd.mdc: Tests written first to define expected behavior.
 * Per bounded-contexts.mdc: Insights Engine reads from Engagement Tracker.
 */

// Jest is configured globally, no imports needed
import {
  BPTAnalysisSchema,
  HourlyAverageSchema,
  TimePeriodPeakSchema,
  analyzeBPT,
  groupLogsByHour,
  calculateHourlyAverages,
  findPeakInPeriod,
  getAnalysisReadiness,
  formatBPTSummary,
  MINIMUM_LOGS_FOR_ANALYSIS,
  TIME_PERIODS,
  type BPTAnalysis,
  type HourlyAverage,
  type EnergyLogForAnalysis,
} from './bptAnalysis';

// Helper to create mock energy logs
function createMockLog(overrides: Partial<EnergyLogForAnalysis>): EnergyLogForAnalysis {
  return {
    loggedAt: '2026-02-01T10:00:00Z',
    hour: 10,
    energyLevel: 7,
    ...overrides,
  };
}

describe('HourlyAverageSchema', () => {
  it('should validate a complete hourly average', () => {
    const avg: HourlyAverage = {
      hour: 10,
      averageEnergy: 7.5,
      sampleCount: 5,
    };
    const result = HourlyAverageSchema.safeParse(avg);
    expect(result.success).toBe(true);
  });

  it('should reject invalid hour', () => {
    const result = HourlyAverageSchema.safeParse({
      hour: 25,
      averageEnergy: 7,
      sampleCount: 1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid energy level', () => {
    const result = HourlyAverageSchema.safeParse({
      hour: 10,
      averageEnergy: 15,
      sampleCount: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe('TimePeriodPeakSchema', () => {
  it('should validate a period peak', () => {
    const peak = {
      period: 'morning' as const,
      peakHour: 10,
      averageEnergy: 8.2,
      sampleCount: 12,
    };
    const result = TimePeriodPeakSchema.safeParse(peak);
    expect(result.success).toBe(true);
  });

  it('should allow null for no data in period', () => {
    const result = TimePeriodPeakSchema.nullable().safeParse(null);
    expect(result.success).toBe(true);
  });
});

describe('BPTAnalysisSchema', () => {
  it('should validate complete BPT analysis', () => {
    const analysis: BPTAnalysis = {
      overallPeak: { hour: 10, averageEnergy: 8.5, sampleCount: 20 },
      morningPeak: { period: 'morning', peakHour: 10, averageEnergy: 8.5, sampleCount: 8 },
      afternoonPeak: { period: 'afternoon', peakHour: 14, averageEnergy: 7.2, sampleCount: 6 },
      eveningPeak: { period: 'evening', peakHour: 20, averageEnergy: 6.8, sampleCount: 6 },
      hourlyAverages: [
        { hour: 9, averageEnergy: 7.0, sampleCount: 4 },
        { hour: 10, averageEnergy: 8.5, sampleCount: 5 },
      ],
      totalLogs: 20,
      uniqueDays: 5,
      analyzedAt: '2026-02-01T12:00:00Z',
    };
    const result = BPTAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(true);
  });

  it('should allow null period peaks', () => {
    const analysis: BPTAnalysis = {
      overallPeak: { hour: 10, averageEnergy: 8.5, sampleCount: 10 },
      morningPeak: { period: 'morning', peakHour: 10, averageEnergy: 8.5, sampleCount: 10 },
      afternoonPeak: null,
      eveningPeak: null,
      hourlyAverages: [{ hour: 10, averageEnergy: 8.5, sampleCount: 10 }],
      totalLogs: 10,
      uniqueDays: 2,
      analyzedAt: '2026-02-01T12:00:00Z',
    };
    const result = BPTAnalysisSchema.safeParse(analysis);
    expect(result.success).toBe(true);
  });
});

describe('groupLogsByHour', () => {
  it('should group logs by hour', () => {
    const logs: EnergyLogForAnalysis[] = [
      createMockLog({ hour: 9, energyLevel: 6 }),
      createMockLog({ hour: 10, energyLevel: 8 }),
      createMockLog({ hour: 9, energyLevel: 7 }),
      createMockLog({ hour: 10, energyLevel: 9 }),
    ];

    const grouped = groupLogsByHour(logs);

    expect(grouped.get(9)).toHaveLength(2);
    expect(grouped.get(10)).toHaveLength(2);
    expect(grouped.get(11)).toBeUndefined();
  });

  it('should handle empty logs', () => {
    const grouped = groupLogsByHour([]);
    expect(grouped.size).toBe(0);
  });

  it('should handle single log', () => {
    const logs = [createMockLog({ hour: 14, energyLevel: 5 })];
    const grouped = groupLogsByHour(logs);
    expect(grouped.get(14)).toHaveLength(1);
  });
});

describe('calculateHourlyAverages', () => {
  it('should calculate correct averages', () => {
    const logs: EnergyLogForAnalysis[] = [
      createMockLog({ hour: 10, energyLevel: 6 }),
      createMockLog({ hour: 10, energyLevel: 8 }),
      createMockLog({ hour: 10, energyLevel: 10 }),
    ];

    const averages = calculateHourlyAverages(logs);

    expect(averages).toHaveLength(1);
    expect(averages[0].hour).toBe(10);
    expect(averages[0].averageEnergy).toBe(8); // (6+8+10)/3 = 8
    expect(averages[0].sampleCount).toBe(3);
  });

  it('should sort averages by hour', () => {
    const logs: EnergyLogForAnalysis[] = [
      createMockLog({ hour: 14, energyLevel: 5 }),
      createMockLog({ hour: 9, energyLevel: 7 }),
      createMockLog({ hour: 18, energyLevel: 6 }),
    ];

    const averages = calculateHourlyAverages(logs);

    expect(averages[0].hour).toBe(9);
    expect(averages[1].hour).toBe(14);
    expect(averages[2].hour).toBe(18);
  });

  it('should round averages to one decimal', () => {
    const logs: EnergyLogForAnalysis[] = [
      createMockLog({ hour: 10, energyLevel: 7 }),
      createMockLog({ hour: 10, energyLevel: 8 }),
      createMockLog({ hour: 10, energyLevel: 7 }),
    ];

    const averages = calculateHourlyAverages(logs);
    // (7+8+7)/3 = 7.333... should round to 7.3
    expect(averages[0].averageEnergy).toBe(7.3);
  });
});

describe('findPeakInPeriod', () => {
  const averages: HourlyAverage[] = [
    { hour: 8, averageEnergy: 6.0, sampleCount: 3 },
    { hour: 9, averageEnergy: 7.5, sampleCount: 4 },
    { hour: 10, averageEnergy: 8.0, sampleCount: 5 },
    { hour: 14, averageEnergy: 6.5, sampleCount: 3 },
    { hour: 15, averageEnergy: 7.0, sampleCount: 4 },
    { hour: 20, averageEnergy: 5.5, sampleCount: 2 },
  ];

  it('should find morning peak (6-11)', () => {
    const peak = findPeakInPeriod(averages, 'morning');

    expect(peak).not.toBeNull();
    expect(peak!.period).toBe('morning');
    expect(peak!.peakHour).toBe(10);
    expect(peak!.averageEnergy).toBe(8.0);
    expect(peak!.sampleCount).toBe(5);
  });

  it('should find afternoon peak (12-17)', () => {
    const peak = findPeakInPeriod(averages, 'afternoon');

    expect(peak).not.toBeNull();
    expect(peak!.period).toBe('afternoon');
    expect(peak!.peakHour).toBe(15);
    expect(peak!.averageEnergy).toBe(7.0);
  });

  it('should find evening peak (18-23)', () => {
    const peak = findPeakInPeriod(averages, 'evening');

    expect(peak).not.toBeNull();
    expect(peak!.period).toBe('evening');
    expect(peak!.peakHour).toBe(20);
    expect(peak!.averageEnergy).toBe(5.5);
  });

  it('should return null when no data in period', () => {
    const morningOnly: HourlyAverage[] = [
      { hour: 9, averageEnergy: 7.0, sampleCount: 3 },
    ];

    const afternoonPeak = findPeakInPeriod(morningOnly, 'afternoon');
    expect(afternoonPeak).toBeNull();
  });
});

describe('analyzeBPT', () => {
  it('should return null with insufficient data', () => {
    const logs: EnergyLogForAnalysis[] = [
      createMockLog({ hour: 10, energyLevel: 7 }),
    ];

    const result = analyzeBPT(logs);
    expect(result).toBeNull();
  });

  it('should analyze with minimum required logs', () => {
    // Create MINIMUM_LOGS_FOR_ANALYSIS logs
    const logs: EnergyLogForAnalysis[] = [];
    for (let i = 0; i < MINIMUM_LOGS_FOR_ANALYSIS; i++) {
      logs.push(
        createMockLog({
          loggedAt: `2026-02-0${Math.floor(i / 3) + 1}T10:00:00Z`,
          hour: 9 + (i % 3),
          energyLevel: 6 + (i % 5),
        })
      );
    }

    const result = analyzeBPT(logs);

    expect(result).not.toBeNull();
    expect(result!.totalLogs).toBe(MINIMUM_LOGS_FOR_ANALYSIS);
    expect(result!.overallPeak).toBeDefined();
    expect(result!.hourlyAverages.length).toBeGreaterThan(0);
  });

  it('should identify correct overall peak', () => {
    const logs: EnergyLogForAnalysis[] = [
      // Morning data - highest energy
      createMockLog({ loggedAt: '2026-02-01T10:00:00Z', hour: 10, energyLevel: 9 }),
      createMockLog({ loggedAt: '2026-02-02T10:00:00Z', hour: 10, energyLevel: 10 }),
      createMockLog({ loggedAt: '2026-02-03T10:00:00Z', hour: 10, energyLevel: 9 }),
      // Afternoon data - medium energy
      createMockLog({ loggedAt: '2026-02-01T14:00:00Z', hour: 14, energyLevel: 6 }),
      createMockLog({ loggedAt: '2026-02-02T14:00:00Z', hour: 14, energyLevel: 7 }),
      createMockLog({ loggedAt: '2026-02-03T14:00:00Z', hour: 14, energyLevel: 6 }),
      // Evening data - low energy
      createMockLog({ loggedAt: '2026-02-01T20:00:00Z', hour: 20, energyLevel: 4 }),
      createMockLog({ loggedAt: '2026-02-02T20:00:00Z', hour: 20, energyLevel: 5 }),
    ];

    const result = analyzeBPT(logs);

    expect(result).not.toBeNull();
    expect(result!.overallPeak.hour).toBe(10);
    expect(result!.overallPeak.averageEnergy).toBeCloseTo(9.3, 1);
  });

  it('should count unique days correctly', () => {
    const logs: EnergyLogForAnalysis[] = [
      createMockLog({ loggedAt: '2026-02-01T09:00:00Z', hour: 9, energyLevel: 7 }),
      createMockLog({ loggedAt: '2026-02-01T10:00:00Z', hour: 10, energyLevel: 8 }),
      createMockLog({ loggedAt: '2026-02-02T09:00:00Z', hour: 9, energyLevel: 6 }),
      createMockLog({ loggedAt: '2026-02-02T10:00:00Z', hour: 10, energyLevel: 7 }),
      createMockLog({ loggedAt: '2026-02-03T09:00:00Z', hour: 9, energyLevel: 8 }),
      createMockLog({ loggedAt: '2026-02-03T14:00:00Z', hour: 14, energyLevel: 5 }),
      createMockLog({ loggedAt: '2026-02-04T09:00:00Z', hour: 9, energyLevel: 7 }),
      createMockLog({ loggedAt: '2026-02-04T14:00:00Z', hour: 14, energyLevel: 6 }),
    ];

    const result = analyzeBPT(logs);

    expect(result).not.toBeNull();
    expect(result!.uniqueDays).toBe(4);
  });

  it('should include analyzedAt timestamp', () => {
    const logs: EnergyLogForAnalysis[] = [];
    for (let i = 0; i < MINIMUM_LOGS_FOR_ANALYSIS; i++) {
      logs.push(createMockLog({ hour: 10, energyLevel: 7 }));
    }

    const result = analyzeBPT(logs);

    expect(result).not.toBeNull();
    expect(result!.analyzedAt).toBeDefined();
    // Should be a valid ISO timestamp
    expect(() => new Date(result!.analyzedAt)).not.toThrow();
  });
});

describe('getAnalysisReadiness', () => {
  it('should return not ready with no logs', () => {
    const readiness = getAnalysisReadiness([]);

    expect(readiness.isReady).toBe(false);
    expect(readiness.currentLogs).toBe(0);
    expect(readiness.requiredLogs).toBe(MINIMUM_LOGS_FOR_ANALYSIS);
    expect(readiness.percentComplete).toBe(0);
  });

  it('should return ready when minimum logs reached', () => {
    const logs: EnergyLogForAnalysis[] = [];
    for (let i = 0; i < MINIMUM_LOGS_FOR_ANALYSIS; i++) {
      logs.push(createMockLog({ hour: 10, energyLevel: 7 }));
    }

    const readiness = getAnalysisReadiness(logs);

    expect(readiness.isReady).toBe(true);
    expect(readiness.percentComplete).toBe(100);
  });

  it('should calculate percentage correctly', () => {
    const logs: EnergyLogForAnalysis[] = [];
    const halfRequired = Math.floor(MINIMUM_LOGS_FOR_ANALYSIS / 2);
    for (let i = 0; i < halfRequired; i++) {
      logs.push(createMockLog({ hour: 10, energyLevel: 7 }));
    }

    const readiness = getAnalysisReadiness(logs);

    expect(readiness.isReady).toBe(false);
    expect(readiness.percentComplete).toBe(50);
  });

  it('should cap percentage at 100', () => {
    const logs: EnergyLogForAnalysis[] = [];
    for (let i = 0; i < MINIMUM_LOGS_FOR_ANALYSIS * 2; i++) {
      logs.push(createMockLog({ hour: 10, energyLevel: 7 }));
    }

    const readiness = getAnalysisReadiness(logs);

    expect(readiness.percentComplete).toBe(100);
  });

  it('should count unique days', () => {
    const logs: EnergyLogForAnalysis[] = [
      createMockLog({ loggedAt: '2026-02-01T10:00:00Z' }),
      createMockLog({ loggedAt: '2026-02-01T11:00:00Z' }),
      createMockLog({ loggedAt: '2026-02-02T10:00:00Z' }),
      createMockLog({ loggedAt: '2026-02-03T10:00:00Z' }),
    ];

    const readiness = getAnalysisReadiness(logs);

    expect(readiness.uniqueDays).toBe(3);
  });
});

describe('formatBPTSummary', () => {
  it('should format complete analysis', () => {
    const analysis: BPTAnalysis = {
      overallPeak: { hour: 10, averageEnergy: 8.5, sampleCount: 20 },
      morningPeak: { period: 'morning', peakHour: 10, averageEnergy: 8.5, sampleCount: 10 },
      afternoonPeak: { period: 'afternoon', peakHour: 14, averageEnergy: 7.0, sampleCount: 5 },
      eveningPeak: { period: 'evening', peakHour: 20, averageEnergy: 5.5, sampleCount: 5 },
      hourlyAverages: [],
      totalLogs: 20,
      uniqueDays: 5,
      analyzedAt: '2026-02-01T12:00:00Z',
    };

    const summary = formatBPTSummary(analysis);

    expect(summary).toContain('10am');
    expect(summary).toContain('8.5');
    expect(summary).toContain('Biological Prime Time');
  });

  it('should handle null period peaks', () => {
    const analysis: BPTAnalysis = {
      overallPeak: { hour: 10, averageEnergy: 8.0, sampleCount: 10 },
      morningPeak: { period: 'morning', peakHour: 10, averageEnergy: 8.0, sampleCount: 10 },
      afternoonPeak: null,
      eveningPeak: null,
      hourlyAverages: [],
      totalLogs: 10,
      uniqueDays: 2,
      analyzedAt: '2026-02-01T12:00:00Z',
    };

    const summary = formatBPTSummary(analysis);

    expect(summary).toContain('10am');
    expect(summary).not.toContain('undefined');
  });

  it('should format hours correctly', () => {
    const analysis: BPTAnalysis = {
      overallPeak: { hour: 14, averageEnergy: 8.0, sampleCount: 10 },
      morningPeak: null,
      afternoonPeak: { period: 'afternoon', peakHour: 14, averageEnergy: 8.0, sampleCount: 10 },
      eveningPeak: null,
      hourlyAverages: [],
      totalLogs: 10,
      uniqueDays: 2,
      analyzedAt: '2026-02-01T12:00:00Z',
    };

    const summary = formatBPTSummary(analysis);

    expect(summary).toContain('2pm'); // 14:00 should be 2pm
  });
});

describe('TIME_PERIODS constant', () => {
  it('should have correct morning range', () => {
    expect(TIME_PERIODS.morning.start).toBe(6);
    expect(TIME_PERIODS.morning.end).toBe(11);
  });

  it('should have correct afternoon range', () => {
    expect(TIME_PERIODS.afternoon.start).toBe(12);
    expect(TIME_PERIODS.afternoon.end).toBe(17);
  });

  it('should have correct evening range', () => {
    expect(TIME_PERIODS.evening.start).toBe(18);
    expect(TIME_PERIODS.evening.end).toBe(23);
  });
});
