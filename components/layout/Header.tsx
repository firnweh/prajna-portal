'use client';

import { useStore } from '@/lib/store';

export function Header({ title }: { title: string }) {
  const { exam, setExam } = useStore();

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-prajna-border bg-prajna-surface/80 backdrop-blur-sm sticky top-0 z-50">
      <h2 className="text-sm font-bold text-prajna-text tracking-wide">{title}</h2>
      <div className="flex border border-prajna-border rounded-lg overflow-hidden">
        <button
          onClick={() => setExam('neet')}
          className={`px-3 py-1 text-xs font-bold tracking-wider transition-colors cursor-pointer ${
            exam === 'neet' ? 'bg-prajna-accent text-white' : 'text-prajna-muted hover:text-prajna-text'
          }`}
        >
          NEET
        </button>
        <button
          onClick={() => setExam('jee')}
          className={`px-3 py-1 text-xs font-bold tracking-wider transition-colors cursor-pointer ${
            exam === 'jee' ? 'bg-prajna-accent text-white' : 'text-prajna-muted hover:text-prajna-text'
          }`}
        >
          JEE
        </button>
      </div>
    </header>
  );
}
