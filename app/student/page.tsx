'use client';

import { Header } from '@/components/layout/Header';
import { KpiStrip, SubjectCard, zone } from '@/components/dashboard';
import { computeRoi } from '@/components/dashboard/RoiBadge';
import { TrajectoryChart, SubjectRadar } from '@/components/charts';
import { SlmFocusPanel } from '@/components/dashboard/SlmFocusPanel';
import { ChapterHeatmap } from '@/components/dashboard/ChapterHeatmap';
import { WeaknessZones } from '@/components/dashboard/WeaknessZones';
import { useStudentData } from '@/lib/hooks/useStudentData';
import { useStore } from '@/lib/store';
import type { Prediction } from '@/lib/types';

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#f59e0b', Chemistry: '#6366f1', Biology: '#22c55e',
  Mathematics: '#a855f7', Botany: '#22c55e', Zoology: '#10b981',
};

const SUBJECTS: Record<string, string[]> = {
  neet: ['Physics', 'Chemistry', 'Biology'],
  jee: ['Physics', 'Chemistry', 'Mathematics'],
};

function getStudentAcc(student: any, name: string): number | null {
  const ch = student?.chapters?.[name];
  if (ch) return ch[0];
  const sub = student?.subjects?.[name];
  if (sub) return sub.acc ?? null;
  return null;
}

