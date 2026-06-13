"use client";

import { useState, useEffect, useRef } from "react";

interface VoiceInputProps {
  onResult: (text: string) => void;
  disabled?: boolean;
}

export default function VoiceInput({ onResult, disabled }: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const retryCountRef = useRef(0);
  // Store onResult in a ref to avoid re-running effect
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    // Initialize speech recognition if supported
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      setError("Speech recognition not supported. Use Chrome or Edge.");
      return;
    }

    const recog = new SpeechRecognition();
    recog.continuous = false;
    recog.interimResults = false;
    recog.lang = "en-US";
    recog.maxAlternatives = 1;

    recog.onstart = () => {
      console.log("Speech recognition started");
      setListening(true);
      setError(null);
    };

    recog.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      console.log("Speech recognized:", transcript);
      recog.stop();
      onResultRef.current(transcript);
      setListening(false);
      retryCountRef.current = 0;
    };

    recog.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setListening(false);

      if (event.error === "network") {
        if (retryCountRef.current < 2) {
          retryCountRef.current++;
          setError(`Network error – retrying (${retryCountRef.current}/2)...`);
          setTimeout(() => {
            if (recognitionRef.current && !listening) {
              recognitionRef.current.start();
            }
          }, 1000);
        } else {
          setError("Network error. Please check your internet and try again.");
          retryCountRef.current = 0;
        }
      } else if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError(`Error: ${event.error}. Please try again.`);
      }
    };

    recog.onend = () => {
      console.log("Speech recognition ended");
      setListening(false);
    };

    recognitionRef.current = recog;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (e) {
          // ignore
        }
      }
    };
  }, []); // Empty dependency array – effect runs only once

  const toggleListening = async () => {
    if (!recognitionRef.current) {
      setError("Speech recognition not supported in this browser.");
      return;
    }

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
      return;
    }

    // Request microphone permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      recognitionRef.current.start();
      setError(null);
      retryCountRef.current = 0;
    } catch (err: any) {
      console.error("Microphone permission error:", err);
      if (err.name === "NotAllowedError") {
        setError("Microphone permission denied. Please allow access and try again.");
      } else if (err.name === "NotFoundError") {
        setError("No microphone found. Please connect a microphone.");
      } else {
        setError("Could not access microphone. Please check your permissions.");
      }
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={disabled}
        style={{
          padding: '0.5rem',
          borderRadius: '9999px',
          transition: 'all 0.2s',
          background: listening
            ? '#ef4444'
            : error
            ? '#eab308'
            : '#e5e7eb',
          color: listening || error ? 'white' : '#374151',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '2rem',
          height: '2rem',
        }}
        title="Click and speak"
      >
        🎤
      </button>
      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            marginBottom: '0.5rem',
            padding: '0.25rem 0.5rem',
            backgroundColor: '#dc2626',
            color: 'white',
            fontSize: '0.7rem',
            borderRadius: '0.25rem',
            whiteSpace: 'nowrap',
            zIndex: 50,
            maxWidth: '200px',
            whiteSpace: 'normal',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
}