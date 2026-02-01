/**
 * @file parkedItems.test.ts
 * @description Tests for F026 Parking Lot types and utilities
 * @module parking-lot
 *
 * Per 001-tdd.mdc: Tests written first to define expected behavior.
 * Per bounded-contexts.mdc: Parking Lot Manager owns parked items.
 */

import {
  ParkedItemSchema,
  CreateParkedItemSchema,
  UpdateParkedItemSchema,
  toParkedItem,
  toDbInsert,
  getDaysParked,
  isStale,
  canTransitionTo,
  formatDaysParkedLabel,
  PARKING_LOT_LIMIT,
  STALE_THRESHOLD_DAYS,
  type ParkedItem,
  type CreateParkedItemInput,
  type UpdateParkedItemInput,
  type ParkedItemStatus,
  type DbParkedItem,
} from './parkedItems';

// Helper to create mock parked items
function createMockParkedItem(overrides: Partial<ParkedItem> = {}): ParkedItem {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    userId: '550e8400-e29b-41d4-a716-446655440001',
    text: 'Research competitors',
    status: 'parked',
    parkedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe('ParkedItemSchema', () => {
  it('should validate a complete parked item', () => {
    const item: ParkedItem = createMockParkedItem();
    const result = ParkedItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should validate minimal parked item', () => {
    const item = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      userId: '550e8400-e29b-41d4-a716-446655440001',
      text: 'Task',
      status: 'parked',
      parkedAt: '2026-02-01T10:00:00Z',
      createdAt: '2026-02-01T10:00:00Z',
      updatedAt: '2026-02-01T10:00:00Z',
    };
    const result = ParkedItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should reject empty text', () => {
    const item = createMockParkedItem({ text: '' });
    const result = ParkedItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('should reject text over 500 chars', () => {
    const item = createMockParkedItem({ text: 'a'.repeat(501) });
    const result = ParkedItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('should accept valid statuses', () => {
    const statuses: ParkedItemStatus[] = ['parked', 'under_review', 'reactivated', 'deleted'];
    for (const status of statuses) {
      const item = createMockParkedItem({ status });
      const result = ParkedItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid status', () => {
    const item = createMockParkedItem({ status: 'invalid' as ParkedItemStatus });
    const result = ParkedItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('should accept optional reason', () => {
    const item = createMockParkedItem({ reason: 'Not urgent right now' });
    const result = ParkedItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });

  it('should reject reason over 200 chars', () => {
    const item = createMockParkedItem({ reason: 'a'.repeat(201) });
    const result = ParkedItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('should accept optional lastReviewedAt', () => {
    const item = createMockParkedItem({ lastReviewedAt: '2026-02-01T10:00:00Z' });
    const result = ParkedItemSchema.safeParse(item);
    expect(result.success).toBe(true);
  });
});

describe('CreateParkedItemSchema', () => {
  it('should validate minimal create input', () => {
    const input: CreateParkedItemInput = {
      text: 'New task to park',
    };
    const result = CreateParkedItemSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate full create input', () => {
    const input: CreateParkedItemInput = {
      text: 'New task to park',
      reason: 'Not urgent',
      source: 'check_in',
      projectId: '550e8400-e29b-41d4-a716-446655440002',
    };
    const result = CreateParkedItemSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject empty text', () => {
    const result = CreateParkedItemSchema.safeParse({ text: '' });
    expect(result.success).toBe(false);
  });

  it('should accept valid sources', () => {
    const sources = ['check_in', 'manual', 'ai_suggested'];
    for (const source of sources) {
      const result = CreateParkedItemSchema.safeParse({ text: 'Task', source });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid source', () => {
    const result = CreateParkedItemSchema.safeParse({ text: 'Task', source: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('UpdateParkedItemSchema', () => {
  it('should validate status update', () => {
    const input: UpdateParkedItemInput = {
      status: 'under_review',
    };
    const result = UpdateParkedItemSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate text update', () => {
    const input: UpdateParkedItemInput = {
      text: 'Updated task',
    };
    const result = UpdateParkedItemSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should validate lastReviewedAt update', () => {
    const input: UpdateParkedItemInput = {
      lastReviewedAt: '2026-02-01T10:00:00Z',
    };
    const result = UpdateParkedItemSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should allow empty object (no updates)', () => {
    const result = UpdateParkedItemSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});

describe('toParkedItem', () => {
  it('should convert database row to domain entity', () => {
    const dbRow: DbParkedItem = {
      id: 'item-id',
      user_id: 'user-id',
      text: 'Research task',
      reason: 'Not urgent',
      status: 'parked',
      parked_at: '2026-02-01T10:00:00Z',
      last_reviewed_at: null,
      source: 'manual',
      project_id: null,
      created_at: '2026-02-01T10:00:00Z',
      updated_at: '2026-02-01T10:00:00Z',
    };

    const result = toParkedItem(dbRow);

    expect(result.id).toBe('item-id');
    expect(result.userId).toBe('user-id');
    expect(result.text).toBe('Research task');
    expect(result.reason).toBe('Not urgent');
    expect(result.status).toBe('parked');
    expect(result.source).toBe('manual');
    expect(result.lastReviewedAt).toBeUndefined();
  });

  it('should handle null optional fields', () => {
    const dbRow: DbParkedItem = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      user_id: '550e8400-e29b-41d4-a716-446655440001',
      text: 'Task',
      reason: null,
      status: 'parked',
      parked_at: '2026-02-01T10:00:00Z',
      last_reviewed_at: null,
      source: null,
      project_id: null,
      created_at: '2026-02-01T10:00:00Z',
      updated_at: '2026-02-01T10:00:00Z',
    };

    const result = toParkedItem(dbRow);

    // Null fields converted to undefined
    expect(result.reason).toBeUndefined();
    expect(result.lastReviewedAt).toBeUndefined();
    expect(result.projectId).toBeUndefined();
    expect(result.source).toBeUndefined();
  });
});

describe('toDbInsert', () => {
  it('should convert create input to database format', () => {
    const input: CreateParkedItemInput = {
      text: 'New task',
      reason: 'Not urgent',
      source: 'check_in',
    };

    const result = toDbInsert(input, 'user-123');

    expect(result.user_id).toBe('user-123');
    expect(result.text).toBe('New task');
    expect(result.reason).toBe('Not urgent');
    expect(result.source).toBe('check_in');
    expect(result.status).toBe('parked');
  });

  it('should handle minimal input', () => {
    const input: CreateParkedItemInput = {
      text: 'Simple task',
    };

    const result = toDbInsert(input, 'user-123');

    expect(result.text).toBe('Simple task');
    expect(result.reason).toBeUndefined();
    expect(result.source).toBeUndefined();
  });
});

describe('getDaysParked', () => {
  it('should return 0 for today', () => {
    const item = createMockParkedItem({
      parkedAt: new Date().toISOString(),
    });
    expect(getDaysParked(item)).toBe(0);
  });

  it('should return correct days for past date', () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
    
    const item = createMockParkedItem({
      parkedAt: fiveDaysAgo.toISOString(),
    });
    
    expect(getDaysParked(item)).toBe(5);
  });
});

describe('isStale', () => {
  it('should return false for recent items', () => {
    const item = createMockParkedItem({
      parkedAt: new Date().toISOString(),
    });
    expect(isStale(item)).toBe(false);
  });

  it('should return true for items older than threshold', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - (STALE_THRESHOLD_DAYS + 1));
    
    const item = createMockParkedItem({
      parkedAt: oldDate.toISOString(),
    });
    
    expect(isStale(item)).toBe(true);
  });

  it('should return false when recently reviewed', () => {
    const oldParkedAt = new Date();
    oldParkedAt.setDate(oldParkedAt.getDate() - 40);
    
    const recentReview = new Date();
    recentReview.setDate(recentReview.getDate() - 5);
    
    const item = createMockParkedItem({
      parkedAt: oldParkedAt.toISOString(),
      lastReviewedAt: recentReview.toISOString(),
    });
    
    expect(isStale(item)).toBe(false);
  });
});

describe('canTransitionTo', () => {
  it('should allow parked → under_review', () => {
    expect(canTransitionTo('parked', 'under_review')).toBe(true);
  });

  it('should allow under_review → reactivated', () => {
    expect(canTransitionTo('under_review', 'reactivated')).toBe(true);
  });

  it('should allow under_review → parked (keep)', () => {
    expect(canTransitionTo('under_review', 'parked')).toBe(true);
  });

  it('should allow under_review → deleted', () => {
    expect(canTransitionTo('under_review', 'deleted')).toBe(true);
  });

  it('should not allow parked → reactivated directly', () => {
    expect(canTransitionTo('parked', 'reactivated')).toBe(false);
  });

  it('should not allow parked → deleted directly', () => {
    expect(canTransitionTo('parked', 'deleted')).toBe(false);
  });

  it('should not allow transitions from terminal states', () => {
    expect(canTransitionTo('reactivated', 'parked')).toBe(false);
    expect(canTransitionTo('deleted', 'parked')).toBe(false);
  });
});

describe('formatDaysParkedLabel', () => {
  it('should format "today" for 0 days', () => {
    expect(formatDaysParkedLabel(0)).toBe('parked today');
  });

  it('should format "yesterday" for 1 day', () => {
    expect(formatDaysParkedLabel(1)).toBe('parked yesterday');
  });

  it('should format "N days ago" for multiple days', () => {
    expect(formatDaysParkedLabel(5)).toBe('parked 5 days ago');
  });

  it('should format "1 week ago" for 7 days', () => {
    expect(formatDaysParkedLabel(7)).toBe('parked 1 week ago');
  });

  it('should format "N weeks ago" for multiple weeks', () => {
    expect(formatDaysParkedLabel(14)).toBe('parked 2 weeks ago');
    expect(formatDaysParkedLabel(21)).toBe('parked 3 weeks ago');
  });

  it('should format "1 month ago" for 30 days', () => {
    expect(formatDaysParkedLabel(30)).toBe('parked 1 month ago');
  });
});

describe('Constants', () => {
  it('should have parking lot limit of 50', () => {
    expect(PARKING_LOT_LIMIT).toBe(50);
  });

  it('should have stale threshold of 30 days', () => {
    expect(STALE_THRESHOLD_DAYS).toBe(30);
  });
});
