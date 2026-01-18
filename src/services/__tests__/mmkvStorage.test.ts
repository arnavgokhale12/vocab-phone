import { __resetMockStorage } from '../../__mocks__/react-native-mmkv';

jest.mock('react-native-mmkv');

import {
  getAllProgress,
  getProgress,
  setProgress,
  getStats,
  setStats,
  clearAll,
  storage,
} from '../storage/mmkvStorage';
import { createDefaultProgress, createDefaultStats } from '../../types/wordProgress';

describe('mmkvStorage', () => {
  beforeEach(() => {
    __resetMockStorage();
  });

  describe('Word Progress', () => {
    describe('getProgress', () => {
      it('should return default progress for unknown word', () => {
        const progress = getProgress('unknown-word');

        expect(progress.wordId).toBe('unknown-word');
        expect(progress.masteryLevel).toBe('new');
        expect(progress.correctCount).toBe(0);
        expect(progress.incorrectCount).toBe(0);
        expect(progress.consecutiveCorrect).toBe(0);
        expect(progress.lastSeenAt).toBeNull();
      });

      it('should return stored progress for known word', () => {
        const testProgress = {
          wordId: 'test-word',
          masteryLevel: 'learning' as const,
          correctCount: 5,
          incorrectCount: 2,
          consecutiveCorrect: 2,
          lastSeenAt: '2024-01-15T10:00:00Z',
          nextReviewDate: null,
        };

        setProgress('test-word', testProgress);
        const result = getProgress('test-word');

        expect(result).toEqual(testProgress);
      });
    });

    describe('getAllProgress', () => {
      it('should return empty map when no progress stored', () => {
        const result = getAllProgress();
        expect(result.size).toBe(0);
      });

      it('should return all stored progress', () => {
        setProgress('word-1', createDefaultProgress('word-1'));
        setProgress('word-2', createDefaultProgress('word-2'));

        const result = getAllProgress();

        expect(result.size).toBe(2);
        expect(result.has('word-1')).toBe(true);
        expect(result.has('word-2')).toBe(true);
      });
    });

    describe('data validation', () => {
      it('should handle corrupted JSON gracefully', () => {
        storage.set('word_progress', 'not valid json {{{');

        const result = getAllProgress();
        expect(result.size).toBe(0);
      });

      it('should skip entries with missing wordId', () => {
        storage.set('word_progress', JSON.stringify({
          'word-1': { masteryLevel: 'learning' }, // Missing wordId
          'word-2': { wordId: 'word-2', masteryLevel: 'new' },
        }));

        const result = getAllProgress();
        expect(result.size).toBe(1);
        expect(result.has('word-2')).toBe(true);
      });

      it('should provide defaults for missing fields', () => {
        storage.set('word_progress', JSON.stringify({
          'word-1': { wordId: 'word-1' }, // Only required field
        }));

        const result = getAllProgress();
        const progress = result.get('word-1');

        expect(progress).toBeDefined();
        expect(progress!.masteryLevel).toBe('new');
        expect(progress!.correctCount).toBe(0);
        expect(progress!.consecutiveCorrect).toBe(0);
      });

      it('should fix invalid mastery level', () => {
        storage.set('word_progress', JSON.stringify({
          'word-1': { wordId: 'word-1', masteryLevel: 'invalid' },
        }));

        const result = getAllProgress();
        expect(result.get('word-1')!.masteryLevel).toBe('new');
      });

      it('should fix negative counts', () => {
        storage.set('word_progress', JSON.stringify({
          'word-1': { wordId: 'word-1', correctCount: -5, incorrectCount: 'string' },
        }));

        const result = getAllProgress();
        const progress = result.get('word-1');

        // Due to type check, invalid values get defaults
        expect(progress!.correctCount).toBe(0);
        expect(progress!.incorrectCount).toBe(0);
      });
    });
  });

  describe('User Stats', () => {
    describe('getStats', () => {
      it('should return default stats when no stats stored', () => {
        const stats = getStats();

        expect(stats.currentStreak).toBe(0);
        expect(stats.longestStreak).toBe(0);
        expect(stats.lastActiveDate).toBe('');
        expect(stats.totalWordsReviewed).toBe(0);
        expect(stats.totalWordsMastered).toBe(0);
        expect(stats.todayReviewedCount).toBe(0);
        expect(stats.todayGoalMet).toBe(false);
      });

      it('should return stored stats', () => {
        const testStats = {
          currentStreak: 5,
          longestStreak: 10,
          lastActiveDate: '2024-01-15',
          totalWordsReviewed: 100,
          totalWordsMastered: 50,
          todayReviewedCount: 5,
          todayGoalMet: true,
        };

        setStats(testStats);
        const result = getStats();

        expect(result).toEqual(testStats);
      });
    });

    describe('data validation', () => {
      it('should handle corrupted JSON gracefully', () => {
        storage.set('user_stats', 'not valid json');

        const result = getStats();
        expect(result).toEqual(createDefaultStats());
      });

      it('should provide defaults for missing fields', () => {
        storage.set('user_stats', JSON.stringify({
          currentStreak: 5,
          // Missing other fields
        }));

        const result = getStats();

        expect(result.currentStreak).toBe(5);
        expect(result.longestStreak).toBe(0);
        expect(result.lastActiveDate).toBe('');
        expect(result.totalWordsReviewed).toBe(0);
      });

      it('should fix negative numeric values', () => {
        storage.set('user_stats', JSON.stringify({
          currentStreak: -5,
          longestStreak: -10,
          totalWordsReviewed: -100,
        }));

        const result = getStats();

        expect(result.currentStreak).toBe(0);
        expect(result.longestStreak).toBe(0);
        expect(result.totalWordsReviewed).toBe(0);
      });

      it('should fix invalid boolean values', () => {
        storage.set('user_stats', JSON.stringify({
          todayGoalMet: 'yes',
        }));

        const result = getStats();
        expect(result.todayGoalMet).toBe(false);
      });

      it('should handle null object', () => {
        storage.set('user_stats', 'null');

        const result = getStats();
        expect(result).toEqual(createDefaultStats());
      });
    });
  });

  describe('clearAll', () => {
    it('should clear all stored data', () => {
      setProgress('word-1', createDefaultProgress('word-1'));
      setStats({ ...createDefaultStats(), currentStreak: 5 });

      clearAll();

      expect(getAllProgress().size).toBe(0);
      expect(getStats()).toEqual(createDefaultStats());
    });
  });
});
