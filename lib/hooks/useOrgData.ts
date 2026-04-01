'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { backend, intelligence } from '@/lib/api';
import type { StudentRecord, Prediction, BranchStat } from '@/lib/types';

export function useOrgData() {
  const { exam } = useStore();
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [sRes, pRes] = await Promise.all([
          backend(`/api/students?exam=${exam}`),
          intelligence(`/api/v1/data/predict?exam_type=${exam === 'jee' ? 'jee_main' : 'neet'}&year=2026&level=chapter&top_n=15`).catch(() => null),
        ]);
        if (sRes.ok) {
          const sData = await sRes.json();
          if (!cancelled) setStudents(sData.students || []);
        }
        if (pRes?.ok) {
          const pData = await pRes.json();
          if (!cancelled) setPredictions(pData.predictions || []);
        }
      } catch {} finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [exam]);

  return { students, predictions, loading };
}
