import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, Sparkles, Loader2, Paperclip, ChevronRight,
  Database, RefreshCw, CheckCircle2, AlertCircle, ChevronDown,
  ChevronUp, Layers, Zap, Search, X, Brain
} from 'lucide-react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

// ─── Suggested Prompts ───────────────────────────────────────────────────────
const SUGGESTED_PROMPTS = [
  { icon: '🎯', label: 'At-risk students', query: 'List all students who are at academic risk — low GPA, poor attendance, or multiple backlogs.' },
  { icon: '📊', label: 'Batch performance', query: 'Compare the overall performance of each section — average GPA, attendance, and pass rate.' },
  { icon: '👨‍🏫', label: 'Faculty overview', query: 'Which faculty members teach the most subjects and in which sections?' },
  { icon: '📈', label: 'Placement readiness', query: 'List the top placement-ready students by their capability scores and placement probability.' },
  { icon: '📅', label: 'Attendance analysis', query: 'Which students have attendance below 75% and in which subjects?' },
  { icon: '🏆', label: 'Top performers', query: 'Show the top 10 students by academic performance across all semesters.' },
];

const MODEL_OPTIONS = [
  { id: 'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free', label: 'Nemotron 3 Nano Omni (Free)', hasReasoning: true },
  { id: 'nvidia/llama-nemotron-embed-vl-1b-v2:free', label: 'Llama Nemotron Embed VL 1B V2 (Free)', hasReasoning: false },
  { id: 'deepseek/deepseek-r1:free', label: 'DeepSeek R1 (Free)', hasReasoning: true },
  { id: 'google/gemini-2.5-flash-thinking-exp:free', label: 'Gemini 2.5 Thinking (Free)', hasReasoning: true },
  { id: 'qwen/qwen-2.5-72b-instruct:free', label: 'Qwen 2.5 72B (Free)', hasReasoning: false },
];

