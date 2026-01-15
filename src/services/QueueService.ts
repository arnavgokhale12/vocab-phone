import { Word } from '../types/word';
import { WordProgress } from '../types/wordProgress';
import { seedWords } from '../data/seedWords';
import { getAllProgress } from './storage/mmkvStorage';

// FNV-1a hash constants
const FNV_PRIME = 0x01000193;
const FNV_OFFSET = 0x811c9dc5;

/**
 * FNV-1a hash function for deterministic seeding
 */
function fnvHash(str: string): number {
  let hash = FNV_OFFSET;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash;
}

/**
 * Seeded shuffle using FNV hash
 */
function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = Math.imul(s, FNV_PRIME) >>> 0;
    const j = s % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Get deterministic daily words based on date seed
 * This preserves the core app behavior: same date = same words
 */
export function getDeterministicDailyWords(date: string, count: number): Word[] {
  const seed = fnvHash(date);
  const shuffled = seededShuffle(seedWords, seed);
  return shuffled.slice(0, count);
}

/**
 * Get today's date as YYYY-MM-DD
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Get words that need review (not mastered, have been seen)
 */
export function getReviewWords(progress: Map<string, WordProgress>): Word[] {
  return seedWords.filter((word) => {
    const p = progress.get(word.id);
    if (!p) return false;
    if (p.masteryLevel === 'mastered') return false;

    // Include if: marked incorrect OR still learning
    return p.incorrectCount > 0 || p.masteryLevel === 'learning';
  });
}

/**
 * Get today's session words, mixing deterministic daily + review queue
 *
 * Priority:
 * 1. Deterministic daily words (not yet mastered)
 * 2. Review words (sorted by oldest lastSeenAt)
 *
 * Total limited to dailyGoal
 */
export function getTodaySessionWords(
  date: string,
  dailyGoal: number
): Word[] {
  const progress = getAllProgress();

  // 1. Get deterministic daily words
  const dailyWords = getDeterministicDailyWords(date, dailyGoal);

  // 2. Filter out already mastered daily words
  const unmasteredDaily = dailyWords.filter((word) => {
    const p = progress.get(word.id);
    return !p || p.masteryLevel !== 'mastered';
  });

  // 3. Get review candidates (not in daily set)
  const dailyIds = new Set(dailyWords.map((w) => w.id));
  const reviewCandidates = getReviewWords(progress).filter(
    (w) => !dailyIds.has(w.id)
  );

  // 4. Sort reviews by oldest first
  const sortedReviews = reviewCandidates.sort((a, b) => {
    const pA = progress.get(a.id)?.lastSeenAt || '';
    const pB = progress.get(b.id)?.lastSeenAt || '';
    return pA.localeCompare(pB);
  });

  // 5. Combine: daily first, then fill with reviews
  const combined = [...unmasteredDaily];
  const remainingSlots = dailyGoal - combined.length;

  if (remainingSlots > 0) {
    combined.push(...sortedReviews.slice(0, remainingSlots));
  }

  return combined.slice(0, dailyGoal);
}

/**
 * Get the next word in queue after current one
 */
export function getNextWord(
  currentWordId: string,
  sessionWords: Word[]
): Word | null {
  const currentIndex = sessionWords.findIndex((w) => w.id === currentWordId);
  if (currentIndex === -1 || currentIndex >= sessionWords.length - 1) {
    return null;
  }
  return sessionWords[currentIndex + 1];
}

/**
 * Check if all session words are mastered
 */
export function isSessionComplete(sessionWords: Word[]): boolean {
  const progress = getAllProgress();
  return sessionWords.every((word) => {
    const p = progress.get(word.id);
    return p?.masteryLevel === 'mastered';
  });
}
