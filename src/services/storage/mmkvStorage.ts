import { createMMKV } from 'react-native-mmkv';
import {
  WordProgress,
  UserStats,
  createDefaultProgress,
  createDefaultStats,
} from '../../types/wordProgress';
import { DailyQuizStatus, QuizSession } from '../../types/quiz';

// Initialize MMKV instance
export const storage = createMMKV({
  id: 'vocab-phone-storage',
});

// Storage keys
const KEYS = {
  PROGRESS: 'word_progress',
  STATS: 'user_stats',
  DAILY_QUIZ_STATUS: 'daily_quiz_status',
  QUIZ_SESSION: 'quiz_session',
} as const;

// --- Word Progress ---

/**
 * Validate that a parsed object has the required WordProgress fields
 * Returns a sanitized WordProgress or null if invalid
 */
function validateWordProgress(wordId: string, data: unknown): WordProgress | null {
  if (!data || typeof data !== 'object') return null;

  const p = data as Partial<WordProgress>;

  // Ensure required fields exist with valid types
  if (typeof p.wordId !== 'string') return null;

  // Return sanitized object with defaults for missing fields
  return {
    wordId: p.wordId,
    masteryLevel: ['new', 'learning', 'mastered'].includes(p.masteryLevel as string)
      ? (p.masteryLevel as WordProgress['masteryLevel'])
      : 'new',
    correctCount: typeof p.correctCount === 'number' && p.correctCount >= 0 ? p.correctCount : 0,
    incorrectCount: typeof p.incorrectCount === 'number' && p.incorrectCount >= 0 ? p.incorrectCount : 0,
    consecutiveCorrect: typeof p.consecutiveCorrect === 'number' && p.consecutiveCorrect >= 0 ? p.consecutiveCorrect : 0,
    lastSeenAt: typeof p.lastSeenAt === 'string' ? p.lastSeenAt : null,
    nextReviewDate: typeof p.nextReviewDate === 'string' ? p.nextReviewDate : null,
  };
}

export function getAllProgress(): Map<string, WordProgress> {
  const json = storage.getString(KEYS.PROGRESS);
  if (!json) return new Map();

  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    const result = new Map<string, WordProgress>();

    for (const [key, value] of Object.entries(obj)) {
      const validated = validateWordProgress(key, value);
      if (validated) {
        result.set(key, validated);
      }
      // Skip invalid entries silently - they'll be recreated as needed
    }

    return result;
  } catch (e) {
    // Log error for debugging but don't crash
    console.error('Failed to parse word progress from storage:', e);
    return new Map();
  }
}

export function getProgress(wordId: string): WordProgress {
  const all = getAllProgress();
  return all.get(wordId) ?? createDefaultProgress(wordId);
}

export function setProgress(wordId: string, progress: WordProgress): void {
  const all = getAllProgress();
  all.set(wordId, progress);

  const obj = Object.fromEntries(all);
  storage.set(KEYS.PROGRESS, JSON.stringify(obj));
}

export function setAllProgress(progressMap: Map<string, WordProgress>): void {
  const obj = Object.fromEntries(progressMap);
  storage.set(KEYS.PROGRESS, JSON.stringify(obj));
}

// --- User Stats ---

/**
 * Validate that a parsed object has the required UserStats fields
 * Returns a sanitized UserStats or null if invalid
 */
function validateUserStats(data: unknown): UserStats | null {
  if (!data || typeof data !== 'object') return null;

  const s = data as Partial<UserStats>;

  // Return sanitized object with defaults for missing/invalid fields
  return {
    currentStreak: typeof s.currentStreak === 'number' && s.currentStreak >= 0 ? s.currentStreak : 0,
    longestStreak: typeof s.longestStreak === 'number' && s.longestStreak >= 0 ? s.longestStreak : 0,
    lastActiveDate: typeof s.lastActiveDate === 'string' ? s.lastActiveDate : '',
    totalWordsReviewed: typeof s.totalWordsReviewed === 'number' && s.totalWordsReviewed >= 0 ? s.totalWordsReviewed : 0,
    totalWordsMastered: typeof s.totalWordsMastered === 'number' && s.totalWordsMastered >= 0 ? s.totalWordsMastered : 0,
    todayReviewedCount: typeof s.todayReviewedCount === 'number' && s.todayReviewedCount >= 0 ? s.todayReviewedCount : 0,
    todayGoalMet: typeof s.todayGoalMet === 'boolean' ? s.todayGoalMet : false,
  };
}

export function getStats(): UserStats {
  const json = storage.getString(KEYS.STATS);
  if (!json) return createDefaultStats();

  try {
    const parsed = JSON.parse(json);
    const validated = validateUserStats(parsed);
    return validated ?? createDefaultStats();
  } catch (e) {
    console.error('Failed to parse user stats from storage:', e);
    return createDefaultStats();
  }
}

export function setStats(stats: UserStats): void {
  storage.set(KEYS.STATS, JSON.stringify(stats));
}

// --- Daily Quiz Status ---

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyQuizStatus(): DailyQuizStatus | null {
  const json = storage.getString(KEYS.DAILY_QUIZ_STATUS);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as DailyQuizStatus;
    // Reset if it's a new day
    if (parsed.date !== getTodayDateString()) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse daily quiz status:', e);
    return null;
  }
}

export function setDailyQuizStatus(status: DailyQuizStatus): void {
  storage.set(KEYS.DAILY_QUIZ_STATUS, JSON.stringify(status));
}

export function addSeenWord(wordId: string): void {
  const today = getTodayDateString();
  const current = getDailyQuizStatus();

  if (current && current.date === today) {
    // Only add if not already in the list
    if (!current.seenWordIds.includes(wordId)) {
      current.seenWordIds.push(wordId);
      setDailyQuizStatus(current);
    }
  } else {
    // New day, create fresh status
    setDailyQuizStatus({
      date: today,
      seenWordIds: [wordId],
      quizTaken: false,
      quizScore: null,
    });
  }
}

export function getSeenWordIds(): string[] {
  const status = getDailyQuizStatus();
  return status?.seenWordIds ?? [];
}

// --- Quiz Session ---

export function getQuizSession(): QuizSession | null {
  const json = storage.getString(KEYS.QUIZ_SESSION);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as QuizSession;
    // Only return if it's from today
    if (parsed.date !== getTodayDateString()) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse quiz session:', e);
    return null;
  }
}

export function setQuizSession(session: QuizSession): void {
  storage.set(KEYS.QUIZ_SESSION, JSON.stringify(session));
}

export function markQuizComplete(score: number): void {
  const status = getDailyQuizStatus();
  if (status) {
    status.quizTaken = true;
    status.quizScore = score;
    setDailyQuizStatus(status);
  }
}

// --- Utility ---

export function clearAll(): void {
  storage.clearAll();
}
