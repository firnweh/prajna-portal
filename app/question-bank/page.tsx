'use client';

import { useState, useEffect, useCallback } from 'react';
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
}

interface Stats {
  total: number;
  with_gpt_analysis: number;
  by_subject: Record<string, number>;
  by_difficulty: Record<string, number>;
  by_type: Record<string, number>;
}

const SUBJECTS = ['All', 'Physics', 'Chemistry', 'Mathematics', 'Biology'];
const DIFFICULTIES = ['All', 'easy', 'medium', 'hard'];
const TYPES = ['All', 'single correct', 'numerical', 'multiple correct'];

function QuestionCard({ q }: { q: Question }) {
  const [showAnswer, setShowAnswer] = useState(false);
  const [showSolution, setShowSolution] = useState(false);

  return (
    <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 space-y-3">
      <p className="text-sm text-prajna-text leading-relaxed [&_.katex]:text-prajna-accent" dangerouslySetInnerHTML={{ __html: renderWithLatex(q.question_clean) }} />
      <div className="flex flex-wrap gap-2">
        <span className="text-[10px] px-2 py-0.5 rounded bg-prajna-accent/15 text-prajna-accent">
          {q.subject}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-prajna-teal/15 text-prajna-teal">
          {q.difficulty}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded bg-prajna-gold/15 text-prajna-gold">
          {q.type}
        </span>
      </div>
      <div className="flex gap-4">
        <button
          onClick={() => setShowAnswer(!showAnswer)}
          className="text-xs text-prajna-accent hover:underline"
        >
          {showAnswer ? 'Hide Answer \u25B2' : 'Show Answer \u25BC'}
        </button>
        {(q.text_solution || q.gpt_analysis) && (
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="text-xs text-prajna-teal hover:underline"
          >
            {showSolution ? 'Hide Solution \u25B2' : 'Show Solution \u25BC'}
          </button>
        )}
      </div>
      {showAnswer && (
        <div className="text-sm text-prajna-teal bg-prajna-surface rounded-lg p-3 border border-prajna-border" dangerouslySetInnerHTML={{ __html: renderWithLatex(q.answer_clean || '') }} />
      )}
      {showSolution && (
        <div className="text-sm text-prajna-text bg-prajna-surface rounded-lg p-3 border border-prajna-border" dangerouslySetInnerHTML={{ __html: renderWithLatex(q.text_solution || q.gpt_analysis || '') }} />
      )}
    </div>
  );
}

export default function QuestionBankPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState('All');
  const [difficulty, setDifficulty] = useState('All');
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    intelligence('/api/v1/qbank/stats')
      .then(r => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const fetchQuestions = useCallback(async (query?: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (subject !== 'All') params.set('subject', subject);
      if (difficulty !== 'All') params.set('difficulty', difficulty);

      let url: string;
      if (query) {
        params.set('query', query);
        params.set('top_n', '20');
        url = `/api/v1/qbank/search?${params}`;
      } else {
        params.set('count', '20');
        url = `/api/v1/qbank/random?${params}`;
      }

      const res = await intelligence(url);
      const data = await res.json();
      let results: Question[] = data.questions || [];

      // Client-side type filter (API may not support it)
      if (type !== 'All') {
        results = results.filter(q => q.type?.toLowerCase() === type.toLowerCase());
      }
      setQuestions(results);
    } catch {
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  }, [subject, difficulty, type]);

  // Initial load
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handleSearch = () => {
    const q = search.trim();
    setSearched(!!q);
    fetchQuestions(q || undefined);
  };

  const loadMore = () => {
    // Fetch another batch and append
    const doFetch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (subject !== 'All') params.set('subject', subject);
        if (difficulty !== 'All') params.set('difficulty', difficulty);
        params.set('count', '20');
        const res = await intelligence(`/api/v1/qbank/random?${params}`);
        const data = await res.json();
        let results: Question[] = data.questions || [];
        if (type !== 'All') {
          results = results.filter(q => q.type?.toLowerCase() === type.toLowerCase());
        }
        setQuestions(prev => [...prev, ...results]);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    doFetch();
  };

  const selectClass =
    'bg-prajna-card border border-prajna-border rounded-lg px-3 py-2 text-sm text-prajna-text focus:outline-none focus:ring-2 focus:ring-prajna-accent/50';

  return (
    <div className="flex flex-col h-screen">
      <Header title="Question Bank" />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Stats bar */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-prajna-accent">
                {(stats.total / 1_000_000).toFixed(2)}M
              </div>
              <div className="text-xs text-prajna-muted mt-1">Total Questions</div>
            </div>
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-prajna-teal">
                {Object.keys(stats.by_subject || {}).length}
              </div>
              <div className="text-xs text-prajna-muted mt-1">Subjects</div>
            </div>
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-prajna-gold">
                {Object.keys(stats.by_difficulty || {}).length}
              </div>
              <div className="text-xs text-prajna-muted mt-1">Difficulty Levels</div>
            </div>
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-prajna-warn">
                {stats.with_gpt_analysis?.toLocaleString() ?? 'N/A'}
              </div>
              <div className="text-xs text-prajna-muted mt-1">With AI Analysis</div>
            </div>
          </div>
        )}

        {/* Filter bar */}
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-prajna-muted">Subject</label>
            <select value={subject} onChange={e => setSubject(e.target.value)} className={selectClass}>
              {SUBJECTS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-prajna-muted">Difficulty</label>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)} className={selectClass}>
              {DIFFICULTIES.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-prajna-muted">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className={selectClass}>
              {TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs text-prajna-muted">Search</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Search questions..."
                className="flex-1 bg-prajna-card border border-prajna-border rounded-lg px-3 py-2 text-sm text-prajna-text placeholder:text-prajna-muted focus:outline-none focus:ring-2 focus:ring-prajna-accent/50"
              />
              <button
                onClick={handleSearch}
                className="bg-prajna-accent hover:bg-prajna-accent/90 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Questions */}
        {loading && questions.length === 0 ? (
          <div className="text-center py-12 text-prajna-muted text-sm animate-pulse">
            Loading questions...
          </div>
        ) : questions.length === 0 ? (
          <div className="text-center py-12 text-prajna-muted text-sm">
            No questions found. Try different filters.
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((q, i) => (
              <QuestionCard key={`${q.qbgid}-${i}`} q={q} />
            ))}
          </div>
        )}

        {/* Load more */}
        {questions.length > 0 && !searched && (
          <div className="text-center pb-6">
            <button
              onClick={loadMore}
              disabled={loading}
              className="bg-prajna-card hover:bg-prajna-card/80 border border-prajna-border text-prajna-text px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
            >
              {loading ? 'Loading...' : 'Load More'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