export default function StudentDashboard() {
  const { exam } = useStore();
  const { student, microPreds, loading, error } = useStudentData();

  if (loading) {
    return (
      <>
        <Header title="PRAJNA · Student Dashboard" />
        <div className="flex items-center justify-center h-64 text-prajna-muted">Loading student data...</div>
      </>
    );
  }

  if (error || !student) {
    return (
      <>
        <Header title="PRAJNA · Student Dashboard" />
        <div className="flex items-center justify-center h-64 text-prajna-warn">
          {error || 'No student data found. Check backend connection.'}
        </div>
      </>
    );
  }

  const m = student.metrics;
  const zoneKey = zone(m.avg_percentage || 0);
  const ZONE_CFG: Record<string, { color: string; label: string }> = {
    M: { color: '#00d4aa', label: 'Mastery' },
    S: { color: '#8b7fff', label: 'Strong' },
    D: { color: '#ffd166', label: 'Developing' },
    W: { color: '#ff9966', label: 'Weak' },
    C: { color: '#ff6b6b', label: 'Critical' },
  };
  const lv = ZONE_CFG[zoneKey] || ZONE_CFG.D;
  const subjects = SUBJECTS[exam] || SUBJECTS.neet;

  // Compute trend from trajectory
  const traj = m.trajectory || [];
  const trendPerExam = traj.length >= 2 ? traj[traj.length - 1] - traj[0] : 0;

  // Build subject stats
  const subjectStats = subjects.map(sub => {
    const acc = getStudentAcc(student, sub);
    const subPreds = microPreds.filter(p => p.subject === sub);
    const avgProb = subPreds.length
      ? subPreds.reduce((sum, p) => sum + (p.appearance_probability || 0), 0) / subPreds.length
      : 0;
    const critCount = subPreds.filter(p => {
      const mtAcc = getStudentAcc(student, p.micro_topic || p.chapter) ?? acc;
      return computeRoi(mtAcc, p.appearance_probability, p.confidence_score) > 0.4;
    }).length;
    return { subject: sub, accuracy: acc, prajnaLoad: avgProb, criticalCount: critCount, chapterCount: subPreds.length };
  });

  // Summary counts
  const allRois = microPreds.map(p => {
    const mtAcc = getStudentAcc(student, p.micro_topic || p.chapter)
      ?? getStudentAcc(student, p.subject);
    return computeRoi(mtAcc, p.appearance_probability, p.confidence_score);
  });
  const critTotal = allRois.filter(r => r > 0.4).length;
  const focusTotal = allRois.filter(r => r > 0.25 && r <= 0.4).length;
  const okTotal = allRois.filter(r => r <= 0.25).length;

  return (
    <>
      <Header title="PRAJNA · Student Dashboard" />
      <div className="p-6 space-y-6 max-w-[1400px]">
        {/* Hero */}
        <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-prajna-accent/20 flex items-center justify-center text-xl font-bold text-prajna-accent">
            {student.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-prajna-text">{student.name}</h2>
            <p className="text-xs text-prajna-muted">
              {student.id} · {student.coaching} · {student.city} · Target: {student.target?.toUpperCase()}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {(m.latest_rank || m.best_rank) && (
              <div className="text-right">
                <p className="text-xl font-extrabold text-prajna-gold">#{m.latest_rank || m.best_rank}</p>
                <p className="text-xs text-prajna-muted">Rank</p>
              </div>
            )}
            <div className="text-right">
              <div className="flex items-center gap-2 justify-end">
                <p className="text-3xl font-extrabold text-prajna-accent">{(m.latest_percentage || m.avg_percentage || 0).toFixed(1)}%</p>
                <span
                  className="text-[0.6rem] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: `${lv.color}20`, color: lv.color }}
                >
                  {lv.label}
                </span>
              </div>
              <p className="text-xs text-prajna-muted">Latest Score</p>
            </div>
          </div>
        </div>

        {/* KPIs — 6 cards */}
        <KpiStrip items={[
          { label: 'Average Score', value: `${(m.avg_percentage || 0).toFixed(1)}%`, color: SUBJECT_COLORS.Physics },
          { label: 'Best Score', value: `${(m.best_percentage || 0).toFixed(1)}%`, color: '#22c55e' },
          { label: 'Improvement', value: `${m.improvement >= 0 ? '+' : ''}${(m.improvement || 0).toFixed(1)}pp`, color: m.improvement >= 0 ? '#00d4aa' : '#ff6b6b', trend: m.improvement >= 0 ? 'up' : 'down' },
          { label: 'Consistency', value: `${(m.consistency_score || 0).toFixed(0)}`, color: '#a855f7' },
          { label: 'Best Rank', value: m.best_rank ? `#${m.best_rank}` : '—', color: '#ffd166' },
          { label: 'Trend/Exam', value: `${trendPerExam >= 0 ? '+' : ''}${trendPerExam.toFixed(1)}pp`, color: trendPerExam >= 0 ? '#00d4aa' : '#ff6b6b', trend: trendPerExam >= 0 ? 'up' : 'down' },
        ]} />

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-4">
          <TrajectoryChart trajectory={m.trajectory || []} />
          <SubjectRadar abilities={student.abilities || {}} />
        </div>

        {/* PRAJNA Summary */}
        {microPreds.length > 0 && (
          <div className="bg-gradient-to-br from-prajna-accent/8 to-purple-500/6 border border-prajna-accent/25 rounded-xl p-5">
            <h3 className="text-sm font-bold text-prajna-accent/80 mb-2">PRAJNA Study Priority Summary — {microPreds.length} micro-topics analyzed</h3>
            <div className="flex gap-5 text-sm font-bold">
              <span className="text-prajna-warn">{critTotal} CRITICAL</span>
              <span className="text-prajna-gold">{focusTotal} FOCUS</span>
              <span className="text-prajna-teal">{okTotal} on track</span>
            </div>
          </div>
        )}

        {/* Subject Cards */}
        <div>
          <p className="text-[0.65rem] font-bold uppercase tracking-wider text-prajna-muted mb-3">Subjects — click to explore</p>
          <div className="grid grid-cols-3 gap-4">
            {subjectStats.map(ss => (
              <SubjectCard
                key={ss.subject}
                subject={ss.subject}
                accuracy={ss.accuracy}
                prajnaLoad={ss.prajnaLoad}
                criticalCount={ss.criticalCount}
                chapterCount={ss.chapterCount}
                href={`/student/${ss.subject.toLowerCase()}`}
              />
            ))}
          </div>
        </div>

        {/* SLM Focus Panel */}
        <SlmFocusPanel items={student.slm_focus || []} />

        {/* Chapter Heatmap + Weakness Zones */}
        <div className="grid grid-cols-2 gap-4">
          <ChapterHeatmap chapters={student.chapters} subjects={subjects} predictions={microPreds} />
          <WeaknessZones chapters={student.chapters} />
        </div>
      </div>
    </>
  );
}
