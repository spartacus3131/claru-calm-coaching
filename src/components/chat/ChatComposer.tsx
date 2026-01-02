import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceRecorder } from './VoiceRecorder';

interface ChatComposerProps {
  onSend: (message: string) => void;
  onVoiceMessage?: (transcription: string, reply: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, onVoiceMessage, disabled }: ChatComposerProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 border-t border-border/30 bg-background">
      <VoiceRecorder onTranscription={onVoiceMessage} />
      
      <div className="flex-1 flex items-center bg-secondary/50 rounded-full pl-4 pr-1.5 py-1.5">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base focus:outline-none"
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled}
          className="h-10 w-10 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
