import { create } from 'zustand';
import type { User, Prediction } from './types';

interface PrajnaStore {
  user: User | null;
  exam: 'neet' | 'jee';
  year: number;
  microPreds: Prediction[];
  setUser: (u: User | null) => void;
  setExam: (e: 'neet' | 'jee') => void;
  setYear: (y: number) => void;
  setMicroPreds: (p: Prediction[]) => void;
}

export const useStore = create<PrajnaStore>((set) => ({
  user: null,
  exam: 'neet',
  year: 2026,
  microPreds: [],
  setUser: (user) => set({
    user,
    // Auto-set exam type from student's profile
    ...(user?.exam ? { exam: user.exam === 'jee' ? 'jee' as const : 'neet' as const, microPreds: [] } : {}),
  }),
  setExam: (exam) => set({ exam, microPreds: [] }),
  setYear: (year) => set({ year }),
  setMicroPreds: (microPreds) => set({ microPreds }),
}));
