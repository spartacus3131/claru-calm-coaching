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
  const { isRecording, isProcessing, audioLevel, error, startRecording, stopRecording } = useVoiceRecording();
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

  const scaledLevel = Math.min(1, audioLevel * 4); // boost typical speaking levels
  const isSilent = scaledLevel < 0.08;

  return (
    <>
      {/* Full-width waveform overlay (positioned relative to the chat input container) */}
      {isRecording && !isProcessing && (
        <div
          className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 z-0"
          aria-hidden="true"
        >
          {/* Baseline */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-foreground/25 dark:bg-white/35" />

          {/* Bars */}
          <div className="relative h-4 flex items-center justify-between gap-1">
            {Array.from({ length: 40 }).map((_, i) => {
              const shape = 0.3 + 0.7 * Math.abs(Math.sin(i * 1.7));
              const h = 2 + Math.min(14, scaledLevel * 14 * shape);
              return (
                <span
                  key={i}
                  className="w-[2px] rounded-full bg-foreground/45 dark:bg-white/60 transition-[height,opacity] duration-75"
                  style={{ height: `${h}px`, opacity: isSilent ? 0 : 0.9 }}
                />
              );
            })}
          </div>
        </div>
      )}

      <div className="relative z-10 shrink-0">
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
            isRecording && 'text-foreground dark:text-white bg-white/10 hover:bg-white/15'
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
    </>
  );
}
