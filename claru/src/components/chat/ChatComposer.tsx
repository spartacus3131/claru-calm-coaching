'use client';

/**
 * @file ChatComposer.tsx
 * @description Chat input with text and voice support
 * @module components/chat
 * 
 * F012/F013: Voice recording with Deepgram transcription
 */

import { useState, useCallback } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceRecorder } from './VoiceRecorder';
import { useVoiceCapture } from '@/hooks/useVoiceCapture';

interface ChatComposerProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function ChatComposer({ onSend, disabled }: ChatComposerProps) {
  const [message, setMessage] = useState('');

  const voice = useVoiceCapture({
    onTranscript: (text) => {
      // Update the text input with real-time transcript
      setMessage(text);
    },
  });

  // Handle voice transcription completing - transfer text to input and clear voice state
  // User can review/edit then press send when ready
  const handleVoiceComplete = useCallback((text: string) => {
    if (text.trim()) {
      setMessage(text.trim());
    }
    // Clear the voice transcript so it doesn't re-populate on re-render
    voice.clear();
  }, [voice]);

  // Handle Enter during voice recording - stop and submit in one action
  const handleVoiceStopAndSubmit = useCallback((text: string) => {
    voice.clear();
    setMessage('');
    if (text.trim() && !disabled) {
      onSend(text.trim());
    }
  }, [voice, disabled, onSend]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
      voice.clear();
    }
  };

  // Check if voice is enabled
  const voiceEnabled = process.env.NEXT_PUBLIC_VOICE_ENABLED === 'true' || 
    process.env.NEXT_PUBLIC_DEEPGRAM_KEY;

  return (
    <form onSubmit={handleSubmit} className="flex items-center justify-center p-4 border-t border-border/30 bg-background">
      <div className="relative overflow-hidden flex-1 max-w-2xl flex items-center gap-1 bg-secondary/50 rounded-2xl pl-4 pr-1.5 min-h-[48px]">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              if (message.trim() && !disabled) {
                onSend(message.trim());
                setMessage('');
                voice.clear();
              }
            }
          }}
          placeholder={voice.isListening ? '' : 'Type a message...'}
          disabled={disabled}
          rows={1}
          className="relative z-10 flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base leading-6 focus:outline-none resize-none max-h-32 overflow-y-auto pr-2 py-3 min-h-[24px]"
        />

        {voiceEnabled && (
          <VoiceRecorder
            onComplete={handleVoiceComplete}
            onStopAndSubmit={handleVoiceStopAndSubmit}
            disabled={disabled}
            isListening={voice.isListening}
            isConnecting={voice.isConnecting}
            audioLevel={voice.audioLevel}
            error={voice.error}
            transcript={voice.transcript}
            start={voice.start}
            stop={voice.stop}
          />
        )}

        <Button
          type="submit"
          size="icon"
          disabled={!message.trim() || disabled}
          className="relative z-10 h-10 w-10 rounded-full bg-accent hover:bg-accent/90 text-accent-foreground shrink-0"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </form>
  );
}
