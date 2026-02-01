'use client';

import { useState, useRef, useCallback } from 'react';

/**
 * Deepgram Nova-3 real-time transcription
 * 
 * IMPORTANT: This connects directly from the browser to Deepgram.
 * The API key is exposed client-side but scoped to transcription only.
 */
export function useDeepgramTranscription() {
  const [isConnected, setIsConnected] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const connect = useCallback(async (): Promise<boolean> => {
    const apiKey = process.env.NEXT_PUBLIC_DEEPGRAM_KEY;
    if (!apiKey) {
      setError('Voice transcription not configured');
      console.error('NEXT_PUBLIC_DEEPGRAM_KEY is not set');
      return false;
    }

    try {
      setError(null);
      setTranscript('');

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Connect to Deepgram WebSocket
      const socket = new WebSocket(
        'wss://api.deepgram.com/v1/listen?model=nova-2&punctuate=true&smart_format=true',
        ['token', apiKey]
      );

      socket.onopen = () => {
        console.log('[Deepgram] WebSocket connected');
        setIsConnected(true);

        // Start recording and sending audio
        const mediaRecorder = new MediaRecorder(stream, {
          mimeType: 'audio/webm;codecs=opus',
        });

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0 && socket.readyState === WebSocket.OPEN) {
            socket.send(event.data);
          }
        };

        mediaRecorder.start(250); // Send audio every 250ms
        mediaRecorderRef.current = mediaRecorder;
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const text = data.channel?.alternatives?.[0]?.transcript;
          
          if (text && data.is_final) {
            setTranscript((prev) => {
              const newText = prev ? `${prev} ${text}` : text;
              return newText.trim();
            });
          }
        } catch (e) {
          console.error('[Deepgram] Parse error:', e);
        }
      };

      socket.onerror = (event) => {
        console.error('[Deepgram] WebSocket error:', event);
        setError('Connection error');
      };

      socket.onclose = (event) => {
        console.log('[Deepgram] WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
      };

      socketRef.current = socket;
      return true;
    } catch (err) {
      console.error('[Deepgram] Connection error:', err);
      setError('Could not access microphone');
      return false;
    }
  }, []);

  const disconnect = useCallback((): string => {
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

    // Close WebSocket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setIsConnected(false);
    
    // Return the final transcript
    const finalTranscript = transcript;
    return finalTranscript;
  }, [transcript]);

  const getTranscript = useCallback(() => transcript, [transcript]);

  return {
    isConnected,
    transcript,
    error,
    connect,
    disconnect,
    getTranscript,
  };
}
