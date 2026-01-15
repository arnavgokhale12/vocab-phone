import { MMKV } from 'react-native-mmkv';
import {
  WordProgress,
  UserStats,
  createDefaultProgress,
  createDefaultStats,
} from '../../types/wordProgress';

// Initialize MMKV instance
export const storage = new MMKV({
  id: 'vocab-phone-storage',
});

// Storage keys
const KEYS = {
  PROGRESS: 'word_progress',
  STATS: 'user_stats',
} as const;

// --- Word Progress ---

export function getAllProgress(): Map<string, WordProgress> {
  const json = storage.getString(KEYS.PROGRESS);
  if (!json) return new Map();

  try {
    const obj = JSON.parse(json) as Record<string, WordProgress>;
    return new Map(Object.entries(obj));
  } catch {
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

export function getStats(): UserStats {
  const json = storage.getString(KEYS.STATS);
  if (!json) return createDefaultStats();

  try {
    return JSON.parse(json) as UserStats;
  } catch {
    return createDefaultStats();
  }
}

export function setStats(stats: UserStats): void {
  storage.set(KEYS.STATS, JSON.stringify(stats));
}

// --- Utility ---

export function clearAll(): void {
  storage.clearAll();
}
