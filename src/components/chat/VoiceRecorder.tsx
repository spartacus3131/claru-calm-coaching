import { useState } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscription?: (text: string, reply: string) => void;
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const { isRecording, isProcessing, error, startRecording, stopRecording } = useVoiceRecording();
  const [showRecorder, setShowRecorder] = useState(false);

  const handleToggleRecording = async () => {
    if (isRecording) {
      const result = await stopRecording();
      if (result && onTranscription) {
        onTranscription(result.transcription, result.reply);
      }
      setShowRecorder(false);
    } else {
      // Request permission and start recording first, only show UI if successful
      const success = await startRecording();
      if (success) {
        setShowRecorder(true);
      }
    }
  };

  const handleCancel = () => {
    if (isRecording) {
      stopRecording();
    }
    setShowRecorder(false);
  };

  if (!showRecorder) {
    return (
      <div className="relative shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleToggleRecording}
          className="h-10 w-10 rounded-full border-2 border-transparent bg-secondary/40 text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-accent/30 active:bg-accent/15 active:border-accent/60"
          disabled={isProcessing}
          aria-label={isProcessing ? 'Processing voice message' : 'Start voice recording'}
        >
          {isProcessing ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      {/* In-row control stays fixed-size to avoid layout shift */}
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleRecording}
        className={cn(
          "h-10 w-10 rounded-full border-2",
          isRecording
            ? "bg-destructive/10 border-destructive/40 text-destructive hover:bg-destructive/15"
            : "bg-secondary/40 border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/60 hover:border-accent/30"
        )}
        disabled={isProcessing}
        aria-label={isRecording ? 'Stop voice recording' : 'Voice recorder'}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isRecording ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>

      {/* Status overlay sits above without pushing layout */}
      <div className="absolute z-20 bottom-full left-0 mb-2 flex items-center gap-2 rounded-full bg-destructive/10 border-2 border-destructive/30 px-3 py-2 shadow-sm">
        <div
          className={cn(
            "w-3 h-3 rounded-full",
            isRecording && "bg-destructive animate-pulse",
            isProcessing && "bg-primary"
          )}
        />

        <span className="text-sm text-foreground whitespace-nowrap">
          {isRecording ? 'Recording…' : 'Processing…'}
        </span>

        {isRecording && (
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8 -mr-1 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Cancel recording"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      </div>

      {/* Keep errors from changing layout height; expose via title + sr-only text */}
      {error && <span className="sr-only" title={error}>{error}</span>}
    </div>
  );
}
