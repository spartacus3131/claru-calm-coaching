import { useState } from 'react';
import { Mic, MicOff, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoiceRecording } from '@/hooks/useVoiceRecording';
import { cn } from '@/lib/utils';

interface VoiceRecorderProps {
  onTranscription?: (text: string) => void;
}

export function VoiceRecorder({ onTranscription }: VoiceRecorderProps) {
  const { isRecording, isProcessing, error, startRecording, stopRecording } = useVoiceRecording();
  const [showRecorder, setShowRecorder] = useState(false);

  const handleToggleRecording = async () => {
    if (isRecording) {
      const transcription = await stopRecording();
      if (transcription && onTranscription) {
        onTranscription(transcription);
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
      <Button
        variant="ghost"
        size="icon"
        onClick={handleToggleRecording}
        className="text-muted-foreground hover:text-foreground"
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 bg-destructive/10 rounded-full px-3 py-1.5">
      <div
        className={cn(
          'w-3 h-3 rounded-full',
          isRecording && 'bg-destructive animate-pulse',
          isProcessing && 'bg-primary'
        )}
      />

      <span className="text-sm text-foreground">{isRecording ? 'Recording...' : 'Processing...'}</span>

      {isRecording && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleToggleRecording}
            className="h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <MicOff className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCancel}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </Button>
        </>
      )}

      {isProcessing && <Loader2 className="w-4 h-4 animate-spin text-primary" />}

      {error && <span className="text-xs text-destructive ml-2">{error}</span>}
    </div>
  );
}
