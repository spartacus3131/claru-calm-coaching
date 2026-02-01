/**
 * @file useChatHistory.ts
 * @description Hook for managing chat history persistence - F031
 * @module hooks
 *
 * Handles loading, saving, and migration of chat messages.
 * Uses Supabase for persistence when authenticated.
 *
 * Per bounded-contexts.mdc: This belongs to User Context Store.
 * Per domain-language.mdc: "ConversationTurn" is a user input + AI response pair.
 * Per supabase.mdc: Always filter by user_id even with RLS (defense in depth).
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { createBrowserSupabase } from '@/lib/supabase/client';
import { clearTrialMessages, TryModeMessage } from './useTryMode';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Shape of a chat message in the database.
 * Per typescript.mdc: Always define explicit types for domain entities.
 */
export interface ChatHistoryMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

/**
 * Internal message format for the hook.
 * Combines DB shape with local-only fields.
 */
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  metadata?: Record<string, unknown>;
  /** True if message hasn't been persisted yet */
  isPending?: boolean;
}

/**
 * Return type for the useChatHistory hook.
 */
export interface UseChatHistoryReturn {
  /** Current chat messages */
  messages: Message[];
  /** Whether initial load is in progress */
  loading: boolean;
  /** Whether user is authenticated */
  isAuthenticated: boolean;
  /** User ID if authenticated */
  userId: string | null;
  /** Add a new message (persists to DB if authenticated) */
  addMessage: (role: 'user' | 'assistant', content: string, metadata?: Record<string, unknown>) => Promise<Message>;
  /** Clear all messages from local state */
  clearMessages: () => void;
  /** Update a message's content (for streaming) */
  updateMessageContent: (id: string, content: string) => void;
  /** Migrate trial messages to database */
  migrateTrialMessages: (trialMessages: TryModeMessage[]) => Promise<void>;
}

/**
 * Loads chat history from the database for a user.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to load messages for
 * @returns Array of chat messages, empty on error
 */
export async function loadChatHistory(
  supabase: SupabaseClient,
  userId: string
): Promise<ChatHistoryMessage[]> {
  try {
    // Per supabase.mdc: Always filter by user_id even with RLS
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      // Per 005-error-handling.mdc: Log with context
      console.error('Failed to load chat history:', {
        userId,
        error: error.message,
      });
      return [];
    }

    return data ?? [];
  } catch (err) {
    console.error('Chat history query failed:', err);
    return [];
  }
}

/**
 * Saves a single chat message to the database.
 *
 * @param supabase - Supabase client instance
 * @param params - Message parameters
 * @returns Saved message or null on error
 */
export async function saveChatMessage(
  supabase: SupabaseClient,
  params: {
    userId: string;
    role: 'user' | 'assistant';
    content: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ChatHistoryMessage | null> {
  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: params.userId,
      role: params.role,
      content: params.content,
      metadata: params.metadata ?? {},
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to save chat message:', {
      userId: params.userId,
      role: params.role,
      error: error.message,
    });
    return null;
  }

  return data;
}

/**
 * Migrates trial mode messages to the database.
 * Per domain-language.mdc: "Try Mode" is the guest experience.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID to associate messages with
 * @param messages - Trial messages to migrate
 * @returns Migrated messages or empty array on error
 */
export async function migrateTryModeMessages(
  supabase: SupabaseClient,
  userId: string,
  messages: TryModeMessage[]
): Promise<ChatHistoryMessage[]> {
  if (messages.length === 0) {
    return [];
  }

  const toInsert = messages.map((msg) => ({
    user_id: userId,
    role: msg.role,
    content: msg.content,
    metadata: { source: 'trial_migration', original_id: msg.id },
    created_at: msg.createdAt,
  }));

  const { data, error } = await supabase
    .from('chat_messages')
    .insert(toInsert)
    .select();

  if (error) {
    console.error('Failed to migrate trial messages:', {
      userId,
      messageCount: messages.length,
      error: error.message,
    });
    return [];
  }

  // Clear trial messages from localStorage after successful migration
  clearTrialMessages();

  return data ?? [];
}

/**
 * Converts database message to internal Message format.
 */
function dbToMessage(dbMsg: ChatHistoryMessage): Message {
  return {
    id: dbMsg.id,
    role: dbMsg.role,
    content: dbMsg.content,
    createdAt: new Date(dbMsg.created_at),
    metadata: dbMsg.metadata,
    isPending: false,
  };
}

