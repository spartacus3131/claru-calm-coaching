import { useState, useRef, useCallback } from 'react';
import { backend } from '@/backend';

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0); // 0..1 (RMS)
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Live mic level metering
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  // Match WebAudio libdefs: Uint8Array backed by ArrayBuffer (not SharedArrayBuffer).
  const meterDataRef = useRef<Uint8Array<ArrayBuffer> | null>(null);
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
      // Closing can throw if already closed; ignore.
      void ctx.close().catch(() => undefined);
    }
  }, []);

  const startMeter = useCallback((stream: MediaStream) => {
    try {
      // Some browsers require AudioContext to be created from a user gesture; startRecording is a click.
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const ctx = new AudioContextCtor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.85;

      const data = new Uint8Array(analyser.fftSize) as Uint8Array<ArrayBuffer>;
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
        // RMS of normalized time-domain data (centered at 128).
        let sumSquares = 0;
        for (let i = 0; i < d.length; i++) {
          const v = (d[i] - 128) / 128;
          sumSquares += v * v;
        }
        const rms = Math.sqrt(sumSquares / d.length); // 0..~1

        // Smooth + clamp
        const smoothed = 0.8 * lastLevelRef.current + 0.2 * rms;
        lastLevelRef.current = smoothed;

        // Avoid re-rendering too aggressively for tiny changes
        setAudioLevel((prev) => (Math.abs(prev - smoothed) > 0.01 ? smoothed : prev));

        meterRafRef.current = requestAnimationFrame(tick);
      };

      meterRafRef.current = requestAnimationFrame(tick);
    } catch (err) {
      // Metering is optional; recording/transcription should still work.
      console.warn('[voice] Failed to start meter:', err);
    }
  }, []);

  const startRecording = useCallback(async (): Promise<boolean> => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current = mediaRecorder;
      startMeter(stream);
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
      return true;
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please allow microphone permissions.');
      stopMeter();
      return false;
    }
  }, [startMeter, stopMeter]);

  const stopRecording = useCallback(async (): Promise<string | null> => {
    if (!mediaRecorderRef.current) return null;

    setIsRecording(false);
    setIsProcessing(true);
    setError(null);
    stopMeter();

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;

      mediaRecorder.onstop = async () => {
        try {
          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach((track) => track.stop());

          // Create audio blob
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          console.log('Audio blob size:', audioBlob.size);

          if (audioBlob.size < 1000) {
            throw new Error('Recording too short. Please try again.');
          }

          // Convert to base64
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);

          reader.onloadend = async () => {
            try {
              const base64Audio = (reader.result as string).split(',')[1];

              // Transcribe audio
              console.log('Sending to transcribe...');
              const transcription = await backend.ai.transcribe(base64Audio);
              console.log('Transcription:', transcription);

              if (!transcription || transcription.trim() === '') {
                throw new Error('Could not understand audio. Please try again.');
              }

              setIsProcessing(false);
              resolve(transcription);
            } catch (err) {
              console.error('Transcription processing error:', err);
              setError(err instanceof Error ? err.message : 'Failed to transcribe recording');
              setIsProcessing(false);
              resolve(null);
            }
          };
        } catch (err) {
          console.error('Stop recording error:', err);
          setError(err instanceof Error ? err.message : 'Failed to process recording');
          setIsProcessing(false);
          resolve(null);
        }
      };

      mediaRecorder.stop();
    });
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
