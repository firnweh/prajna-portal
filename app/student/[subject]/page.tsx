'use client';

import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { KpiStrip, ChapterRow } from '@/components/dashboard';
import { computeRoi } from '@/components/dashboard/RoiBadge';
import { useStudentData } from '@/lib/hooks/useStudentData';
import type { Prediction } from '@/lib/types';

const SUBJECT_COLORS: Record<string, string> = {
  physics: '#f59e0b', chemistry: '#6366f1', biology: '#22c55e',
  mathematics: '#a855f7', botany: '#22c55e', zoology: '#10b981',
};

function getStudentAcc(student: any, name: string): number | null {
  const ch = student?.chapters?.[name];
  if (ch) return ch[0];
  const sub = student?.subjects?.[name];
  if (sub) return sub.acc ?? null;
  return null;
}

export default function SubjectPage() {
  const params = useParams();
  const subjectSlug = (params.subject as string) || '';
  const subjectName = subjectSlug.charAt(0).toUpperCase() + subjectSlug.slice(1);
  const color = SUBJECT_COLORS[subjectSlug] || '#6366f1';
  const { student, microPreds, loading } = useStudentData();

  if (loading || !student) {
    return (
      <>
        <Header title={`PRAJNA · ${subjectName}`} />
        <div className="flex items-center justify-center h-64 text-prajna-muted">Loading...</div>
      </>
    );
  }

  // Filter predictions for this subject
  const subPreds = microPreds.filter(p =>
    p.subject.toLowerCase() === subjectSlug
  );

  const subjAcc = getStudentAcc(student, subjectName) ?? getStudentAcc(student, subjectSlug);

  // Group by chapter
  const chapterMap = new Map<string, { preds: Prediction[]; maxProb: number; expQ: number; trend: string }>();
  for (const p of subPreds) {
    const ch = p.chapter || 'Other';
    if (!chapterMap.has(ch)) chapterMap.set(ch, { preds: [], maxProb: 0, expQ: 0, trend: 'STABLE' });
    const entry = chapterMap.get(ch)!;
    entry.preds.push(p);
    entry.maxProb = Math.max(entry.maxProb, p.appearance_probability || 0);
    entry.expQ += (p.expected_questions || 0);
    if ((p.appearance_probability || 0) >= entry.maxProb) entry.trend = p.trend_direction || 'STABLE';
  }

  // Compute ROI per micro and sort chapters by max ROI
  const chapters = [...chapterMap.entries()].map(([ch, data]) => {
    const chAcc = getStudentAcc(student, ch) ?? subjAcc;
    const micros = data.preds.map(p => {
      const mtAcc = getStudentAcc(student, p.micro_topic || p.chapter) ?? chAcc;
      return {
        name: p.micro_topic || p.chapter,
        studentAcc: mtAcc,
        prajnaProb: p.appearance_probability || 0,
        roi: computeRoi(mtAcc, p.appearance_probability, p.confidence_score),
      };
    }).sort((a, b) => b.roi - a.roi);

    const maxRoi = micros.length ? Math.max(...micros.map(m => m.roi)) : 0;
    return { name: ch, studentAcc: chAcc, prajnaProb: data.maxProb, expectedQs: data.expQ, trend: data.trend, microTopics: micros, maxRoi, signals: data.preds[0]?.signal_breakdown };
  }).sort((a, b) => b.maxRoi - a.maxRoi);

  // Stats
  const allMicros = chapters.flatMap(c => c.microTopics);
  const critCount = allMicros.filter(m => m.roi > 0.4).length;
  const focusCount = allMicros.filter(m => m.roi > 0.25 && m.roi <= 0.4).length;
  const avgProb = subPreds.length
    ? subPreds.reduce((s, p) => s + (p.appearance_probability || 0), 0) / subPreds.length
    : 0;

  // Top 5 priority actions
  const top5 = allMicros.filter(m => m.roi > 0.1).slice(0, 5);

  return (
    <>
      <Header title={`PRAJNA · ${subjectName}`} />
      <div className="p-6 space-y-6 max-w-[1200px]">
        {/* Zone A: KPIs */}
        <KpiStrip items={[
          { label: 'Your Accuracy', value: subjAcc !== null ? `${subjAcc.toFixed(0)}%` : '—', color },
          { label: 'PRAJNA Exam Load', value: `${(avgProb * 100).toFixed(0)}%`, color: '#6366f1' },
          { label: 'Critical Topics', value: `${critCount}`, color: '#ff6b6b' },
          { label: 'Chapters Predicted', value: `${chapters.length}`, color: '#00d4aa' },
        ]} />

        {/* Zone B: Top 5 Priority Actions */}
        {top5.length > 0 && (
          <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">Top Priority Actions</h3>
            <div className="space-y-2">
              {top5.map((m, i) => {
                const roiColor = m.roi > 0.4 ? '#ff6b6b' : m.roi > 0.25 ? '#f59e0b' : '#818cf8';
                const roiLabel = m.roi > 0.4 ? 'CRITICAL' : m.roi > 0.25 ? 'FOCUS' : 'REVIEW';
                return (
                  <div key={i} className="flex items-center gap-3 py-1.5 border-b border-white/[0.04] last:border-b-0">
                    <span className="text-xs font-bold text-prajna-muted w-5">#{i + 1}</span>
                    <span className="flex-1 text-sm font-medium text-prajna-text truncate">{m.name}</span>
                    <span className="text-xs" style={{ color: m.studentAcc !== null && m.studentAcc < 50 ? '#ff6b6b' : '#22c55e' }}>
                      {m.studentAcc !== null ? `${m.studentAcc.toFixed(0)}%` : '—'}
                    </span>
                    <span className="text-xs font-bold" style={{ color }}>
                      {(m.prajnaProb * 100).toFixed(0)}%
                    </span>
                    <span className="text-[0.6rem] font-bold px-2 py-0.5 rounded" style={{ color: roiColor, background: `${roiColor}18` }}>
                      {roiLabel}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Zone C: Chapter Breakdown */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">
            Chapter Breakdown — {chapters.length} chapters · {allMicros.length} micro-topics
          </h3>
          {chapters.map(ch => (
            <ChapterRow
              key={ch.name}
              name={ch.name}
              studentAcc={ch.studentAcc}
              prajnaProb={ch.prajnaProb}
              expectedQs={ch.expectedQs}
              trend={ch.trend}
              subjectColor={color}
              microTopics={ch.microTopics}
              signals={ch.signals}
            />
          ))}
          {chapters.length === 0 && (
            <p className="text-sm text-prajna-muted py-8 text-center">
              No PRAJNA predictions available for {subjectName}. Start the Intelligence API on port 8001.
            </p>
          )}
        </div>
      </div>
    </>
  );
}
