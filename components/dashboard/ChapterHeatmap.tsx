'use client';

const ZONE_COLORS: Record<string, string> = {
  M: '#00d4aa', S: '#8b7fff', D: '#ffd166', W: '#ff9966', C: '#ff6b6b',
};
const ZONE_LABELS: Record<string, string> = {
  M: 'Mastery', S: 'Strong', D: 'Developing', W: 'Weak', C: 'Critical',
};

interface Props {
  chapters: Record<string, [number, string, number]>; // { name: [accuracy, zone, count] }
  subjects: string[];
  predictions: Array<{ chapter: string; subject: string }>;
}

export function ChapterHeatmap({ chapters, subjects, predictions }: Props) {
  if (!chapters || Object.keys(chapters).length === 0) return null;

  // Build chapter-to-subject mapping from predictions
  const chapterSubject: Record<string, string> = {};
  predictions.forEach(p => { chapterSubject[p.chapter] = p.subject; });

  // Group chapters by subject
  const grouped: Record<string, Array<{ name: string; acc: number; zone: string; count: number }>> = {};
  subjects.forEach(s => { grouped[s] = []; });

  for (const [name, [acc, zone, count]] of Object.entries(chapters)) {
    const subj = chapterSubject[name] || 'Other';
    if (!grouped[subj]) grouped[subj] = [];
    grouped[subj].push({ name, acc, zone, count });
  }

  // Sort each group by accuracy ascending (weakest first)
  for (const subj of Object.keys(grouped)) {
    grouped[subj].sort((a, b) => a.acc - b.acc);
  }

  return (
    <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-4">
        Chapter Performance
      </h3>
      {subjects.map(subj => {
        const items = grouped[subj];
        if (!items || items.length === 0) return null;
        return (
          <div key={subj} className="mb-4 last:mb-0">
            <p className="text-xs font-bold text-prajna-text mb-2">{subj}</p>
            <div className="space-y-1">
              {items.slice(0, 10).map((ch, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[0.68rem] text-prajna-muted truncate w-40">{ch.name}</span>
                  <div className="flex-1 h-1.5 bg-prajna-border rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(100, ch.acc)}%`, background: ZONE_COLORS[ch.zone] || '#64748b' }}
                    />
                  </div>
                  <span className="text-[0.65rem] font-bold w-8 text-right" style={{ color: ZONE_COLORS[ch.zone] }}>
                    {ch.acc.toFixed(0)}%
                  </span>
                  <span
                    className="text-[0.55rem] font-bold px-1.5 py-0.5 rounded w-6 text-center"
                    style={{ background: `${ZONE_COLORS[ch.zone]}18`, color: ZONE_COLORS[ch.zone] }}
                  >
                    {ch.zone}
                  </span>
                </div>
              ))}
              {items.length > 10 && (
                <p className="text-[0.6rem] text-prajna-muted pl-40">+{items.length - 10} more chapters</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
