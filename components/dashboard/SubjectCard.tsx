'use client';

import Link from 'next/link';
import { ZoneBadge, zone } from './ZoneBadge';

const SUBJECT_COLORS: Record<string, string> = {
  Physics: '#f59e0b',
  Chemistry: '#6366f1',
  Biology: '#22c55e',
  Mathematics: '#a855f7',
  Botany: '#22c55e',
  Zoology: '#10b981',
};

interface SubjectCardProps {
  subject: string;
  accuracy: number | null;
  prajnaLoad: number; // avg appearance probability (0-1)
  criticalCount: number;
  chapterCount: number;
  href: string;
}

export function SubjectCard({ subject, accuracy, prajnaLoad, criticalCount, chapterCount, href }: SubjectCardProps) {
  const color = SUBJECT_COLORS[subject] || '#6366f1';
  const acc = accuracy ?? 0;
  const lv = zone(acc);

  return (
    <Link href={href} className="block">
      <div
        className="bg-prajna-card border border-prajna-border rounded-xl p-5 hover:border-prajna-accent transition-colors cursor-pointer"
        style={{ borderTopWidth: 3, borderTopColor: color }}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-bold" style={{ color }}>{subject}</h3>
          <ZoneBadge level={lv} />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-prajna-muted">Your accuracy</span>
            <span className="font-bold" style={{ color }}>{acc.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 bg-prajna-border rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, acc)}%`, background: color }} />
          </div>
          <div className="flex justify-between text-xs text-prajna-muted">
            <span>PRAJNA: <strong className="text-prajna-text">{(prajnaLoad * 100).toFixed(0)}%</strong> exam load</span>
            <span>{chapterCount} chapters</span>
          </div>
          {criticalCount > 0 && (
            <p className="text-xs font-bold text-prajna-warn">⚠ {criticalCount} critical micro-topics</p>
          )}
        </div>

        <div className="mt-3 text-xs font-semibold text-prajna-accent">Explore →</div>
      </div>
    </Link>
  );
}
