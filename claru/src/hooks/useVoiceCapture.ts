'use client';

/**
 * @file useVoiceCapture.ts
 * @description Real-time voice transcription using Deepgram Nova-3
 * @module hooks
 * 
 * F012: Voice Recording + F013: Voice Transcription
 * 
 * Per deepgram-voice.mdc:
 * - Client-side WebSocket directly to Deepgram
 * - Real-time streaming transcription
 * - NEVER route through serverless functions
 */

import { useCallback, useRef, useState, useEffect } from 'react';

interface UseVoiceCaptureOptions {
  onTranscript?: (text: string) => void;
}

interface UseVoiceCaptureReturn {
  transcript: string;
  isListening: boolean;
  isConnecting: boolean;
  error: string | null;
  audioLevel: number;
  start: () => Promise<boolean>;
  stop: () => void;
  clear: () => void;
}

/**
 * Hook for real-time voice capture and transcription via Deepgram.
 * 
 * Per deepgram-voice.mdc: Browser connects directly to Deepgram WebSocket.
 * Vercel serverless functions CANNOT maintain WebSocket connections.
 */
export function useVoiceCapture(options: UseVoiceCaptureOptions = {}): UseVoiceCaptureReturn {
  const { onTranscript } = options;

  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);

  const socketRef = useRef<WebSocket | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Audio level metering
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  /**
   * Starts audio level metering for waveform visualization.
   */
  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const AudioContextCtor = window.AudioContext || 
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const ctx = new AudioContextCtor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.fftSize);
      let lastLevel = 0;

      const tick = () => {
        if (!analyserRef.current) return;

        analyserRef.current.getByteTimeDomainData(data);
        
        // Calculate RMS
        let sumSquares = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / data.length);

        // Smooth the level
        const smoothed = 0.7 * lastLevel + 0.3 * rms;
        lastLevel = smoothed;

        setAudioLevel(smoothed);
        rafRef.current = requestAnimationFrame(tick);
      };

      rafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn('[voice] Failed to start meter:', err);
    }
  }, []);

  /**
   * Stops audio level metering.
   */
  const stopMeter = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    analyserRef.current = null;
    setAudioLevel(0);

    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx) {
      void ctx.close().catch(() => undefined);
    }
  }, []);

  /**
   * Cleanup all resources.
   */
  const cleanup = useCallback(() => {
    // Stop recorder
    if (recorderRef.current) {
      try {
        recorderRef.current.stop();
      } catch {
        // Ignore if already stopped
      }
      recorderRef.current = null;
    }

    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close(1000);
      socketRef.current = null;
    }

    // Stop meter
    stopMeter();

    setIsListening(false);
    setIsConnecting(false);
  }, [stopMeter]);

  /**
   * Starts voice capture and transcription.
   */
  const start = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      setIsConnecting(true);

      // Check for Deepgram API key
      const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_KEY;
      if (!apiKey) {
        throw new Error('Voice transcription is not configured');
      }

      // Get microphone access
      // Per deepgram-voice.mdc: Configure for speech quality
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Connect to Deepgram WebSocket
      // Per deepgram-voice.mdc: Browser connects directly to Deepgram
      const socket = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&smart_format=true',
        ['token', apiKey]
      );

      socket.onopen = () => {
        // Start MediaRecorder
        const recorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        recorder.ondataavailable = (e) => {
          if (e.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(e.data);
          }
        };

        recorder.start(250); // Send chunks every 250ms
        recorderRef.current = recorder;

        // Start audio level metering
        startMeter(stream);

        setIsConnecting(false);
        setIsListening(true);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const text = data.channel?.alternatives?.[0]?.transcript;
          
          if (text && data.is_final) {
            setTranscript((prev) => {
              const newTranscript = prev ? `${prev} ${text}` : text;
              onTranscript?.(newTranscript);
              return newTranscript;
            });
          }
        } catch (err) {
          console.warn('[voice] Failed to parse message:', err);
        }
      };

      socket.onerror = () => {
        setError('Voice connection failed. Try again or type instead.');
        cleanup();
      };

      socket.onclose = () => {
        setIsListening(false);
        setIsConnecting(false);
      };

      socketRef.current = socket;
      return true;
    } catch (err) {
      console.error('[voice] Start error:', err);
      
      if (err instanceof Error) {
        if (err.name === 'NotAllowedError') {
          setError('Microphone access denied. Please allow microphone permissions.');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone found. Please connect a microphone.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Failed to start voice capture');
      }

      cleanup();
      return false;
    }
  }, [cleanup, startMeter, onTranscript]);

  /**
   * Stops voice capture.
   */
  const stop = useCallback(() => {
    cleanup();
  }, [cleanup]);

  /**
   * Clears the transcript.
   */
  const clear = useCallback(() => {
    setTranscript('');
  }, []);

  // Cleanup on unmount
  // Per deepgram-voice.mdc: ALWAYS clean up resources on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    transcript,
    isListening,
    isConnecting,
    error,
    audioLevel,
    start,
    stop,
    clear,
  };
}
