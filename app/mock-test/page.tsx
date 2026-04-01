'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { intelligence } from '@/lib/api';
import { renderWithLatex } from '@/lib/latex';
import 'katex/dist/katex.min.css';

interface Question {
  qbgid: string;
  subject: string;
  difficulty: string;
  type: string;
  question_clean: string;
  answer_clean: string;
  text_solution?: string;
  gpt_analysis?: string;
  option1?: string;
  option2?: string;
  option3?: string;
  option4?: string;
}

type TestState = 'config' | 'test' | 'results';

const SUBJECTS = ['Physics', 'Chemistry', 'Mathematics', 'Biology'];
const COUNTS = [10, 20, 30, 50];
const TIMES = [15, 30, 45, 60, 90];
const DIFFS = ['mixed', 'easy', 'medium', 'hard'];

export default function MockTestPage() {
  // Config state
  const [subject, setSubject] = useState('Physics');
  const [count, setCount] = useState(30);
  const [timeLimit, setTimeLimit] = useState(45);
  const [difficulty, setDifficulty] = useState('mixed');

  // Test state
  const [state, setState] = useState<TestState>('config');
  const [fullQuestions, setFullQuestions] = useState<Question[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Timer
  useEffect(() => {
    if (state !== 'test') return;
    timerRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          submitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const submitTest = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    setState('results');
  }, []);

  const startTest = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        subject,
        count: String(count),
      });
      if (difficulty !== 'mixed') params.set('difficulty', difficulty);

      const res = await intelligence(`/api/v1/qbank/random?${params}`);
      if (!res.ok) throw new Error(`Server error (${res.status})`);
      const data = await res.json();
      const qs: Question[] = data.questions || [];

      if (qs.length === 0) {
        setError('No questions available for this configuration. Try different settings.');
        return;
      }

      setFullQuestions(qs);
      setAnswers({});
      setCurrentIdx(0);
      setSecondsLeft(timeLimit * 60);
      setState('test');
    } catch {
      setError('Failed to load test questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentQ = fullQuestions[currentIdx];
  const hasOptions = currentQ && (currentQ.option1 || currentQ.option2);
  const options = currentQ
    ? [currentQ.option1, currentQ.option2, currentQ.option3, currentQ.option4].filter(Boolean) as string[]
    : [];

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  // Results calculation
  const getResults = () => {
    let correct = 0;
    const topicBreakdown: Record<string, { correct: number; total: number }> = {};

    fullQuestions.forEach((q, i) => {
      const topic = q.subject || 'Unknown';
      if (!topicBreakdown[topic]) topicBreakdown[topic] = { correct: 0, total: 0 };
      topicBreakdown[topic].total++;

      const userAns = (answers[i] || '').trim().toLowerCase();
      const correctAns = (q.answer_clean || '').trim().toLowerCase();

      if (userAns && userAns === correctAns) {
        correct++;
        topicBreakdown[topic].correct++;
      }
    });

    return { correct, total: fullQuestions.length, topicBreakdown };
  };

  const selectClass =
    'bg-prajna-card border border-prajna-border rounded-lg px-3 py-2.5 text-sm text-prajna-text focus:outline-none focus:ring-2 focus:ring-prajna-accent/50';

  // ---- CONFIG MODE ----
  if (state === 'config') {
    return (
      <div className="flex flex-col h-screen">
        <Header title="Mock Test" />
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-lg mx-auto space-y-6">
            <div className="bg-prajna-card border border-prajna-border rounded-2xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-prajna-text">Configure Your Test</h2>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-prajna-muted">Subject</label>
                <select value={subject} onChange={e => setSubject(e.target.value)} className={selectClass}>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-prajna-muted">Number of Questions</label>
                <select value={count} onChange={e => setCount(Number(e.target.value))} className={selectClass}>
                  {COUNTS.map(c => <option key={c} value={c}>{c} questions</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-prajna-muted">Time Limit</label>
                <select value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} className={selectClass}>
                  {TIMES.map(t => <option key={t} value={t}>{t} minutes</option>)}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-prajna-muted">Difficulty</label>
                <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={selectClass}>
                  {DIFFS.map(d => (
                    <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
                  ))}
                </select>
              </div>

              {error && <p className="text-sm text-prajna-warn">{error}</p>}

              <button
                onClick={startTest}
                disabled={loading}
                className="w-full bg-prajna-accent hover:bg-prajna-accent/90 disabled:opacity-40 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                {loading ? 'Loading Questions...' : 'Start Test'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- TEST MODE ----
  if (state === 'test' && currentQ) {
    const urgent = secondsLeft < 60;
    return (
      <div className="flex flex-col h-screen">
        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-prajna-surface border-b border-prajna-border">
          <span className="text-sm font-medium text-prajna-text">
            Question {currentIdx + 1} of {fullQuestions.length}
          </span>
          <span className={`text-sm font-mono font-bold ${urgent ? 'text-prajna-warn animate-pulse' : 'text-prajna-teal'}`}>
            {formatTime(secondsLeft)}
          </span>
          <button
            onClick={() => {
              if (confirm('Are you sure you want to submit the test?')) submitTest();
            }}
            className="bg-prajna-warn/20 text-prajna-warn px-4 py-1.5 rounded-lg text-xs font-medium hover:bg-prajna-warn/30 transition-colors"
          >
            Submit Test
          </button>
        </div>

        {/* Question nav dots */}
        <div className="flex flex-wrap gap-1.5 px-6 py-3 bg-prajna-bg border-b border-prajna-border">
          {fullQuestions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-7 h-7 rounded text-[10px] font-medium transition-colors ${
                i === currentIdx
                  ? 'bg-prajna-accent text-white'
                  : answers[i]
                  ? 'bg-prajna-teal/20 text-prajna-teal'
                  : 'bg-prajna-card text-prajna-muted hover:bg-prajna-card/80'
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Question */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="flex gap-2">
              <span className="text-[10px] px-2 py-0.5 rounded bg-prajna-accent/15 text-prajna-accent">
                {currentQ.subject}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-prajna-teal/15 text-prajna-teal">
                {currentQ.difficulty}
              </span>
            </div>

            <p className="text-sm text-prajna-text leading-relaxed" dangerouslySetInnerHTML={{__html: renderWithLatex(currentQ.question_clean)}} />

            {hasOptions && options.length > 0 ? (
              <div className="space-y-2">
                {options.map((opt, j) => {
                  const label = String.fromCharCode(65 + j); // A, B, C, D
                  const selected = answers[currentIdx] === opt;
                  return (
                    <button
                      key={j}
                      onClick={() => setAnswers({ ...answers, [currentIdx]: opt })}
                      className={`w-full text-left flex gap-3 items-start p-3 rounded-lg border text-sm transition-colors ${
                        selected
                          ? 'bg-prajna-accent/10 border-prajna-accent text-prajna-text'
                          : 'bg-prajna-card border-prajna-border text-prajna-muted hover:text-prajna-text hover:border-prajna-accent/40'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs flex-shrink-0 ${
                        selected ? 'border-prajna-accent bg-prajna-accent text-white' : 'border-prajna-border'
                      }`}>
                        {label}
                      </span>
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="text-xs text-prajna-muted block mb-1">Your answer</label>
                <input
                  type="text"
                  value={answers[currentIdx] || ''}
                  onChange={e => setAnswers({ ...answers, [currentIdx]: e.target.value })}
                  placeholder="Type your answer..."
                  className="w-full bg-prajna-card border border-prajna-border rounded-lg px-3 py-2.5 text-sm text-prajna-text placeholder:text-prajna-muted focus:outline-none focus:ring-2 focus:ring-prajna-accent/50"
                />
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex justify-between px-6 py-4 border-t border-prajna-border">
          <button
            onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            className="bg-prajna-card border border-prajna-border text-prajna-text px-5 py-2 rounded-xl text-sm disabled:opacity-30 hover:bg-prajna-card/80 transition-colors"
          >
            &larr; Previous
          </button>
          <button
            onClick={() => setCurrentIdx(Math.min(fullQuestions.length - 1, currentIdx + 1))}
            disabled={currentIdx === fullQuestions.length - 1}
            className="bg-prajna-card border border-prajna-border text-prajna-text px-5 py-2 rounded-xl text-sm disabled:opacity-30 hover:bg-prajna-card/80 transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      </div>
    );
  }

  // ---- RESULTS MODE ----
  if (state === 'results') {
    const { correct, total, topicBreakdown } = getResults();
    const pct = total > 0 ? Math.round((correct / total) * 100) : 0;

    return (
      <div className="flex flex-col h-screen">
        <Header title="Mock Test Results" />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Score card */}
          <div className="max-w-lg mx-auto bg-prajna-card border border-prajna-border rounded-2xl p-6 text-center space-y-3">
            <div className={`text-5xl font-bold ${pct >= 70 ? 'text-prajna-teal' : pct >= 40 ? 'text-prajna-gold' : 'text-prajna-warn'}`}>
              {pct}%
            </div>
            <div className="text-lg text-prajna-text font-semibold">{correct} / {total} correct</div>
            <div className="text-sm text-prajna-muted">
              {pct >= 70 ? 'Excellent work!' : pct >= 40 ? 'Good effort, keep practicing!' : 'Keep going, practice makes perfect!'}
            </div>
            <button
              onClick={() => {
                setState('config');
                setFullQuestions([]);
                setAnswers({});
              }}
              className="mt-2 bg-prajna-accent hover:bg-prajna-accent/90 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
            >
              Take Another Test
            </button>
          </div>

          {/* Topic breakdown */}
          <div className="max-w-lg mx-auto bg-prajna-card border border-prajna-border rounded-2xl p-5">
            <h3 className="text-sm font-semibold text-prajna-text mb-3">Topic Breakdown</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-prajna-muted text-xs border-b border-prajna-border">
                  <th className="text-left py-2">Topic</th>
                  <th className="text-right py-2">Correct</th>
                  <th className="text-right py-2">Total</th>
                  <th className="text-right py-2">%</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(topicBreakdown).map(([topic, { correct: c, total: t }]) => (
                  <tr key={topic} className="border-b border-prajna-border/50">
                    <td className="py-2 text-prajna-text">{topic}</td>
                    <td className="py-2 text-right text-prajna-teal">{c}</td>
                    <td className="py-2 text-right text-prajna-muted">{t}</td>
                    <td className="py-2 text-right font-medium text-prajna-text">
                      {t > 0 ? Math.round((c / t) * 100) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Detailed review */}
          <div className="max-w-2xl mx-auto space-y-4">
            <h3 className="text-sm font-semibold text-prajna-text">Question Review</h3>
            {fullQuestions.map((q, i) => {
              const userAns = (answers[i] || '').trim();
              const correctAns = (q.answer_clean || '').trim();
              const isCorrect = userAns.toLowerCase() === correctAns.toLowerCase();

              return (
                <div
                  key={i}
                  className={`bg-prajna-card border rounded-xl p-4 space-y-2 ${
                    isCorrect ? 'border-prajna-teal/40' : 'border-prajna-warn/40'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs text-prajna-muted">Q{i + 1}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      isCorrect ? 'bg-prajna-teal/15 text-prajna-teal' : 'bg-prajna-warn/15 text-prajna-warn'
                    }`}>
                      {isCorrect ? 'Correct' : userAns ? 'Incorrect' : 'Skipped'}
                    </span>
                  </div>
                  <p className="text-sm text-prajna-text" dangerouslySetInnerHTML={{__html: renderWithLatex(q.question_clean)}} />
                  <div className="flex flex-col gap-1 text-xs">
                    <div>
                      <span className="text-prajna-muted">Your answer: </span>
                      <span className={isCorrect ? 'text-prajna-teal' : 'text-prajna-warn'}>
                        {userAns || '(skipped)'}
                      </span>
                    </div>
                    {!isCorrect && (
                      <div>
                        <span className="text-prajna-muted">Correct answer: </span>
                        <span className="text-prajna-teal">{correctAns}</span>
                      </div>
                    )}
                  </div>
                  {(q.text_solution || q.gpt_analysis) && (
                    <details className="text-xs">
                      <summary className="text-prajna-accent cursor-pointer hover:underline">View Solution</summary>
                      <div className="mt-2 text-prajna-text bg-prajna-surface rounded-lg p-3 whitespace-pre-wrap">
                        {q.text_solution || q.gpt_analysis}
                      </div>
                    </details>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Fallback
  return null;
}
