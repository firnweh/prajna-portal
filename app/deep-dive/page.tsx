'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { useStore } from '@/lib/store';
import { intelligence } from '@/lib/api';

interface TopicItem {
  subject: string;
  chapter: string;
  micro_topic?: string;
}

export default function DeepDivePage() {
  const { exam } = useStore();
  const router = useRouter();
  const [topics, setTopics] = useState<TopicItem[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      const examType = exam === 'jee' ? 'jee_main' : 'neet';
      try {
        const res = await intelligence(`/api/v1/data/topics-list?exam_type=${examType}`);
        if (res.ok) {
          const d = await res.json();
          setTopics(d.topics || []);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [exam]);

  const filtered = useMemo(() => {
    if (!search.trim()) return topics.slice(0, 50);
    const q = search.toLowerCase();
    return topics.filter(t =>
      (t.chapter || '').toLowerCase().includes(q) ||
      (t.micro_topic || '').toLowerCase().includes(q) ||
      (t.subject || '').toLowerCase().includes(q)
    ).slice(0, 50);
  }, [topics, search]);

  const handleSelect = (topic: TopicItem) => {
    const name = topic.micro_topic || topic.chapter;
    router.push(`/deep-dive/${encodeURIComponent(name)}`);
  };

  return (
    <>
      <Header title="PRAJNA - Topic Deep Dive" />
      <div className="p-6 space-y-6 max-w-[1200px]">
        {/* Search */}
        <div className="bg-prajna-card border border-prajna-border rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-prajna-muted mb-3">Search Topics</h3>
          <input
            type="text"
            placeholder="Type to search chapters and micro-topics..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-prajna-bg border border-prajna-border rounded-lg px-4 py-2.5 text-sm text-prajna-text placeholder:text-prajna-muted/50 focus:outline-none focus:border-prajna-accent"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center h-32 text-prajna-muted">Loading topics...</div>
        )}

        {error && (
          <div className="flex items-center justify-center h-32 text-prajna-warn">Intelligence API not available</div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex items-center justify-center h-32 text-prajna-muted">
            {search ? 'No topics match your search' : 'Select a topic to explore'}
          </div>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div className="space-y-1">
            {filtered.map((t, i) => (
              <button
                key={i}
                onClick={() => handleSelect(t)}
                className="w-full flex items-center gap-3 bg-prajna-card border border-prajna-border rounded-lg px-4 py-2.5 hover:border-prajna-accent/50 transition-colors text-left"
              >
                <span className="text-xs text-prajna-muted font-semibold w-20 truncate">{t.subject}</span>
                <span className="text-sm text-prajna-text truncate flex-1">{t.micro_topic || t.chapter}</span>
                <span className="text-xs text-prajna-muted">{t.chapter}</span>
                <span className="text-prajna-accent text-sm">&rarr;</span>
              </button>
            ))}
          </div>
        )}

        {!search && !loading && (
          <p className="text-center text-sm text-prajna-muted">Select a topic to explore its historical frequency, difficulty trends, and sample questions</p>
        )}
      </div>
    </>
  );
}
