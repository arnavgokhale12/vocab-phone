import {
  WordProgress,
  MasteryLevel,
  MASTERY_THRESHOLDS,
  createDefaultProgress,
} from '../types/wordProgress';
import { getProgress, setProgress, getStats, setStats } from './storage/mmkvStorage';

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
 * Get today's date as YYYY-MM-DD string
 */
function getTodayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Record an answer for a word and update its progress
 */
export function recordAnswer(
  wordId: string,
  isCorrect: boolean
): { progress: WordProgress; wasNewlyMastered: boolean } {
  const progress = getProgress(wordId);
  const previousMastery = progress.masteryLevel;

  // Update counts
  if (isCorrect) {
    progress.correctCount += 1;
    progress.consecutiveCorrect += 1;
  } else {
    progress.incorrectCount += 1;
    progress.consecutiveCorrect = 0; // Reset streak on incorrect
  }

  // Update mastery level
  progress.masteryLevel = calculateMasteryLevel(progress.consecutiveCorrect);
  progress.lastSeenAt = new Date().toISOString();

  // Persist
  setProgress(wordId, progress);

  // Check if newly mastered
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
  const { getAllProgress } = require('./storage/mmkvStorage');
  return getAllProgress();
}
