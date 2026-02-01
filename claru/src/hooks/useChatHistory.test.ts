/**
 * @file useChatHistory.test.ts
 * @description Tests for useChatHistory hook - F031 Chat History Persistence
 * @module hooks
 *
 * Tests loading, saving, and migration of chat messages.
 * Per 001-tdd.mdc: Write tests first before implementation.
 */

import { renderHook, act, waitFor } from '@testing-library/react';

// Mock Supabase client before importing the hook
const mockSupabaseClient = {
  from: jest.fn(),
  auth: {
    getUser: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
};

// Mock the query builder
const mockQueryBuilder = {
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  single: jest.fn(),
};

mockSupabaseClient.from.mockReturnValue(mockQueryBuilder);

jest.mock('@/lib/supabase/client', () => ({
  createBrowserSupabase: () => mockSupabaseClient,
}));

// Import after mocking
import {
  useChatHistory,
  ChatHistoryMessage,
  loadChatHistory,
  saveChatMessage,
  migrateTryModeMessages,
} from './useChatHistory';
import { TryModeMessage, clearTrialMessages } from './useTryMode';

// Mock clearTrialMessages
jest.mock('./useTryMode', () => ({
  ...jest.requireActual('./useTryMode'),
  clearTrialMessages: jest.fn(),
}));

describe('useChatHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryBuilder.select.mockReturnThis();
    mockQueryBuilder.insert.mockReturnThis();
    mockQueryBuilder.eq.mockReturnThis();
    mockQueryBuilder.order.mockReturnThis();
  });

  describe('loadChatHistory', () => {
    it('should load messages for authenticated user', async () => {
      const mockMessages: ChatHistoryMessage[] = [
        {
          id: '1',
          user_id: 'user-123',
          role: 'user',
          content: 'Hello',
          metadata: {},
          created_at: '2026-02-01T10:00:00Z',
        },
        {
          id: '2',
          user_id: 'user-123',
          role: 'assistant',
          content: 'Hi there',
          metadata: {},
          created_at: '2026-02-01T10:00:01Z',
        },
      ];

      mockQueryBuilder.order.mockResolvedValueOnce({
        data: mockMessages,
        error: null,
      });

      const result = await loadChatHistory(mockSupabaseClient as never, 'user-123');

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_messages');
      expect(mockQueryBuilder.select).toHaveBeenCalledWith('*');
      expect(mockQueryBuilder.eq).toHaveBeenCalledWith('user_id', 'user-123');
      expect(mockQueryBuilder.order).toHaveBeenCalledWith('created_at', { ascending: true });
      expect(result).toHaveLength(2);
      expect(result[0].content).toBe('Hello');
    });

    it('should return empty array on error', async () => {
      mockQueryBuilder.order.mockResolvedValueOnce({
        data: null,
        error: { message: 'Database error' },
      });

      const result = await loadChatHistory(mockSupabaseClient as never, 'user-123');

      expect(result).toEqual([]);
    });

    it('should return empty array when no messages exist', async () => {
      mockQueryBuilder.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const result = await loadChatHistory(mockSupabaseClient as never, 'user-123');

      expect(result).toEqual([]);
    });
  });

  describe('saveChatMessage', () => {
    it('should save a message to the database', async () => {
      const savedMessage = {
        id: 'new-msg-1',
        user_id: 'user-123',
        role: 'user',
        content: 'Test message',
        metadata: {},
        created_at: '2026-02-01T10:00:00Z',
      };

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: savedMessage,
        error: null,
      });

      const result = await saveChatMessage(mockSupabaseClient as never, {
        userId: 'user-123',
        role: 'user',
        content: 'Test message',
      });

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_messages');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        role: 'user',
        content: 'Test message',
        metadata: {},
      });
      expect(result).toEqual(savedMessage);
    });

    it('should include metadata when provided', async () => {
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: { id: 'msg-1' },
        error: null,
      });

      await saveChatMessage(mockSupabaseClient as never, {
        userId: 'user-123',
        role: 'assistant',
        content: 'Response',
        metadata: { source: 'morning_checkin' },
      });

      expect(mockQueryBuilder.insert).toHaveBeenCalledWith({
        user_id: 'user-123',
        role: 'assistant',
        content: 'Response',
        metadata: { source: 'morning_checkin' },
      });
    });

    it('should return null on error', async () => {
      mockQueryBuilder.single.mockResolvedValueOnce({
        data: null,
        error: { message: 'Insert failed' },
      });

      const result = await saveChatMessage(mockSupabaseClient as never, {
        userId: 'user-123',
        role: 'user',
        content: 'Test',
      });

      expect(result).toBeNull();
    });
  });

  describe('migrateTryModeMessages', () => {
    it('should migrate trial messages to database', async () => {
      const trialMessages: TryModeMessage[] = [
        { id: 'trial-1', role: 'user', content: 'Hello', createdAt: '2026-02-01T10:00:00Z' },
        { id: 'trial-2', role: 'assistant', content: 'Hi', createdAt: '2026-02-01T10:00:01Z' },
      ];

      mockQueryBuilder.select.mockResolvedValueOnce({
        data: [
          { id: 'db-1', user_id: 'user-123', role: 'user', content: 'Hello', metadata: { source: 'trial_migration' }, created_at: '2026-02-01T10:00:00Z' },
          { id: 'db-2', user_id: 'user-123', role: 'assistant', content: 'Hi', metadata: { source: 'trial_migration' }, created_at: '2026-02-01T10:00:01Z' },
        ],
        error: null,
      });

      const result = await migrateTryModeMessages(
        mockSupabaseClient as never,
        'user-123',
        trialMessages
      );

      expect(mockSupabaseClient.from).toHaveBeenCalledWith('chat_messages');
      expect(mockQueryBuilder.insert).toHaveBeenCalledWith([
        {
          user_id: 'user-123',
          role: 'user',
          content: 'Hello',
          metadata: { source: 'trial_migration', original_id: 'trial-1' },
          created_at: '2026-02-01T10:00:00Z',
        },
        {
          user_id: 'user-123',
          role: 'assistant',
          content: 'Hi',
          metadata: { source: 'trial_migration', original_id: 'trial-2' },
          created_at: '2026-02-01T10:00:01Z',
        },
      ]);
      expect(result).toHaveLength(2);
    });

    it('should clear trial messages after successful migration', async () => {
      mockQueryBuilder.select.mockResolvedValueOnce({
        data: [{ id: 'db-1' }],
        error: null,
      });

      await migrateTryModeMessages(mockSupabaseClient as never, 'user-123', [
        { id: 'trial-1', role: 'user', content: 'Test', createdAt: '2026-02-01T10:00:00Z' },
      ]);

      expect(clearTrialMessages).toHaveBeenCalled();
    });

    it('should return empty array and not clear on error', async () => {
      mockQueryBuilder.select.mockResolvedValueOnce({
        data: null,
        error: { message: 'Migration failed' },
      });

      const result = await migrateTryModeMessages(mockSupabaseClient as never, 'user-123', [
        { id: 'trial-1', role: 'user', content: 'Test', createdAt: '2026-02-01T10:00:00Z' },
      ]);

      expect(result).toEqual([]);
      expect(clearTrialMessages).not.toHaveBeenCalled();
    });

    it('should return empty array when no messages to migrate', async () => {
      const result = await migrateTryModeMessages(mockSupabaseClient as never, 'user-123', []);

      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('useChatHistory hook', () => {
    it('should start in loading state', () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useChatHistory());

      expect(result.current.loading).toBe(true);
      expect(result.current.messages).toEqual([]);
    });

    it('should set isAuthenticated to false when no user', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useChatHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load messages when user is authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };
      const mockMessages: ChatHistoryMessage[] = [
        {
          id: '1',
          user_id: 'user-123',
          role: 'user',
          content: 'Hello',
          metadata: {},
          created_at: '2026-02-01T10:00:00Z',
        },
      ];

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockQueryBuilder.order.mockResolvedValueOnce({
        data: mockMessages,
        error: null,
      });

      const { result } = renderHook(() => useChatHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Hello');
    });

    it('should add message locally and persist to database when authenticated', async () => {
      const mockUser = { id: 'user-123', email: 'test@example.com' };

      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });

      mockQueryBuilder.order.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      mockQueryBuilder.single.mockResolvedValueOnce({
        data: {
          id: 'saved-msg-1',
          user_id: 'user-123',
          role: 'user',
          content: 'New message',
          metadata: {},
          created_at: '2026-02-01T10:00:00Z',
        },
        error: null,
      });

      const { result } = renderHook(() => useChatHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addMessage('user', 'New message');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('New message');
    });

    it('should add message locally without persistence when not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useChatHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addMessage('user', 'Local message');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].content).toBe('Local message');
      // Insert should not have been called since not authenticated
      expect(mockQueryBuilder.insert).not.toHaveBeenCalled();
    });

    it('should clear messages', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      const { result } = renderHook(() => useChatHistory());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.addMessage('user', 'Test');
      });

      expect(result.current.messages).toHaveLength(1);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
    });
  });
});
