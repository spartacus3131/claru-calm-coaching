import { useState, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function useVoiceRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [conversationHistory, setConversationHistory] = useState<Message[]>([]);

  const startRecording = useCallback(async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please allow microphone permissions.');
    }
  }, []);

  const stopRecording = useCallback(async (): Promise<{ transcription: string; reply: string } | null> => {
    if (!mediaRecorderRef.current) return null;
    
    setIsRecording(false);
    setIsProcessing(true);
    setError(null);

    return new Promise((resolve) => {
      const mediaRecorder = mediaRecorderRef.current!;
      
      mediaRecorder.onstop = async () => {
        try {
          // Stop all tracks
          mediaRecorder.stream.getTracks().forEach(track => track.stop());
          
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
              const transcribeResponse = await supabase.functions.invoke('transcribe', {
                body: { audio: base64Audio }
              });
              
              if (transcribeResponse.error) {
                throw new Error(transcribeResponse.error.message || 'Transcription failed');
              }
              
              const transcription = transcribeResponse.data.text;
              console.log('Transcription:', transcription);
              
              if (!transcription || transcription.trim() === '') {
                throw new Error('Could not understand audio. Please try again.');
              }
              
              // Get coach reply
              console.log('Getting coach reply...');
              const replyResponse = await supabase.functions.invoke('coach-reply', {
                body: { 
                  message: transcription,
                  conversationHistory: conversationHistory
                }
              });
              
              if (replyResponse.error) {
                throw new Error(replyResponse.error.message || 'Failed to get response');
              }
              
              const reply = replyResponse.data.reply;
              console.log('Coach reply:', reply);
              
              // Update conversation history
              setConversationHistory(prev => [
                ...prev,
                { role: 'user', content: transcription },
                { role: 'assistant', content: reply }
              ]);
              
              setIsProcessing(false);
              resolve({ transcription, reply });
              
            } catch (err) {
              console.error('Processing error:', err);
              setError(err instanceof Error ? err.message : 'Failed to process recording');
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
  }, [conversationHistory]);

  const clearHistory = useCallback(() => {
    setConversationHistory([]);
  }, []);

  return {
    isRecording,
    isProcessing,
    error,
    startRecording,
    stopRecording,
    clearHistory,
    conversationHistory
  };
}
