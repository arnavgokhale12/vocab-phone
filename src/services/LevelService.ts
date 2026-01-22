/**
 * LevelService - Computes user level and progress based on mastered words.
 *
 * A word is considered "mastered" when numericMasteryLevel == 3.
 */

import { getAllProgress } from './storage/mmkvStorage';
import { LEVELS, LevelDefinition, TOTAL_WORDS } from '../constants/levels';

export interface LevelProgress {
  currentLevel: LevelDefinition;
  nextLevel: LevelDefinition | null;
  masteredCount: number;
  progressToNext: number; // 0-1 progress toward next level
  wordsToNextLevel: number;
  totalWords: number;
  overallMasteryPercent: number;
}

/**
 * Count words with numericMasteryLevel == 3 (fully mastered)
 */
export function getMasteredWordCount(): number {
  const allProgress = getAllProgress();
  let count = 0;

  for (const progress of allProgress.values()) {
    if (progress.numericMasteryLevel === 3) {
      count++;
    }
  }

  return count;
}

/**
 * Get the current level based on mastered word count
 */
export function getCurrentLevel(masteredCount: number): LevelDefinition {
  // Find the highest level the user has achieved
  let currentLevel = LEVELS[0];

  for (const level of LEVELS) {
    if (masteredCount >= level.minMastered) {
      currentLevel = level;
    } else {
      break;
    }
  }

  return currentLevel;
}

/**
 * Get the next level (or null if at max level)
 */
export function getNextLevel(masteredCount: number): LevelDefinition | null {
  for (const level of LEVELS) {
    if (masteredCount < level.minMastered) {
      return level;
    }
  }

  return null; // At max level
}

/**
 * Calculate progress toward next level (0-1)
 */
export function getProgressToNextLevel(masteredCount: number): number {
  const currentLevel = getCurrentLevel(masteredCount);
  const nextLevel = getNextLevel(masteredCount);

  if (!nextLevel) {
    // At max level, show 100%
    return 1;
  }

  const levelRange = nextLevel.minMastered - currentLevel.minMastered;
  const progress = masteredCount - currentLevel.minMastered;

  return Math.min(1, Math.max(0, progress / levelRange));
}

/**
 * Get complete level progress information
 */
export function getLevelProgress(): LevelProgress {
  const masteredCount = getMasteredWordCount();
  const currentLevel = getCurrentLevel(masteredCount);
  const nextLevel = getNextLevel(masteredCount);
  const progressToNext = getProgressToNextLevel(masteredCount);

  const wordsToNextLevel = nextLevel
    ? nextLevel.minMastered - masteredCount
    : 0;

  const overallMasteryPercent = Math.round((masteredCount / TOTAL_WORDS) * 100);

  return {
    currentLevel,
    nextLevel,
    masteredCount,
    progressToNext,
    wordsToNextLevel,
    totalWords: TOTAL_WORDS,
    overallMasteryPercent,
  };
}
