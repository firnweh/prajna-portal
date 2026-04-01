'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiStrip } from '@/components/dashboard';
import { useStore } from '@/lib/store';
import { intelligence } from '@/lib/api';
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const TOOLTIP_STYLE = { background: '#1a1d2e', border: '1px solid #1e1e3a', borderRadius: 8, color: '#e2e8f0' };

const BAND_COLORS: Record<string, string> = { A: '#22c55e', B: '#f59e0b', C: '#64748b' };
const BAND_LABELS: Record<string, string> = { A: 'Must Study', B: 'Should Study', C: 'Optional' };

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#f59e0b', Chemistry: '#6366f1', Biology: '#22c55e',
  Mathematics: '#a855f7', Botany: '#22c55e', Zoology: '#10b981',
};

interface LessonItem {
  chapter: string;
  subject: string;
  appearance_probability: number;
  expected_questions: number;
  confidence_score: number;
  trend_direction: string;
  priority_band: string;
}

type SortKey = 'priority_band' | 'subject' | 'appearance_probability';

export default function LessonPlanPage() {
  const { exam } = useStore();
  const [items, setItems] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('priority_band');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      const examType = exam === 'jee' ? 'jee_main' : 'neet';
      try {
        const res = await intelligence(`/api/v1/data/lesson-plan?exam_type=${examType}&year=2026&top_n=60`);
        if (res.ok) {
          const d = await res.json();
          setItems(d.lesson_plan || []);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [exam]);

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'priority_band') cmp = a.priority_band.localeCompare(b.priority_band);
      else if (sortKey === 'subject') cmp = a.subject.localeCompare(b.subject);
      else cmp = (b.appearance_probability || 0) - (a.appearance_probability || 0);
      return sortAsc ? cmp : -cmp;
    });
    return arr;
  }, [items, sortKey, sortAsc]);

  const bandA = items.filter(i => i.priority_band === 'A').length;
  const bandB = items.filter(i => i.priority_band === 'B').length;
  const bandC = items.filter(i => i.priority_band === 'C').length;

  // Subject split for donut
  const subjectCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach(i => { map[i.subject] = (map[i.subject] || 0) + 1; });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [items]);

  // Band distribution for bar chart
  const bandDist = [
    { band: 'A - Must Study', count: bandA, fill: BAND_COLORS.A },
    { band: 'B - Should Study', count: bandB, fill: BAND_COLORS.B },
    { band: 'C - Optional', count: bandC, fill: BAND_COLORS.C },
  ];

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  if (loading) {
    return (
      <>
        <Header title="PRAJNA - Lesson Plan" />
        <div className="flex items-center justify-center h-64 text-prajna-muted">Loading lesson plan...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Header title="PRAJNA - Lesson Plan" />
        <div className="flex items-center justify-center h-64 text-prajna-warn">Intelligence API not available</div>
      </>
    );
  }

  return (
    <>
      <Header title="PRAJNA - Lesson Plan" />
      <div className="p-6 space-y-6 max-w-[1200px]">
        <KpiStrip items={[
          { label: 'Total Chapters', value: `${items.length}`, color: '#6366f1' },
          { label: 'Band A (Must)', value: `${bandA}`, color: '#22c55e' },
          { label: 'Band B (Should)', value: `${bandB}`, color: '#f59e0b' },
          { label: 'Band C (Optional)', value: `${bandC}`, color: '#64748b' },
        ]} />

        {/* Main Table */}
        <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-prajna-muted uppercase border-b border-prajna-border">
                <th className="pb-2 pr-4 cursor-pointer hover:text-prajna-accent" onClick={() => handleSort('priority_band')}>
                  Band {sortKey === 'priority_band' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
                </th>
                <th className="pb-2 pr-4">Chapter</th>
                <th className="pb-2 pr-4 cursor-pointer hover:text-prajna-accent" onClick={() => handleSort('subject')}>
                  Subject {sortKey === 'subject' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
                </th>
                <th className="pb-2 pr-4 text-right cursor-pointer hover:text-prajna-accent" onClick={() => handleSort('appearance_probability')}>
                  Probability {sortKey === 'appearance_probability' ? (sortAsc ? '\u25B2' : '\u25BC') : ''}
                </th>
                <th className="pb-2 pr-4 text-right">Expected Qs</th>
                <th className="pb-2 text-right">Trend</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item, i) => {
                const trend = item.trend_direction === 'RISING' ? '\u2191' : item.trend_direction === 'DECLINING' ? '\u2193' : '\u2192';
                return (
                  <tr key={i} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
                    <td className="py-2 pr-4">
                      <span
                        className="inline-block px-2 py-0.5 rounded-md text-xs font-bold"
                        style={{ background: `${BAND_COLORS[item.priority_band] || '#64748b'}20`, color: BAND_COLORS[item.priority_band] || '#64748b' }}
                      >
                        {item.priority_band} - {BAND_LABELS[item.priority_band] || ''}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-prajna-text font-medium">{item.chapter}</td>
                    <td className="py-2 pr-4 text-prajna-muted">{item.subject}</td>
                    <td className="py-2 pr-4 text-right text-prajna-text font-bold">{((item.appearance_probability || 0) * 100).toFixed(0)}%</td>
                    <td className="py-2 pr-4 text-right text-prajna-muted">~{(item.expected_questions || 0).toFixed(1)}</td>
                    <td className="py-2 text-right text-prajna-muted">{trend}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Bottom Charts */}
        <div className="grid grid-cols-2 gap-4">
          {/* Subject Split Donut */}
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">Chapters by Subject</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={subjectCounts}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={false}
                >
                  {subjectCounts.map((entry, idx) => (
                    <Cell key={idx} fill={SUBJECT_COLORS[entry.name] || '#6366f1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Band Distribution Bar */}
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">Band Distribution</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={bandDist}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
                <XAxis dataKey="band" tick={{ fill: '#64748b', fontSize: 11 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {bandDist.map((entry, idx) => (
                    <Cell key={idx} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
