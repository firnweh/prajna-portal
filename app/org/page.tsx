'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { KpiStrip } from '@/components/dashboard';
import { zone } from '@/components/dashboard/ZoneBadge';
import { useOrgData } from '@/lib/hooks/useOrgData';
import { useStore } from '@/lib/store';
import type { StudentRecord } from '@/lib/types';

const SUBJ: Record<string, string[]> = {
  neet: ['Physics', 'Chemistry', 'Biology'],
  jee: ['Physics', 'Chemistry', 'Mathematics'],
};

const ZONE_COL: Record<string, string> = { M: '#00d4aa', S: '#8b7fff', D: '#ffd166', W: '#ff9966', C: '#ff6b6b' };

function avg(arr: number[]) { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

export default function OrgDashboard() {
  const { exam } = useStore();
  const { students, predictions, loading } = useOrgData();
  const [sortCol, setSortCol] = useState<'avg' | 'imp' | 'name'>('avg');

  if (loading) {
    return (
      <>
        <Header title="PRAJNA · Organisation Dashboard" />
        <div className="flex items-center justify-center h-64 text-prajna-muted">Loading...</div>
      </>
    );
  }

  if (!students.length) {
    return (
      <>
        <Header title="PRAJNA · Organisation Dashboard" />
        <div className="flex items-center justify-center h-64 text-prajna-warn">No student data found.</div>
      </>
    );
  }

  const scores = students.map(s => s.metrics?.avg_percentage || 0);
  const avgScore = avg(scores);
  const critCount = students.filter(s => zone(s.metrics?.avg_percentage || 0) === 'C').length;
  const topStudent = students.reduce((a, b) => (a.metrics?.avg_percentage || 0) >= (b.metrics?.avg_percentage || 0) ? a : b);
  const branches = [...new Set(students.map(s => s.coaching))];

  // Branch stats
  const branchStats = branches.map(b => {
    const bs = students.filter(s => s.coaching === b);
    const bScores = bs.map(s => s.metrics?.avg_percentage || 0);
    const bAvg = avg(bScores);
    const atRisk = bs.filter(s => zone(s.metrics?.avg_percentage || 0) === 'C').length;
    const weakSubj = SUBJ[exam]?.reduce((worst, sub) => {
      const vals = bs.filter(s => s.subjects?.[sub]).map(s => s.subjects[sub].acc || 0);
      const a = vals.length ? avg(vals) : 100;
      return a < (worst.acc || 100) ? { name: sub, acc: a } : worst;
    }, { name: '', acc: 100 });
    return { name: b, count: bs.length, avg: bAvg, atRisk, weakest: weakSubj?.name || '—' };
  }).sort((a, b) => b.avg - a.avg);

  // Leaderboard
  const sorted = [...students].sort((a, b) => {
    if (sortCol === 'avg') return (b.metrics?.avg_percentage || 0) - (a.metrics?.avg_percentage || 0);
    if (sortCol === 'imp') return (b.metrics?.improvement || 0) - (a.metrics?.improvement || 0);
    return a.name.localeCompare(b.name);
  });

  return (
    <>
      <Header title="PRAJNA · Organisation Dashboard" />
      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* KPIs */}
        <KpiStrip items={[
          { label: 'Total Students', value: `${students.length}`, subtitle: `${branches.length} branches`, color: '#6366f1' },
          { label: 'Avg Score', value: `${avgScore.toFixed(1)}%`, color: ZONE_COL[zone(avgScore)] },
          { label: 'Critical Students', value: `${critCount}`, subtitle: `${((critCount / students.length) * 100).toFixed(0)}% of total`, color: '#ff6b6b' },
          { label: 'Top Scorer', value: topStudent.name?.split(' ').slice(0, 2).join(' '), subtitle: `${(topStudent.metrics?.avg_percentage || 0).toFixed(1)}%`, color: '#ffd166' },
        ]} />

        {/* PRAJNA Intel */}
        {predictions.length > 0 && (
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">
              PRAJNA Exam Predictions — Top {predictions.length} Chapters for 2026
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {predictions.slice(0, 8).map((p, i) => (
                <div key={i} className="flex items-center gap-3 bg-prajna-bg rounded-lg px-3 py-2 border border-prajna-border">
                  <span className="text-xs font-bold text-prajna-muted">#{i + 1}</span>
                  <span className="flex-1 text-sm font-medium text-prajna-text truncate">{p.chapter}</span>
                  <span className="text-xs font-bold text-prajna-accent">{((p.appearance_probability || 0) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Branch Cards */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">Branch Performance</h3>
          <div className="grid grid-cols-4 gap-3">
            {branchStats.map(b => {
              const lv = zone(b.avg);
              return (
                <div key={b.name} className="bg-prajna-card border border-prajna-border rounded-xl p-4 hover:border-prajna-accent transition-colors">
                  <p className="text-sm font-bold text-prajna-text mb-2">{b.name}</p>
                  <div className="flex justify-between text-xs text-prajna-muted mb-1">
                    <span><strong className="text-prajna-text">{b.count}</strong> students</span>
                    <span style={{ color: ZONE_COL[lv] }}><strong>{b.avg.toFixed(1)}%</strong></span>
                  </div>
                  <div className="h-1 bg-prajna-border rounded-full overflow-hidden mb-2">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, b.avg)}%`, background: ZONE_COL[lv] }} />
                  </div>
                  <p className="text-[0.65rem] text-prajna-muted">
                    {b.atRisk > 0 && <span className="text-prajna-warn font-bold mr-2">{b.atRisk} critical</span>}
                    weakest: {b.weakest}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted">Student Leaderboard</h3>
            <div className="flex gap-1 ml-auto">
              {(['avg', 'imp', 'name'] as const).map(col => (
                <button
                  key={col}
                  onClick={() => setSortCol(col)}
                  className={`text-xs px-2 py-1 rounded cursor-pointer transition-colors ${
                    sortCol === col ? 'bg-prajna-accent text-white' : 'text-prajna-muted hover:text-prajna-text bg-prajna-card border border-prajna-border'
                  }`}
                >
                  {{ avg: 'Avg %', imp: 'Improvement', name: 'Name' }[col]}
                </button>
              ))}
            </div>
          </div>
          <div className="border border-prajna-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-prajna-surface text-[0.62rem] uppercase tracking-wider text-prajna-muted">
                  <th className="text-left px-4 py-2 font-semibold">Rank</th>
                  <th className="text-left px-4 py-2 font-semibold">Student</th>
                  <th className="text-right px-4 py-2 font-semibold">Avg %</th>
                  <th className="text-right px-4 py-2 font-semibold">Best %</th>
                  <th className="text-right px-4 py-2 font-semibold">Improvement</th>
                  <th className="text-center px-4 py-2 font-semibold">Zone</th>
                </tr>
              </thead>
              <tbody>
                {sorted.slice(0, 50).map((s, i) => {
                  const lv = zone(s.metrics?.avg_percentage || 0);
                  const imp = s.metrics?.improvement || 0;
                  return (
                    <tr key={s.id} className="border-t border-prajna-border hover:bg-prajna-surface/50">
                      <td className="px-4 py-2 text-xs font-bold text-prajna-muted">{i + 1}</td>
                      <td className="px-4 py-2">
                        <span className="font-medium text-prajna-text">{s.name}</span>
                        <span className="block text-[0.65rem] text-prajna-muted">{s.coaching} · {s.city}</span>
                      </td>
                      <td className="px-4 py-2 text-right font-bold" style={{ color: ZONE_COL[lv] }}>
                        {(s.metrics?.avg_percentage || 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-right text-prajna-text">
                        {(s.metrics?.best_percentage || 0).toFixed(1)}%
                      </td>
                      <td className="px-4 py-2 text-right">
                        <span className={imp >= 0 ? 'text-prajna-teal' : 'text-prajna-warn'}>
                          {imp >= 0 ? '+' : ''}{imp.toFixed(1)}pp
                        </span>
                      </td>
                      <td className="px-4 py-2 text-center">
                        <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded" style={{ background: `${ZONE_COL[lv]}18`, color: ZONE_COL[lv] }}>
                          {lv}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