// ─── Source Citation Component ───────────────────────────────────────────────
function SourceCitations({ sources }: { sources: any[] }) {
  const [expanded, setExpanded] = useState(false);

  if (!sources || sources.length === 0) return null;

  const tableColors: Record<string, string> = {
    students: 'bg-blue-500/15 text-blue-600 dark:text-blue-400',
    assessments: 'bg-purple-500/15 text-purple-600 dark:text-purple-400',
    attendance: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    staff: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    subjects: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
    capability_scores: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
    counselor_diary: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
    timetable: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
    extra_curricular: 'bg-pink-500/15 text-pink-600 dark:text-pink-400',
    enrollments: 'bg-teal-500/15 text-teal-600 dark:text-teal-400',
  };

  return (
    <div className="mt-2 rounded-xl border border-border/40 overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground hover:bg-muted/20 transition-colors"
      >
        <span className="flex items-center gap-1.5">
          <Layers size={12} />
          {sources.length} Sources Retrieved
        </span>
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {expanded && (
        <div className="border-t border-border/30 divide-y divide-border/20 max-h-48 overflow-y-auto">
          {sources.map((src, i) => (
            <div key={i} className="px-3 py-2 text-xs flex items-start gap-2">
              <span className={`inline-flex px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest shrink-0 mt-0.5 ${tableColors[src.table] || 'bg-muted/30 text-muted-foreground'}`}>
                {src.table}
              </span>
              <span className="text-muted-foreground leading-relaxed line-clamp-2">
                {src.text}
              </span>
              <span className="text-[9px] text-muted-foreground/60 shrink-0 font-mono">
                {Math.round((src.similarity || 0) * 100)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ThinkingAccordion({ reasoning, elapsed, isStreaming }: { reasoning?: string; elapsed?: number; isStreaming?: boolean }) {
  const [collapsed, setCollapsed] = useState(false);
  
  if (!reasoning && !isStreaming) return null;

  return (
    <div className="mb-3 rounded-xl border border-violet-500/15 bg-violet-500/[0.04] dark:bg-violet-500/[0.02] shadow-sm overflow-hidden transition-all duration-300 max-w-full">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 dark:hover:bg-violet-500/10 transition-colors"
      >
        <span className="flex items-center gap-2">
          {isStreaming ? (
            <Loader2 size={11} className="animate-spin text-violet-500" />
          ) : (
            <Brain size={11} className="text-violet-500" />
          )}
          <span>{isStreaming ? `Thinking... (${elapsed || 0}s)` : 'Thinking Process'}</span>
        </span>
        <ChevronDown size={12} className={`transform transition-transform duration-200 ${collapsed ? '-rotate-90' : ''}`} />
      </button>
      {!collapsed && (
        <div className="border-t border-violet-500/10 px-3.5 py-2.5 text-xs text-muted-foreground/90 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
          {reasoning || 'Analyzing query parameters...'}
        </div>
      )}
    </div>
  );
}

// ─── Chat Bubble ─────────────────────────────────────────────────────────────
function Bubble({ from, children, sources }: { from: string; children: React.ReactNode; sources?: any[] }) {
  const isUser = from === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/25 flex items-center justify-center mr-2.5 mt-0.5 flex-shrink-0 shadow-sm animate-fade-in">
          <Brain size={14} className="text-violet-500" />
        </div>
      )}
      <div className="max-w-[80%] min-w-0">
        <div
          className={`
            rounded-[1.25rem] px-4 py-2.5 text-sm leading-6 shadow-sm border transition-all duration-300
            ${isUser
              ? 'bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/20 text-foreground rounded-tr-sm'
              : 'bg-card/80 backdrop-blur-sm border-border/50 text-foreground rounded-tl-sm'
            }
          `}
          style={{ wordBreak: 'break-word' }}
        >
          {children}
        </div>
        {!isUser && sources && <SourceCitations sources={sources} />}
      </div>
    </div>
  );
}

// ─── RAG Status Badge ────────────────────────────────────────────────────────
function RAGStatusBadge({ status, onClick }: { status: any; onClick: () => void }) {
  if (!status) return null;

  const isIndexed = status.indexed && status.total_docs > 0;
  const isIndexing = status.is_indexing;

  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em]
        border transition-all hover:scale-[1.02] active:scale-[0.98]
        ${isIndexing
          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 animate-pulse'
          : isIndexed
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
        }
      `}
    >
      {isIndexing ? (
        <><Loader2 size={10} className="animate-spin" /> Indexing...</>
      ) : isIndexed ? (
        <><CheckCircle2 size={10} /> {status.total_docs.toLocaleString()} docs</>
      ) : (
        <><AlertCircle size={10} /> Not indexed</>
      )}
    </button>
  );
}

// ─── Main RAGChat Component ──────────────────────────────────────────────────
export default function RAGChat() {
  const { theme } = useThemeStore();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [ragStatus, setRagStatus] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState(
    localStorage.getItem('openrouter_selected_model') || MODEL_OPTIONS[0].id
  );
  
  const [messages, setMessages] = useState<any[]>([
    {
      from: 'assistant',
      text: 'Hello! I\'m **SPARK RAG AI** — powered by deep semantic search over your entire database. I can answer detailed questions about students, faculty, assessments, attendance, placements, and more with source-level accuracy.\n\nTry asking me anything!',
      sources: null,
    },
  ]);

  const chatRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Fetch RAG status on mount and poll when indexing is in progress
  useEffect(() => {
    fetchRAGStatus();
  }, []);

  useEffect(() => {
    let intervalId: any;
    if (ragStatus?.is_indexing) {
      intervalId = setInterval(() => {
        fetchRAGStatus();
      }, 5000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [ragStatus?.is_indexing]);

  // Auto-scroll
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchRAGStatus = async () => {
    try {
      const resp = await api.get('ai/rag/status');
      setRagStatus(resp);
    } catch (e) {
      console.warn('Failed to fetch RAG status:', e);
    }
  };

  const handleIndex = async () => {
    if (indexing) return;
    setIndexing(true);
    setRagStatus((prev: any) => ({ ...prev, is_indexing: true }));

    try {
      await api.post('ai/rag/index');
      await fetchRAGStatus();
    } catch (e: any) {
      console.error('Index build failed:', e);
      setRagStatus((prev: any) => ({ ...prev, is_indexing: false, error: e.message }));
    } finally {
      setIndexing(false);
    }
  };

  const handleSend = async (customPrompt?: string) => {
    const text = (typeof customPrompt === 'string' ? customPrompt : input).trim();
    if (!text || loading) return;

    setMessages(msgs => [...msgs, { from: 'user', text, sources: null }]);
    setLoading(true);
    setInput('');

    const assistantPlaceholder = { 
      from: 'assistant', 
      text: '', 
      reasoning: '', 
      usage: null, 
      thinkingTime: 0,
      sources: null, 
      streaming: true 
    };
    setMessages(msgs => [...msgs, assistantPlaceholder]);

    const token = useAuthStore.getState().token || '';
    const baseUrl = ((api as any).defaults?.baseURL || '').replace(/\/api\/v1$/, '');

    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Start thinking timer
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.from === 'assistant' && last.streaming) {
          const elapsed = Math.round((Date.now() - startTime) / 1000);
          updated[updated.length - 1] = { ...last, thinkingTime: elapsed };
        }
        return updated;
      });
    }, 1000);

    try {
      const chatHistory = messages
        .filter(m => m.text)
        .map(m => ({
          role: m.from === 'user' ? 'user' : 'assistant',
          content: m.text,
        }));

      const resp = await fetch(`${baseUrl}/api/v1/ai/openrouter/ask`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          question: text,
          chat_history: chatHistory.slice(-6),
          model: selectedModel,
          use_rag: true, // Always pull RAG database insights!
        }),
        signal: controller.signal,
      });

      if (!resp.ok) throw new Error(`Server returned ${resp.status}`);

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
            clearInterval(timerInterval);
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
            if (parsed.sources) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.from === 'assistant') {
                  updated[updated.length - 1] = { ...last, sources: parsed.sources };
                }
                return updated;
              });
            }
            if (parsed.reasoning) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.from === 'assistant') {
                  updated[updated.length - 1] = { 
                    ...last, 
                    reasoning: (last.reasoning || '') + parsed.reasoning 
                  };
                }
                return updated;
              });
            }
            if (parsed.text) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.from === 'assistant') {
                  updated[updated.length - 1] = { 
                    ...last, 
                    text: (last.text || '') + parsed.text 
                  };
                }
                return updated;
              });
            }
            if (parsed.usage) {
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last && last.from === 'assistant') {
                  updated[updated.length - 1] = { ...last, usage: parsed.usage };
                }
                return updated;
              });
            }
            if (parsed.error) throw new Error(parsed.error);
          } catch (e) {
            /* ignore JSON parse issues */
          }
        }
      }
    } catch (err: any) {
      clearInterval(timerInterval);
      if (err.name === 'AbortError') return;
      setMessages(prev => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last && last.from === 'assistant') {
          updated[updated.length - 1] = {
            ...last,
            text: last.text || '⚠️ Sorry, I encountered an error connecting to the SPARK OpenRouter AI service. Please check the backend is running.',
            streaming: false,
          };
        }
        return updated;
      });
    } finally {
      clearInterval(timerInterval);
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

  const handleReset = () => {
    setMessages([
      {
        from: 'assistant',
        text: 'Chat reset! Ask me anything about your database.',
        sources: null,
      },
    ]);
  };

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const modelId = e.target.value;
    setSelectedModel(modelId);
    localStorage.setItem('openrouter_selected_model', modelId);
  };

  return (
    <div
      className="fixed top-14 md:top-16 right-0 bottom-[76px] lg:bottom-0 z-20 flex flex-col overflow-hidden border-l rounded-none transition-all duration-300 border-border/40 bg-background"
      style={{
        width: 'calc(100vw - var(--sidebar-width))',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div className="flex flex-col h-full w-full">
        {/* ─── Header ─────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b px-4.5 py-3 border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border border-violet-500/25 shadow-sm">
              <Brain size={20} className="text-violet-500" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold leading-none text-foreground">
                  SPARK RAG AI
                </p>
                <RAGStatusBadge status={ragStatus} onClick={fetchRAGStatus} />
              </div>
              <div className="flex items-center gap-1 mt-1 leading-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[10px] uppercase font-black tracking-widest text-violet-500">
                  Database Intelligence Engine
                </p>
              </div>
            </div>
          </div>

          {/* Model Selector & Index Controls */}
          <div className="flex items-center gap-2.5">
            <select
              value={selectedModel}
              onChange={handleModelChange}
              className="text-[11px] font-bold bg-[#fbfaf7] dark:bg-[#0d1c24] border border-border/40 rounded-lg px-2.5 py-1.5 text-violet-500 dark:text-violet-400 outline-none max-w-[170px] truncate"
            >
              {MODEL_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>

            <button
              onClick={handleIndex}
              disabled={indexing}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold
                border transition-all active:scale-[0.97]
                ${indexing
                  ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 cursor-wait'
                  : 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20 hover:bg-violet-500/20'
                }
              `}
              title="Rebuild RAG index from database"
            >
              {indexing ? (
                <><Loader2 size={12} className="animate-spin" /> Indexing...</>
              ) : (
                <><Database size={12} /> Rebuild Index</>
              )}
            </button>
          </div>
        </div>

        {/* ─── Index Status Banner ────────────────────────────────────── */}
        {ragStatus && !ragStatus.indexed && !ragStatus.is_indexing && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-rose-500/10 border-b border-amber-500/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-amber-500 shrink-0" />
              <p className="text-xs text-amber-700 dark:text-amber-300">
                <strong>RAG index is empty.</strong> Click "Rebuild Index" to index your database for intelligent search.
                The AI will still work but with limited context.
              </p>
            </div>
          </div>
        )}

        {ragStatus?.is_indexing && (
          <div className="px-4 py-2.5 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-b border-violet-500/20 flex items-center gap-2">
            <Loader2 size={14} className="text-violet-500 animate-spin shrink-0" />
            <p className="text-xs text-violet-700 dark:text-violet-300">
              <strong>Indexing in progress...</strong> Extracting, embedding, and storing all database records.
              This may take 1-3 minutes.
            </p>
          </div>
        )}

        {/* ─── Chat Messages ──────────────────────────────────────────── */}
        <div
          ref={chatRef}
          className="flex-1 overflow-y-auto px-4.5 py-6 bg-background"
        >
          <div className="max-w-4xl mx-auto w-full space-y-4">
            {messages.map((msg, i) => (
              <Bubble key={i} from={msg.from} sources={msg.sources}>
                {msg.from === 'assistant' && (
                  <ThinkingAccordion 
                    reasoning={msg.reasoning} 
                    elapsed={msg.thinkingTime} 
                    isStreaming={msg.streaming && !msg.text} 
                  />
                )}
                <span className="whitespace-pre-wrap">{msg.text || (msg.streaming && !msg.reasoning ? '...' : '')}</span>
                
                {msg.from === 'assistant' && msg.usage && (
                  <div className="mt-2.5 flex flex-wrap gap-1.5 border-t border-border/10 pt-2 flex-row">
                    <span className="inline-flex items-center gap-1 rounded bg-muted/40 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-muted-foreground">
                      ⚡ {msg.usage.total_tokens?.toLocaleString() || 0} tokens
                    </span>
                    {msg.usage.reasoning_tokens && (
                      <span className="inline-flex items-center gap-1 rounded bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-violet-500 dark:text-violet-400">
                        🧠 {msg.usage.reasoning_tokens?.toLocaleString() || 0} reasoning tokens
                      </span>
                    )}
                  </div>
                )}

                {msg.streaming && (
                  <span className="inline-block w-1.5 h-4 bg-violet-500 ml-0.5 animate-pulse rounded-full align-middle" />
                )}
              </Bubble>
            ))}

            {/* Suggested Prompts Grid */}
            {messages.length === 1 && (
              <div className="mt-6 space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Suggested Queries
                </p>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {SUGGESTED_PROMPTS.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleSend(p.query)}
                      className="flex items-center justify-between text-left rounded-xl border px-3.5 py-3 text-xs transition-all group
                        border-border/40 bg-card/50 backdrop-blur-sm text-foreground
                        hover:border-violet-500/40 hover:bg-violet-500/5 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{p.icon}</span>
                        <span className="font-semibold truncate">{p.label}</span>
                      </div>
                      <ChevronRight size={14} className="text-muted-foreground/40 group-hover:text-violet-500 transition-colors shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── Input Bar ──────────────────────────────────────────────── */}
        <div className="border-t p-3.5 pb-6 border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto w-full">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2 rounded-xl border pl-3 pr-1.5 py-1.5 transition-all
                border-border/40 bg-background focus-within:border-violet-500/50 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.08)]"
            >
              <Search size={16} className="text-muted-foreground/50 shrink-0" />
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={loading ? 'Generating response...' : 'Ask anything about your database...'}
                className="flex-1 bg-transparent text-sm outline-none disabled:opacity-60 text-foreground placeholder-muted-foreground/40"
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
                  className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white hover:from-violet-600 hover:to-fuchsia-600 disabled:opacity-30 active:scale-95 transition-all shadow-sm"
                >
                  <Send size={14} />
                </button>
              )}
            </form>

            {messages.length > 1 && (
              <div className="flex items-center justify-between mt-2.5 px-0.5">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-[10px] font-bold text-violet-500 hover:text-violet-600 transition-colors"
                >
                  Reset Chat
                </button>

                <div className="flex items-center gap-3">
                  {ragStatus?.indexed && (
                    <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                      <Database size={9} />
                      {ragStatus.total_docs.toLocaleString()} vectors
                    </span>
                  )}
                  <p className="text-[10px] text-muted-foreground/50 font-medium">
                    {MODEL_OPTIONS.find(m => m.id === selectedModel)?.label || 'OpenRouter Engine'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
