'use client';

import { useEffect, useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/lib/store';
import { intelligence } from '@/lib/api';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, Legend, ReferenceArea,
} from 'recharts';

const TOOLTIP_STYLE = { background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b' };

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#f59e0b', Chemistry: '#6366f1', Biology: '#22c55e',
  Mathematics: '#a855f7', Botany: '#22c55e', Zoology: '#10b981',
};

/* ---------- types ---------- */
interface DangerZone {
  micro_topic: string; subject: string; error_rate: number;
  prajna_prob: number; danger_score: number;
}
interface CofailurePair {
  topic_a: string; topic_b: string; cofailure_pct: number; both_fail_count: number;
}
interface TimeAccuracy {
  micro_topic: string; subject: string; avg_time: number; avg_accuracy: number; student_count: number;
}
interface PredictionRow {
  micro_topic: string; subject: string; past_accuracy: number;
  p_mistake: number; importance: number; trend: string;
}
interface Importances { [key: string]: number }

type ViewMode = 'center' | 'student';

/* ---------- helpers ---------- */
function dangerColor(value: number, invert = false) {
  const v = invert ? 1 - value : value;
  if (v > 0.7) return '#ef4444';
  if (v > 0.4) return '#f59e0b';
  return '#22c55e';
}

function riskBadge(pMiss: number) {
  if (pMiss > 0.7) return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-400">HIGH</span>;
  if (pMiss > 0.5) return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400">MEDIUM</span>;
  return <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/15 text-green-400">LOW</span>;
}

