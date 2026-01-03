import { useEffect, useState } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  onTranscription?: (text: string) => void;
  disabled?: boolean;
  isRecording: boolean;
  isProcessing: boolean;
  audioLevel: number;
  error: string | null;
  startRecording: () => Promise<boolean>;
  stopRecording: () => Promise<string | null>;
}

export function VoiceRecorder({
  onTranscription,
  disabled,
  isRecording,
  isProcessing,
  audioLevel,
  error,
  startRecording,
  stopRecording,
}: VoiceRecorderProps) {
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

  // Show mic errors as a toast because the chat input container clips overflow.
  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);

  // Boost typical speaking levels so the waveform feels lively like modern voice UIs.
  const scaledLevel = Math.min(1, audioLevel * 7);
  const isSilent = scaledLevel < 0.08;

  return (
    <>
      {/* Full-width waveform overlay (positioned relative to the chat input container) */}
      {isRecording && !isProcessing && (
        <div
          // Constrain the waveform to the text area ONLY (stop before the mic button).
          // Layout math (from ChatComposer):
          // - container left padding: 16px  => left-4
          // - right offset to end at mic *left edge*:
          //   pr-1.5 (6px) + send (40px) + gap (4px) + mic (40px) + gap (4px) = 94px
          className="pointer-events-none absolute left-4 right-[94px] top-1/2 -translate-y-1/2 z-0"
          aria-hidden="true"
        >
          {/* Baseline */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-foreground/25 dark:bg-white/35" />

          {/* Bars */}
          <div className="relative h-4 flex items-center justify-between gap-1">
            {Array.from({ length: 28 }).map((_, i) => {
              // Add a subtle traveling-wave feel (updates as meter updates while speaking)
              const t = typeof performance !== 'undefined' ? performance.now() / 180 : Date.now() / 180;
              const shape = 0.25 + 0.75 * Math.abs(Math.sin(i * 0.9 + t));
              const h = 2 + Math.min(18, scaledLevel * 18 * shape);
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
