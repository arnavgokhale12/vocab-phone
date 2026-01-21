/**
 * Quiz types for End-of-Day Quiz feature
 */

export interface QuizQuestion {
  wordId: string;
  term: string;
  correctDefinition: string;
  options: string[]; // 4 options, shuffled (includes correct)
  correctIndex: number;
}

export interface QuizQuestionResult {
  wordId: string;
  term: string;
  selectedIndex: number;
  correctIndex: number;
  isCorrect: boolean;
}

export interface QuizSession {
  date: string; // YYYY-MM-DD
  questions: QuizQuestion[];
  results: QuizQuestionResult[];
  completedAt: string | null;
  score: number;
  totalQuestions: number;
}

export interface DailyQuizStatus {
  date: string; // YYYY-MM-DD
  seenWordIds: string[];
  quizTaken: boolean;
  quizScore: number | null;
}
