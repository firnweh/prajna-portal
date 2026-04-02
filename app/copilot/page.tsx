'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { intelligence } from '@/lib/api';
import 'katex/dist/katex.min.css';
import { useStore } from '@/lib/store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  insights?: { title: string; narrative: string }[];
  followUps?: string[];
}

// ── Format message with markdown + KaTeX ──────────────────────
function formatMessageToHtml(text: string): string {
  let html = text;
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  html = html.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-50 border border-gray-200 rounded-lg p-3 my-3 text-[13px] overflow-x-auto font-mono text-gray-800">$1</pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-[13px] font-mono text-indigo-700">$1</code>');
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em class="italic text-gray-500">$1</em>');
  html = html.replace(/\n/g, '<br/>');

  try {
    const katex = require('katex');
    html = html.replace(/\\\[([\s\S]*?)\\\]/g, (_, math: string) => {
      try { return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }); }
      catch { return `\\[${math}\\]`; }
    });
    html = html.replace(/\\\((.*?)\\\)/g, (_, math: string) => {
      try { return katex.renderToString(math.trim(), { displayMode: false, throwOnError: false }); }
      catch { return `\\(${math}\\)`; }
    });
    html = html.replace(/\$\$([\s\S]*?)\$\$/g, (_, math: string) => {
      try { return katex.renderToString(math.trim(), { displayMode: true, throwOnError: false }); }
      catch { return `$$${math}$$`; }
    });
  } catch { /* KaTeX not available */ }

  return html;
}

function MessageContent({ text }: { text: string }) {
  const html = formatMessageToHtml(text);
  return <div className="prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: html }} />;
}

// ── Suggested topics for empty state ──────────────────────────
const SUGGESTIONS = [
  { icon: '⚡', label: 'Explain Ohm\'s law with formula', category: 'Physics' },
  { icon: '🧪', label: 'SN1 vs SN2 reaction mechanism', category: 'Chemistry' },
  { icon: '🧬', label: 'Stages of meiosis cell division', category: 'Biology' },
  { icon: '📐', label: 'Quadratic formula derivation', category: 'Mathematics' },
  { icon: '🎯', label: 'Which topics to prioritize for NEET 2026?', category: 'Strategy' },
  { icon: '📊', label: 'Predict top Physics chapters for JEE', category: 'Predictions' },
];

const QUICK_ACTIONS = [
  { icon: '📝', label: 'Practice Problems', desc: 'Get practice questions on any topic', template: 'Give me 5 practice problems on ' },
  { icon: '📖', label: 'Explain Concept', desc: 'Clear explanation with examples', template: 'Explain the concept of ' },
  { icon: '🎯', label: 'Exam Strategy', desc: 'Data-driven study advice', template: 'What topics should I prioritize for NEET 2026?' },
  { icon: '📷', label: 'Upload Photo', desc: 'OCR + solve from image', template: '__UPLOAD__' },
];

// ── Thinking stages ────────────────────────────────────────────
const TEXT_STAGES = [
  { icon: '🔍', text: 'Searching 1.14M questions...' },
  { icon: '📚', text: 'Found matches. Retrieving solutions...' },
  { icon: '🧠', text: 'Analyzing with PRAJNA SLM...' },
  { icon: '✍️', text: 'Formatting answer with LaTeX...' },
  { icon: '⏳', text: 'Polishing response...' },
];

const OCR_STAGES = [
  { icon: '📷', text: 'Processing image with Qwen OCR...' },
  { icon: '📝', text: 'Extracting text and formulas...' },
  { icon: '🔍', text: 'Searching question bank...' },
  { icon: '🧠', text: 'PRAJNA SLM solving...' },
  { icon: '✍️', text: 'Formatting with LaTeX...' },
];

