/**
 * @file useTryMode.ts
 * @description Hook for managing Try Mode (F029) - guest experience without auth
 * @module hooks
 *
 * Handles localStorage persistence of trial messages and provides utilities
 * for migration when user signs up.
 *
 * Per bounded-contexts.mdc: This belongs to User Identity context.
 * Per domain-language.mdc: "Try Mode" is the guest experience without signup.
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * localStorage key for trial messages.
 * Using a clear prefix to identify trial-specific data.
 */
export const TRIAL_MESSAGES_KEY = 'claru_trial_messages';

/**
 * A message stored during try mode.
 * Serializable format for localStorage persistence.
 */
export interface TryModeMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string; // ISO string for serialization
}

/**
 * Return type for the useTryMode hook.
 */
export interface UseTryModeReturn {
  /** Current trial messages */
  messages: TryModeMessage[];
  /** Whether there are any trial messages to migrate */
  hasTrialData: boolean;
  /** Add a new message to trial storage */
  addMessage: (role: 'user' | 'assistant', content: string) => TryModeMessage;
  /** Clear all trial messages (call after successful migration) */
  clearMessages: () => void;
}

/**
 * Reads trial messages from localStorage.
 * Safe to call on server (returns empty array).
 *
 * @returns Array of trial messages, empty if none or on error
 */
export function getTrialMessages(): TryModeMessage[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(TRIAL_MESSAGES_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as TryModeMessage[];
  } catch (error) {
    // Per 005-error-handling.mdc: Log with context, return safe default
    console.error('Failed to parse trial messages from localStorage:', error);
    return [];
  }
}

/**
 * Saves trial messages to localStorage.
 *
 * @param messages - Messages to persist
 */
export function saveTrialMessages(messages: TryModeMessage[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(TRIAL_MESSAGES_KEY, JSON.stringify(messages));
  } catch (error) {
    // Per 005-error-handling.mdc: Log storage errors
    console.error('Failed to save trial messages to localStorage:', error);
  }
}

/**
 * Clears trial messages from localStorage.
 * Call after successful migration to authenticated state.
 */
export function clearTrialMessages(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(TRIAL_MESSAGES_KEY);
  } catch (error) {
    console.error('Failed to clear trial messages from localStorage:', error);
  }
}

/**
 * Generates a unique ID for trial messages.
 * Uses timestamp + random suffix for uniqueness.
 */
function generateTrialMessageId(): string {
  return `trial_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook for managing Try Mode state and localStorage persistence.
 *
 * F029 requirement: Guest experience without auth, migrate on signup.
 *
 * @example
 * ```tsx
 * function TryModeChat() {
 *   const { messages, addMessage, hasTrialData } = useTryMode();
 *
 *   const handleSend = (content: string) => {
 *     addMessage('user', content);
 *     // ... get AI response
 *     addMessage('assistant', aiResponse);
 *   };
 *
 *   return <ChatUI messages={messages} onSend={handleSend} />;
 * }
 * ```
 */
export function useTryMode(): UseTryModeReturn {
  const [messages, setMessages] = useState<TryModeMessage[]>([]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const stored = getTrialMessages();
    if (stored.length > 0) {
      setMessages(stored);
    }
  }, []);

  /**
   * Adds a message to trial storage.
   */
  const addMessage = useCallback(
    (role: 'user' | 'assistant', content: string): TryModeMessage => {
      const newMessage: TryModeMessage = {
        id: generateTrialMessageId(),
        role,
        content,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => {
        const updated = [...prev, newMessage];
        saveTrialMessages(updated);
        return updated;
      });

      return newMessage;
    },
    []
  );

  /**
   * Clears all trial messages.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    clearTrialMessages();
  }, []);

  return {
    messages,
    hasTrialData: messages.length > 0,
    addMessage,
    clearMessages,
  };
}
