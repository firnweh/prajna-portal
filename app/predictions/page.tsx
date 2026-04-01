'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiStrip } from '@/components/dashboard';
import { useStore } from '@/lib/store';
import { intelligence } from '@/lib/api';
import type { Prediction } from '@/lib/types';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#f59e0b', Chemistry: '#6366f1', Biology: '#22c55e',
  Mathematics: '#a855f7', Botany: '#22c55e', Zoology: '#10b981',
};

const TOOLTIP_STYLE = { background: '#1a1d2e', border: '1px solid #1e1e3a', borderRadius: 8, color: '#e2e8f0' };

export default function PredictionsPage() {
  const { exam } = useStore();
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [hotCold, setHotCold] = useState<any>(null);
  const [qbankStats, setQbankStats] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [confidenceThreshold, setConfidenceThreshold] = useState(50);
  const [trendFilter, setTrendFilter] = useState('All');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      const examType = exam === 'jee' ? 'jee_main' : 'neet';
      try {
        const [pRes, hRes, qRes, tRes] = await Promise.all([
          intelligence(`/api/v1/data/predict?exam_type=${examType}&year=2026&level=micro&top_n=100`),
          intelligence(`/api/v1/data/hot-cold-topics?exam_type=${examType}&top_n=15`).catch(() => null),
          intelligence(`/api/v1/qbank/stats`).catch(() => null),
          intelligence(`/api/v1/data/subject-timeline?exam_type=${examType}`).catch(() => null),
        ]);
        if (pRes.ok) { const d = await pRes.json(); setPreds(d.predictions || []); }
        else { setError(true); }
        if (hRes?.ok) { const d = await hRes.json(); setHotCold(d); }
        if (qRes?.ok) { const d = await qRes.json(); setQbankStats(d); }
        if (tRes?.ok) { const d = await tRes.json(); setTimeline(d.rows || []); }
      } catch {
        setError(true);
      } finally { setLoading(false); }
    }
    load();
  }, [exam]);

  // Derive subjects for filter
  const subjects = useMemo(() => {
    const s = new Set(preds.map(p => p.subject));
    return ['All', ...Array.from(s).sort()];
  }, [preds]);

  // Filter predictions
  const filtered = useMemo(() => {
    return preds.filter(p => {
      if (subjectFilter !== 'All' && p.subject !== subjectFilter) return false;
      if ((p.confidence_score || 0) * 100 < confidenceThreshold) return false;
      if (trendFilter !== 'All' && (p.trend_direction || '').toUpperCase() !== trendFilter.toUpperCase()) return false;
      return true;
    });
  }, [preds, subjectFilter, confidenceThreshold, trendFilter]);

  const displayed = showAll ? filtered : filtered.slice(0, 30);

  // Subject timeline chart data
  const timelineChart = useMemo(() => {
    if (!timeline.length) return [];
    const byYear: Record<number, Record<string, number>> = {};
    const allSubjects = new Set<string>();
    timeline.forEach((r: any) => {
      const yr = r.year;
      const subj = r.subject;
      allSubjects.add(subj);
      if (!byYear[yr]) byYear[yr] = {};
      byYear[yr][subj] = r.weight_percent;
    });
    return Object.keys(byYear).sort().map(yr => ({
      year: Number(yr),
      ...byYear[Number(yr)],
    }));
  }, [timeline]);

  const timelineSubjects = useMemo(() => {
    const s = new Set<string>();
    timeline.forEach((r: any) => s.add(r.subject));
    return Array.from(s).sort();
  }, [timeline]);

  if (loading) {
    return (
      <>
        <Header title="PRAJNA - Predictions" />
        <div className="flex items-center justify-center h-64 text-prajna-muted">Loading predictions...</div>
      </>
    );
  }

  if (error && !preds.length) {
    return (
      <>
        <Header title="PRAJNA - Predictions" />
        <div className="flex items-center justify-center h-64 text-prajna-warn">Intelligence API not available</div>
      </>
    );
  }

  const highProb = preds.filter(p => (p.appearance_probability || 0) > 0.7).length;
  const totalQs = preds.reduce((s, p) => s + (p.expected_questions || 0), 0);
  const risingCount = preds.filter(p => p.trend_direction === 'RISING').length;
  const avgConf = preds.length ? preds.reduce((s, p) => s + (p.confidence_score || 0), 0) / preds.length : 0;
  const qbankTotal = qbankStats?.total || 0;

  return (
    <>
      <Header title="PRAJNA - Predictions" />
      <div className="p-6 space-y-6 max-w-[1200px]">
        <KpiStrip items={[
          { label: 'High-Prob Topics', value: `${highProb}`, subtitle: '>70% probability', color: '#6366f1' },
          { label: 'Expected Questions', value: `~${totalQs.toFixed(0)}`, color: '#00d4aa' },
          { label: 'Rising Trends', value: `${risingCount}`, color: '#f59e0b' },
          { label: 'Avg Confidence', value: `${(avgConf * 100).toFixed(0)}%`, color: '#a855f7' },
          { label: 'QBank Size', value: qbankTotal.toLocaleString(), subtitle: 'total questions', color: '#38bdf8' },
        ]} />

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-4 bg-prajna-card border border-prajna-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-prajna-muted font-semibold uppercase">Subject</label>
            <select
              value={subjectFilter}
              onChange={e => setSubjectFilter(e.target.value)}
              className="bg-prajna-bg border border-prajna-border rounded-lg px-3 py-1.5 text-sm text-prajna-text focus:outline-none focus:border-prajna-accent"
            >
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-prajna-muted font-semibold uppercase">Confidence &gt;{confidenceThreshold}%</label>
            <input
              type="range"
              min={50} max={80} step={10}
              value={confidenceThreshold}
              onChange={e => setConfidenceThreshold(Number(e.target.value))}
              className="w-24 accent-prajna-accent"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-prajna-muted font-semibold uppercase">Trend</label>
            {['All', 'Rising', 'Stable', 'Declining'].map(t => (
              <button
                key={t}
                onClick={() => setTrendFilter(t)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  trendFilter === t
                    ? 'bg-prajna-accent text-white'
                    : 'bg-prajna-bg text-prajna-muted border border-prajna-border hover:border-prajna-accent/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <span className="ml-auto text-xs text-prajna-muted">{filtered.length} topics match</span>
        </div>

        {/* Top Predictions */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">
            Top Micro-Topic Predictions for 2026 ({displayed.length} of {filtered.length})
          </h3>
          <div className="space-y-1.5">
            {displayed.map((p, i) => {
              const prob = ((p.appearance_probability || 0) * 100).toFixed(0);
              const col = SUBJECT_COLORS[p.subject] || '#6366f1';
              const trend = p.trend_direction === 'RISING' ? '\u2191' : p.trend_direction === 'DECLINING' ? '\u2193' : '\u2192';
              return (
                <div key={i} className="flex items-center gap-3 bg-prajna-card border border-prajna-border rounded-lg px-4 py-2.5 hover:border-prajna-accent/50 transition-colors">
                  <span className="text-xs font-bold text-prajna-muted w-7">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-prajna-text truncate">{p.micro_topic || p.chapter}</p>
                    <p className="text-[0.65rem] text-prajna-muted" style={{ color: col }}>{p.subject} - ~{(p.expected_questions || 0).toFixed(1)}Q</p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: col }}>{prob}%</span>
                  <div className="w-16 h-1.5 bg-prajna-border rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${prob}%`, background: col }} />
                  </div>
                  <span className="text-xs text-prajna-muted">{trend}</span>
                </div>
              );
            })}
          </div>
          {!showAll && filtered.length > 30 && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 w-full py-2 rounded-lg bg-prajna-card border border-prajna-border text-sm text-prajna-accent hover:border-prajna-accent/50 transition-colors"
            >
              Show all {filtered.length} predictions
            </button>
          )}
          {showAll && filtered.length > 30 && (
            <button
              onClick={() => setShowAll(false)}
              className="mt-3 w-full py-2 rounded-lg bg-prajna-card border border-prajna-border text-sm text-prajna-muted hover:border-prajna-accent/50 transition-colors"
            >
              Collapse to top 30
            </button>
          )}
        </div>

        {/* Hot/Cold Topics - expanded to 15 */}
        {hotCold && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-teal mb-3">Hot Topics (Recent)</h3>
              {(hotCold.hot_topics || []).slice(0, 15).map((t: any, i: number) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-white/[0.04] last:border-b-0 text-sm">
                  <span className="text-prajna-text truncate">{t.micro_topic || t[1]}</span>
                  <span className="text-prajna-teal font-bold text-xs">{t.count || t[2]} appearances</span>
                </div>
              ))}
            </div>
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-warn mb-3">Cold Topics (Dormant)</h3>
              {(hotCold.cold_topics || []).slice(0, 15).map((t: any, i: number) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-white/[0.04] last:border-b-0 text-sm">
                  <span className="text-prajna-text truncate">{t.micro_topic || t[1]}</span>
                  <span className="text-prajna-warn font-bold text-xs">dormant {t.gap || '?'}yr</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Subject Weightage Timeline */}
        {timelineChart.length > 0 && (
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">Subject Weightage Timeline</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={timelineChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} unit="%" />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend />
                {timelineSubjects.map(subj => (
                  <Area
                    key={subj}
                    type="monotone"
                    dataKey={subj}
                    stackId="1"
                    stroke={SUBJECT_COLORS[subj] || '#6366f1'}
                    fill={SUBJECT_COLORS[subj] || '#6366f1'}
                    fillOpacity={0.4}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </>
  );
}
