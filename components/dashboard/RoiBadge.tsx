export function computeRoi(studentAcc: number | null, prob: number, confidence: number): number {
  if (studentAcc === null) return 0;
  return (1 - studentAcc / 100) * prob * Math.max(confidence, 0.5);
}

const ROI_CONFIG = [
  { min: 0.4, cls: 'bg-[#fef2f2] text-[#dc2626]', label: '⚠ CRITICAL' },
  { min: 0.25, cls: 'bg-[#fff7ed] text-[#d97706]', label: '⚡ FOCUS' },
  { min: 0.1, cls: 'bg-[#eef2ff] text-[#6366f1]', label: '📘 REVIEW' },
  { min: 0, cls: 'bg-[#ecfdf5] text-[#059669]', label: '✓ OK' },
];

export function RoiBadge({ roi }: { roi: number }) {
  const cfg = ROI_CONFIG.find(r => roi >= r.min) || ROI_CONFIG[3];
  return (
    <span className={`text-[0.62rem] font-bold px-2 py-0.5 rounded whitespace-nowrap ${cfg.cls}`}>
      {cfg.label}
    </span>
  );
}

export function roiClass(roi: number): string {
  if (roi > 0.4) return 'critical';
  if (roi > 0.25) return 'focus';
  if (roi > 0.1) return 'review';
  return 'ok';
}
