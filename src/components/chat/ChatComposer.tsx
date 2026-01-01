import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 glass border-t border-border/50">
      <input
        type="text"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type a message..."
        disabled={disabled}
        className="flex-1 bg-secondary/50 text-foreground placeholder:text-muted-foreground rounded-full px-4 py-3 text-[15px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-calm"
      />
      <Button
        type="submit"
        variant="send"
        disabled={!message.trim() || disabled}
      >
        <Send className="w-5 h-5" />
      </Button>
    </form>
  );
}
