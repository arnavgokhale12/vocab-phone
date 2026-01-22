import {
  WordProgress,
  MasteryLevel,
  MASTERY_THRESHOLDS,
} from '../types/wordProgress';
import { getProgress, setProgress, getStats, setStats, getAllProgress } from './storage/mmkvStorage';

/**
 * Calculate mastery level based on consecutive correct answers
 */
function calculateMasteryLevel(consecutiveCorrect: number): MasteryLevel {
  if (consecutiveCorrect >= MASTERY_THRESHOLDS.MASTERED) {
    return 'mastered';
  }
  if (consecutiveCorrect >= MASTERY_THRESHOLDS.LEARNING) {
    return 'learning';
  }
  return 'new';
}

/**
 * Update numeric mastery level (0-3) based on answer correctness.
 *
 * Rule (simple deterministic):
 * - Correct answer: numericMasteryLevel = min(current + 1, 3)
 * - Incorrect answer: numericMasteryLevel = max(current - 1, 0)
 *
 * Levels:
 *   0 = new (never answered correctly)
 *   1 = learning (some correct answers)
 *   2 = familiar (progressing well)
 *   3 = mastered (highest level)
 *
 * @param currentLevel - Current numeric mastery level (0-3)
 * @param isCorrect - Whether the answer was correct
 * @returns Updated numeric mastery level, clamped to [0, 3]
 */
export function updateNumericMastery(currentLevel: number, isCorrect: boolean): number {
  // Ensure current level is valid (handle corrupted data)
  const safeLevel = Math.max(0, Math.min(3, Math.floor(currentLevel || 0)));

  if (isCorrect) {
    return Math.min(safeLevel + 1, 3);
  } else {
    return Math.max(safeLevel - 1, 0);
  }
}

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 * IMPORTANT: Uses local timezone to ensure consistent day boundaries for users
 */
function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Record an answer for a word and update its progress.
 * Updates both string-based masteryLevel (for UI) and numericMasteryLevel (0-3).
 */
export function recordAnswer(
  wordId: string,
  isCorrect: boolean
): { progress: WordProgress; wasNewlyMastered: boolean } {
  const progress = getProgress(wordId);
  const previousMastery = progress.masteryLevel;

  // Update counts (validated to be non-negative)
  if (isCorrect) {
    progress.correctCount = Math.max(0, progress.correctCount) + 1;
    progress.consecutiveCorrect = Math.max(0, progress.consecutiveCorrect) + 1;
  } else {
    progress.incorrectCount = Math.max(0, progress.incorrectCount) + 1;
    progress.consecutiveCorrect = 0; // Reset streak on incorrect
  }

  // Update string-based mastery level (for backward compatibility)
  progress.masteryLevel = calculateMasteryLevel(progress.consecutiveCorrect);

  // Update numeric mastery level (0-3) using simple rule
  progress.numericMasteryLevel = updateNumericMastery(
    progress.numericMasteryLevel,
    isCorrect
  );

  // Update lastSeenAt timestamp
  progress.lastSeenAt = new Date().toISOString();

  // Persist
  setProgress(wordId, progress);

  // Check if newly mastered (string-based for UI)
  const wasNewlyMastered =
    previousMastery !== 'mastered' && progress.masteryLevel === 'mastered';

  // Update global stats
  updateStatsOnReview(wasNewlyMastered);

  return { progress, wasNewlyMastered };
}

/**
 * Update user stats when a word is reviewed
 */
function updateStatsOnReview(wasNewlyMastered: boolean): void {
  const stats = getStats();
  const today = getTodayString();

  // Check if new day
  if (stats.lastActiveDate !== today) {
    // Calculate streak
    if (stats.lastActiveDate) {
      const lastDate = new Date(stats.lastActiveDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor(
        (todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff === 1) {
        // Consecutive day
        stats.currentStreak += 1;
      } else if (daysDiff > 1) {
        // Gap in streak
        stats.currentStreak = 1;
      }
    } else {
      // First ever review
      stats.currentStreak = 1;
    }

    // Reset daily counters
    stats.todayReviewedCount = 0;
    stats.todayGoalMet = false;
    stats.lastActiveDate = today;
  }

  // Increment daily count
  stats.todayReviewedCount += 1;
  stats.totalWordsReviewed += 1;

  // Update mastered count
  if (wasNewlyMastered) {
    stats.totalWordsMastered += 1;
  }

  // Update longest streak
  if (stats.currentStreak > stats.longestStreak) {
    stats.longestStreak = stats.currentStreak;
  }

  setStats(stats);
}

/**
 * Mark today's goal as met
 */
export function markGoalMet(): void {
  const stats = getStats();
  stats.todayGoalMet = true;
  setStats(stats);
}

/**
 * Check if goal is met based on daily goal setting
 */
export function checkGoalMet(dailyGoal: number): boolean {
  const stats = getStats();
  const today = getTodayString();

  // Reset if new day
  if (stats.lastActiveDate !== today) {
    return false;
  }

  return stats.todayReviewedCount >= dailyGoal;
}

/**
 * Get progress for a specific word
 */
export function getWordProgress(wordId: string): WordProgress {
  return getProgress(wordId);
}

/**
 * Get all word progress
 */
export function getAllWordProgress(): Map<string, WordProgress> {
  return getAllProgress();
}
