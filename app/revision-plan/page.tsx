'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/lib/store';
import { intelligence } from '@/lib/api';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const TOOLTIP_STYLE = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b' };

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#f59e0b', Chemistry: '#6366f1', Biology: '#22c55e',
  Mathematics: '#a855f7', Botany: '#22c55e', Zoology: '#10b981',
};

interface Chapter { chapter: string; priority: string; hours: number }
interface SubjectStrategy { subject: string; strategy: string; chapters: Chapter[] }
interface GlobalPriority { chapter: string; subject: string; priority_score: number }

interface RevisionPlanData {
  subject_strategies: SubjectStrategy[];
  global_top_priorities: GlobalPriority[];
  exam_brief: string;
}

export default function RevisionPlanPage() {
  const { exam } = useStore();
  const [days, setDays] = useState(45);
  const [hoursPerDay, setHoursPerDay] = useState(6);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [data, setData] = useState<RevisionPlanData | null>(null);

  const subjects = exam === 'jee'
    ? ['Physics', 'Chemistry', 'Mathematics']
    : ['Physics', 'Chemistry', 'Biology'];

  async function generate() {
    setLoading(true);
    setError('');
    const examType = exam === 'jee' ? 'jee_main' : 'neet';
    try {
      const res = await intelligence('/api/v1/reports/revision-plan', {
        method: 'POST',
        body: JSON.stringify({
          exam_type: examType,
          target_year: 2026,
          subjects,
          available_days: days,
          persona: 'student',
        }),
      });
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      if (!json.success) throw new Error('Plan generation failed');
      setData({
        subject_strategies: json.subject_strategies || [],
        global_top_priorities: json.global_top_priorities || [],
        exam_brief: json.exam_brief || '',
      });
    } catch {
      setError('Could not generate revision plan. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const topPriorities = useMemo(() => {
    if (!data) return [];
    return data.global_top_priorities.slice(0, 10);
  }, [data]);

  const hoursBySubject = useMemo(() => {
    if (!data) return [];
    return data.subject_strategies.map(s => ({
      name: s.subject,
      value: s.chapters.reduce((sum, c) => sum + c.hours, 0),
    }));
  }, [data]);

  const maxScore = topPriorities.length > 0
    ? Math.max(...topPriorities.map(p => p.priority_score))
    : 1;

  return (
    <>
      <Header title="PRAJNA - Revision Plan" />
      <div className="p-6 space-y-6 max-w-[1200px]">
        {/* Config Form */}
        <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted mb-4">Plan Configuration</h2>
          <div className="flex items-end gap-6 flex-wrap">
            <div>
              <label className="block text-xs text-prajna-muted mb-1">Days Until Exam</label>
              <input
                type="number"
                min={1}
                max={365}
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-28 bg-prajna-bg border border-prajna-border rounded-lg px-3 py-2 text-prajna-text text-sm focus:outline-none focus:border-prajna-accent"
              />
            </div>
            <div>
              <label className="block text-xs text-prajna-muted mb-1">Hours Per Day</label>
              <input
                type="number"
                min={1}
                max={16}
                value={hoursPerDay}
                onChange={(e) => setHoursPerDay(Number(e.target.value))}
                className="w-28 bg-prajna-bg border border-prajna-border rounded-lg px-3 py-2 text-prajna-text text-sm focus:outline-none focus:border-prajna-accent"
              />
            </div>
            <button
              onClick={generate}
              disabled={loading}
              className="px-6 py-2 bg-prajna-accent text-white text-sm font-bold rounded-lg hover:brightness-110 disabled:opacity-50 transition"
            >
              {loading ? 'Generating...' : 'Generate Plan'}
            </button>
          </div>
          {error && <p className="mt-3 text-sm text-prajna-warn">{error}</p>}
        </div>

        {loading && (
          <div className="flex items-center justify-center h-40 text-prajna-muted">Generating personalized revision plan...</div>
        )}

        {data && !loading && (
          <>
            {/* Global Top Priorities */}
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted mb-4">Top 10 Priority Chapters</h2>
              <div className="space-y-2">
                {topPriorities.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-6 text-right text-xs text-prajna-muted font-mono">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm text-prajna-text font-medium truncate">{p.chapter}</span>
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded font-bold"
                          style={{ background: `${SUBJECT_COLORS[p.subject] || '#6366f1'}20`, color: SUBJECT_COLORS[p.subject] || '#6366f1' }}
                        >
                          {p.subject}
                        </span>
                      </div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(p.priority_score / maxScore) * 100}%`,
                            background: SUBJECT_COLORS[p.subject] || '#6366f1',
                          }}
                        />
                      </div>
                    </div>
                    <span className="text-xs text-prajna-muted w-12 text-right">{p.priority_score.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Strategies */}
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted">Subject Strategies</h2>
              {data.subject_strategies.map((ss, i) => (
                <div key={i} className="bg-prajna-card border border-prajna-border rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ background: SUBJECT_COLORS[ss.subject] || '#6366f1' }}
                    />
                    <h3 className="text-base font-bold text-prajna-text">{ss.subject}</h3>
                  </div>
                  <p className="text-sm text-prajna-muted mb-4">{ss.strategy}</p>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-prajna-muted uppercase border-b border-prajna-border">
                          <th className="pb-2 pr-4">Chapter</th>
                          <th className="pb-2 pr-4">Priority</th>
                          <th className="pb-2 text-right">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ss.chapters.map((ch, j) => (
                          <tr key={j} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
                            <td className="py-2 pr-4 text-prajna-text">{ch.chapter}</td>
                            <td className="py-2 pr-4">
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                ch.priority === 'HIGH' ? 'bg-red-500/10 text-red-400'
                                  : ch.priority === 'MEDIUM' ? 'bg-amber-500/10 text-amber-400'
                                    : 'bg-green-500/10 text-green-400'
                              }`}>{ch.priority}</span>
                            </td>
                            <td className="py-2 text-right text-prajna-text font-mono">{ch.hours}h</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom row: Pie + Brief */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">Hours by Subject</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={hoursBySubject}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      dataKey="value"
                      nameKey="name"
                      label={({ name, value }) => `${name}: ${value}h`}
                      labelLine={false}
                    >
                      {hoursBySubject.map((entry, idx) => (
                        <Cell key={idx} fill={SUBJECT_COLORS[entry.name] || '#6366f1'} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">Exam Brief</h3>
                <p className="text-sm text-prajna-muted leading-relaxed flex-1">{data.exam_brief || 'No brief available.'}</p>
                <div className="mt-4 pt-4 border-t border-prajna-border text-xs text-prajna-muted">
                  <div className="flex justify-between">
                    <span>Total study days</span>
                    <span className="text-prajna-text font-bold">{days}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Hours per day</span>
                    <span className="text-prajna-text font-bold">{hoursPerDay}</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span>Total hours available</span>
                    <span className="text-prajna-text font-bold">{days * hoursPerDay}</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
