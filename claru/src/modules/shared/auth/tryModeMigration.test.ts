/**
 * @file tryModeMigration.test.ts
 * @description Tests for F029 Try Mode migration logic
 * @module shared/auth
 *
 * Tests the migration of trial messages to authenticated user's database.
 */

import { migrateTrialMessages, MigrationResult } from './tryModeMigration';
import { TryModeMessage } from '@/hooks/useTryMode';

// Mock fetch
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('migrateTrialMessages', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('successful migration', () => {
    it('should return success when messages are migrated', async () => {
      const messages: TryModeMessage[] = [
        { id: 'trial_1', role: 'user', content: 'Hello', createdAt: '2026-02-01T10:00:00Z' },
        { id: 'trial_2', role: 'assistant', content: 'Hi there', createdAt: '2026-02-01T10:00:01Z' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, migratedCount: 2 }),
      });

      const result = await migrateTrialMessages(messages);

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(2);
      expect(result.error).toBeUndefined();

      expect(mockFetch).toHaveBeenCalledWith('/api/chat/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });
    });

    it('should return success with 0 count for empty messages', async () => {
      const result = await migrateTrialMessages([]);

      expect(result.success).toBe(true);
      expect(result.migratedCount).toBe(0);
      expect(mockFetch).not.toHaveBeenCalled();
    });
  });

  describe('failed migration', () => {
    it('should return error when API fails', async () => {
      const messages: TryModeMessage[] = [
        { id: 'trial_1', role: 'user', content: 'Hello', createdAt: '2026-02-01T10:00:00Z' },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Unauthorized' }),
      });

      const result = await migrateTrialMessages(messages);

      expect(result.success).toBe(false);
      expect(result.migratedCount).toBe(0);
      expect(result.error).toBe('Unauthorized');
    });

    it('should return error on network failure', async () => {
      const messages: TryModeMessage[] = [
        { id: 'trial_1', role: 'user', content: 'Hello', createdAt: '2026-02-01T10:00:00Z' },
      ];

      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await migrateTrialMessages(messages);

      expect(result.success).toBe(false);
      expect(result.migratedCount).toBe(0);
      expect(result.error).toBe('Network error');
    });
  });

  describe('message validation', () => {
    it('should filter out invalid messages before migration', async () => {
      const messages: TryModeMessage[] = [
        { id: 'trial_1', role: 'user', content: 'Valid message', createdAt: '2026-02-01T10:00:00Z' },
        { id: '', role: 'user', content: 'No ID', createdAt: '2026-02-01T10:00:01Z' }, // invalid
        { id: 'trial_3', role: 'user', content: '', createdAt: '2026-02-01T10:00:02Z' }, // empty content is valid
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, migratedCount: 2 }),
      });

      await migrateTrialMessages(messages);

      const calledBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(calledBody.messages).toHaveLength(2);
      expect(calledBody.messages[0].id).toBe('trial_1');
      expect(calledBody.messages[1].id).toBe('trial_3');
    });
  });
});
