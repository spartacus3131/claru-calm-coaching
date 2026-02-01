'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Info, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { createMessage, type Message, type SessionFlow } from '@/modules/coaching/types';
import { shouldSavePlan } from '@/modules/coaching/confirmationDetection';
import { useStreak } from '@/hooks/useStreak';
import { useTryMode, type TryModeMessage } from '@/hooks/useTryMode';
import { useChatHistory, type Message as ChatHistoryMessage } from '@/hooks/useChatHistory';
import { useChatContext } from '@/hooks/useChatContext';

/**
 * Builds contextual welcome message based on chat context.
 */
function buildWelcomeMessage(content: string): Message {
  return createMessage({
    role: 'assistant',
    content,
  });
}

/**
 * Builds challenge intro welcome message.
 */
function buildChallengeIntroMessage(): Message {
  return createMessage({
    role: 'assistant',
    content: "I'm ready to guide you through this foundation. Let's get started.",
  });
}

interface ChatInterfaceProps {
  /** @deprecated No longer used - auth state comes from useChatHistory */
  isAuthenticated?: boolean;
}

/**
 * Converts TryModeMessage to Message format.
 * F029: Required for loading trial messages into chat state.
 */
function tryModeToMessage(tm: TryModeMessage): Message {
  return {
    id: tm.id,
    role: tm.role,
    content: tm.content,
    createdAt: new Date(tm.createdAt),
  };
}

/**
 * Converts ChatHistoryMessage to Message format.
 * F031: Required for loading persisted messages into chat state.
 */
function chatHistoryToMessage(chm: ChatHistoryMessage): Message {
  return {
    id: chm.id,
    role: chm.role,
    content: chm.content,
    createdAt: chm.createdAt,
  };
}

