import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { Message } from '@/types/claru';

export function useChatMessages() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  // Load messages from database
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setLoading(false);
      return;
    }

    const loadMessages = async () => {
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
      setLoading(false);
    };

    loadMessages();
  }, [user]);

  const addMessage = async (role: 'user' | 'assistant', content: string): Promise<Message> => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role,
      content,
      timestamp: new Date()
    };

    // Optimistically update local state
    setMessages(prev => [...prev, newMessage]);

    // Persist to database
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

  return { messages, loading, addMessage };
}
