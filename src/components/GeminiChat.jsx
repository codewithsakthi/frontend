
import React, { useState, useRef, useEffect } from 'react';
import { askGemini } from '../api/gemini';

function Bubble({ from, children }) {
  const isUser = from === 'user';
  return (
    <div style={{
      display: 'flex',
      justifyContent: isUser ? 'flex-end' : 'flex-start',
      marginBottom: 8,
    }}>
      <div style={{
        maxWidth: '75%',
        background: isUser ? 'var(--color-primary)' : 'var(--card)',
        color: isUser ? 'var(--color-primary-foreground)' : 'var(--color-foreground)',
        borderRadius: 18,
        padding: '10px 16px',
        fontSize: 15,
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        borderTopRightRadius: isUser ? 4 : 18,
        borderTopLeftRadius: isUser ? 18 : 4,
        wordBreak: 'break-word',
      }}>
        {children}
      </div>
    </div>
  );
}

export default function GeminiChat() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    { from: 'gemini', text: 'Hi! I am Gemini AI. How can I help you today?' }
  ]);
  const chatRef = useRef(null);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages(msgs => [...msgs, { from: 'user', text: input }]);
    setLoading(true);
    setError('');
    setInput('');
    try {
      const res = await askGemini(input);
      setMessages(msgs => [...msgs, { from: 'gemini', text: res }]);
    } catch (err) {
      setMessages(msgs => [...msgs, { from: 'gemini', text: 'Sorry, I could not get a response.' }]);
      setError('Failed to get response from Gemini.');
    } finally {
      setLoading(false);
    }
  };

  // Floating button and chat styles
  return (
    <>
      {/* Floating Button */}
      <button
        aria-label="Open Gemini Chat"
        onClick={() => setOpen(v => !v)}
        style={{
          position: 'fixed',
          bottom: 32,
          right: 32,
          zIndex: 1000,
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
          border: 'none',
          boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
          fontSize: 28,
          cursor: 'pointer',
          display: open ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'background 0.2s',
        }}
      >
        <span role="img" aria-label="Gemini">💬</span>
      </button>

      {/* Chat Window */}
      {open && (
        <div
          style={{
            position: 'fixed',
            bottom: 32,
            right: 32,
            zIndex: 1001,
            width: 350,
            maxWidth: '95vw',
            height: 480,
            background: 'var(--card)',
            color: 'var(--color-foreground)',
            borderRadius: 18,
            boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            border: '1.5px solid var(--color-border)',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '12px 18px',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
            fontWeight: 700,
            fontSize: 17,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            Gemini AI
            <button
              aria-label="Close Gemini Chat"
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: 'inherit',
                fontSize: 22,
                cursor: 'pointer',
                marginLeft: 8,
              }}
            >
              ×
            </button>
          </div>
          {/* Chat History */}
          <div
            ref={chatRef}
            style={{
              flex: 1,
              padding: '18px 12px',
              overflowY: 'auto',
              background: 'var(--card)',
            }}
          >
            {messages.map((msg, i) => (
              <Bubble key={i} from={msg.from}>{msg.text}</Bubble>
            ))}
            {loading && <Bubble from="gemini"><span style={{ opacity: 0.7 }}>Gemini is typing…</span></Bubble>}
          </div>
          {/* Input */}
          <form
            onSubmit={handleSend}
            style={{
              display: 'flex',
              borderTop: '1px solid var(--color-border)',
              background: 'var(--card)',
              padding: 10,
              gap: 8,
            }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Type your message..."
              style={{
                flex: 1,
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: '8px 12px',
                fontSize: 15,
                background: 'var(--color-muted)',
                color: 'var(--color-foreground)',
                outline: 'none',
              }}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              style={{
                background: 'var(--color-primary)',
                color: 'var(--color-primary-foreground)',
                border: 'none',
                borderRadius: 8,
                padding: '0 18px',
                fontWeight: 600,
                fontSize: 15,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.7 : 1,
                transition: 'opacity 0.2s',
              }}
            >
              Send
            </button>
          </form>
          {error && <div style={{ color: 'red', padding: 8, fontSize: 13 }}>{error}</div>}
        </div>
      )}
    </>
  );
}
