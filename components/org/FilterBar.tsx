'use client';
import { useState, useEffect } from 'react';
import type { StudentRecord } from '@/lib/types';

interface Props {
  students: StudentRecord[];
  onFilter: (filtered: StudentRecord[]) => void;
}

export function FilterBar({ students, onFilter }: Props) {
  const [branch, setBranch] = useState('');
  const [city, setCity] = useState('');
  const [target, setTarget] = useState('');
  const [search, setSearch] = useState('');

  const branches = [...new Set(students.map(s => s.coaching))].sort();
  const cities = [...new Set(students.map(s => s.city))].sort();
  const targets = [...new Set(students.map(s => s.target))].sort();

  useEffect(() => {
    const filtered = students.filter(s => {
      if (branch && s.coaching !== branch) return false;
      if (city && s.city !== city) return false;
      if (target && s.target !== target) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.id.toLowerCase().includes(q)) return false;
      }
      return true;
    });
    onFilter(filtered);
  }, [branch, city, target, search, students]);

  function clear() { setBranch(''); setCity(''); setTarget(''); setSearch(''); }

  const selectClass = "bg-prajna-card border border-prajna-border text-prajna-text text-xs px-3 py-2 rounded-lg outline-none focus:border-prajna-accent min-w-[140px]";

  return (
    <div className="flex flex-wrap items-center gap-2 p-3 bg-prajna-surface border border-prajna-border rounded-xl">
      <select value={branch} onChange={e => setBranch(e.target.value)} className={selectClass}>
        <option value="">All Branches</option>
        {branches.map(b => <option key={b} value={b}>{b}</option>)}
      </select>
      <select value={city} onChange={e => setCity(e.target.value)} className={selectClass}>
        <option value="">All Cities</option>
        {cities.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <select value={target} onChange={e => setTarget(e.target.value)} className={selectClass}>
        <option value="">All Targets</option>
        {targets.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <input
        type="text" value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Search name or ID..."
        className="bg-prajna-card border border-prajna-border text-prajna-text text-xs px-3 py-2 rounded-lg outline-none focus:border-prajna-accent min-w-[180px]"
      />
      <button onClick={clear} className="text-xs text-prajna-muted hover:text-prajna-warn border border-prajna-border rounded-lg px-3 py-2 cursor-pointer transition-colors">
        ✕ Clear
      </button>
      <span className="ml-auto text-xs text-prajna-muted">
        {students.length} students
      </span>
    </div>
  );
}
