/**
 * @file useTryMode.test.ts
 * @description Tests for the useTryMode hook - F029 Try Mode
 * @module hooks
 *
 * Tests localStorage persistence and migration of trial messages.
 */

import { renderHook, act } from '@testing-library/react';
import {
  useTryMode,
  TryModeMessage,
  TRIAL_MESSAGES_KEY,
  getTrialMessages,
  saveTrialMessages,
  clearTrialMessages,
} from './useTryMode';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useTryMode', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should start with empty messages when localStorage is empty', () => {
      const { result } = renderHook(() => useTryMode());

      expect(result.current.messages).toEqual([]);
      expect(result.current.hasTrialData).toBe(false);
    });

    it('should load existing messages from localStorage', () => {
      const existingMessages: TryModeMessage[] = [
        { id: '1', role: 'user', content: 'Hello', createdAt: '2026-02-01T10:00:00Z' },
        { id: '2', role: 'assistant', content: 'Hi there', createdAt: '2026-02-01T10:00:01Z' },
      ];
      localStorageMock.setItem(TRIAL_MESSAGES_KEY, JSON.stringify(existingMessages));

      const { result } = renderHook(() => useTryMode());

      expect(result.current.messages).toHaveLength(2);
      expect(result.current.hasTrialData).toBe(true);
    });

    it('should handle malformed localStorage data gracefully', () => {
      localStorageMock.setItem(TRIAL_MESSAGES_KEY, 'not valid json');

      const { result } = renderHook(() => useTryMode());

      expect(result.current.messages).toEqual([]);
      expect(result.current.hasTrialData).toBe(false);
    });
  });

  describe('addMessage', () => {
    it('should add a message and persist to localStorage', () => {
      const { result } = renderHook(() => useTryMode());

      act(() => {
        result.current.addMessage('user', 'Test message');
      });

      expect(result.current.messages).toHaveLength(1);
      expect(result.current.messages[0].role).toBe('user');
      expect(result.current.messages[0].content).toBe('Test message');
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        TRIAL_MESSAGES_KEY,
        expect.any(String)
      );
    });

    it('should add multiple messages in sequence', () => {
      const { result } = renderHook(() => useTryMode());

      act(() => {
        result.current.addMessage('user', 'Hello');
      });
      act(() => {
        result.current.addMessage('assistant', 'Hi there');
      });
      act(() => {
        result.current.addMessage('user', 'How are you?');
      });

      expect(result.current.messages).toHaveLength(3);
      expect(result.current.messages[0].content).toBe('Hello');
      expect(result.current.messages[1].content).toBe('Hi there');
      expect(result.current.messages[2].content).toBe('How are you?');
    });

    it('should generate unique ids for each message', () => {
      const { result } = renderHook(() => useTryMode());

      act(() => {
        result.current.addMessage('user', 'First');
      });
      act(() => {
        result.current.addMessage('user', 'Second');
      });

      const ids = result.current.messages.map((m) => m.id);
      expect(new Set(ids).size).toBe(2);
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages and localStorage', () => {
      const { result } = renderHook(() => useTryMode());

      act(() => {
        result.current.addMessage('user', 'Test');
      });
      expect(result.current.messages).toHaveLength(1);

      act(() => {
        result.current.clearMessages();
      });

      expect(result.current.messages).toEqual([]);
      expect(localStorageMock.removeItem).toHaveBeenCalledWith(TRIAL_MESSAGES_KEY);
    });
  });

  describe('hasTrialData', () => {
    it('should return false when no messages', () => {
      const { result } = renderHook(() => useTryMode());
      expect(result.current.hasTrialData).toBe(false);
    });

    it('should return true when messages exist', () => {
      const { result } = renderHook(() => useTryMode());

      act(() => {
        result.current.addMessage('user', 'Test');
      });

      expect(result.current.hasTrialData).toBe(true);
    });
  });
});

describe('getTrialMessages', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should return empty array when no data', () => {
    const messages = getTrialMessages();
    expect(messages).toEqual([]);
  });

  it('should return parsed messages from localStorage', () => {
    const data: TryModeMessage[] = [
      { id: '1', role: 'user', content: 'Hello', createdAt: '2026-02-01T10:00:00Z' },
    ];
    localStorageMock.setItem(TRIAL_MESSAGES_KEY, JSON.stringify(data));

    const messages = getTrialMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe('Hello');
  });

  it('should return empty array on parse error', () => {
    localStorageMock.setItem(TRIAL_MESSAGES_KEY, '{invalid}');
    const messages = getTrialMessages();
    expect(messages).toEqual([]);
  });
});

describe('saveTrialMessages', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should save messages to localStorage', () => {
    const messages: TryModeMessage[] = [
      { id: '1', role: 'user', content: 'Test', createdAt: '2026-02-01T10:00:00Z' },
    ];

    saveTrialMessages(messages);

    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      TRIAL_MESSAGES_KEY,
      JSON.stringify(messages)
    );
  });
});

describe('clearTrialMessages', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should remove trial messages from localStorage', () => {
    localStorageMock.setItem(TRIAL_MESSAGES_KEY, '[]');

    clearTrialMessages();

    expect(localStorageMock.removeItem).toHaveBeenCalledWith(TRIAL_MESSAGES_KEY);
  });
});
