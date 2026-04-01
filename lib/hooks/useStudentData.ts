'use client';

import { useEffect, useState } from 'react';
import { useStore } from '@/lib/store';
import { backend, intelligence } from '@/lib/api';
import type { StudentRecord, Prediction } from '@/lib/types';

export function useStudentData() {
  const { exam, user, microPreds, setMicroPreds, setUser } = useStore();
  const [student, setStudent] = useState<StudentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const sRes = await backend(`/api/students?exam=${exam}`);
        if (!sRes.ok) throw new Error('Failed to load student data');
        const sData = await sRes.json();
        const students: StudentRecord[] = sData.students || [];

        // Find current student by studentId from JWT or take first
        const me = user?.studentId
          ? students.find(s => s.id === user.studentId) || students[0]
          : students[0];
        if (!cancelled) setStudent(me || null);

        // Hydrate user info into store if not set
        if (me && user && !user.userId.includes('@')) {
          // userId might be the email, keep it
        }

        // Load micro predictions if not cached
        if (!microPreds.length) {
          const examType = exam === 'jee' ? 'jee_main' : 'neet';
          try {
            const pRes = await intelligence(
              `/api/v1/data/predict?exam_type=${examType}&year=2026&level=micro&top_n=200`
            );
            if (pRes.ok) {
              const pData = await pRes.json();
              if (!cancelled) setMicroPreds(pData.predictions || []);
            }
          } catch {
            // Intelligence API might be offline - non-fatal
          }
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [exam]);

  return { student, microPreds, loading, error };
}
