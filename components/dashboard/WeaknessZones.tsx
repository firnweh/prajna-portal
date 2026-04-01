'use client';

const ZONE_COLORS: Record<string, string> = { C: '#ff6b6b', W: '#ff9966' };

interface Props {
  chapters: Record<string, [number, string, number]>;
}

export function WeaknessZones({ chapters }: Props) {
  if (!chapters) return null;

  const weak = Object.entries(chapters)
    .filter(([, [, zone]]) => zone === 'C' || zone === 'W')
    .map(([name, [acc, zone, count]]) => ({ name, acc, zone, count }))
    .sort((a, b) => a.acc - b.acc);

  if (weak.length === 0) {
    return (
      <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 text-center">
        <p className="text-prajna-teal text-sm font-semibold">No critical or weak chapters!</p>
      </div>
    );
  }

  return (
    <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-warn mb-3">
        {weak.length} Chapters Need Attention
      </h3>
      <div className="space-y-1.5">
        {weak.slice(0, 8).map((ch, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <span
              className="text-[0.6rem] font-bold px-1.5 py-0.5 rounded"
              style={{ background: `${ZONE_COLORS[ch.zone]}18`, color: ZONE_COLORS[ch.zone] }}
            >
              {ch.zone}
            </span>
            <span className="flex-1 text-prajna-text truncate">{ch.name}</span>
            <span className="font-bold" style={{ color: ZONE_COLORS[ch.zone] }}>{ch.acc.toFixed(0)}%</span>
          </div>
        ))}
      </div>
      {weak.length > 8 && (
        <p className="text-[0.62rem] text-prajna-muted mt-2">+{weak.length - 8} more weak chapters</p>
      )}
    </div>
  );
}
