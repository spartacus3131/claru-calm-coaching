import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { supabase } from '@/integrations/supabase/client';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Message } from '@/types/claru';

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  role: 'assistant',
  content: "Do you feel overwhelmed by what you have to get done and uncertain of how to go do it? Do you want to feel more fulfilled in your daily life and more productive? I'm here to help.",
  timestamp: new Date(),
};

export function ChatScreen() {
  const { messages, loading, addMessage, isAuthenticated } = useChatMessages();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Show welcome message if no messages yet
  const displayMessages = messages.length === 0 ? [WELCOME_MESSAGE] : messages;

  const lastMessage = displayMessages[displayMessages.length - 1];
  const showQuickReplies = lastMessage?.role === 'assistant' && lastMessage?.quickReplies;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages, isTyping]);

  const handleSend = async (content: string) => {
    await addMessage('user', content);

    setIsTyping(true);
    
    try {
      // Include welcome context if this is the first message
      const conversationHistory = messages.length === 0 
        ? [{ role: 'assistant' as const, content: WELCOME_MESSAGE.content }]
        : messages.map(m => ({ role: m.role, content: m.content }));
      
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

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Trial mode banner */}
      {!isAuthenticated && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Info className="w-4 h-4 text-primary" />
            <span>Try mode – </span>
            <button 
              onClick={() => navigate('/auth')}
              className="text-primary font-medium hover:underline"
            >
              Sign up to save your progress
            </button>
          </div>
        </div>
      )}

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Messages */}
          <div className="space-y-4">
            {displayMessages.map((message) => (
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
