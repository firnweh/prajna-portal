'use client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

const ZONES = [
  { key: 'M', label: 'Mastery ≥80%', color: '#00d4aa' },
  { key: 'S', label: 'Strong 65-79%', color: '#8b7fff' },
  { key: 'D', label: 'Developing 45-64%', color: '#ffd166' },
  { key: 'W', label: 'Weak 25-44%', color: '#ff9966' },
  { key: 'C', label: 'Critical <25%', color: '#ff6b6b' },
];

interface Props {
  counts: Record<string, number>;
}

export function ZoneDonut({ counts }: Props) {
  const data = ZONES.map(z => ({ name: `${z.key} · ${z.label}`, value: counts[z.key] || 0, color: z.color })).filter(d => d.value > 0);

  return (
    <div className="bg-prajna-card border border-prajna-border rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">Zone Distribution</h3>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={2}>
            {data.map((d, i) => <Cell key={i} fill={d.color} stroke="#ffffff" strokeWidth={2} />)}
          </Pie>
          <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b', fontSize: 12 }} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2 justify-center mt-2">
        {data.map((d, i) => (
          <span key={i} className="text-[0.62rem] font-semibold flex items-center gap-1" style={{ color: d.color }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: d.color }} />
            {d.name}: {d.value}
          </span>
        ))}
      </div>
    </div>
  );
}
