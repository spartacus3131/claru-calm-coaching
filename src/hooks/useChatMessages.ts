import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
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

        const messagesToInsert = trialMessages.map(m => ({
          user_id: user.id,
          role: m.role,
          content: m.content,
          created_at: m.timestamp.toISOString()
        }));

        const { error: insertError } = await supabase
          .from('chat_messages')
          .insert(messagesToInsert);

        if (insertError) {
          console.error('Error migrating trial messages:', insertError);
        } else {
          console.log('Trial messages migrated successfully');
        }
      }

      // Now load all messages (including freshly migrated ones)
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error loading messages:', error);
      } else if (data) {
        setMessages(data.map(m => ({
          id: m.id,
          role: m.role as 'user' | 'assistant',
          content: m.content,
          timestamp: new Date(m.created_at)
        })));
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
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          role,
          content
        })
        .select()
        .single();

      if (error) {
        console.error('Error saving message:', error);
      } else if (data) {
        // Update with real ID
        setMessages(prev => 
          prev.map(m => m.id === newMessage.id 
            ? { ...m, id: data.id } 
            : m
          )
        );
        return { ...newMessage, id: data.id };
      }
    }

    return newMessage;
  };

  return { messages, loading, addMessage, isAuthenticated: !!user };
}
