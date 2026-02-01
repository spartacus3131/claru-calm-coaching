/**
 * @file streaks.test.ts
 * @description Tests for F028 Streak Tracking types and utilities
 * @module modules/engagement
 *
 * Per 001-tdd.mdc: Tests define WHAT should happen.
 */

import {
  RecordEngagementSchema,
  toEngagementRecord,
  toStreakSummary,
  toDbInsert,
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
  type DbEngagementRecord,
  type DbStreakSummary,
  type StreakSummary,
} from './streaks';

describe('ENGAGEMENT_TYPES', () => {
  it('should have 3 engagement types', () => {
    expect(ENGAGEMENT_TYPES).toHaveLength(3);
  });

  it('should include expected types', () => {
    expect(ENGAGEMENT_TYPES).toContain('morning_checkin');
    expect(ENGAGEMENT_TYPES).toContain('evening_checkin');
    expect(ENGAGEMENT_TYPES).toContain('hotspots_checkin');
  });
});

describe('STREAK_MILESTONES', () => {
  it('should have milestone values in ascending order', () => {
    for (let i = 1; i < STREAK_MILESTONES.length; i++) {
      expect(STREAK_MILESTONES[i]).toBeGreaterThan(STREAK_MILESTONES[i - 1]);
    }
  });

  it('should include key milestones', () => {
    expect(STREAK_MILESTONES).toContain(7);
    expect(STREAK_MILESTONES).toContain(30);
    expect(STREAK_MILESTONES).toContain(365);
  });
});

