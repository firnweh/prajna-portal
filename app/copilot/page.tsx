'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { intelligence } from '@/lib/api';
import { useStore } from '@/lib/store';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  insights?: { title: string; detail: string }[];
  followUps?: string[];
}

interface PracticeQuestion {
  qbgid: string;
  question_clean: string;
  answer_clean: string;
  subject: string;
  difficulty: string;
}

const SUGGESTED_TOPICS = [
  'Explain thermodynamics laws with examples',
  'Organic chemistry reaction mechanisms',
  'Electromagnetic induction concepts',
  'Human physiology - nervous system',
  'Coordinate geometry problem-solving tips',
];

const QUICK_ACTIONS = [
  { icon: '\u{1F4DD}', label: 'Practice Problems', template: 'Give me 5 practice problems on ' },
  { icon: '\u{1F4D6}', label: 'Explain a Concept', template: 'Explain the concept of  in simple terms' },
  { icon: '\u{1F3AF}', label: 'Exam Strategy', template: 'What topics should I prioritize for NEET 2026?' },
  { icon: '\u{1F52C}', label: 'Topic Deep Dive', template: 'Deep dive into ' },
];

function formatMessage(text: string) {
  // Simple markdown-like rendering: bold, code blocks, inline code
  const parts = text.split(/(```[\s\S]*?```|`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const code = part.slice(3, -3).replace(/^\w+\n/, '');
      return (
        <pre key={i} className="bg-prajna-bg rounded-lg p-3 my-2 text-sm overflow-x-auto font-mono text-prajna-teal">
          {code}
        </pre>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={i} className="bg-prajna-bg px-1.5 py-0.5 rounded text-sm font-mono text-prajna-gold">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    // Handle newlines
    return part.split('\n').map((line, j) => (
      <span key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </span>
    ));
  });
}

export default function CopilotPage() {
  const { exam, year } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  const [practiceQ, setPracticeQ] = useState<PracticeQuestion | null>(null);
  const [showPracticeAnswer, setShowPracticeAnswer] = useState(false);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const fetchPracticeQuestion = useCallback(async () => {
    setPracticeLoading(true);
    setShowPracticeAnswer(false);
    try {
      const res = await intelligence('/api/v1/qbank/random?count=1');
      const data = await res.json();
      if (data.questions?.length) {
        setPracticeQ(data.questions[0]);
      }
    } catch {
      setPracticeQ(null);
    } finally {
      setPracticeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (practiceMode) fetchPracticeQuestion();
  }, [practiceMode, fetchPracticeQuestion]);

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;

    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
      const res = await intelligence('/api/v1/copilot/ask', {
        method: 'POST',
        body: JSON.stringify({
          exam_type: exam,
          target_year: year,
          question: q,
          subject_filter: null,
          persona: 'tutor',
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
          ? 'Request timed out. Please try again.'
          : 'Something went wrong. Please try again.';
      setMessages(prev => [...prev, { role: 'assistant', content: msg }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen">
      <Header title="Ask PRAJNA" />

      <div className="flex flex-1 overflow-hidden">
        {/* Left panel - Chat (65%) */}
        <div className="w-[65%] flex flex-col border-r border-prajna-border">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center text-prajna-muted">
                <div className="text-5xl mb-4">{'\u{1F916}'}</div>
                <h2 className="text-xl font-semibold text-prajna-text mb-2">Ask me anything</h2>
                <p className="text-sm max-w-md">
                  I can help you understand concepts, solve problems, plan your study strategy,
                  and practice for {exam.toUpperCase()} {year}.
                </p>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-prajna-accent text-white rounded-br-md'
                      : 'bg-prajna-card text-prajna-text rounded-bl-md'
                  }`}
                >
                  <div>{formatMessage(msg.content)}</div>

                  {/* Insights */}
                  {msg.insights && msg.insights.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {msg.insights.map((ins, j) => (
                        <div key={j} className="bg-prajna-surface rounded-lg p-2.5 border border-prajna-border">
                          <div className="text-xs font-semibold text-prajna-teal">{ins.title}</div>
                          <div className="text-xs text-prajna-muted mt-0.5">{ins.detail}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Follow-up questions */}
                  {msg.followUps && msg.followUps.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.followUps.map((fq, j) => (
                        <button
                          key={j}
                          onClick={() => setInput(fq)}
                          className="text-xs bg-prajna-accent/10 text-prajna-accent px-3 py-1.5 rounded-full hover:bg-prajna-accent/20 transition-colors"
                        >
                          {fq}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-prajna-card rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-prajna-accent rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 bg-prajna-accent rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 bg-prajna-accent rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="border-t border-prajna-border p-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Ask a question..."
                className="flex-1 bg-prajna-card border border-prajna-border rounded-xl px-4 py-3 text-sm text-prajna-text placeholder:text-prajna-muted focus:outline-none focus:ring-2 focus:ring-prajna-accent/50"
              />
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="bg-prajna-accent hover:bg-prajna-accent/90 disabled:opacity-40 text-white px-6 py-3 rounded-xl text-sm font-medium transition-colors"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        {/* Right panel - Context (35%) */}
        <div className="w-[35%] overflow-y-auto p-6 space-y-6">
          {/* Suggested Topics */}
          <div>
            <h3 className="text-sm font-semibold text-prajna-text mb-3">Suggested Topics</h3>
            <div className="space-y-2">
              {SUGGESTED_TOPICS.map((topic, i) => (
                <button
                  key={i}
                  onClick={() => setInput(topic)}
                  className="w-full text-left text-xs bg-prajna-card hover:bg-prajna-card/80 border border-prajna-border rounded-lg px-3 py-2.5 text-prajna-muted hover:text-prajna-text transition-colors"
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-prajna-text mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {QUICK_ACTIONS.map((action, i) => (
                <button
                  key={i}
                  onClick={() => setInput(action.template)}
                  className="flex flex-col items-center gap-1.5 bg-prajna-card hover:bg-prajna-card/80 border border-prajna-border rounded-lg p-3 text-center transition-colors"
                >
                  <span className="text-xl">{action.icon}</span>
                  <span className="text-xs text-prajna-muted">{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Practice Mode */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-prajna-text">Practice Mode</h3>
              <button
                onClick={() => setPracticeMode(!practiceMode)}
                className={`relative w-10 h-5 rounded-full transition-colors ${
                  practiceMode ? 'bg-prajna-accent' : 'bg-prajna-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                    practiceMode ? 'translate-x-5' : ''
                  }`}
                />
              </button>
            </div>

            {practiceMode && (
              <div className="bg-prajna-card border border-prajna-border rounded-lg p-4 space-y-3">
                {practiceLoading ? (
                  <div className="text-sm text-prajna-muted animate-pulse">Loading question...</div>
                ) : practiceQ ? (
                  <>
                    <div className="flex gap-2 mb-2">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-prajna-accent/15 text-prajna-accent">
                        {practiceQ.subject}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-prajna-teal/15 text-prajna-teal">
                        {practiceQ.difficulty}
                      </span>
                    </div>
                    <p className="text-sm text-prajna-text leading-relaxed">{practiceQ.question_clean}</p>

                    <button
                      onClick={() => setShowPracticeAnswer(!showPracticeAnswer)}
                      className="text-xs text-prajna-accent hover:underline"
                    >
                      {showPracticeAnswer ? 'Hide Answer' : 'Show Answer'}
                    </button>
                    {showPracticeAnswer && (
                      <div className="text-sm text-prajna-teal bg-prajna-surface rounded p-2 mt-1">
                        {practiceQ.answer_clean}
                      </div>
                    )}
                    <button
                      onClick={fetchPracticeQuestion}
                      className="block text-xs text-prajna-muted hover:text-prajna-text mt-2"
                    >
                      Next question &rarr;
                    </button>
                  </>
                ) : (
                  <p className="text-xs text-prajna-muted">Could not load a practice question.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
