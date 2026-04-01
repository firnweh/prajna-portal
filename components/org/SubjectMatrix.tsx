'use client';
import type { StudentRecord } from '@/lib/types';

const ZONE_COLORS: Record<string, { bg: string; text: string }> = {
  M: { bg: '#ecfdf5', text: '#059669' },
  S: { bg: '#eef2ff', text: '#6366f1' },
  D: { bg: '#fefce8', text: '#d97706' },
  W: { bg: '#fff7ed', text: '#ea580c' },
  C: { bg: '#fef2f2', text: '#dc2626' },
};

function zone(pct: number): string {
  if (pct >= 80) return 'M'; if (pct >= 65) return 'S'; if (pct >= 45) return 'D'; if (pct >= 25) return 'W'; return 'C';
}

interface Props {
  students: StudentRecord[];
  subjects: string[];
}

export function SubjectMatrix({ students, subjects }: Props) {
  const branches = [...new Set(students.map(s => s.coaching))].sort();

  const matrix = branches.map(branch => {
    const branchStudents = students.filter(s => s.coaching === branch);
    const cells = subjects.map(subj => {
      const vals = branchStudents
        .filter(s => s.subjects?.[subj])
        .map(s => s.subjects[subj].acc || 0);
      const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
      return { subject: subj, avg, zone: zone(avg) };
    });
    return { branch, cells };
  });

  return (
    <div className="bg-prajna-card border border-prajna-border rounded-xl p-5 overflow-x-auto">
      <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">Subject Health Matrix</h3>
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="text-left text-xs text-prajna-muted font-semibold uppercase tracking-wider py-2 px-3">Branch</th>
            {subjects.map(s => (
              <th key={s} className="text-center text-xs text-prajna-muted font-semibold uppercase tracking-wider py-2 px-3">{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {matrix.map(row => (
            <tr key={row.branch} className="border-t border-prajna-border">
              <td className="py-2 px-3 font-semibold text-prajna-text text-xs">{row.branch}</td>
              {row.cells.map((cell, i) => {
                const colors = ZONE_COLORS[cell.zone] || ZONE_COLORS.D;
                return (
                  <td key={i} className="py-2 px-3 text-center">
                    <span
                      className="text-xs font-bold px-2 py-1 rounded"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {cell.avg.toFixed(0)}% · {cell.zone}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
