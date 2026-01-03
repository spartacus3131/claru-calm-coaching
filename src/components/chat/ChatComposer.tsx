import { useState } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceRecorder } from './VoiceRecorder';

interface ChatComposerProps {
  onSend: (message: string) => void;
  onVoiceTranscription?: (transcription: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, onVoiceTranscription, disabled }: ChatComposerProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center justify-center p-4 border-t border-border/30 bg-background">
      <div className="flex-1 max-w-2xl flex items-center gap-1 bg-secondary/50 rounded-2xl pl-4 pr-1.5 min-h-[48px]">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (message.trim() && !disabled) {
                onSend(message.trim());
                setMessage('');
              }
            }
          }}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base leading-6 focus:outline-none resize-none max-h-32 overflow-y-auto pr-2 py-3 min-h-[24px]"
        />

        <VoiceRecorder onTranscription={onVoiceTranscription} disabled={disabled} />

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