/**
 * Generates a temporary ID for local messages.
 */
function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Hook for managing chat history with database persistence.
 *
 * F031 requirement: Save and load conversation history.
 *
 * @example
 * ```tsx
 * function ChatScreen() {
 *   const {
 *     messages,
 *     loading,
 *     isAuthenticated,
 *     addMessage,
 *   } = useChatHistory();
 *
 *   const handleSend = async (content: string) => {
 *     await addMessage('user', content);
 *     // ... get AI response
 *     await addMessage('assistant', aiResponse);
 *   };
 *
 *   if (loading) return <Loading />;
 *   return <ChatUI messages={messages} onSend={handleSend} />;
 * }
 * ```
 */
export function useChatHistory(): UseChatHistoryReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  // Start with loading=false so chat renders immediately
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const supabaseRef = useRef(createBrowserSupabase());
  const initialLoadDoneRef = useRef(false);

  // Load user and messages on mount - non-blocking
  useEffect(() => {
    const supabase = supabaseRef.current;

    async function initialize() {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();

        if (error || !user) {
          setIsAuthenticated(false);
          setUserId(null);
          return;
        }

        setIsAuthenticated(true);
        setUserId(user.id);

        // Load existing messages in background
        try {
          const history = await loadChatHistory(supabase, user.id);
          if (history.length > 0) {
            setMessages(history.map(dbToMessage));
          }
        } catch (loadErr) {
          console.error('Failed to load chat history:', loadErr);
        }
        
        initialLoadDoneRef.current = true;
      } catch (err) {
        console.error('Chat history initialization failed:', err);
        setIsAuthenticated(false);
        setUserId(null);
      }
    }

    initialize();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setIsAuthenticated(true);
          setUserId(session.user.id);

          // Reload messages for new user
          const history = await loadChatHistory(supabase, session.user.id);
          setMessages(history.map(dbToMessage));
        } else if (event === 'SIGNED_OUT') {
          setIsAuthenticated(false);
          setUserId(null);
          setMessages([]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /**
   * Adds a new message to local state and persists to database if authenticated.
   */
  const addMessage = useCallback(
    async (
      role: 'user' | 'assistant',
      content: string,
      metadata?: Record<string, unknown>
    ): Promise<Message> => {
      const tempId = generateTempId();
      const tempMessage: Message = {
        id: tempId,
        role,
        content,
        createdAt: new Date(),
        metadata,
        isPending: true,
      };

      // Add to local state immediately
      setMessages((prev) => [...prev, tempMessage]);

      // Persist to database if authenticated
      if (isAuthenticated && userId) {
        const saved = await saveChatMessage(supabaseRef.current, {
          userId,
          role,
          content,
          metadata,
        });

        if (saved) {
          // Update with real ID from database
          setMessages((prev) =>
            prev.map((m) =>
              m.id === tempId ? { ...dbToMessage(saved) } : m
            )
          );
          return dbToMessage(saved);
        }
      }

      // Mark as no longer pending even if not persisted
      setMessages((prev) =>
        prev.map((m) =>
          m.id === tempId ? { ...m, isPending: false } : m
        )
      );

      return { ...tempMessage, isPending: false };
    },
    [isAuthenticated, userId]
  );

  /**
   * Updates a message's content (useful for streaming responses).
   */
  const updateMessageContent = useCallback((id: string, content: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, content } : m))
    );
  }, []);

  /**
   * Clears all messages from local state.
   * Does NOT delete from database.
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  /**
   * Migrates trial messages to database.
   * Call this after user signs up from trial mode.
   */
  const migrateTrialMessages = useCallback(
    async (trialMessages: TryModeMessage[]) => {
      if (!isAuthenticated || !userId || trialMessages.length === 0) {
        return;
      }

      const migrated = await migrateTryModeMessages(
        supabaseRef.current,
        userId,
        trialMessages
      );

      if (migrated.length > 0) {
        // Prepend migrated messages to existing ones
        setMessages((prev) => [...migrated.map(dbToMessage), ...prev]);
      }
    },
    [isAuthenticated, userId]
  );

  return {
    messages,
    loading,
    isAuthenticated,
    userId,
    addMessage,
    clearMessages,
    updateMessageContent,
    migrateTrialMessages,
  };
}
