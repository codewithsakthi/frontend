import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, Sparkles, X, ChevronRight, Loader2, Paperclip, MessageSquare } from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

// ─── Suggested prompts like Claude ───────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  { label: '🔥 Summarise academic risks', query: 'Which students are at the highest academic risk and why?' },
  { label: '📉 Identify subject bottlenecks', query: 'Which subjects have the highest failure rates, and what are their averages?' },
  { label: '🎯 Check placement readiness', query: 'List the most placement-ready students based on their coding scores and CGPA.' },
  { label: '⭐ Find top performers', query: 'Who are the top academic performers in the cohort?' },
];

function Bubble({ from, children }) {
  const isUser = from === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-[#cc5a37]/10 border border-[#cc5a37]/20 flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0 shadow-sm">
          <Bot size={14} className="text-[#cc5a37]" />
        </div>
      )}
      <div 
        className={`
          max-w-[80%] rounded-[1.25rem] px-4 py-2.5 text-sm leading-6 shadow-sm border
          ${isUser 
            ? 'bg-[#f0ede4] dark:bg-[#1b3542] border-[#e4e1d6] dark:border-[#24414e] text-[#191919] dark:text-[#edf5f7] rounded-tr-sm'
            : 'bg-[#fbfaf7] dark:bg-[#132630] border-[#ecebe4] dark:border-[#24414e] text-[#191919] dark:text-[#edf5f7] rounded-tl-sm'
          }
        `}
        style={{ wordBreak: 'break-word' }}
      >
        {children}
      </div>
    </div>
  );
}

