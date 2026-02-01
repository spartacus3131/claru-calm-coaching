/**
 * Carryover & Parking Lot Detection Tests - F009
 *
 * Tests for detecting incomplete Top 3 items and parked items.
 */

import {
  getCarryoverItems,
  formatCarryoverForPrompt,
  formatParkedItemsForPrompt,
  type CarryoverInput,
} from './carryover';
import { createTop3Item, type DailyNote, type ParkedItem } from './types';

describe('Context Store - Carryover Detection', () => {
  const today = '2026-02-01';

  describe('getCarryoverItems', () => {
    it('returns empty array when no yesterday note exists', () => {
      const input: CarryoverInput = {
        yesterdayNote: null,
        today,
      };
      const result = getCarryoverItems(input);
      expect(result).toEqual([]);
    });

    it('returns empty array when yesterday has no plan', () => {
      const input: CarryoverInput = {
        yesterdayNote: {
          id: '1',
          userId: 'user-1',
          date: '2026-01-31',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        today,
      };
      const result = getCarryoverItems(input);
      expect(result).toEqual([]);
    });

    it('returns empty array when all Top 3 items are completed', () => {
      const input: CarryoverInput = {
        yesterdayNote: {
          id: '1',
          userId: 'user-1',
          date: '2026-01-31',
          plan: {
            top3: [
              createTop3Item({ text: 'Task 1', workType: 'deep_focus', completed: true }),
              createTop3Item({ text: 'Task 2', workType: 'admin', completed: true }),
              createTop3Item({ text: 'Task 3', workType: 'meeting', completed: true }),
            ],
            adminBatch: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        today,
      };
      const result = getCarryoverItems(input);
      expect(result).toEqual([]);
    });

    it('returns incomplete Top 3 items as carryover', () => {
      const input: CarryoverInput = {
        yesterdayNote: {
          id: '1',
          userId: 'user-1',
          date: '2026-01-31',
          plan: {
            top3: [
              createTop3Item({ text: 'Finish investor deck', workType: 'deep_focus', completed: false }),
              createTop3Item({ text: 'Review PRs', workType: 'admin', completed: true }),
              createTop3Item({ text: 'Prep for standup', workType: 'meeting', completed: false }),
            ],
            adminBatch: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        today,
      };
      const result = getCarryoverItems(input);
      
      expect(result).toHaveLength(2);
      expect(result[0].text).toBe('Finish investor deck');
      expect(result[0].workType).toBe('deep_focus');
      expect(result[0].originalDate).toBe('2026-01-31');
      expect(result[0].daysSinceOriginal).toBe(1);
      
      expect(result[1].text).toBe('Prep for standup');
    });

    it('calculates daysSinceOriginal correctly', () => {
      const input: CarryoverInput = {
        yesterdayNote: {
          id: '1',
          userId: 'user-1',
          date: '2026-01-29', // 3 days ago
          plan: {
            top3: [
              createTop3Item({ text: 'Old task', workType: 'deep_focus', completed: false }),
            ],
            adminBatch: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        today,
      };
      const result = getCarryoverItems(input);
      
      expect(result[0].daysSinceOriginal).toBe(3);
    });
  });

  describe('formatCarryoverForPrompt', () => {
    it('returns "None" when no carryover items', () => {
      const result = formatCarryoverForPrompt([]);
      expect(result).toBe('None');
    });

    it('formats single carryover item', () => {
      const result = formatCarryoverForPrompt([
        { text: 'Finish deck', workType: 'deep_focus', originalDate: '2026-01-31', daysSinceOriginal: 1 },
      ]);
      expect(result).toContain('Finish deck');
      expect(result).toContain('deep_focus');
    });

    it('formats multiple carryover items', () => {
      const result = formatCarryoverForPrompt([
        { text: 'Task 1', workType: 'deep_focus', originalDate: '2026-01-31', daysSinceOriginal: 1 },
        { text: 'Task 2', workType: 'admin', originalDate: '2026-01-31', daysSinceOriginal: 1 },
      ]);
      expect(result).toContain('Task 1');
      expect(result).toContain('Task 2');
    });

    it('flags items carrying over for multiple days', () => {
      const result = formatCarryoverForPrompt([
        { text: 'Stuck task', workType: 'deep_focus', originalDate: '2026-01-29', daysSinceOriginal: 3 },
      ]);
      expect(result).toContain('3 days');
    });
  });

  describe('formatParkedItemsForPrompt', () => {
    const makeParkedItem = (text: string, daysAgo: number = 0): ParkedItem => ({
      id: `parked-${Math.random()}`,
      userId: 'user-1',
      text,
      status: 'parked',
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
      updatedAt: new Date(),
    });

    it('returns "None" when no parked items', () => {
      const result = formatParkedItemsForPrompt([]);
      expect(result).toBe('None');
    });

    it('formats single parked item', () => {
      const result = formatParkedItemsForPrompt([
        makeParkedItem('Research competitors'),
      ]);
      expect(result).toContain('Research competitors');
    });

    it('formats multiple parked items', () => {
      const result = formatParkedItemsForPrompt([
        makeParkedItem('Research competitors'),
        makeParkedItem('Update resume'),
      ]);
      expect(result).toContain('Research competitors');
      expect(result).toContain('Update resume');
    });

    it('flags old parked items (7+ days)', () => {
      const result = formatParkedItemsForPrompt([
        makeParkedItem('Old task', 10),
      ]);
      expect(result).toContain('10 days');
    });

    it('includes reason if provided', () => {
      const item = makeParkedItem('Blocked task');
      item.reason = 'Waiting on client feedback';
      const result = formatParkedItemsForPrompt([item]);
      expect(result).toContain('Waiting on client feedback');
    });
  });
});
