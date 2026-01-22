// Word mastery and progress tracking types

export type MasteryLevel = 'new' | 'learning' | 'mastered';

export interface WordProgress {
  wordId: string;
  masteryLevel: MasteryLevel;
  correctCount: number;
  incorrectCount: number;
  consecutiveCorrect: number; // streak for mastery calculation
  lastSeenAt: string | null; // ISO date
  nextReviewDate: string | null; // ISO date (for SM-2, v2.1)
  /**
   * Numeric mastery level (0-3) for simpler tracking.
   * Rule: correct +1, incorrect -1, clamped to [0, 3].
   * 0 = new, 1 = learning, 2 = familiar, 3 = mastered
   */
  numericMasteryLevel: number;
}

export interface UserStats {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // ISO date YYYY-MM-DD
  totalWordsReviewed: number;
  totalWordsMastered: number;
  todayReviewedCount: number;
  todayGoalMet: boolean;
}

export interface WidgetState {
  wordId: string;
  term: string;
  definition: string;
  partOfSpeech: string;
}

// Mastery thresholds
export const MASTERY_THRESHOLDS = {
  LEARNING: 1, // 1+ correct to become learning
  MASTERED: 3, // 3+ consecutive correct to become mastered
} as const;

// Default progress for new words
export function createDefaultProgress(wordId: string): WordProgress {
  return {
    wordId,
    masteryLevel: 'new',
    correctCount: 0,
    incorrectCount: 0,
    consecutiveCorrect: 0,
    lastSeenAt: null,
    nextReviewDate: null,
    numericMasteryLevel: 0,
  };
}

// Default stats for new users
export function createDefaultStats(): UserStats {
  return {
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: '',
    totalWordsReviewed: 0,
    totalWordsMastered: 0,
    todayReviewedCount: 0,
    todayGoalMet: false,
  };
}
