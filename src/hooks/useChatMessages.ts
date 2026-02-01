import { useState, useEffect, useRef } from 'react';
import { backend } from '@/backend';
import { useAuth } from './useAuth';
import { Message } from '@/types/claru';

export function useChatMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Track previous user to detect signup transition
  const prevUserRef = useRef<string | null>(null);
  const localMessagesRef = useRef<Message[]>([]);

  // Keep track of local messages for migration
  useEffect(() => {
    if (!user) {
      localMessagesRef.current = messages;
    }
  }, [messages, user]);

  // Load messages from database if logged in, migrate trial messages on signup
  useEffect(() => {
    if (!user) {
      // Not logged in - keep local state
      prevUserRef.current = null;
      setLoading(false);
      return;
    }

    const loadAndMigrateMessages = async () => {
      // Check if this is a new signup (transition from no user to user)
      const isNewSignup = prevUserRef.current === null && localMessagesRef.current.length > 0;
      const trialMessages = isNewSignup ? [...localMessagesRef.current] : [];

      // Update ref to current user
      prevUserRef.current = user.id;

      // If we have trial messages to migrate, save them first
      if (trialMessages.length > 0) {
        console.log('Migrating trial messages:', trialMessages.length);
        try {
          await backend.chatMessages.insertMany(
            trialMessages.map((m) => ({
              userId: user.id,
              role: m.role,
              content: m.content,
              createdAt: m.timestamp.toISOString(),
            }))
          );
          console.log('Trial messages migrated successfully');
        } catch (e) {
          console.error('Error migrating trial messages:', e);
        }
      }

      // Now load all messages (including freshly migrated ones)
      try {
        const msgs = await backend.chatMessages.list(user.id);
        setMessages(msgs);
      } catch (e) {
        console.error('Error loading messages:', e);
      }

      // Clear the local messages ref after successful migration
      localMessagesRef.current = [];
      setLoading(false);
    };

    loadAndMigrateMessages();
  }, [user]);

  const addMessage = async (role: 'user' | 'assistant', content: string): Promise<Message> => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };

    // Always update local state
    setMessages(prev => [...prev, newMessage]);

    // Only persist to database if logged in
    if (user) {
      try {
        const inserted = await backend.chatMessages.insert({
          userId: user.id,
          role,
          content,
        });
        // Update with real ID
        setMessages((prev) =>
          prev.map((m) => (m.id === newMessage.id ? { ...m, id: inserted.id } : m))
        );
        return { ...newMessage, id: inserted.id };
      } catch (e) {
        console.error('Error saving message:', e);
      }
    }

    return newMessage;
  };

  return { messages, loading, addMessage, isAuthenticated: !!user };
}
