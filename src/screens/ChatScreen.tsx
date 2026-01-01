import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { TodayPlan } from '@/components/chat/TodayPlan';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { mockMessages, mockPriorities } from '@/data/mockData';
import { Message, TodayPriority } from '@/types/claru';
import { supabase } from '@/integrations/supabase/client';

export function ChatScreen() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [priorities, setPriorities] = useState<TodayPriority[]>(mockPriorities);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const lastMessage = messages[messages.length - 1];
  const showQuickReplies = lastMessage?.role === 'assistant' && lastMessage?.quickReplies;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);

    // Get AI response
    setIsTyping(true);
    
    try {
      const conversationHistory = messages.map(m => ({
        role: m.role,
        content: m.content
      }));
      
      const { data, error } = await supabase.functions.invoke('coach-reply', {
        body: { 
          message: content,
          conversationHistory 
        }
      });
      
      if (error) throw error;
      
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
    } catch (err) {
      console.error('Error getting response:', err);
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble responding right now. Let's try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, response]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceMessage = (transcription: string, reply: string) => {
    // Add user's transcribed message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: transcription,
      timestamp: new Date(),
    };
    
    // Add AI reply
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: reply,
      timestamp: new Date(),
    };
    
    setMessages((prev) => [...prev, userMessage, assistantMessage]);
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const handleTogglePriority = (id: string) => {
    setPriorities((prev) =>
      prev.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p))
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Today Plan */}
          <TodayPlan priorities={priorities} onToggle={handleTogglePriority} />

          {/* Messages */}
          <div className="space-y-4 pt-2">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isTyping && <TypingIndicator />}

            {showQuickReplies && !isTyping && (
              <QuickReplies
                replies={lastMessage.quickReplies!}
                onSelect={handleQuickReply}
              />
            )}
          </div>
        </div>
      </div>

      {/* Composer */}
      <ChatComposer 
        onSend={handleSend} 
        onVoiceMessage={handleVoiceMessage}
        disabled={isTyping} 
      />
    </div>
  );
}
