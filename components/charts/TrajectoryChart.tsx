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
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="exam" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} />
          <YAxis domain={[0, 100]} tick={{ fill: '#64748b', fontSize: 11 }} axisLine={{ stroke: '#e2e8f0' }} />
          <Tooltip
            contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, color: '#1e293b' }}
            formatter={(val) => [`${val}%`, 'Score']}
          />
          <ReferenceLine y={avg} stroke="#64748b" strokeDasharray="5 5" label={{ value: `Avg ${avg.toFixed(1)}%`, fill: '#64748b', fontSize: 10, position: 'right' }} />
          <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={2.5} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6, fill: '#a5b4fc' }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
