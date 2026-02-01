/**
 * @file useChatContext.ts
 * @description Hook for context-aware chat welcome messages
 * @module hooks
 *
 * Determines the appropriate welcome message based on:
 * - Time of day
 * - Whether check-ins have been completed today
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

export type ChatContextType = 
  | 'morning_checkin'
  | 'need_help'
  | 'evening_prompt'
  | 'all_done';

interface ChatContext {
  context: ChatContextType;
  morningDone: boolean;
  eveningDone: boolean;
  isAfternoon: boolean;
  userName?: string;
}

interface UseChatContextResult {
  chatContext: ChatContext | null;
  isLoading: boolean;
  welcomeMessage: string;
  effectiveFlow: 'morning' | 'evening' | 'adhoc';
  refetch: () => Promise<void>;
}

const WELCOME_MESSAGES: Record<ChatContextType, string> = {
  morning_checkin: 
    "Your brain is meant to solve problems and be creative, not store to-do lists.\n\n" +
    "The first step to getting things done is getting everything out of your head. " +
    "Just tell me what's on your mind right now, tasks, worries, things you need to do. " +
    "We'll sort through it together.\n\n" +
    "🎤 Tap the mic if talking is easier.",
  
  need_help:
    "Hey, is there anything I can help with that you're working on?",
  
  evening_prompt:
    "Hey, it looks like it might be the end of your day. " +
    "Did you want to do your evening check-in, or is there something else I can help with?",
  
  all_done:
    "You're all set for today. Anything else on your mind?",
};

/**
 * Hook for fetching chat context and generating appropriate welcome messages.
 */
export function useChatContext(): UseChatContextResult {
  const [chatContext, setChatContext] = useState<ChatContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchContext = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/chat-context');
      
      if (!response.ok) {
        // Default to morning check-in on error
        setChatContext({
          context: 'morning_checkin',
          morningDone: false,
          eveningDone: false,
          isAfternoon: false,
        });
        return;
      }

      const { data } = await response.json();
      setChatContext(data);
    } catch (err) {
      console.error('Failed to fetch chat context:', err);
      // Default to morning check-in on error
      setChatContext({
        context: 'morning_checkin',
        morningDone: false,
        eveningDone: false,
        isAfternoon: false,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContext();
  }, [fetchContext]);

  // Generate welcome message based on context
  const welcomeMessage = chatContext 
    ? WELCOME_MESSAGES[chatContext.context]
    : WELCOME_MESSAGES.morning_checkin;

  // Determine effective flow for API calls
  const effectiveFlow: 'morning' | 'evening' | 'adhoc' = 
    chatContext?.context === 'morning_checkin' ? 'morning' :
    chatContext?.context === 'evening_prompt' ? 'evening' :
    'adhoc';

  return {
    chatContext,
    isLoading,
    welcomeMessage,
    effectiveFlow,
    refetch: fetchContext,
  };
}