export default function MistakeAnalysisPage() {
  const { exam } = useStore();
  const examType = exam === 'jee' ? 'jee_main' : 'neet';

  const [view, setView] = useState<ViewMode>('center');

  /* --- center state --- */
  const [dangerZones, setDangerZones] = useState<DangerZone[]>([]);
  const [cofailures, setCofailures] = useState<CofailurePair[]>([]);
  const [timeAcc, setTimeAcc] = useState<TimeAccuracy[]>([]);
  const [centerLoading, setCenterLoading] = useState(true);
  const [centerError, setCenterError] = useState(false);

  /* --- student state --- */
  const [studentId, setStudentId] = useState('');
  const [predictions, setPredictions] = useState<PredictionRow[]>([]);
  const [importances, setImportances] = useState<Importances>({});
  const [studentLoading, setStudentLoading] = useState(false);
  const [studentError, setStudentError] = useState('');

  /* --- load center data --- */
  useEffect(() => {
    if (view !== 'center') return;
    let cancelled = false;
    async function load() {
      setCenterLoading(true);
      setCenterError(false);
      try {
        const [dzRes, cfRes, taRes] = await Promise.all([
          intelligence(`/api/v1/mistakes/danger-zones?exam_type=${examType}&error_threshold=0.4&top_n=15`),
          intelligence(`/api/v1/mistakes/cofailure?exam_type=${examType}&top_n=15`),
          intelligence(`/api/v1/mistakes/time-accuracy?exam_type=${examType}`),
        ]);
        if (!dzRes.ok || !cfRes.ok || !taRes.ok) throw new Error('API error');
        const [dzJ, cfJ, taJ] = await Promise.all([dzRes.json(), cfRes.json(), taRes.json()]);
        if (!cancelled) {
          setDangerZones(dzJ.zones || []);
          setCofailures(cfJ.pairs || []);
          setTimeAcc(taJ.data || []);
        }
      } catch {
        if (!cancelled) setCenterError(true);
      } finally {
        if (!cancelled) setCenterLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [view, examType]);

  /* --- load student data --- */
  async function loadStudent() {
    if (!studentId.trim()) return;
    setStudentLoading(true);
    setStudentError('');
    try {
      const [predRes, featRes] = await Promise.all([
        intelligence(`/api/v1/mistakes/predict?student_id=${encodeURIComponent(studentId)}&exam_type=${examType}`),
        intelligence(`/api/v1/mistakes/feature-importance?exam_type=${examType}`),
      ]);
      if (!predRes.ok || !featRes.ok) throw new Error('API error');
      const [predJ, featJ] = await Promise.all([predRes.json(), featRes.json()]);
      setPredictions(predJ.predictions || []);
      setImportances(featJ.importances || {});
    } catch {
      setStudentError('Could not load student data.');
    } finally {
      setStudentLoading(false);
    }
  }

  /* --- derived data --- */
  const scatterData = useMemo(() => {
    const subjects = [...new Set(timeAcc.map(d => d.subject))];
    return subjects.map(subject => ({
      subject,
      data: timeAcc.filter(d => d.subject === subject).map(d => ({
        x: d.avg_time,
        y: d.avg_accuracy,
        topic: d.micro_topic,
        subject: d.subject,
      })),
    }));
  }, [timeAcc]);

  const importanceChart = useMemo(() => {
    return Object.entries(importances)
      .map(([name, value]) => ({ name: name.replace(/_/g, ' '), value: Number(value) }))
      .sort((a, b) => b.value - a.value);
  }, [importances]);

  const personalDangerZones = useMemo(() => {
    return predictions.filter(p => p.p_mistake > 0.5 && p.importance > 0.6);
  }, [predictions]);

  // For scatter quadrant: find max values for reference area
  const maxTime = useMemo(() => Math.max(...timeAcc.map(d => d.avg_time), 1), [timeAcc]);
  const midTime = maxTime * 0.5;

  return (
    <>
      <Header title="PRAJNA - Mistake Analysis" />
      <div className="p-6 space-y-6 max-w-[1200px]">
        {/* View Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setView('center')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
              view === 'center'
                ? 'bg-prajna-accent text-white'
                : 'bg-prajna-card border border-prajna-border text-prajna-muted hover:text-prajna-text'
            }`}
          >
            Center View
          </button>
          <button
            onClick={() => setView('student')}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
              view === 'student'
                ? 'bg-prajna-accent text-white'
                : 'bg-prajna-card border border-prajna-border text-prajna-muted hover:text-prajna-text'
            }`}
          >
            Student View
          </button>
        </div>

        {/* ========== CENTER VIEW ========== */}
        {view === 'center' && (
          <>
            {centerLoading && (
              <div className="flex items-center justify-center h-40 text-prajna-muted">Loading mistake data...</div>
            )}
            {centerError && (
              <div className="flex items-center justify-center h-40 text-prajna-warn">Intelligence API not available</div>
            )}
            {!centerLoading && !centerError && (
              <>
                {/* Danger Zones Table */}
                <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 overflow-x-auto">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted mb-4">Danger Zones</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-prajna-muted uppercase border-b border-prajna-border">
                        <th className="pb-2 pr-4">Topic</th>
                        <th className="pb-2 pr-4">Subject</th>
                        <th className="pb-2 pr-4 text-right">Error Rate %</th>
                        <th className="pb-2 pr-4 text-right">PRAJNA Prob %</th>
                        <th className="pb-2 text-right">Danger Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dangerZones.map((dz, i) => (
                        <tr key={i} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
                          <td className="py-2 pr-4 text-prajna-text font-medium">{dz.micro_topic}</td>
                          <td className="py-2 pr-4 text-prajna-muted">{dz.subject}</td>
                          <td className="py-2 pr-4 text-right font-bold" style={{ color: dangerColor(dz.error_rate) }}>
                            {(dz.error_rate * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 pr-4 text-right text-prajna-text">
                            {(dz.prajna_prob * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 text-right font-bold" style={{ color: dangerColor(dz.danger_score) }}>
                            {dz.danger_score.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      {dangerZones.length === 0 && (
                        <tr><td colSpan={5} className="py-4 text-center text-prajna-muted">No danger zones found</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Co-failure Patterns */}
                <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 overflow-x-auto">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted mb-4">Co-failure Patterns</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-prajna-muted uppercase border-b border-prajna-border">
                        <th className="pb-2 pr-4">Topic A</th>
                        <th className="pb-2 pr-4">Topic B</th>
                        <th className="pb-2 pr-4 text-right">Co-failure %</th>
                        <th className="pb-2 text-right">Both Fail Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cofailures.map((cf, i) => (
                        <tr key={i} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
                          <td className="py-2 pr-4 text-prajna-text font-medium">{cf.topic_a}</td>
                          <td className="py-2 pr-4 text-prajna-text font-medium">{cf.topic_b}</td>
                          <td className="py-2 pr-4 text-right text-prajna-text font-bold">{cf.cofailure_pct.toFixed(1)}%</td>
                          <td className="py-2 text-right text-prajna-muted">{cf.both_fail_count}</td>
                        </tr>
                      ))}
                      {cofailures.length === 0 && (
                        <tr><td colSpan={4} className="py-4 text-center text-prajna-muted">No co-failure data</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Time vs Accuracy Scatter */}
                <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted mb-4">Time vs Accuracy</h2>
                  <ResponsiveContainer width="100%" height={400}>
                    <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis
                        type="number" dataKey="x" name="Avg Time (s)"
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        label={{ value: 'Avg Time (s)', position: 'bottom', fill: '#64748b', fontSize: 11 }}
                      />
                      <YAxis
                        type="number" dataKey="y" name="Avg Accuracy"
                        domain={[0, 1]}
                        tick={{ fill: '#64748b', fontSize: 11 }}
                        label={{ value: 'Avg Accuracy', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={TOOLTIP_STYLE}
                        formatter={(value, name) => {
                          const v = Number(value);
                          return [name === 'Avg Accuracy' ? `${(v * 100).toFixed(0)}%` : `${v.toFixed(1)}s`, String(name)];
                        }}
                        labelFormatter={() => ''}
                      />
                      {/* Quadrant highlight: high time + low accuracy */}
                      <ReferenceArea
                        x1={midTime} x2={maxTime * 1.1}
                        y1={0} y2={0.5}
                        fill="#ef4444" fillOpacity={0.06}
                        label={{ value: 'Conceptual Gaps', position: 'insideTopRight', fill: '#ef4444', fontSize: 11 }}
                      />
                      <Legend />
                      {scatterData.map((group) => (
                        <Scatter
                          key={group.subject}
                          name={group.subject}
                          data={group.data}
                          fill={SUBJECT_COLORS[group.subject] || '#6366f1'}
                        />
                      ))}
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </>
            )}
          </>
        )}

        {/* ========== STUDENT VIEW ========== */}
        {view === 'student' && (
          <>
            {/* Student selector */}
            <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted mb-4">Student Selector</h2>
              <div className="flex items-end gap-4">
                <div>
                  <label className="block text-xs text-prajna-muted mb-1">Student ID</label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Enter student ID"
                    className="w-64 bg-prajna-bg border border-prajna-border rounded-lg px-3 py-2 text-prajna-text text-sm focus:outline-none focus:border-prajna-accent"
                    onKeyDown={(e) => e.key === 'Enter' && loadStudent()}
                  />
                </div>
                <button
                  onClick={loadStudent}
                  disabled={studentLoading || !studentId.trim()}
                  className="px-6 py-2 bg-prajna-accent text-white text-sm font-bold rounded-lg hover:brightness-110 disabled:opacity-50 transition"
                >
                  {studentLoading ? 'Loading...' : 'Load'}
                </button>
              </div>
              {studentError && <p className="mt-3 text-sm text-prajna-warn">{studentError}</p>}
            </div>

            {studentLoading && (
              <div className="flex items-center justify-center h-40 text-prajna-muted">Loading student data...</div>
            )}

            {!studentLoading && predictions.length > 0 && (
              <>
                {/* P(Miss) Predictions Table */}
                <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 overflow-x-auto">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted mb-4">P(Miss) Predictions</h2>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-prajna-muted uppercase border-b border-prajna-border">
                        <th className="pb-2 pr-4">Topic</th>
                        <th className="pb-2 pr-4">Subject</th>
                        <th className="pb-2 pr-4 text-right">Past Accuracy</th>
                        <th className="pb-2 pr-4 text-right">P(Miss)</th>
                        <th className="pb-2 pr-4 text-right">Importance</th>
                        <th className="pb-2 text-center">Risk</th>
                      </tr>
                    </thead>
                    <tbody>
                      {predictions.map((p, i) => (
                        <tr key={i} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
                          <td className="py-2 pr-4 text-prajna-text font-medium">{p.micro_topic}</td>
                          <td className="py-2 pr-4 text-prajna-muted">{p.subject}</td>
                          <td className="py-2 pr-4 text-right text-prajna-text">{(p.past_accuracy * 100).toFixed(0)}%</td>
                          <td className="py-2 pr-4 text-right font-bold" style={{ color: dangerColor(p.p_mistake) }}>
                            {(p.p_mistake * 100).toFixed(1)}%
                          </td>
                          <td className="py-2 pr-4 text-right text-prajna-text">{p.importance.toFixed(2)}</td>
                          <td className="py-2 text-center">{riskBadge(p.p_mistake)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Feature Importance Bar Chart */}
                {importanceChart.length > 0 && (
                  <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted mb-4">Feature Importance</h2>
                    <ResponsiveContainer width="100%" height={Math.max(250, importanceChart.length * 32)}>
                      <BarChart data={importanceChart} layout="vertical" margin={{ left: 120, right: 20, top: 5, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" tick={{ fill: '#64748b', fontSize: 11 }} unit="%" />
                        <YAxis
                          type="category" dataKey="name" width={110}
                          tick={{ fill: '#94a3b8', fontSize: 11 }}
                        />
                        <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [`${Number(v).toFixed(1)}%`, 'Importance']} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {importanceChart.map((_, idx) => (
                            <Cell key={idx} fill={idx === 0 ? '#6366f1' : idx < 3 ? '#8b5cf6' : '#475569'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Personal Danger Zones */}
                <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 overflow-x-auto">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-prajna-muted mb-4">
                    Personal Danger Zones
                    <span className="ml-2 text-xs font-normal text-prajna-muted">(P(Miss) &gt; 50% AND Importance &gt; 0.6)</span>
                  </h2>
                  {personalDangerZones.length > 0 ? (
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-xs text-prajna-muted uppercase border-b border-prajna-border">
                          <th className="pb-2 pr-4">Topic</th>
                          <th className="pb-2 pr-4">Subject</th>
                          <th className="pb-2 pr-4 text-right">P(Miss)</th>
                          <th className="pb-2 pr-4 text-right">Importance</th>
                          <th className="pb-2 text-center">Risk</th>
                        </tr>
                      </thead>
                      <tbody>
                        {personalDangerZones.map((p, i) => (
                          <tr key={i} className="border-b border-white/[0.04] last:border-b-0 hover:bg-white/[0.02]">
                            <td className="py-2 pr-4 text-prajna-text font-medium">{p.micro_topic}</td>
                            <td className="py-2 pr-4 text-prajna-muted">{p.subject}</td>
                            <td className="py-2 pr-4 text-right font-bold" style={{ color: dangerColor(p.p_mistake) }}>
                              {(p.p_mistake * 100).toFixed(1)}%
                            </td>
                            <td className="py-2 pr-4 text-right text-prajna-text">{p.importance.toFixed(2)}</td>
                            <td className="py-2 text-center">{riskBadge(p.p_mistake)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-sm text-prajna-muted">No critical danger zones for this student.</p>
                  )}
                </div>
              </>
            )}

            {!studentLoading && predictions.length === 0 && studentId && !studentError && (
              <div className="flex items-center justify-center h-40 text-prajna-muted">No prediction data for this student.</div>
            )}
          </>
        )}
      </div>
    </>
  );
}
