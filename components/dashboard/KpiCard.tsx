'use client';

interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string; // hex color for left border
  trend?: 'up' | 'down' | null;
}

export function KpiCard({ label, value, subtitle, color = '#6366f1', trend }: KpiCardProps) {
  return (
    <div
      className="bg-prajna-card border border-prajna-border rounded-xl p-4"
      style={{ borderLeftWidth: 3, borderLeftColor: color }}
    >
      <p className="text-[0.65rem] font-bold uppercase tracking-wider text-prajna-muted mb-1">{label}</p>
      <p className="text-2xl font-extrabold leading-none mb-1" style={{ color }}>{value}</p>
      {subtitle && (
        <p className="text-xs text-prajna-muted">
          {trend === 'up' && <span className="text-prajna-teal mr-1">▲</span>}
          {trend === 'down' && <span className="text-prajna-warn mr-1">▼</span>}
          {subtitle}
        </p>
      )}
    </div>
  );
}
