export interface WordSessionResult {
  wordId: string;
  term: string;
  definition: string;
  isCorrect: boolean;
  isFirstSeenToday: boolean; // true = new word, false = review word
}

export interface SessionSummary {
  sessionType: 'learn' | 'quiz';
  date: string; // YYYY-MM-DD
  timestamp: number;
  totalWords: number;
  newWords: number;
  reviewWords: number;
  correctCount: number;
  incorrectCount: number;
  accuracy: number; // 0-100
  results: WordSessionResult[];
  weakWords: WeakWord[]; // 1-2 words with lowest accuracy
}

export interface WeakWord {
  wordId: string;
  term: string;
  definition: string;
  reason: 'incorrect' | 'low_accuracy';
}
