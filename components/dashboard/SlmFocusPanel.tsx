'use client';

interface SlmItem {
  chapter: string;
  accuracy: number;
  level: string;
  slm_importance: number;
  slm_priority_score: number;
}

interface Props {
  items: SlmItem[];
}

export function SlmFocusPanel({ items }: Props) {
  if (!items || items.length === 0) {
    return null;
  }

  const top5 = items.slice(0, 5);

  return (
    <div className="bg-gradient-to-br from-prajna-accent/8 to-purple-500/6 border border-prajna-accent/25 rounded-xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-accent/80 mb-3">
        SLM Focus — What To Study Next
      </h3>
      <div className="space-y-2">
        {top5.map((item, i) => {
          const priorityPct = Math.min(100, item.slm_priority_score * 100);
          const accColor = item.accuracy < 50 ? '#ff6b6b' : item.accuracy < 65 ? '#ffd166' : '#22c55e';
          return (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-white/[0.06] last:border-b-0">
              <span className="text-xs font-bold text-prajna-accent w-5">#{i + 1}</span>
              <span className="flex-1 text-sm font-medium text-prajna-text truncate">{item.chapter}</span>
              <span className="text-xs font-semibold" style={{ color: accColor }}>
                {item.accuracy.toFixed(0)}%
              </span>
              <div className="w-16 h-1.5 bg-prajna-border rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-prajna-accent" style={{ width: `${priorityPct}%` }} />
              </div>
              <span className="text-[0.6rem] font-bold text-prajna-accent">{item.slm_priority_score.toFixed(2)}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[0.62rem] text-prajna-muted mt-3">
        Priority = weakness x exam importance. Higher = study this first.
      </p>
    </div>
  );
}
