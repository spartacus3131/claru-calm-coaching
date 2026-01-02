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
      
      <div className="flex-1 flex items-center bg-secondary/40 rounded-full px-4 py-2.5">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-[15px] focus:outline-none"
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          disabled={!message.trim() || disabled}
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
