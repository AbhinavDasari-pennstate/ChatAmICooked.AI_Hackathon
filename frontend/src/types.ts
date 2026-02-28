export interface Topic {
  name: string;
  score: number;
  gap: string;
  priority: 'urgent' | 'soon' | 'ok';
}

export interface Question {
  topic: string;
  question: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface StudyDay {
  day: number;
  date: string;
  focus: string;
  tasks: string[];
  hours: number;
}

export interface MismatchWarning {
  message: string;
  reason: string;
}

export interface AnalysisResult {
  overall_score: number;
  topics: Topic[];
  questions: Question[];
  plan: StudyDay[];
  mismatch_warning: MismatchWarning | null;
  // derived on the frontend from overall_score
  exam_topic?: string;
  exam_date?: string;
  days_until_exam?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  message: string;
}
