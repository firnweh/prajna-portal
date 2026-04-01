'use client';

import { useState } from 'react';

interface MicroTopic {
  name: string;
  studentAcc: number | null;
  prajnaProb: number;
  roi: number;
}

interface ChapterRowProps {
  name: string;
  studentAcc: number | null;
  prajnaProb: number;
  expectedQs: number;
  trend: string;
  subjectColor: string;
  microTopics: MicroTopic[];
  signals?: Record<string, number>;
}

export function ChapterRow({ name, studentAcc, prajnaProb, expectedQs, trend, subjectColor, microTopics, signals }: ChapterRowProps) {
  const [open, setOpen] = useState(false);
  const trendIcon = trend === 'RISING' ? '↑' : trend === 'DECLINING' ? '↓' : '→';
  const accColor = studentAcc !== null && studentAcc < 50 ? '#ff6b6b' : '#22c55e';

  return (
    <div className="bg-prajna-bg border border-prajna-border rounded-lg overflow-hidden mb-1.5">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-white/[0.02] transition-colors cursor-pointer"
      >
        <span className="text-prajna-muted text-xs">{open ? '▼' : '▶'}</span>
        <span className="flex-1 text-sm font-semibold text-prajna-text truncate">{name}</span>
        <span className="text-xs text-prajna-muted">
          Your: <strong style={{ color: accColor }}>{studentAcc !== null ? `${studentAcc.toFixed(0)}%` : '—'}</strong>
        </span>
        <span className="text-xs font-bold" style={{ color: subjectColor }}>{(prajnaProb * 100).toFixed(0)}%</span>
        <span className="text-[0.65rem] text-prajna-muted whitespace-nowrap">~{expectedQs.toFixed(1)}Q · {trendIcon}</span>
      </button>

      {open && (
        <div className="px-4 pb-3 border-t border-prajna-border">
          {signals && Object.keys(signals).length > 0 && (
            <div className="flex flex-wrap gap-1.5 py-2">
              {Object.entries(signals).map(([k, v]) => (
                v > 0 && (
                  <span key={k} className="text-[0.6rem] px-2 py-0.5 rounded bg-white/5 text-prajna-muted">
                    {k.replace(/_/g, ' ')}: <strong className="text-prajna-text">{v.toFixed(2)}</strong>
                  </span>
                )
              ))}
            </div>
          )}
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[0.62rem] uppercase tracking-wider text-prajna-muted">
                <th className="text-left py-1.5 font-semibold">Micro-Topic</th>
                <th className="text-right py-1.5 font-semibold w-16">You</th>
                <th className="text-right py-1.5 font-semibold w-16">PRAJNA</th>
                <th className="text-right py-1.5 font-semibold w-20">ROI</th>
              </tr>
            </thead>
            <tbody>
              {microTopics.map((mt, i) => {
                const roiLabel = mt.roi > 0.4 ? '⚠ CRIT' : mt.roi > 0.25 ? '⚡ FOCUS' : mt.roi > 0.1 ? '📘 REV' : '✓ OK';
                const roiColor = mt.roi > 0.4 ? '#ff6b6b' : mt.roi > 0.25 ? '#f59e0b' : mt.roi > 0.1 ? '#818cf8' : '#22c55e';
                const mtAccColor = mt.studentAcc !== null && mt.studentAcc < 50 ? '#ff6b6b' : '#22c55e';
                return (
                  <tr key={i} className="border-t border-white/[0.04]">
                    <td className="py-1.5 text-xs text-prajna-text truncate max-w-[200px]">{mt.name}</td>
                    <td className="py-1.5 text-xs text-right font-semibold" style={{ color: mtAccColor }}>
                      {mt.studentAcc !== null ? `${mt.studentAcc.toFixed(0)}%` : '—'}
                    </td>
                    <td className="py-1.5 text-xs text-right font-semibold" style={{ color: subjectColor }}>
                      {(mt.prajnaProb * 100).toFixed(0)}%
                    </td>
                    <td className="py-1.5 text-right">
                      <span className="text-[0.6rem] font-bold" style={{ color: roiColor }}>{roiLabel}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
