"use client";

import { useState, useRef, useEffect } from "react";
import VoiceInput from "./VoiceInput";

type Message = { role: "user" | "assistant"; content: string };

export default function ChatWindow() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [convId, setConvId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim()) return;
    const newMessages = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/support/chat", {
        method: "POST",
        body: JSON.stringify({ conversationId: convId, messages: newMessages }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.conversationId && !convId) setConvId(data.conversationId);
      setMessages([...newMessages, data.reply]);

      if (window.speechSynthesis && data.reply?.content) {
        const utterance = new SpeechSynthesisUtterance(data.reply.content);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setMessages([...newMessages, { role: "assistant", content: "Sorry, I'm having trouble right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  if (!mounted) return null;

  return (
    <div style={{
      position: 'relative',
      minHeight: '100vh',
      width: '100%',
      background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
      overflow: 'hidden'
    }}>
      {/* Animated background orbs */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '-5%',
        width: '60%',
        height: '60%',
        borderRadius: '50%',
        background: 'rgba(139, 92, 246, 0.3)',
        filter: 'blur(150px)',
        animation: 'pulse 6s ease-in-out infinite'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        right: '-5%',
        width: '60%',
        height: '60%',
        borderRadius: '50%',
        background: 'rgba(59, 130, 246, 0.3)',
        filter: 'blur(150px)',
        animation: 'pulse 6s ease-in-out infinite 1s'
      }} />

      {/* Main centering container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: '1rem',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Hero section */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
            <span style={{ color: '#a3e635', fontWeight: 'bold', fontSize: '0.875rem', letterSpacing: '0.1em' }}>✨ AMAZING AI</span>
          </div>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 8vw, 5rem)',
            fontWeight: '900',
            letterSpacing: '-0.025em',
            background: 'linear-gradient(to right, white, #e5e7eb, white)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
          }}>
            Refund Support
          </h1>
          <p style={{ color: '#d1d5db', fontSize: 'clamp(1rem, 4vw, 1.25rem)', marginTop: '1rem', maxWidth: '42rem', marginLeft: 'auto', marginRight: 'auto' }}>
            Here to help you 24/7
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.5rem' }}>
            <div style={{ height: '0.25rem', width: '5rem', background: 'linear-gradient(to right, #a3e635, #10b981)', borderRadius: '9999px' }} />
          </div>
        </div>

        {/* Glassmorphic chat card */}
        <div style={{
          width: '100%',
          maxWidth: '56rem',
          marginLeft: 'auto',
          marginRight: 'auto',
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '1.5rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden'
        }}>
          {/* Chat messages area */}
          <div style={{
            height: '55vh',
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}>
            {messages.length === 0 ? (
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                textAlign: 'center',
                color: '#d1d5db',
                gap: '1rem'
              }}>
                <div style={{
                  width: '5rem',
                  height: '5rem',
                  borderRadius: '9999px',
                  background: 'linear-gradient(135deg, rgba(163,230,53,0.2), rgba(16,185,129,0.2))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2rem'
                }}>
                  💬
                </div>
                <div>
                  <p style={{ fontSize: '1.25rem', fontWeight: '600', color: 'white' }}>Start a conversation</p>
                  <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginTop: '0.5rem', maxWidth: '20rem' }}>
                    Tell me your order number and I’ll check your refund eligibility instantly.
                  </p>
                </div>
              </div>
            ) : (
              messages.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                    animation: 'fadeInUp 0.4s cubic-bezier(0.2, 0.9, 0.4, 1.1) forwards'
                  }}
                >
                  <div style={{
                    maxWidth: '85%',
                    borderRadius: '1rem',
                    padding: '0.75rem 1rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    background: m.role === 'user'
                      ? 'linear-gradient(135deg, #a3e635, #10b981)'
                      : 'rgba(255, 255, 255, 0.1)',
                    border: m.role === 'assistant' ? '1px solid rgba(255, 255, 255, 0.2)' : 'none',
                    color: m.role === 'user' ? 'black' : 'white',
                    borderRadiusTopRight: m.role === 'user' ? '0' : '1rem',
                    borderRadiusTopLeft: m.role === 'assistant' ? '0' : '1rem'
                  }}>
                    <p style={{ fontSize: '0.875rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{m.content}</p>
                    <span style={{ fontSize: '0.625rem', opacity: 0.6, marginTop: '0.375rem', display: 'block', textAlign: 'right' }}>
                      {m.role === 'user' ? 'You' : 'Amazing Assistant'}
                    </span>
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start', animation: 'fadeInUp 0.3s ease-out' }}>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '1rem',
                  padding: '0.5rem 1rem',
                  display: 'flex',
                  gap: '0.25rem'
                }}>
                  <div style={{ width: '0.5rem', height: '0.5rem', background: '#9ca3af', borderRadius: '9999px', animation: 'bounce 1s infinite' }} />
                  <div style={{ width: '0.5rem', height: '0.5rem', background: '#9ca3af', borderRadius: '9999px', animation: 'bounce 1s infinite 0.2s' }} />
                  <div style={{ width: '0.5rem', height: '0.5rem', background: '#9ca3af', borderRadius: '9999px', animation: 'bounce 1s infinite 0.4s' }} />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1rem',
            background: 'rgba(0, 0, 0, 0.2)',
            borderRadius: '0 0 1.5rem 1.5rem'
          }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage(input);
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="I want a refund for my order [number]..."
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '9999px',
                  padding: '0.625rem 1.25rem',
                  color: 'white',
                  fontSize: '0.875rem',
                  outline: 'none'
                }}
              />
              <VoiceInput onResult={sendMessage} disabled={loading} />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  background: 'linear-gradient(135deg, #a3e635, #10b981)',
                  color: 'black',
                  fontWeight: '600',
                  padding: '0.5rem 1.25rem',
                  borderRadius: '9999px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Footer */}
        <p style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '2rem', textAlign: 'center' }}>
          Powered by self‑hosted AI · 100% private · Voice enabled
        </p>
      </div>

      {/* Add keyframes for animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}