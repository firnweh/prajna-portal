import { KpiCard } from './KpiCard';

interface Kpi {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  trend?: 'up' | 'down' | null;
}

export function KpiStrip({ items }: { items: Kpi[] }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, 1fr)` }}>
      {items.map((k, i) => <KpiCard key={i} {...k} />)}
    </div>
  );
}