describe('RecordEngagementSchema', () => {
  it('should accept valid engagement', () => {
    const result = RecordEngagementSchema.safeParse({
      engagementType: 'morning_checkin',
    });
    expect(result.success).toBe(true);
  });

  it('should accept with session ID', () => {
    const result = RecordEngagementSchema.safeParse({
      engagementType: 'evening_checkin',
      sessionId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid engagement type', () => {
    const result = RecordEngagementSchema.safeParse({
      engagementType: 'invalid_type',
    });
    expect(result.success).toBe(false);
  });

  it('should reject invalid session ID format', () => {
    const result = RecordEngagementSchema.safeParse({
      engagementType: 'morning_checkin',
      sessionId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

describe('toEngagementRecord', () => {
  it('should convert database record to domain entity', () => {
    const dbRecord: DbEngagementRecord = {
      id: 'record-id',
      user_id: 'user-id',
      date: '2026-02-01',
      engagement_type: 'morning_checkin',
      completed_at: '2026-02-01T08:00:00Z',
      session_id: 'session-id',
      created_at: '2026-02-01T08:00:00Z',
    };

    const result = toEngagementRecord(dbRecord);

    expect(result.id).toBe('record-id');
    expect(result.userId).toBe('user-id');
    expect(result.date).toBe('2026-02-01');
    expect(result.engagementType).toBe('morning_checkin');
    expect(result.sessionId).toBe('session-id');
    expect(result.completedAt).toBeInstanceOf(Date);
  });

  it('should handle null session ID', () => {
    const dbRecord: DbEngagementRecord = {
      id: 'record-id',
      user_id: 'user-id',
      date: '2026-02-01',
      engagement_type: 'hotspots_checkin',
      completed_at: '2026-02-01T08:00:00Z',
      session_id: null,
      created_at: '2026-02-01T08:00:00Z',
    };

    const result = toEngagementRecord(dbRecord);
    expect(result.sessionId).toBeUndefined();
  });
});

describe('toStreakSummary', () => {
  it('should convert database summary to domain entity', () => {
    const dbSummary: DbStreakSummary = {
      user_id: 'user-id',
      current_streak: 7,
      longest_streak: 14,
      last_checkin_date: '2026-02-01',
      total_checkins: 25,
      updated_at: '2026-02-01T08:00:00Z',
    };

    const result = toStreakSummary(dbSummary);

    expect(result.userId).toBe('user-id');
    expect(result.currentStreak).toBe(7);
    expect(result.longestStreak).toBe(14);
    expect(result.lastCheckinDate).toBe('2026-02-01');
    expect(result.totalCheckins).toBe(25);
  });
});

describe('toDbInsert', () => {
  it('should convert input to database format', () => {
    const input = { engagementType: 'morning_checkin' as const };
    const result = toDbInsert(input, 'user-123', '2026-02-01');

    expect(result.user_id).toBe('user-123');
    expect(result.date).toBe('2026-02-01');
    expect(result.engagement_type).toBe('morning_checkin');
    expect(result.session_id).toBeNull();
    expect(result.completed_at).toBeDefined();
  });

  it('should include session ID if provided', () => {
    const input = {
      engagementType: 'morning_checkin' as const,
      sessionId: 'session-123',
    };
    const result = toDbInsert(input, 'user-123', '2026-02-01');

    expect(result.session_id).toBe('session-123');
  });
});

describe('isStreakActive', () => {
  const getDateString = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  it('should return true if checked in today', () => {
    expect(isStreakActive(getDateString(0))).toBe(true);
  });

  it('should return true if checked in yesterday', () => {
    expect(isStreakActive(getDateString(1))).toBe(true);
  });

  it('should return false if checked in 2+ days ago', () => {
    expect(isStreakActive(getDateString(2))).toBe(false);
  });

  it('should return false for null', () => {
    expect(isStreakActive(null)).toBe(false);
  });
});

describe('hasCheckedInToday', () => {
  it('should return true for today', () => {
    const today = new Date().toISOString().split('T')[0];
    expect(hasCheckedInToday(today)).toBe(true);
  });

  it('should return false for yesterday', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    expect(hasCheckedInToday(yesterday.toISOString().split('T')[0])).toBe(false);
  });

  it('should return false for null', () => {
    expect(hasCheckedInToday(null)).toBe(false);
  });
});

describe('getCurrentMilestone', () => {
  it('should return milestone for exact match', () => {
    expect(getCurrentMilestone(7)).toBe(7);
    expect(getCurrentMilestone(30)).toBe(30);
    expect(getCurrentMilestone(365)).toBe(365);
  });

  it('should return null for non-milestone values', () => {
    expect(getCurrentMilestone(5)).toBeNull();
    expect(getCurrentMilestone(8)).toBeNull();
    expect(getCurrentMilestone(100)).toBeNull();
  });
});

describe('getNextMilestone', () => {
  it('should return next milestone', () => {
    expect(getNextMilestone(0)).toBe(3);
    expect(getNextMilestone(5)).toBe(7);
    expect(getNextMilestone(7)).toBe(14);
    expect(getNextMilestone(180)).toBe(365);
  });

  it('should return null if past all milestones', () => {
    expect(getNextMilestone(365)).toBeNull();
    expect(getNextMilestone(500)).toBeNull();
  });
});

describe('getDaysToNextMilestone', () => {
  it('should return days remaining', () => {
    expect(getDaysToNextMilestone(0)).toBe(3);
    expect(getDaysToNextMilestone(5)).toBe(2);
    expect(getDaysToNextMilestone(25)).toBe(5);
  });

  it('should return null if past all milestones', () => {
    expect(getDaysToNextMilestone(365)).toBeNull();
  });
});

describe('formatStreakLabel', () => {
  it('should format zero', () => {
    expect(formatStreakLabel(0)).toBe('No streak');
  });

  it('should format singular', () => {
    expect(formatStreakLabel(1)).toBe('1 day');
  });

  it('should format plural', () => {
    expect(formatStreakLabel(5)).toBe('5 days');
    expect(formatStreakLabel(30)).toBe('30 days');
  });
});

describe('getStreakMessage', () => {
  const createSummary = (overrides: Partial<StreakSummary> = {}): StreakSummary => ({
    userId: 'user-id',
    currentStreak: 0,
    longestStreak: 0,
    lastCheckinDate: null,
    totalCheckins: 0,
    updatedAt: new Date(),
    ...overrides,
  });

  it('should return milestone message', () => {
    const summary = createSummary({ currentStreak: 7 });
    expect(getStreakMessage(summary)).toContain('7-day streak');
  });

  it('should encourage starting fresh if streak broken', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 5);
    const summary = createSummary({
      currentStreak: 0,
      longestStreak: 10,
      lastCheckinDate: oldDate.toISOString().split('T')[0],
    });
    expect(getStreakMessage(summary)).toContain('start fresh');
  });

  it('should warn about breaking streak', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const summary = createSummary({
      currentStreak: 5,
      lastCheckinDate: yesterday.toISOString().split('T')[0],
    });
    expect(getStreakMessage(summary)).toContain("Don't break");
  });

  it('should encourage starting', () => {
    const summary = createSummary();
    expect(getStreakMessage(summary)).toContain('Start your streak');
  });
});

describe('toStreakDisplay', () => {
  it('should handle null summary', () => {
    const result = toStreakDisplay(null);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
    expect(result.isActive).toBe(false);
    expect(result.milestone).toBeNull();
  });

  it('should convert summary to display format', () => {
    const today = new Date().toISOString().split('T')[0];
    const summary: StreakSummary = {
      userId: 'user-id',
      currentStreak: 7,
      longestStreak: 14,
      lastCheckinDate: today,
      totalCheckins: 30,
      updatedAt: new Date(),
    };

    const result = toStreakDisplay(summary);

    expect(result.current).toBe(7);
    expect(result.longest).toBe(14);
    expect(result.total).toBe(30);
    expect(result.isActive).toBe(true);
    expect(result.milestone).toBe(7);
  });
});

describe('calculateStreakFromDates', () => {
  const getDateString = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  it('should return 0 for empty array', () => {
    const result = calculateStreakFromDates([]);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(0);
  });

  it('should calculate current streak', () => {
    const dates = [
      getDateString(0), // today
      getDateString(1), // yesterday
      getDateString(2), // 2 days ago
    ];
    const result = calculateStreakFromDates(dates);
    expect(result.current).toBe(3);
  });

  it('should detect broken streak', () => {
    const dates = [
      getDateString(3), // 3 days ago (gap)
      getDateString(4), // 4 days ago
      getDateString(5), // 5 days ago
    ];
    const result = calculateStreakFromDates(dates);
    expect(result.current).toBe(0);
    expect(result.longest).toBe(3);
  });

  it('should calculate longest streak with gap', () => {
    const dates = [
      getDateString(0), // today
      getDateString(1), // yesterday
      // gap
      getDateString(5), // 5 days ago
      getDateString(6),
      getDateString(7),
      getDateString(8),
    ];
    const result = calculateStreakFromDates(dates);
    expect(result.current).toBe(2);
    expect(result.longest).toBe(4);
  });
});
