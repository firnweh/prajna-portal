const ZONE_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
  M: { bg: '#0d2e22', text: '#00d4aa', label: 'Mastery' },
  S: { bg: '#1a1a35', text: '#8b7fff', label: 'Strong' },
  D: { bg: '#2e2800', text: '#ffd166', label: 'Developing' },
  W: { bg: '#2e1800', text: '#ff9966', label: 'Weak' },
  C: { bg: '#2e0d0d', text: '#ff6b6b', label: 'Critical' },
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
