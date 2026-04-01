export interface User {
  userId: string;
  role: 'student' | 'center' | 'central';
  branch: string | null;
  studentId: string | null;
  exam: string | null;
}

export interface StudentRecord {
  id: string;
  name: string;
  coaching: string;
  city: string;
  target: string;
  metrics: {
    avg_percentage: number;
    best_percentage: number;
    improvement: number;
    consistency_score: number;
    latest_percentage: number;
    trajectory: number[];
    best_rank?: number;
    latest_rank?: number;
  };
  abilities?: Record<string, number>;
  subjects: Record<string, { acc: number }>;
  chapters: Record<string, [number, string, number]>;
  slm_focus?: Array<{
    chapter: string;
    accuracy: number;
    level: string;
    slm_importance: number;
    slm_priority_score: number;
  }>;
}

export interface Prediction {
  chapter: string;
  subject: string;
  micro_topic?: string;
  appearance_probability: number;
  expected_questions: number;
  confidence_score: number;
  trend_direction: string;
  signal_breakdown?: Record<string, number>;
  reasons?: string[];
  syllabus_status?: string;
}

export interface BranchStat {
  branch: string;
  count: number;
  avg_score: number;
  avg_improvement: number;
  at_risk: number;
}
