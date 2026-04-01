'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiStrip } from '@/components/dashboard';
import { useStore } from '@/lib/store';
import { intelligence } from '@/lib/api';
import type { Prediction } from '@/lib/types';

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#f59e0b', Chemistry: '#6366f1', Biology: '#22c55e',
  Mathematics: '#a855f7', Botany: '#22c55e', Zoology: '#10b981',
};

export default function PredictionsPage() {
  const { exam } = useStore();
  const [preds, setPreds] = useState<Prediction[]>([]);
  const [hotCold, setHotCold] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const examType = exam === 'jee' ? 'jee_main' : 'neet';
      try {
        const [pRes, hRes] = await Promise.all([
          intelligence(`/api/v1/data/predict?exam_type=${examType}&year=2026&level=micro&top_n=100`),
          intelligence(`/api/v1/data/hot-cold-topics?exam_type=${examType}&top_n=10`).catch(() => null),
        ]);
        if (pRes.ok) { const d = await pRes.json(); setPreds(d.predictions || []); }
        if (hRes?.ok) { const d = await hRes.json(); setHotCold(d); }
      } catch {} finally { setLoading(false); }
    }
    load();
  }, [exam]);

  if (loading) {
    return (
      <>
        <Header title="PRAJNA · Predictions" />
        <div className="flex items-center justify-center h-64 text-prajna-muted">Loading predictions...</div>
      </>
    );
  }

  const highProb = preds.filter(p => (p.appearance_probability || 0) > 0.7).length;
  const totalQs = preds.reduce((s, p) => s + (p.expected_questions || 0), 0);
  const risingCount = preds.filter(p => p.trend_direction === 'RISING').length;
  const avgConf = preds.length ? preds.reduce((s, p) => s + (p.confidence_score || 0), 0) / preds.length : 0;

  return (
    <>
      <Header title="PRAJNA · Predictions" />
      <div className="p-6 space-y-6 max-w-[1200px]">
        <KpiStrip items={[
          { label: 'High-Prob Topics', value: `${highProb}`, subtitle: '>70% probability', color: '#6366f1' },
          { label: 'Expected Questions', value: `~${totalQs.toFixed(0)}`, color: '#00d4aa' },
          { label: 'Rising Trends', value: `${risingCount}`, color: '#f59e0b' },
          { label: 'Avg Confidence', value: `${(avgConf * 100).toFixed(0)}%`, color: '#a855f7' },
        ]} />

        {/* Top Predictions */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">
            Top {preds.length} Micro-Topic Predictions for 2026
          </h3>
          <div className="space-y-1.5">
            {preds.slice(0, 30).map((p, i) => {
              const prob = ((p.appearance_probability || 0) * 100).toFixed(0);
              const col = SUBJECT_COLORS[p.subject] || '#6366f1';
              const trend = p.trend_direction === 'RISING' ? '\u2191' : p.trend_direction === 'DECLINING' ? '\u2193' : '\u2192';
              return (
                <div key={i} className="flex items-center gap-3 bg-prajna-card border border-prajna-border rounded-lg px-4 py-2.5 hover:border-prajna-accent/50 transition-colors">
                  <span className="text-xs font-bold text-prajna-muted w-7">#{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-prajna-text truncate">{p.micro_topic || p.chapter}</p>
                    <p className="text-[0.65rem] text-prajna-muted" style={{ color: col }}>{p.subject} · ~{(p.expected_questions || 0).toFixed(1)}Q</p>
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
        </div>

        {/* Hot/Cold Topics */}
        {hotCold && (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-teal mb-3">Hot Topics (Recent)</h3>
              {(hotCold.hot_topics || []).slice(0, 8).map((t: any, i: number) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-white/[0.04] last:border-b-0 text-sm">
                  <span className="text-prajna-text truncate">{t.micro_topic || t[1]}</span>
                  <span className="text-prajna-teal font-bold text-xs">{t.count || t[2]} appearances</span>
                </div>
              ))}
            </div>
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-warn mb-3">Cold Topics (Dormant)</h3>
              {(hotCold.cold_topics || []).slice(0, 8).map((t: any, i: number) => (
                <div key={i} className="flex justify-between py-1.5 border-b border-white/[0.04] last:border-b-0 text-sm">
                  <span className="text-prajna-text truncate">{t.micro_topic || t[1]}</span>
                  <span className="text-prajna-warn font-bold text-xs">dormant {t.gap || '?'}yr</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