export function ChatInterface({ isAuthenticated: _isAuthenticatedProp }: ChatInterfaceProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { recordCheckin } = useStreak();

  // F031: Chat history persistence for authenticated users
  const chatHistory = useChatHistory();
  const isAuthenticated = chatHistory.isAuthenticated;

  // Context-aware welcome messages
  const { chatContext, welcomeMessage: contextWelcomeMessage, effectiveFlow: contextFlow } = useChatContext();

  // F029: Trial mode message persistence
  const tryMode = useTryMode();
  const trialMessagesLoadedRef = useRef(false);
  const historyMessagesLoadedRef = useRef(false);
  const migrationAttemptedRef = useRef(false);

  // F019: Read flow and challengeId from URL params
  const urlFlow = searchParams.get('flow') as SessionFlow | null;
  const urlChallengeId = searchParams.get('challengeId');
  const urlMessage = searchParams.get('message');
  const isChallengeIntro = urlFlow === 'challenge_intro' && urlChallengeId;
  const challengeId = urlChallengeId ? parseInt(urlChallengeId, 10) : undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [hasAutoSent, setHasAutoSent] = useState(false);
  const [planSavedMessage, setPlanSavedMessage] = useState<string | null>(null);

  // F031: Load messages from chat history when authenticated
  useEffect(() => {
    if (isAuthenticated && !chatHistory.loading && !historyMessagesLoadedRef.current) {
      historyMessagesLoadedRef.current = true;
      const loadedMessages = chatHistory.messages.map(chatHistoryToMessage);
      if (loadedMessages.length > 0) {
        setMessages(loadedMessages);
      }
    }
  }, [isAuthenticated, chatHistory.loading, chatHistory.messages]);

  // F029/F031: Migrate trial messages when user signs up
  useEffect(() => {
    if (
      isAuthenticated &&
      !chatHistory.loading &&
      !migrationAttemptedRef.current &&
      tryMode.hasTrialData
    ) {
      migrationAttemptedRef.current = true;
      // Migrate trial messages to database
      chatHistory.migrateTrialMessages(tryMode.messages).then(() => {
        // Clear trial mode after successful migration
        tryMode.clearMessages();
      });
    }
  }, [isAuthenticated, chatHistory.loading, tryMode.hasTrialData, tryMode.messages, chatHistory, tryMode]);

  // F029: Load trial messages on mount (only in trial mode)
  useEffect(() => {
    if (!isAuthenticated && !chatHistory.loading && !trialMessagesLoadedRef.current && tryMode.hasTrialData) {
      trialMessagesLoadedRef.current = true;
      const loadedMessages = tryMode.messages.map(tryModeToMessage);
      setMessages(loadedMessages);
    }
  }, [isAuthenticated, chatHistory.loading, tryMode.hasTrialData, tryMode.messages]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);
  const isUserScrollingRef = useRef(false);
  const scrollStopTimeoutRef = useRef<number | null>(null);
  const lastScrollTopRef = useRef(0);
  const autoScrollLockedOffRef = useRef(false);

  // Navigation warning for trial mode users with unsaved messages
  useEffect(() => {
    if (isAuthenticated || messages.length === 0) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have unsaved messages. Sign up to save your progress!';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isAuthenticated, messages.length]);

  // Determine the effective flow for API calls (context-aware)
  const effectiveFlow: SessionFlow = isChallengeIntro ? 'challenge_intro' : contextFlow;

  // Build welcome message based on context
  const welcomeMessage = useMemo(
    () => isChallengeIntro 
      ? buildChallengeIntroMessage() 
      : buildWelcomeMessage(contextWelcomeMessage),
    [contextWelcomeMessage, isChallengeIntro]
  );

  const displayMessages = useMemo(() => {
    const base = messages.length === 0 ? [welcomeMessage] : messages;
    // Add plan saved confirmation as inline message if present
    if (planSavedMessage) {
      return [...base, createMessage({ role: 'assistant', content: planSavedMessage })];
    }
    return base;
  }, [messages, welcomeMessage, planSavedMessage]);

  const lastMessage = displayMessages[displayMessages.length - 1];
  const showQuickReplies = lastMessage?.role === 'assistant' && (lastMessage as Message & { quickReplies?: string[] })?.quickReplies;

  const handleSend = useCallback(
    async (content: string) => {
      const userMessage = createMessage({ role: 'user', content });
      setMessages((prev) => [...prev, userMessage]);
      setIsTyping(true);

      // F031: Persist user message to database when authenticated
      // F029: Persist to localStorage in trial mode
      if (isAuthenticated) {
        chatHistory.addMessage('user', content, { flow: effectiveFlow });
      } else {
        tryMode.addMessage('user', content);
      }

      try {
        const conversationHistory =
          messages.length === 0
            ? [{ role: 'assistant' as const, content: welcomeMessage.content }]
            : messages.map((m) => ({ role: m.role, content: m.content }));

        // F019: Include challengeId for challenge_intro flow
        // Filter out any system messages and cast to the expected type
        const apiMessages = [...conversationHistory, { role: 'user' as const, content }]
          .filter((m): m is { role: 'user' | 'assistant'; content: string } =>
            m.role === 'user' || m.role === 'assistant'
          );

        const requestBody: {
          messages: { role: 'user' | 'assistant'; content: string }[];
          flow: SessionFlow;
          challengeId?: number;
        } = {
          messages: apiMessages,
          flow: effectiveFlow,
        };

        if (isChallengeIntro && challengeId) {
          requestBody.challengeId = challengeId;
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error('No response body');

        const decoder = new TextDecoder();
        let assistantContent = '';

        const assistantMessage = createMessage({ role: 'assistant', content: '' });
        setMessages((prev) => [...prev, assistantMessage]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          assistantContent += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessage.id
                ? { ...m, content: assistantContent }
                : m
            )
          );
        }

        // F031: Persist assistant message to database when authenticated
        // F029: Persist to localStorage in trial mode
        if (assistantContent) {
          if (isAuthenticated) {
            chatHistory.addMessage('assistant', assistantContent, { flow: effectiveFlow });
          } else {
            tryMode.addMessage('assistant', assistantContent);
          }
        }

        // F010: Check if user confirmed their plan and save it (only for morning check-in)
        if (effectiveFlow === 'morning' && isAuthenticated) {
          // Get the assistant message before the user's confirmation
          const previousAssistantMsg = conversationHistory
            .filter((m) => m.role === 'assistant')
            .pop();

          if (previousAssistantMsg && shouldSavePlan(content, previousAssistantMsg.content)) {
            // Save the plan to daily notes
            try {
              const saveResponse = await fetch('/api/daily-notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  messages: [...conversationHistory, { role: 'user', content }],
                }),
              });

              if (saveResponse.ok) {
                // Toast notification
                toast.success('Plan saved to your Daily Note', {
                  icon: <CheckCircle2 className="w-4 h-4" />,
                  duration: 3000,
                });
                
                // Inline confirmation message from Claru
                setPlanSavedMessage("I've saved your plan to your Daily Note. You're all set!");
                
                // F028: Record check-in for streak tracking
                await recordCheckin('morning_checkin');
              }
            } catch (saveErr) {
              console.error('Failed to save plan:', saveErr);
              // Don't show error to user - plan saving is secondary
            }
          }
        }
      } catch (err) {
        console.error('Error getting response:', err);
        setMessages((prev) => [
          ...prev,
          createMessage({
            role: 'assistant',
            content: "I'm having trouble responding right now. Let's try again in a moment.",
          }),
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, welcomeMessage.content, effectiveFlow, isChallengeIntro, challengeId, isAuthenticated, tryMode, chatHistory, recordCheckin]
  );

  // F019: Auto-send initial message for challenge_intro flow
  useEffect(() => {
    if (isChallengeIntro && urlMessage && !hasAutoSent && messages.length === 0) {
      setHasAutoSent(true);
      const decodedMessage = decodeURIComponent(urlMessage);
      // Small delay to let the UI render first
      const timer = setTimeout(() => {
        handleSend(decodedMessage);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isChallengeIntro, urlMessage, hasAutoSent, messages.length, handleSend]);

  // Auto-scroll logic
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const AT_BOTTOM_PX = 2;

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

      const currentTop = el.scrollTop;
      if (currentTop < lastScrollTopRef.current - 2) {
        autoScrollLockedOffRef.current = true;
        shouldAutoScrollRef.current = false;
      }
      lastScrollTopRef.current = currentTop;

      const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      if (distanceFromBottom <= AT_BOTTOM_PX) {
        autoScrollLockedOffRef.current = false;
        shouldAutoScrollRef.current = true;
      } else if (autoScrollLockedOffRef.current) {
        shouldAutoScrollRef.current = false;
      } else {
        shouldAutoScrollRef.current = false;
      }
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

    requestAnimationFrame(() => {
      const el2 = scrollRef.current;
      if (!el2) return;
      if (!shouldAutoScrollRef.current) return;
      if (isUserScrollingRef.current) return;
      el2.scrollTop = el2.scrollHeight;
    });
  }, [displayMessages, isTyping]);

  const handleQuickReply = (reply: string) => {
    handleSend(reply);
  };

  // Chat loads immediately - auth check happens in background
  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Trial mode banner */}
      {!isAuthenticated && (
        <div className="bg-primary/10 border-b border-primary/20 px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-foreground">
            <Info className="w-4 h-4 text-primary" />
            <span>Try mode – </span>
            <button onClick={() => router.push('/auth')} className="text-primary font-medium hover:underline">
              Sign up to save your progress
            </button>
          </div>
        </div>
      )}

      {/* Context indicator - shows current context type */}
      {!isChallengeIntro && chatContext && (
        <div className="border-b border-border/30 px-4 py-2 bg-background">
          <div className="text-sm text-muted-foreground">
            {chatContext.context === 'morning_checkin' && 'Morning Check-in'}
            {chatContext.context === 'need_help' && 'How can I help?'}
            {chatContext.context === 'evening_prompt' && 'Evening Wind Down'}
            {chatContext.context === 'all_done' && "You're all set"}
          </div>
        </div>
      )}

      {/* F019: Challenge intro header */}
      {isChallengeIntro && (
        <div className="border-b border-border/30 px-4 py-2 bg-primary/5">
          <div className="text-sm text-primary font-medium">Foundation Introduction</div>
        </div>
      )}

      {/* Scrollable content */}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain touch-pan-y [-webkit-overflow-scrolling:touch]"
      >
        <div className="p-4 space-y-4">
          {/* Messages */}
          <div className="space-y-4">
            {displayMessages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}

            {isTyping && <TypingIndicator />}

            {showQuickReplies && !isTyping && (
              <QuickReplies
                replies={(lastMessage as Message & { quickReplies?: string[] }).quickReplies!}
                onSelect={handleQuickReply}
              />
            )}
          </div>
        </div>
      </div>

      {/* Composer */}
      <ChatComposer onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
