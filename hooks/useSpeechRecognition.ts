import { useState, useEffect, useRef } from 'react';

// Add type declarations for the Speech Recognition API which may not be in default TS lib
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: (() => void) | null;
  onerror: ((event: any) => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition: { new (): SpeechRecognition };
    webkitSpeechRecognition: { new (): SpeechRecognition };
  }

  // FIX: Define SpeechRecognitionEvent and related types to fix "Cannot find name" error.
  // These types are for the Web Speech API, which may not be in default TS lib versions.
  // SpeechRecognitionEvent was also incorrectly defined as a property of Window.
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }

  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }

  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }

  interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
  }
}

interface SpeechRecognitionHook {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  error: string | null;
  clearError: () => void;
  isSupported: boolean;
}

const getSpeechErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        case 'no-speech':
            return "No speech was detected. Please try speaking again.";
        case 'audio-capture':
            return "Could not capture audio. Please check that your microphone is working correctly.";
        case 'not-allowed':
            return "Microphone access was denied. Please allow microphone permissions in your browser settings to use this feature.";
        case 'network':
            return "A network error occurred during speech recognition. Please check your internet connection.";
        case 'service-not-allowed':
            return "Speech recognition service is not allowed by your browser or a security setting. Please check your browser's permissions.";
        default:
            return `An unknown speech recognition error occurred: ${errorCode}`;
    }
};

const useSpeechRecognition = (): SpeechRecognitionHook => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const isListeningRef = useRef(false);

  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const isSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const clearError = () => setError(null);

  useEffect(() => {
    if (!isSupported) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }

    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognitionAPI();
    const recognition = recognitionRef.current;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcriptArray = Array.from(event.results);
      const fullTranscript = transcriptArray
        .map(result => result[0])
        .map(result => result.transcript)
        .join('');
      setTranscript(fullTranscript);
    };
    
    recognition.onend = () => {
      if (isListeningRef.current) {
        // Restart listening if it was not stopped manually by the user
        recognition.start();
      } else {
        // Ensure state is synced if recognition stops for other reasons
        setIsListening(false);
      }
    };

    recognition.onerror = (event: any) => {
      setError(getSpeechErrorMessage(event.error));
      setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isSupported]);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setError(null);
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  return { isListening, transcript, startListening, stopListening, error, clearError, isSupported };
};

export default useSpeechRecognition;