export default function CopilotPage() {
  const { exam, year } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // ── Send text message ──────────────────────────────────────
  const sendMessage = async (overrideText?: string) => {
    const q = (overrideText || input).trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    setThinkingStage(0);

    const stageTimers = [
      setTimeout(() => setThinkingStage(1), 2000),
      setTimeout(() => setThinkingStage(2), 5000),
      setTimeout(() => setThinkingStage(3), 12000),
      setTimeout(() => setThinkingStage(4), 25000),
    ];

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 120000);

    try {
      const res = await intelligence('/api/v1/copilot/ask', {
        method: 'POST',
        body: JSON.stringify({
          exam_type: exam,
          target_year: year,
          question: q,
          subject_filter: null,
          persona: 'student',
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: data.answer || 'Sorry, I could not generate a response.',
          insights: data.insights,
          followUps: data.follow_up_questions,
        },
      ]);
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === 'AbortError'
          ? 'Request timed out. The AI is still processing — try again in a moment.'
          : 'Something went wrong. Check that the Intelligence API is running on port 8001.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      stageTimers.forEach(clearTimeout);
      setLoading(false);
      setThinkingStage(0);
    }
  };

  // ── Handle file upload ──────────────────────────────────────
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['jpg', 'jpeg', 'png', 'pdf', 'webp'].includes(ext || '')) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Unsupported file type. Use .jpg, .png, or .pdf.' }]);
      return;
    }

    setUploading(true);
    setLoading(true);
    setThinkingStage(0);
    setMessages(prev => [...prev, { role: 'user', content: `📎 Uploaded: ${file.name}` }]);

    const stageTimers = [
      setTimeout(() => setThinkingStage(1), 2000),
      setTimeout(() => setThinkingStage(2), 8000),
      setTimeout(() => setThinkingStage(3), 15000),
      setTimeout(() => setThinkingStage(4), 25000),
    ];

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('exam_type', exam);

      const res = await fetch('/api/proxy/intel/api/v1/copilot/ocr-solve', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();

      if (data.success) {
        const extracted = data.extracted_text
          ? `\n\n📝 **Extracted text:**\n${data.extracted_text.slice(0, 400)}${data.extracted_text.length > 400 ? '...' : ''}`
          : '';
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: (data.answer || 'Could not find a matching solution.') + extracted,
          followUps: data.follow_up_questions,
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `⚠️ ${data.error || 'Could not process the file.'}` }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Failed to process. Ensure Intelligence API and Qwen model are running.' }]);
    } finally {
      stageTimers.forEach(clearTimeout);
      setUploading(false);
      setLoading(false);
      setThinkingStage(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const stages = uploading ? OCR_STAGES : TEXT_STAGES;
  const hasMessages = messages.length > 0 || loading;

  return (
    <div className="flex flex-col h-screen bg-prajna-bg">
      <Header title="Ask PRAJNA" />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4">

          {/* ── Empty State ──────────────────────────────── */}
          {!hasMessages && (
            <div className="pt-16 pb-8">
              {/* Hero */}
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg shadow-indigo-200">
                  🧠
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Ask PRAJNA anything</h1>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  AI tutor powered by 1.14M NEET/JEE questions. Ask concepts, solve problems,
                  get exam strategy, or upload a photo of any question.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-4 gap-3 mb-8">
                {QUICK_ACTIONS.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      if (action.template === '__UPLOAD__') {
                        fileInputRef.current?.click();
                      } else {
                        setInput(action.template);
                        inputRef.current?.focus();
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-center group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">{action.icon}</span>
                    <span className="text-xs font-semibold text-gray-800">{action.label}</span>
                    <span className="text-[10px] text-gray-400">{action.desc}</span>
                  </button>
                ))}
              </div>

              {/* Suggested Topics */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Try asking</p>
                <div className="grid grid-cols-2 gap-2">
                  {SUGGESTIONS.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(s.label)}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all text-left group"
                    >
                      <span className="text-lg">{s.icon}</span>
                      <div className="min-w-0">
                        <span className="text-sm text-gray-700 group-hover:text-indigo-700 block truncate">{s.label}</span>
                        <span className="text-[10px] text-gray-400">{s.category}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Messages ─────────────────────────────────── */}
          {hasMessages && (
            <div className="py-6 space-y-6">
              {messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                  {/* Avatar */}
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm text-white flex-shrink-0 mt-0.5">
                      🧠
                    </div>
                  )}

                  {/* Bubble */}
                  <div className={`max-w-[85%] ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-2xl rounded-br-md px-4 py-2.5'
                      : 'bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm'
                  }`}>
                    <div className={msg.role === 'user' ? 'text-sm' : 'text-[14px] leading-relaxed text-gray-800'}>
                      <MessageContent text={msg.content} />
                    </div>

                    {/* Insights */}
                    {msg.insights && msg.insights.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {msg.insights.map((ins, j) => (
                          <div key={j} className="bg-indigo-50 rounded-lg p-3 border border-indigo-100">
                            <div className="text-xs font-semibold text-indigo-700">{ins.title}</div>
                            <div className="text-xs text-indigo-600/70 mt-0.5">{ins.narrative}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Follow-ups */}
                    {msg.followUps && msg.followUps.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {msg.followUps.map((fq, j) => (
                          <button
                            key={j}
                            onClick={() => sendMessage(fq)}
                            className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full hover:bg-indigo-100 border border-indigo-100 transition-colors"
                          >
                            {fq}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* User avatar */}
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0 mt-0.5">
                      You
                    </div>
                  )}
                </div>
              ))}

              {/* Thinking indicator */}
              {loading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm text-white flex-shrink-0 animate-pulse">
                    🧠
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm max-w-sm">
                    <div className="space-y-2.5">
                      {stages.map((stage, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-2.5 text-sm transition-all duration-500 ${
                            i < thinkingStage ? 'text-emerald-600' :
                            i === thinkingStage ? 'text-indigo-600 font-medium' :
                            'text-gray-300'
                          }`}
                        >
                          <span className={`text-base ${i === thinkingStage ? 'animate-pulse' : ''}`}>
                            {i < thinkingStage ? '✓' : stage.icon}
                          </span>
                          <span>{stage.text}</span>
                          {i === thinkingStage && (
                            <span className="inline-flex gap-0.5 ml-auto">
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* ── Input Bar (sticky bottom) ──────────────────── */}
      <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-2xl px-2 py-1.5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:border-indigo-400 transition-all">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.webp"
              onChange={handleFileUpload}
              className="hidden"
            />
            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={loading}
              className="p-2 rounded-xl text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 transition-colors"
              title="Upload photo or PDF"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            </button>

            {/* Text input */}
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask a question, or upload a photo..."
              className="flex-1 text-sm text-gray-800 placeholder:text-gray-400 bg-transparent outline-none py-2 px-1"
              disabled={loading}
            />

            {/* Send button */}
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-30 disabled:bg-gray-300 transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[11px] text-gray-400 mt-2">
            PRAJNA SLM · 1.14M questions · Qwen OCR · KaTeX math rendering
          </p>
        </div>
      </div>
    </div>
  );
}
