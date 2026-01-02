import { useState, useRef, useEffect, useMemo } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { useChatMessages } from '@/hooks/useChatMessages';
import { Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Message } from '@/types/claru';

type CheckInMode = 'morning' | 'evening';
const CHECKIN_MODE_STORAGE_KEY = 'claru_checkin_mode';

function safeReadCheckInMode(): CheckInMode {
  try {
    const saved = localStorage.getItem(CHECKIN_MODE_STORAGE_KEY);
    return saved === 'evening' ? 'evening' : 'morning';
  } catch {
    return 'morning';
  }
}

function buildWelcomeMessage(mode: CheckInMode): Message {
  const content =
    mode === 'evening'
      ? "Evening. Let's close out the day well. What went well today—and what's still hanging over you?"
      : "Hey, let's do your daily check-in. Tell me everything on your mind - work stuff, personal projects, random thoughts. Just dump it all out and I'll help you sort through it.\n\nAs we work together, I'll also introduce you to some challenges that'll help you get clearer on what matters most and how to actually get things done. But first - what's on your plate today?";

  return {
    id: 'welcome',
    role: 'assistant',
    content,
    timestamp: new Date(),
  };
}

interface ChatScreenProps {
  autoMessage?: string | null;
  onAutoMessageSent?: () => void;
}

export function ChatScreen({ autoMessage, onAutoMessageSent }: ChatScreenProps) {
  const { messages, loading, addMessage, isAuthenticated } = useChatMessages();
  const navigate = useNavigate();

  const [checkInMode, setCheckInMode] = useState<CheckInMode>(() => safeReadCheckInMode());
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const autoMessageSentRef = useRef(false);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKIN_MODE_STORAGE_KEY, checkInMode);
    } catch {
      // ignore
    }
  }, [checkInMode]);

  const welcomeMessage = useMemo(() => buildWelcomeMessage(checkInMode), [checkInMode]);

  // Show welcome message if no messages yet
  const displayMessages = messages.length === 0 ? [welcomeMessage] : messages;

  const lastMessage = displayMessages[displayMessages.length - 1];
  const showQuickReplies = lastMessage?.role === 'assistant' && lastMessage?.quickReplies;

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages, isTyping]);

  // Handle auto-message from Hot Spots check-in
  useEffect(() => {
    if (autoMessage && !autoMessageSentRef.current && !loading) {
      autoMessageSentRef.current = true;
      handleSend(autoMessage);
      onAutoMessageSent?.();
    }
  }, [autoMessage, loading]);

  const handleSend = async (content: string) => {
    await addMessage('user', content);

    setIsTyping(true);

    try {
      // Include welcome context if this is the first message
      const conversationHistory =
        messages.length === 0
          ? [{ role: 'assistant' as const, content: welcomeMessage.content }]
          : messages.map((m) => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('coach-reply', {
        body: {
          message: content,
          conversationHistory,
          mode: checkInMode,
        },
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

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  const handleVoiceTranscription = (transcription: string) => {
    handleSend(transcription);
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
            <button onClick={() => navigate('/auth')} className="text-primary font-medium hover:underline">
              Sign up to save your progress
            </button>
          </div>
        </div>
      )}

      {/* Check-in mode */}
      <div className="border-b border-border/30 px-4 py-2 flex items-center justify-between bg-background">
        <div className="text-sm text-muted-foreground">Check-in</div>
        <ToggleGroup
          type="single"
          value={checkInMode}
          onValueChange={(value) => {
            if (value === 'morning' || value === 'evening') {
              setCheckInMode(value);
            }
          }}
          variant="outline"
          size="sm"
        >
          <ToggleGroupItem value="morning" aria-label="Morning check-in">
            Morning
          </ToggleGroupItem>
          <ToggleGroupItem value="evening" aria-label="Evening reflection">
            Evening
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

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
              <QuickReplies replies={lastMessage.quickReplies!} onSelect={handleQuickReply} />
            )}
          </div>
        </div>
      </div>

      {/* Composer */}
      <ChatComposer onSend={handleSend} onVoiceTranscription={handleVoiceTranscription} disabled={isTyping} />
    </div>
  );
}
