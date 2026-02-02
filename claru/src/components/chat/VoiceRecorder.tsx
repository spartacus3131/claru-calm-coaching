'use client';

/**
 * @file VoiceRecorder.tsx
 * @description Voice recording UI with real-time waveform visualization
 * @module components/chat
 * 
 * F012: Voice Recording + F013: Voice Transcription
 * 
 * Per deepgram-voice.mdc:
 * - ALWAYS provide text input fallback when voice fails
 * - Client-side only
 */

import { useEffect, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface VoiceRecorderProps {
  /** Called when recording stops AND user should submit (Enter key) */
  onStopAndSubmit?: (text: string) => void;
  /** Called when transcript updates (real-time) */
  onTranscript?: (text: string) => void;
  /** Called when user stops recording with final transcript */
  onComplete?: (text: string) => void;
  /** Disable the recorder */
  disabled?: boolean;
  /** Current listening state */
  isListening: boolean;
  /** Connecting to Deepgram */
  isConnecting: boolean;
  /** Current audio level (0-1) */
  audioLevel: number;
  /** Error message */
  error: string | null;
  /** Current transcript */
  transcript: string;
  /** Start recording */
  start: () => Promise<boolean>;
  /** Stop recording */
  stop: () => void;
}

export function VoiceRecorder({
  onComplete,
  onStopAndSubmit,
  disabled,
  isListening,
  isConnecting,
  audioLevel,
  error,
  transcript,
  start,
  stop,
}: VoiceRecorderProps) {
  const [isRequestingMic, setIsRequestingMic] = useState(false);

  const handleToggleRecording = async () => {
    if (isListening) {
      stop();
      if (transcript && onComplete) {
        onComplete(transcript);
      }
    } else {
      setIsRequestingMic(true);
      await start();
      setIsRequestingMic(false);
    }
  };

  // Enter key to stop recording AND submit in one action
  useEffect(() => {
    if (!isListening || isConnecting) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      if (e.shiftKey || e.altKey || e.ctrlKey || e.metaKey) return;

      e.preventDefault();
      e.stopPropagation();
      stop();
      // If we have transcript and a submit handler, submit directly
      if (transcript?.trim() && onStopAndSubmit) {
        onStopAndSubmit(transcript.trim());
      } else if (transcript && onComplete) {
        onComplete(transcript);
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => document.removeEventListener('keydown', onKeyDown, true);
  }, [isListening, isConnecting, transcript, onComplete, onStopAndSubmit, stop]);

  // Show errors as toast
  useEffect(() => {
    if (!error) return;
    toast.error(error);
  }, [error]);

  // Scale audio level for visualization
  const scaledLevel = Math.min(1, audioLevel * 7);
  const isSilent = scaledLevel < 0.08;

  const isLoading = isConnecting || isRequestingMic;

  return (
    <>
      {/* Waveform overlay when recording */}
      {isListening && !isConnecting && (
        <div
          className="pointer-events-none absolute left-4 right-[94px] top-1/2 -translate-y-1/2 z-0"
          aria-hidden="true"
        >
          {/* Baseline */}
          <div className="absolute inset-x-0 top-1/2 h-px bg-foreground/25 dark:bg-white/35" />

          {/* Animated bars */}
          <div className="relative h-4 flex items-center justify-between gap-1">
            {Array.from({ length: 28 }).map((_, i) => {
              const t = typeof performance !== 'undefined' 
                ? performance.now() / 180 
                : Date.now() / 180;
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
          disabled={disabled || isLoading}
          aria-label={
            isListening 
              ? 'Stop recording' 
              : isLoading 
                ? 'Connecting...' 
                : 'Start voice recording'
          }
          className={cn(
            'h-10 w-10 rounded-full text-muted-foreground hover:text-foreground hover:bg-background/60',
            isListening && 'text-destructive bg-destructive/10 hover:bg-destructive/20'
          )}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isListening ? (
            <Square className="w-4 h-4 fill-current" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </Button>
      </div>
    </>
  );
}
