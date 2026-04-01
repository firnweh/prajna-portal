const ZONE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  M: { bg: '#ecfdf5', text: '#059669', label: 'Mastery' },
  S: { bg: '#eef2ff', text: '#6366f1', label: 'Strong' },
  D: { bg: '#fefce8', text: '#d97706', label: 'Developing' },
  W: { bg: '#fff7ed', text: '#ea580c', label: 'Weak' },
  C: { bg: '#fef2f2', text: '#dc2626', label: 'Critical' },
};

export function zone(pct: number): string {
  if (pct >= 80) return 'M';
  if (pct >= 65) return 'S';
  if (pct >= 45) return 'D';
  if (pct >= 25) return 'W';
  return 'C';
}

export function ZoneBadge({ level }: { level: string }) {
  const cfg = ZONE_CONFIG[level] || ZONE_CONFIG.D;
  return (
    <span
      className="text-[0.62rem] font-bold px-2 py-0.5 rounded"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {level} · {cfg.label}
    </span>
  );
}
