'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Voice recording with Deepgram Nova-3 real-time transcription
 * 
 * Connects directly from browser to Deepgram WebSocket.
 * Includes audio level metering for UI visualization.
 */
export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Deepgram WebSocket
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptRef = useRef<string>('');

  // Audio level metering
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meterDataRef = useRef<any>(null);
  const meterRafRef = useRef<number | null>(null);
  const lastLevelRef = useRef(0);

  const stopMeter = useCallback(() => {
    if (meterRafRef.current != null) {
      cancelAnimationFrame(meterRafRef.current);
      meterRafRef.current = null;
    }
    analyserRef.current = null;
    meterDataRef.current = null;
    lastLevelRef.current = 0;
    setAudioLevel(0);

    const ctx = audioContextRef.current;
    audioContextRef.current = null;
    if (ctx) {
      void ctx.close().catch(() => undefined);
    }
  }, []);

  const startMeter = useCallback((stream: MediaStream) => {
    try {
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const ctx = new AudioContextCtor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85;

      const data = new Uint8Array(analyser.fftSize);
      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      meterDataRef.current = data;
      lastLevelRef.current = 0;

      const tick = () => {
        const a = analyserRef.current;
        const d = meterDataRef.current;
        if (!a || !d) return;

        a.getByteTimeDomainData(d);
        let sumSquares = 0;
        for (let i = 0; i < d.length; i++) {
          const v = (d[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / d.length);

        const smoothed = 0.8 * lastLevelRef.current + 0.2 * rms;
        lastLevelRef.current = smoothed;

        setAudioLevel((prev) => (Math.abs(prev - smoothed) > 0.01 ? smoothed : prev));

        meterRafRef.current = requestAnimationFrame(tick);
      };

      meterRafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      console.warn('[voice] Failed to start meter:', err);
    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_KEY;
    
    // Fallback to OpenAI if Deepgram not configured
    if (!apiKey) {
      console.warn('[voice] NEXT_PUBLIC_DEEPGRAM_KEY not set, voice disabled');
      setError('Voice transcription not configured');
      return false;
    }

    try {
      setError(null);
      transcriptRef.current = '';

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      startMeter(stream);

      // Connect to Deepgram WebSocket
      const socket = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&smart_format=true',
        ['token', apiKey]
      );

      socket.onopen = () => {
        console.log('[Deepgram] Connected');
        setIsRecording(true);

        // Start MediaRecorder to capture audio chunks
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send chunks every 250ms
        mediaRecorderRef.current = mediaRecorder;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const text = data.channel?.alternatives?.[0]?.transcript;
          
          if (text && data.is_final) {
            transcriptRef.current = transcriptRef.current
              ? `${transcriptRef.current} ${text}`.trim()
              : text;
          }
        } catch (e) {
          console.error('[Deepgram] Parse error:', e);
        }
      };

      socket.onerror = (event) => {
        console.error('[Deepgram] Error:', event);
        setError('Voice connection error');
        setIsRecording(false);
      };

      socket.onclose = () => {
        console.log('[Deepgram] Disconnected');
      };

      socketRef.current = socket;
      return true;
    } catch (err) {
      console.error('[voice] Start error:', err);
      setError('Could not access microphone. Please allow microphone permissions.');
      stopMeter();
      return false;
    }
  }, [startMeter, stopMeter]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    setIsProcessing(true);

    // Stop recording
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }

    // Stop microphone
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Close WebSocket (this triggers final transcript)
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    stopMeter();
    setIsRecording(false);

    // Small delay to ensure final transcript is received
    await new Promise((resolve) => setTimeout(resolve, 300));

    const finalTranscript = transcriptRef.current.trim();
    setIsProcessing(false);

    if (!finalTranscript) {
      setError('Could not understand audio. Please try again.');
      return null;
    }

    return finalTranscript;
  }, [stopMeter]);

  return {
    isRecording,
    isProcessing,
    audioLevel,
    error,
    startRecording,
    stopRecording,
  };
}
