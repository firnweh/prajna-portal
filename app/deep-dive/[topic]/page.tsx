'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/lib/store';
import { intelligence } from '@/lib/api';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

const TOOLTIP_STYLE = { background: '#1a1d2e', border: '1px solid #1e1e3a', borderRadius: 8, color: '#e2e8f0' };

interface TopicData {
  total_questions: number;
  first_year: number;
  last_year: number;
  year_counts: Record<string, number> | Array<{ year: number; count: number }>;
  difficulty_trend: Record<string, number> | Array<{ year: number; avg_difficulty: number }>;
  subtopic_counts: Array<{ subtopic: string; count: number; avg_difficulty?: number; first_year?: number; last_year?: number }>;
  subject?: string;
  appearance_probability?: number;
  expected_questions?: number;
}

interface Question {
  question_text: string;
  answer?: string;
  solution?: string;
  subject?: string;
  difficulty?: string;
  year?: number;
}

export default function TopicDeepDivePage() {
  const params = useParams();
  const topicName = decodeURIComponent(params.topic as string);
  const { exam } = useStore();
  const examType = exam === 'jee' ? 'jee_main' : 'neet';

  const [data, setData] = useState<TopicData | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [expandedQ, setExpandedQ] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const [dRes, qRes] = await Promise.all([
          intelligence(`/api/v1/data/topic-deep-dive?topic=${encodeURIComponent(topicName)}&exam_type=${examType}`),
          intelligence(`/api/v1/qbank/search?query=${encodeURIComponent(topicName)}&top_n=5`).catch(() => null),
        ]);
        if (dRes.ok) {
          const d = await dRes.json();
          setData(d);
        } else {
          setError(true);
        }
        if (qRes?.ok) {
          const d = await qRes.json();
          setQuestions(d.questions || []);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [topicName, examType]);

  // Normalize year_counts to array
  const yearCountsArr = (() => {
    if (!data?.year_counts) return [];
    if (Array.isArray(data.year_counts)) return data.year_counts;
    return Object.entries(data.year_counts).map(([year, count]) => ({ year: Number(year), count })).sort((a, b) => a.year - b.year);
  })();

  // Normalize difficulty_trend to array
  const diffTrendArr = (() => {
    if (!data?.difficulty_trend) return [];
    if (Array.isArray(data.difficulty_trend)) return data.difficulty_trend;
    return Object.entries(data.difficulty_trend).map(([year, avg_difficulty]) => ({ year: Number(year), avg_difficulty })).sort((a, b) => a.year - b.year);
  })();

  const totalYears = data ? (data.last_year || 2024) - (data.first_year || 1980) + 1 : 0;
  const appearedYears = yearCountsArr.filter(y => y.count > 0).length;

  if (loading) {
    return (
      <>
        <Header title={`PRAJNA - ${topicName}`} />
        <div className="flex items-center justify-center h-64 text-prajna-muted">Loading topic data...</div>
      </>
    );
  }

  if (error || !data) {
    return (
      <>
        <Header title={`PRAJNA - ${topicName}`} />
        <div className="flex items-center justify-center h-64 text-prajna-warn">Intelligence API not available</div>
      </>
    );
  }

  return (
    <>
      <Header title={`PRAJNA - ${topicName}`} />
      <div className="p-6 space-y-6 max-w-[1200px]">

        {/* Topic Header */}
        <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
          <h2 className="text-lg font-bold text-prajna-text mb-2">{topicName}</h2>
          <div className="flex flex-wrap gap-4 text-sm">
            {data.subject && (
              <span className="text-prajna-muted">Subject: <span className="text-prajna-accent">{data.subject}</span></span>
            )}
            {data.appearance_probability != null && (
              <span className="text-prajna-muted">PRAJNA Probability: <span className="text-prajna-teal font-bold">{(data.appearance_probability * 100).toFixed(0)}%</span></span>
            )}
            {data.expected_questions != null && (
              <span className="text-prajna-muted">Expected Qs: <span className="text-prajna-text font-bold">~{data.expected_questions.toFixed(1)}</span></span>
            )}
            <span className="text-prajna-muted">Appeared: <span className="text-prajna-text font-bold">{appearedYears}/{totalYears} years</span></span>
            <span className="text-prajna-muted">Total Questions: <span className="text-prajna-text font-bold">{data.total_questions}</span></span>
            <span className="text-prajna-muted">Last Appeared: <span className="text-prajna-text font-bold">{data.last_year}</span></span>
          </div>
        </div>

        {/* Two-column: Frequency + Difficulty */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">Frequency Timeline</h3>
            {yearCountsArr.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={yearCountsArr}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-prajna-muted text-sm">No frequency data</div>
            )}
          </div>
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">Difficulty Trend</h3>
            {diffTrendArr.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={diffTrendArr}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
                  <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 10 }} angle={-45} textAnchor="end" height={50} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 12 }} domain={[0, 5]} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                  <Line type="monotone" dataKey="avg_difficulty" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3, fill: '#f59e0b' }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-48 text-prajna-muted text-sm">No difficulty data</div>
            )}
          </div>
        </div>

        {/* Micro-topic Breakdown Table */}
        {data.subtopic_counts && data.subtopic_counts.length > 0 && (
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">Micro-Topic Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-prajna-muted uppercase border-b border-prajna-border">
                    <th className="pb-2 pr-4">Subtopic</th>
                    <th className="pb-2 pr-4 text-right">Questions</th>
                    <th className="pb-2 pr-4 text-right">Avg Difficulty</th>
                    <th className="pb-2 pr-4 text-right">First Appeared</th>
                    <th className="pb-2 text-right">Last Appeared</th>
                  </tr>
                </thead>
                <tbody>
                  {data.subtopic_counts.map((st, i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-b-0">
                      <td className="py-2 pr-4 text-prajna-text">{st.subtopic}</td>
                      <td className="py-2 pr-4 text-right text-prajna-text font-bold">{st.count}</td>
                      <td className="py-2 pr-4 text-right text-prajna-muted">{st.avg_difficulty?.toFixed(1) ?? '-'}</td>
                      <td className="py-2 pr-4 text-right text-prajna-muted">{st.first_year ?? '-'}</td>
                      <td className="py-2 text-right text-prajna-muted">{st.last_year ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Sample Questions */}
        {questions.length > 0 && (
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">Sample Questions from QBank</h3>
            <div className="space-y-2">
              {questions.map((q, i) => (
                <div key={i} className="border border-prajna-border rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-bold text-prajna-muted mt-0.5">Q{i + 1}</span>
                    <div className="flex-1">
                      <p className="text-sm text-prajna-text">{q.question_text}</p>
                      <div className="flex gap-3 mt-1 text-xs text-prajna-muted">
                        {q.year && <span>Year: {q.year}</span>}
                        {q.difficulty && <span>Difficulty: {q.difficulty}</span>}
                        {q.subject && <span>{q.subject}</span>}
                      </div>
                      {(q.solution || q.answer) && (
                        <>
                          <button
                            onClick={() => setExpandedQ(expandedQ === i ? null : i)}
                            className="mt-2 text-xs text-prajna-accent hover:underline"
                          >
                            {expandedQ === i ? 'Hide Solution' : 'Show Solution'}
                          </button>
                          {expandedQ === i && (
                            <div className="mt-2 p-3 bg-prajna-bg rounded-lg text-sm text-prajna-text border border-prajna-border">
                              {q.solution || q.answer}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
