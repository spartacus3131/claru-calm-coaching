import { useState, useRef, useEffect } from 'react';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { QuickReplies } from '@/components/chat/QuickReplies';
import { TodayPlan } from '@/components/chat/TodayPlan';
import { ChatComposer } from '@/components/chat/ChatComposer';
import { mockMessages, mockPriorities } from '@/data/mockData';
import { Message, TodayPriority } from '@/types/claru';

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

  const handleSend = (content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMessage]);

    // Simulate assistant response
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const response: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I hear you. Let's work through this together. Would you like to start with a quick brain dump to clear your head?",
        timestamp: new Date(),
        quickReplies: ['Yes, let\'s do it', 'Maybe later', 'Show me how'],
      };
      setMessages((prev) => [...prev, response]);
    }, 1500);
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
      <ChatComposer onSend={handleSend} disabled={isTyping} />
    </div>
  );
}
