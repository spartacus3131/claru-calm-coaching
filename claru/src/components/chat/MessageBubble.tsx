import { cn } from '@/lib/utils';
import type { Message } from '@/modules/coaching/types';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex animate-fade-in',
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] px-4 py-3',
          isUser 
            ? 'bubble-user text-primary-foreground' 
            : 'bubble-assistant text-foreground'
        )}
      >
        <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
      </div>
    </div>
  );
}
