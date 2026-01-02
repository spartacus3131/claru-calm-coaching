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
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 border-t border-border/30 bg-background">
      <VoiceRecorder onTranscription={onVoiceTranscription} />

      <div className="flex-1 flex items-end bg-secondary/50 rounded-2xl pl-4 pr-1.5 py-1.5 min-h-[48px]">
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
          className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base focus:outline-none resize-none max-h-32 overflow-y-auto pr-2"
          style={{ minHeight: '24px' }}
        />
        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled}
          className="h-10 w-10 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shrink-0 mb-0.5"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
