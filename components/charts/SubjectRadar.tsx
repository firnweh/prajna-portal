'use client';

import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

interface Props {
  abilities: Record<string, number>; // { phy: 0.8, chem: 0.55, bio: 0.83 }
}

const LABELS: Record<string, string> = {
  phy: 'Physics', chem: 'Chemistry', bio: 'Biology', math: 'Mathematics',
};

export function SubjectRadar({ abilities }: Props) {
  if (!abilities || Object.keys(abilities).length === 0) {
    return <div className="text-prajna-muted text-sm text-center py-8">No ability data</div>;
  }

  const data = Object.entries(abilities).map(([key, val]) => ({
    subject: LABELS[key] || key,
    ability: Math.round((val || 0) * 100),
  }));

  return (
    <div className="bg-prajna-card border border-prajna-border rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">Subject Strengths</h3>
      <ResponsiveContainer width="100%" height={200}>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
          <PolarGrid stroke="#1e1e3a" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: '#e2e8f0', fontSize: 12, fontWeight: 600 }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} />
          <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid #1e1e3a', borderRadius: 8, color: '#e2e8f0' }} />
          <Radar name="Ability" dataKey="ability" stroke="#a855f7" fill="#a855f7" fillOpacity={0.25} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
