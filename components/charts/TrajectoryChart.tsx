'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer } from 'recharts';

interface Props {
  trajectory: number[];
}

export function TrajectoryChart({ trajectory }: Props) {
  if (!trajectory || trajectory.length < 2) {
    return <div className="text-prajna-muted text-sm text-center py-8">No trajectory data</div>;
  }

  const data = trajectory.map((score, i) => ({ exam: `Exam ${i + 1}`, score: Math.round(score * 10) / 10 }));
  const avg = trajectory.reduce((a, b) => a + b, 0) / trajectory.length;

  return (
    <div className="bg-prajna-card border border-prajna-border rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">Score Trajectory</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e3a" />
          <XAxis dataKey="exam" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e1e3a' }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#1e1e3a' }} />
          <Tooltip
            contentStyle={{ background: '#1a1d2e', border: '1px solid #1e1e3a', borderRadius: 8, color: '#e2e8f0' }}
            formatter={(val) => [`${val}%`, 'Score']}
          />
          <ReferenceLine y={avg} stroke="#64748b" strokeDasharray="5 5" label={{ value: `Avg ${avg.toFixed(1)}%`, fill: '#64748b', fontSize: 10, position: 'right' }} />
          <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6, fill: '#a5b4fc' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
