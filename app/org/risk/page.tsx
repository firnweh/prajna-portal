'use client';
import { Header } from '@/components/layout/Header';
import { useOrgData } from '@/lib/hooks/useOrgData';
import type { StudentRecord } from '@/lib/types';

function zone(pct: number): string {
  if (pct >= 80) return 'M'; if (pct >= 65) return 'S'; if (pct >= 45) return 'D'; if (pct >= 25) return 'W'; return 'C';
}

export default function AtRiskPage() {
  const { students, loading } = useOrgData();

  if (loading) {
    return (
      <>
        <Header title="PRAJNA · At-Risk Students" />
        <div className="flex items-center justify-center h-64 text-prajna-muted">Loading...</div>
      </>
    );
  }

  const critical = students.filter(s => zone(s.metrics?.avg_percentage || 0) === 'C');
  const weak = students.filter(s => zone(s.metrics?.avg_percentage || 0) === 'W');

  // Group by branch
  const branches = [...new Set(critical.map(s => s.coaching))].sort();
  const branchCounts = branches.map(b => ({
    branch: b,
    critical: critical.filter(s => s.coaching === b).length,
    weak: weak.filter(s => s.coaching === b).length,
  }));

  return (
    <>
      <Header title="PRAJNA · At-Risk Students" />
      <div className="p-6 space-y-6 max-w-[1200px]">
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-4 border-l-4 border-l-[#ff6b6b]">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-prajna-muted">Critical (C)</p>
            <p className="text-3xl font-extrabold text-[#ff6b6b]">{critical.length}</p>
            <p className="text-xs text-prajna-muted">{students.length ? ((critical.length / students.length) * 100).toFixed(0) : 0}% of total</p>
          </div>
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-4 border-l-4 border-l-[#ff9966]">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-prajna-muted">Weak (W)</p>
            <p className="text-3xl font-extrabold text-[#ff9966]">{weak.length}</p>
          </div>
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-4 border-l-4 border-l-prajna-accent">
            <p className="text-[0.65rem] font-bold uppercase tracking-wider text-prajna-muted">Total Students</p>
            <p className="text-3xl font-extrabold text-prajna-accent">{students.length}</p>
          </div>
        </div>

        <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">By Branch</h3>
          <div className="space-y-2">
            {branchCounts.map(b => (
              <div key={b.branch} className="flex items-center gap-3 py-2 border-b border-prajna-border last:border-b-0">
                <span className="text-sm font-semibold text-prajna-text flex-1">{b.branch}</span>
                <span className="text-xs font-bold text-[#ff6b6b]">{b.critical} critical</span>
                <span className="text-xs font-bold text-[#ff9966]">{b.weak} weak</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-warn mb-3">Critical Students</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[0.62rem] uppercase tracking-wider text-prajna-muted">
                <th className="text-left py-2 px-3">Student</th>
                <th className="text-right py-2 px-3">Avg %</th>
                <th className="text-right py-2 px-3">Improvement</th>
                <th className="text-left py-2 px-3">Branch</th>
              </tr>
            </thead>
            <tbody>
              {critical.slice(0, 30).map(s => (
                <tr key={s.id} className="border-t border-prajna-border hover:bg-prajna-surface/50">
                  <td className="py-2 px-3 text-prajna-text font-medium">{s.name}</td>
                  <td className="py-2 px-3 text-right font-bold text-[#ff6b6b]">{(s.metrics?.avg_percentage || 0).toFixed(1)}%</td>
                  <td className="py-2 px-3 text-right text-prajna-muted">{(s.metrics?.improvement || 0).toFixed(1)}pp</td>
                  <td className="py-2 px-3 text-prajna-muted text-xs">{s.coaching}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