export default function GeminiChat({ inline = false }) {
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';
  console.log("GeminiChat: theme =", theme, "isDark =", isDark);

  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [messages, setMessages] = useState([
    { 
      from: 'assistant', 
      text: 'Hello! I am Claude, your SPARK Student Data Analyst. I have real-time access to the cohort database. Ask me anything about student performance, attendance risk, placements, or academic bottlenecks!' 
    }
  ]);
  
  const chatRef = useRef(null);
  const abortControllerRef = useRef(null);

  // ─── Event and Route Listeners for Sidebar clicks & Routing ────────────────
  useEffect(() => {
    if (inline) return;

    const handleOpenEvent = () => setOpen(true);
    window.addEventListener('open-claude-chat', handleOpenEvent);

    const handleLocationChange = () => {
      if (window.location.pathname === '/gemini-chat' || window.location.hash === '#claude-chat') {
        setOpen(true);
        // Clean URL to avoid infinite redirect
        if (window.location.pathname === '/gemini-chat') {
          const searchParams = new URLSearchParams(window.location.search);
          const currentTab = searchParams.get('tab') || 'Overview';
          window.history.replaceState(null, '', `/admin?tab=${currentTab}`);
        }
      }
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    const interval = setInterval(handleLocationChange, 400);

    return () => {
      window.removeEventListener('open-claude-chat', handleOpenEvent);
      window.removeEventListener('popstate', handleLocationChange);
      clearInterval(interval);
    };
  }, [inline]);

  // Sync state back to dispatch event (to update Sidebar or other components)
  useEffect(() => {
    if (inline) return;

    if (open) {
      window.dispatchEvent(new CustomEvent('open-claude-chat'));
    } else {
      window.dispatchEvent(new CustomEvent('close-claude-chat'));
    }
  }, [open, inline]);

  useEffect(() => {
    if (open && chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages, open]);

  // Clean up streaming on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSend = async (customPrompt) => {
    const text = (typeof customPrompt === 'string' ? customPrompt : input).trim();
    if (!text || loading) return;

    // Append user message
    setMessages(msgs => [...msgs, { from: 'user', text }]);
    setLoading(true);
    setError('');
    setInput('');

    // Append initial assistant placeholder
    const assistantPlaceholder = { from: 'assistant', text: '', streaming: true };
    setMessages(msgs => [...msgs, assistantPlaceholder]);

    const token = useAuthStore.getState().token || '';
    const baseUrl = (api.defaults?.baseURL || '').replace(/\/api\/v1$/, '');

    // Setup streaming request
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      // Gather chat history to maintain context (last 6 messages)
      const chatHistory = messages.map(m => ({
        role: m.from === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      const resp = await fetch(`${baseUrl}/api/v1/ai/copilot/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: text,
          chat_history: chatHistory.slice(-6),
        }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        throw new Error(`Server returned ${resp.status}`);
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error('No stream available');
      
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const raw = line.slice(6).trim();
          if (raw === '[DONE]') {
            setLoading(false);
            setMessages(prev => {
              const updated = [...prev];
              const last = updated[updated.length - 1];
              if (last && last.from === 'assistant') {
                updated[updated.length - 1] = { ...last, streaming: false };
              }
              return updated;
            });
            return;
          }
          try {
            const parsed = JSON.parse(raw);
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.from === 'assistant') {
                  updated[updated.length - 1] = { ...last, text: last.text + parsed.text };
                }
                return updated;
              });
            }
            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (e) {
            /* ignore JSON parse issues */
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.from === 'assistant') {
          updated[updated.length - 1] = { 
            ...last, 
            text: last.text ? last.text : '⚠️ Sorry, I encountered an error connecting to the SPARK AI service. Please make sure Ollama/DeepSeek is running.',
            streaming: false 
          };
        }
        return updated;
      });
      setError(err.message || 'Stream failed');
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.from === 'assistant') {
          updated[updated.length - 1] = { ...last, streaming: false };
        }
        return updated;
      });
    }
  };

  if (inline) {
    return (
      <div
        className="fixed top-14 md:top-16 right-0 bottom-[76px] lg:bottom-0 z-20 flex flex-col overflow-hidden border-l rounded-none transition-all duration-300 border-[#ecebe4] dark:border-[#24414e] bg-[#fbfaf7] dark:bg-[#0d1c24]"
        style={{
          width: 'calc(100vw - var(--sidebar-width))',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}
      >
        <style dangerouslySetInnerHTML={{__html: `
          @media (min-width: 768px) {
            .claude-inline-container {
              height: calc(100vh - 4rem) !important;
            }
          }
        `}} />
        <div className="claude-inline-container flex flex-col h-full w-full">
          {/* Header styled like Claude */}
          <div className="flex items-center justify-between border-b px-4.5 py-3.5 border-[#ecebe4] dark:border-[#24414e] bg-[#fdfdfc] dark:bg-[#102330]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#cc5a37]/10 border border-[#cc5a37]/20">
                <Sparkles size={18} className="text-[#cc5a37]" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none text-[#191919] dark:text-[#edf5f7]">Claude AI Analyst</p>
                <div className="flex items-center gap-1 mt-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-[#cc5a37]">Student Data Specialist</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chat History & Welcome Suggested Prompts */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto px-4.5 py-6 bg-[#fbfaf7] dark:bg-[#0d1c24]"
          >
            <div className="max-w-4xl mx-auto w-full space-y-4">
              {messages.map((msg, i) => (
                <Bubble key={i} from={msg.from}>
                  <span className="whitespace-pre-wrap">{msg.text}</span>
                  {msg.streaming && (
                    <span className="inline-block w-1.5 h-4 bg-[#cc5a37] ml-0.5 animate-pulse rounded-full align-middle" />
                  )}
                </Bubble>
              ))}
              
              {/* Suggested prompts in a grid format */}
              {messages.length === 1 && (
                <div className="mt-4 space-y-2.5 pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#888680] dark:text-[#9fb3bc]/60">Suggested Queries</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {SUGGESTED_PROMPTS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleSend(p.query)}
                        className="flex items-center justify-between text-left rounded-xl border px-3.5 py-2.5 text-xs transition-all group border-[#ecebe4] dark:border-[#24414e] bg-[#fbfaf7] dark:bg-[#0d1c24] text-[#191919] dark:text-[#edf5f7] hover:bg-[#cc5a37]/5 dark:hover:bg-[#cc5a37]/10"
                      >
                        <span className="font-semibold">{p.label}</span>
                        <ChevronRight size={14} className="text-[#888680] dark:text-[#9fb3bc] group-hover:text-[#cc5a37] transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Chat Input Bar like Claude */}
          <div className="border-t p-3.5 pb-6 border-[#ecebe4] dark:border-[#24414e] bg-[#fdfdfc] dark:bg-[#102330]">
            <div className="max-w-4xl mx-auto w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2 rounded-xl border pl-3 pr-1.5 py-1.5 focus-within:border-[#cc5a37]/60 transition-all border-[#ecebe4] dark:border-[#24414e] bg-[#fbfaf7] dark:bg-[#0d1c24]"
              >
                <Paperclip size={16} className="text-[#888680] dark:text-[#9fb3bc] shrink-0 cursor-not-allowed opacity-50" />
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={loading ? 'Claude is typing...' : 'Ask Claude about your cohort records...'}
                  className="flex-1 bg-transparent text-sm outline-none disabled:opacity-60 text-[#191919] dark:text-[#edf5f7] placeholder-[#888680]/60 dark:placeholder-[#9fb3bc]/40"
                  disabled={loading}
                  autoFocus
                />
                
                {loading ? (
                  <button
                    type="button"
                    onClick={handleStop}
                    className="flex h-8 items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 text-xs font-bold text-rose-500 border border-rose-500/25 hover:bg-rose-500/20 active:scale-95 transition-all"
                  >
                    <Loader2 size={12} className="animate-spin" />
                    Stop
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={!input.trim()}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc5a37] text-white hover:bg-[#cc5a37]/90 disabled:opacity-30 disabled:hover:bg-[#cc5a37] active:scale-95 transition-all"
                  >
                    <Send size={14} />
                  </button>
                )}
              </form>
              
              {messages.length > 1 && (
                <div className="flex items-center justify-between mt-2.5 px-0.5">
                  <button
                    type="button"
                    onClick={() => setMessages([
                      { 
                        from: 'assistant', 
                        text: 'Welcome back! How else can I assist you in analyzing your student data?' 
                      }
                    ])}
                    className="text-[10px] font-bold text-[#cc5a37] hover:text-[#cc5a37]/80 transition-colors"
                  >
                    Reset Chat
                  </button>
                  
                  <p className="text-[10px] text-[#888680] dark:text-[#9fb3bc]">
                    DeepSeek-V3 Engine
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Floating Button (shown only when closed) */}
      {!open && (
        <button
          aria-label="Open Claude AI Chat"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#cc5a37] to-[#e05e38] text-white shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Claude AI Chat Window */}
      {open && (
        <div
          className="fixed top-0 right-0 bottom-0 z-40 flex flex-col overflow-hidden border-l border-[#ecebe4] dark:border-[#24414e] bg-[#fbfaf7] dark:bg-[#0d1c24] shadow-[0_12px_40px_rgba(27,27,27,0.12)] transition-all duration-300"
          style={{
            width: 'calc(100vw - var(--sidebar-width))',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}
        >
          {/* Header styled like Claude */}
          <div className="flex items-center justify-between border-b border-[#ecebe4] dark:border-[#24414e] bg-[#fdfdfc] dark:bg-[#102330] px-4.5 py-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#cc5a37]/10 border border-[#cc5a37]/15">
                <Sparkles size={18} className="text-[#cc5a37]" />
              </div>
              <div>
                <p className="text-sm font-bold text-[#191919] dark:text-[#edf5f7] leading-none">Claude AI Analyst</p>
                <div className="flex items-center gap-1 mt-1 leading-none">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-[#cc5a37]">Student Data Specialist</p>
                </div>
              </div>
            </div>
            
            <button
              aria-label="Close Chat"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-[#888680] dark:text-[#9fb3bc] hover:bg-[#f0ede4] dark:hover:bg-[#17303c] hover:text-[#191919] dark:hover:text-[#edf5f7] transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Chat History & Welcome Suggested Prompts */}
          <div
            ref={chatRef}
            className="flex-1 overflow-y-auto px-4.5 py-4 bg-[#fbfaf7] dark:bg-[#0d1c24] space-y-4"
          >
            {messages.map((msg, i) => (
              <Bubble key={i} from={msg.from}>
                <span className="whitespace-pre-wrap">{msg.text}</span>
                {msg.streaming && (
                  <span className="inline-block w-1.5 h-4 bg-[#cc5a37] ml-0.5 animate-pulse rounded-full align-middle" />
                )}
              </Bubble>
            ))}
            
            {/* Suggested prompts in a grid format */}
            {messages.length === 1 && (
              <div className="mt-4 space-y-2.5 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#888680] dark:text-[#9fb3bc]/60">Suggested Queries</p>
                <div className="grid gap-2">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSend(p.query)}
                      className="flex items-center justify-between text-left rounded-xl border border-[#ecebe4] dark:border-[#24414e] bg-[#fbfaf7] dark:bg-[#0d1c24] px-3.5 py-2.5 text-xs text-[#191919] dark:text-[#edf5f7] hover:border-[#cc5a37]/50 hover:bg-[#cc5a37]/5 dark:hover:bg-[#cc5a37]/10 transition-all group"
                    >
                      <span className="font-semibold">{p.label}</span>
                      <ChevronRight size={14} className="text-[#888680] dark:text-[#9fb3bc] group-hover:text-[#cc5a37] transition-colors" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar like Claude */}
          <div className="border-t border-[#ecebe4] dark:border-[#24414e] bg-[#fdfdfc] dark:bg-[#102330] p-3.5">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-xl border border-[#ecebe4] dark:border-[#24414e] bg-[#fbfaf7] dark:bg-[#0d1c24] pl-3 pr-1.5 py-1.5 focus-within:border-[#cc5a37]/60 transition-all"
            >
              <Paperclip size={16} className="text-[#888680] dark:text-[#9fb3bc] shrink-0 cursor-not-allowed opacity-50" />
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={loading ? 'Claude is typing...' : 'Ask Claude about your cohort records...'}
                className="flex-1 bg-transparent text-sm text-[#191919] dark:text-[#edf5f7] outline-none placeholder-[#888680]/60 dark:placeholder-[#9fb3bc]/40 disabled:opacity-60"
                disabled={loading}
                autoFocus
              />
              
              {loading ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-rose-500/10 px-2.5 text-xs font-bold text-rose-500 border border-rose-500/25 hover:bg-rose-500/20 active:scale-95 transition-all"
                >
                  <Loader2 size={12} className="animate-spin" />
                  Stop
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#cc5a37] text-white hover:bg-[#cc5a37]/90 disabled:opacity-30 disabled:hover:bg-[#cc5a37] active:scale-95 transition-all"
                >
                  <Send size={14} />
                </button>
              )}
            </form>
            
            {messages.length > 1 && (
              <div className="flex items-center justify-between mt-2.5 px-0.5">
                <button
                  type="button"
                  onClick={() => setMessages([
                    { 
                      from: 'assistant', 
                      text: 'Welcome back! How else can I assist you in analyzing your student data?' 
                    }
                  ])}
                  className="text-[10px] font-bold text-[#cc5a37] hover:text-[#cc5a37]/80 transition-colors"
                >
                  Reset Chat
                </button>
                
                <p className="text-[10px] text-[#888680] dark:text-[#9fb3bc]">
                  DeepSeek-V3 Engine
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
