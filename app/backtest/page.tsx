'use client';

import { useEffect, useState, useCallback } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiStrip } from '@/components/dashboard';
import { useStore } from '@/lib/store';
import { intelligence } from '@/lib/api';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';

const TOOLTIP_STYLE = { background: '#1a1d2e', border: '1px solid #1e1e3a', borderRadius: 8, color: '#e2e8f0' };

interface BacktestResult {
  summary: { hit_rate: number; coverage: number; matched_count: number; missed_count: number };
  topic_breakdown: Array<{ topic: string; predicted_rank?: number; matched: boolean }>;
}

export default function BacktestPage() {
  const { exam } = useStore();
  const examType = exam === 'jee' ? 'jee_main' : 'neet';

  const [testYear, setTestYear] = useState(2023);
  const [topK, setTopK] = useState(50);
  const [level, setLevel] = useState<'chapter' | 'micro'>('chapter');
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Year-by-year data for the bottom chart
  const [yearlyHits, setYearlyHits] = useState<Array<{ year: number; hit_rate: number }>>([]);
  const [yearlyLoading, setYearlyLoading] = useState(false);

  const fetchBacktest = useCallback(async (year: number, k: number, lvl: string) => {
    setLoading(true);
    setError(false);
    try {
      const res = await intelligence(
        `/api/v1/data/backtest?test_year=${year}&exam_type=${examType}&top_n=${k}&level=${lvl}`
      );
      if (res.ok) {
        const d = await res.json();
        setResult(d);
      } else {
        setError(true);
        setResult(null);
      }
    } catch {
      setError(true);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [examType]);

  // Fetch on config change
  useEffect(() => {
    fetchBacktest(testYear, topK, level);
  }, [testYear, topK, level, fetchBacktest]);

  // Fetch year-by-year for bottom chart (2019-2023)
  useEffect(() => {
    let cancelled = false;
    async function loadYearly() {
      setYearlyLoading(true);
      const years = [2019, 2020, 2021, 2022, 2023];
      const results: Array<{ year: number; hit_rate: number }> = [];
      for (const yr of years) {
        try {
          const res = await intelligence(
            `/api/v1/data/backtest?test_year=${yr}&exam_type=${examType}&top_n=${topK}&level=${level}`
          );
          if (res.ok) {
            const d = await res.json();
            results.push({ year: yr, hit_rate: (d.summary?.hit_rate || 0) * 100 });
          } else {
            results.push({ year: yr, hit_rate: 0 });
          }
        } catch {
          results.push({ year: yr, hit_rate: 0 });
        }
      }
      if (!cancelled) {
        setYearlyHits(results);
        setYearlyLoading(false);
      }
    }
    loadYearly();
    return () => { cancelled = true; };
  }, [examType, topK, level]);

  const matched = result?.topic_breakdown?.filter(t => t.matched) || [];
  const missed = result?.topic_breakdown?.filter(t => !t.matched) || [];

  return (
    <>
      <Header title="PRAJNA - Backtest" />
      <div className="p-6 space-y-6 max-w-[1200px]">

        {/* Config Section */}
        <div className="flex flex-wrap items-center gap-4 bg-prajna-card border border-prajna-border rounded-xl p-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-prajna-muted font-semibold uppercase">Test Year</label>
            <select
              value={testYear}
              onChange={e => setTestYear(Number(e.target.value))}
              className="bg-prajna-bg border border-prajna-border rounded-lg px-3 py-1.5 text-sm text-prajna-text focus:outline-none focus:border-prajna-accent"
            >
              {[2019, 2020, 2021, 2022, 2023, 2024].map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-prajna-muted font-semibold uppercase">Top K</label>
            <select
              value={topK}
              onChange={e => setTopK(Number(e.target.value))}
              className="bg-prajna-bg border border-prajna-border rounded-lg px-3 py-1.5 text-sm text-prajna-text focus:outline-none focus:border-prajna-accent"
            >
              {[25, 50, 100].map(k => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-prajna-muted font-semibold uppercase">Level</label>
            {(['chapter', 'micro'] as const).map(l => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-colors ${
                  level === l
                    ? 'bg-prajna-accent text-white'
                    : 'bg-prajna-bg text-prajna-muted border border-prajna-border hover:border-prajna-accent/50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center h-32 text-prajna-muted">Running backtest...</div>
        )}

        {error && (
          <div className="flex items-center justify-center h-32 text-prajna-warn">Intelligence API not available</div>
        )}

        {result && !loading && (
          <>
            {/* KPI Strip */}
            <KpiStrip items={[
              { label: 'Hit Rate', value: `${((result.summary.hit_rate || 0) * 100).toFixed(1)}%`, color: '#22c55e' },
              { label: 'Coverage', value: `${((result.summary.coverage || 0) * 100).toFixed(1)}%`, color: '#6366f1' },
              { label: 'Matched', value: `${result.summary.matched_count || 0}`, color: '#00d4aa' },
              { label: 'Missed', value: `${result.summary.missed_count || 0}`, color: '#ef4444' },
            ]} />

            {/* Matched / Missed Two-Column */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-green-400 mb-3">
                  Matched Topics ({matched.length})
                </h3>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {matched.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-b-0 text-sm">
                      <span className="text-green-400 font-bold">&#10003;</span>
                      <span className="text-prajna-text truncate flex-1">{t.topic}</span>
                      {t.predicted_rank != null && (
                        <span className="text-xs text-prajna-muted">Rank #{t.predicted_rank}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-red-400 mb-3">
                  Missed Topics ({missed.length})
                </h3>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {missed.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 py-1.5 border-b border-white/[0.04] last:border-b-0 text-sm">
                      <span className="text-red-400 font-bold">&#10007;</span>
                      <span className="text-prajna-text truncate flex-1">{t.topic}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Year-by-Year Hit Rate Chart */}
        <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">
            Year-by-Year Hit Rate (2019-2023)
          </h3>
          {yearlyLoading ? (
            <div className="flex items-center justify-center h-48 text-prajna-muted">Loading yearly data...</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={yearlyHits}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
                <XAxis dataKey="year" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} unit="%" domain={[0, 100]} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Hit Rate']} />
                <Bar dataKey="hit_rate" radius={[4, 4, 0, 0]}>
                  {yearlyHits.map((entry, idx) => (
                    <Cell key={idx} fill={entry.hit_rate >= 60 ? '#22c55e' : entry.hit_rate >= 40 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}
