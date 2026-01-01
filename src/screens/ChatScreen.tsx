import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { TodayPlan } from '@/components/chat/TodayPlan';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { mockPriorities } from '@/data/mockData';
import { TodayPriority } from '@/types/claru';
import { supabase } from '@/integrations/supabase/client';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Loader2 } from 'lucide-react';

export function ChatScreen() {
  const { messages, loading, addMessage } = useChatMessages();
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
    await addMessage('user', content);

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
      
      await addMessage('assistant', data.reply);
    } catch (err) {
      console.error('Error getting response:', err);
      await addMessage('assistant', "I'm having trouble responding right now. Let's try again in a moment.");
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceMessage = async (transcription: string, reply: string) => {
    await addMessage('user', transcription);
    await addMessage('assistant', reply);
  };

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const handleTogglePriority = (id: string) => {
    setPriorities((prev) =>
      prev.map((p) => (p.id === id ? { ...p, completed: !p.completed } : p))
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Today Plan */}
          <TodayPlan priorities={priorities} onToggle={handleTogglePriority} />

          {/* Messages */}
          <div className="space-y-4 pt-2">
            {messages.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-sm">Start a conversation with your coach</p>
              </div>
            )}
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
