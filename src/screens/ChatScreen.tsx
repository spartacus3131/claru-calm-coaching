import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { supabase } from '@/integrations/supabase/client';
import { useChatMessages } from '@/hooks/useChatMessages';
import { useDailyNote } from '@/hooks/useDailyNote';
import { Loader2, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Message, Foundation } from '@/types/claru';

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
      ? "Time to close out the day.\n\nWhat got done? What's carrying over? Just tell me how it went.\n\n🎤 Tap the mic if talking is easier."
      : "Your brain is meant to solve problems and be creative - not store to-do lists.\n\nThe first step to getting things done is getting everything out of your head. Just tell me what's on your mind right now - tasks, worries, things you need to do. We'll sort through it together.\n\n🎤 Tap the mic if talking is easier.";

  return {
    id: 'welcome',
    role: 'assistant',
    content,
    timestamp: new Date(),
  };
}

interface ChatScreenProps {
  autoMessage?: string | null;
  autoFoundation?: Foundation | null;
  onAutoMessageSent?: () => void;
}

export function ChatScreen({ autoMessage, autoFoundation, onAutoMessageSent }: ChatScreenProps) {
  const { messages, loading, addMessage, isAuthenticated } = useChatMessages();
  const { mergeChatExtraction } = useDailyNote();
  const navigate = useNavigate();

  const [checkInMode, setCheckInMode] = useState<CheckInMode>(() => safeReadCheckInMode());
  const [isTyping, setIsTyping] = useState(false);
  const [pendingFoundationForSend, setPendingFoundationForSend] = useState<Foundation | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const scrollStopTimeoutRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);
  const lastAutoMessageRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(CHECKIN_MODE_STORAGE_KEY, checkInMode);
    } catch {
      // ignore
    }
  }, [checkInMode]);

  const welcomeMessage = useMemo(() => buildWelcomeMessage(checkInMode), [checkInMode]);

  // Show welcome message if no messages yet
  const displayMessages = useMemo(
    () => (messages.length === 0 ? [welcomeMessage] : messages),
    [messages, welcomeMessage]
  );

  const lastMessage = displayMessages[displayMessages.length - 1];
  const showQuickReplies = lastMessage?.role === 'assistant' && lastMessage?.quickReplies;

  const handleSend = useCallback(
    async (content: string, foundation?: Foundation | null) => {
      console.log('[handleSend] Called with foundation:', foundation ? `Foundation ${foundation.id}` : 'undefined');

      await addMessage('user', content);

      setIsTyping(true);

      try {
        // Include welcome context if this is the first message
        const conversationHistory =
          messages.length === 0
            ? [{ role: 'assistant' as const, content: welcomeMessage.content }]
            : messages.map((m) => ({ role: m.role, content: m.content }));

        // Prepare foundation details for the Edge Function if starting a foundation
        const foundationDetails = foundation ? {
          id: foundation.id,
          title: foundation.title,
          description: foundation.description,
          time: foundation.time,
          energy: foundation.energy,
          value: foundation.value,
          whatYouGet: foundation.whatYouGet,
          steps: foundation.steps,
          tips: foundation.tips,
          researchInsight: foundation.researchInsight,
          actionableTip: foundation.actionableTip,
        } : undefined;

        console.log('[handleSend] Sending to Edge Function with foundationDetails:', foundationDetails ? 'yes' : 'no');

        const { data, error } = await supabase.functions.invoke('coach-reply', {
          body: {
            message: content,
            conversationHistory,
            mode: checkInMode,
            foundationDetails,
          },
        });

        if (error) throw error;

        console.log('[handleSend] Edge Function response _debug:', data._debug);

        await addMessage('assistant', data.reply);

        // If the coach extracted daily note data, save it
        if (data.dailyNote) {
          mergeChatExtraction(data.dailyNote);
        }
      } catch (err) {
        console.error('Error getting response:', err);
        await addMessage('assistant', "I'm having trouble responding right now. Let's try again in a moment.");
      } finally {
        setIsTyping(false);
        setPendingFoundationForSend(null);
      }
    },
    [addMessage, messages, welcomeMessage.content, checkInMode, mergeChatExtraction]
  );

  // Only auto-scroll if the user is already near the bottom (don't fight manual scrolling).
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const THRESHOLD_PX = 40;

    const markUserInteracting = () => {
      isUserScrollingRef.current = true;
      if (scrollStopTimeoutRef.current != null) {
        window.clearTimeout(scrollStopTimeoutRef.current);
      }
      scrollStopTimeoutRef.current = window.setTimeout(() => {
        isUserScrollingRef.current = false;
      }, 180);
    };

    const onScroll = () => {
      markUserInteracting();

      // If the user scrolls upward at all, immediately disable auto-scroll.
      const currentTop = el.scrollTop;
      if (currentTop < lastScrollTopRef.current - 2) {
        shouldAutoScrollRef.current = false;
      }
      lastScrollTopRef.current = currentTop;

      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      shouldAutoScrollRef.current = distanceFromBottom < THRESHOLD_PX;
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('touchstart', markUserInteracting, { passive: true });
    el.addEventListener('mousedown', markUserInteracting, { passive: true } as AddEventListenerOptions);
    onScroll();
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('touchstart', markUserInteracting);
      el.removeEventListener('mousedown', markUserInteracting as EventListener);
      if (scrollStopTimeoutRef.current != null) {
        window.clearTimeout(scrollStopTimeoutRef.current);
        scrollStopTimeoutRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    if (!shouldAutoScrollRef.current) return;
    if (isUserScrollingRef.current) return;

    // Wait a tick for layout so scrollHeight is accurate.
    requestAnimationFrame(() => {
      const el2 = scrollRef.current;
      if (!el2) return;
      if (!shouldAutoScrollRef.current) return;
      if (isUserScrollingRef.current) return;
      el2.scrollTop = el2.scrollHeight;
    });
  }, [displayMessages, isTyping]);

  // Handle auto-message from Hot Spots check-in or Start Foundation
  useEffect(() => {
    if (!autoMessage || loading) return;
    if (lastAutoMessageRef.current === autoMessage) return;

    console.log('[ChatScreen] Auto-message triggered:', autoMessage);
    console.log('[ChatScreen] autoFoundation:', autoFoundation ? `Foundation ${autoFoundation.id}: ${autoFoundation.title}` : 'null');

    lastAutoMessageRef.current = autoMessage;
    void handleSend(autoMessage, autoFoundation);
    onAutoMessageSent?.();
  }, [autoMessage, autoFoundation, loading, handleSend, onAutoMessageSent]);


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
