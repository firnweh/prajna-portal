'use client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

function zoneColor(pct: number): string {
  if (pct >= 80) return '#00d4aa';
  if (pct >= 65) return '#8b7fff';
  if (pct >= 45) return '#ffd166';
  if (pct >= 25) return '#ff9966';
  return '#ff6b6b';
}

interface BranchData {
  name: string;
  avg: number;
}

export function BranchBarChart({ data }: { data: BranchData[] }) {
  const sorted = [...data].sort((a, b) => b.avg - a.avg);

  return (
    <div className="bg-prajna-card border border-prajna-border rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">Branch Comparison</h3>
      <ResponsiveContainer width="100%" height={Math.max(200, sorted.length * 32)}>
        <BarChart data={sorted} layout="vertical" margin={{ left: 10, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
          <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#1e293b', fontSize: 11, fontWeight: 600 }} axisLine={false} />
          <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b' }} formatter={(val) => [`${Number(val).toFixed(1)}%`, 'Avg Score']} />
          <Bar dataKey="avg" radius={[0, 4, 4, 0]} barSize={20}>
            {sorted.map((d, i) => <Cell key={i} fill={zoneColor(d.avg)} fillOpacity={0.8} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
