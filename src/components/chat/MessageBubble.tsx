import { Message } from '@/types/claru';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        'flex flex-col gap-1 animate-fade-in',
        isUser ? 'items-end' : 'items-start'
      )}
    >
      <div
        className={cn(
          'max-w-[85%] px-4 py-3',
          isUser ? 'bubble-user text-primary-foreground' : 'bubble-assistant text-foreground'
        )}
      >
        <p className="text-[15px] leading-relaxed">{message.content}</p>
      </div>
      <span className="text-xs text-muted-foreground px-1">
        {format(message.timestamp, 'h:mm a')}
      </span>
    </div>
  );
}
