import { useEffect, useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscription?: (text: string) => void;
  disabled?: boolean;
}

export function VoiceRecorder({ onTranscription, disabled }: VoiceRecorderProps) {
  const { isRecording, isProcessing, error, startRecording, stopRecording } = useVoiceRecording();
  const [isRequestingMic, setIsRequestingMic] = useState(false);

  const handleToggleRecording = async () => {
    if (isRecording) {
      const transcription = await stopRecording();
      if (transcription && onTranscription) {
        onTranscription(transcription);
      }
    } else {
      // Request permission and start recording first, only show UI if successful
      setIsRequestingMic(true);
      const success = await startRecording();
      setIsRequestingMic(false);
      void success;
    }
  };

  // While recording, allow "Enter" to stop + send (transcribe) immediately.
  useEffect(() => {
    if (!isRecording || isProcessing) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;

      e.preventDefault();
      e.stopPropagation();
      void handleToggleRecording();
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isRecording, isProcessing]);

  return (
    <div className="relative shrink-0 flex items-center gap-2">
      {isRecording && !isProcessing && (
        <div className="audio-bars" aria-hidden="true">
          <span className="audio-bar" />
          <span className="audio-bar" />
          <span className="audio-bar" />
          <span className="audio-bar" />
          <span className="audio-bar" />
        </div>
      )}

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={handleToggleRecording}
        disabled={disabled || isProcessing || isRequestingMic}
        aria-label={
          isRecording ? 'Stop recording' : isProcessing ? 'Transcribing voice' : 'Start voice recording'
        }
        className={cn(
          'h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60',
          isRecording && 'text-destructive bg-destructive/10 hover:bg-destructive/15 hover:text-destructive'
        )}
      >
        {isProcessing || isRequestingMic ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      {error && (
        <div className="absolute top-full right-0 mt-1 text-xs text-destructive whitespace-nowrap max-w-[260px] truncate">
          {error}
        </div>
      )}
    </div>
  );
}
