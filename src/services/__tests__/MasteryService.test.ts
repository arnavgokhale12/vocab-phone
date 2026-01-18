import { __resetMockStorage } from '../../__mocks__/react-native-mmkv';

// Must import after mocks are set up
jest.mock('react-native-mmkv');

import { recordAnswer, getWordProgress, checkGoalMet, getAllWordProgress } from '../MasteryService';
import { getStats, setStats } from '../storage/mmkvStorage';

describe('MasteryService', () => {
  beforeEach(() => {
    __resetMockStorage();
  });

  describe('recordAnswer', () => {
    it('should create new progress for unknown word', () => {
      const result = recordAnswer('word-1', true);

      expect(result.progress.wordId).toBe('word-1');
      expect(result.progress.correctCount).toBe(1);
      expect(result.progress.consecutiveCorrect).toBe(1);
      expect(result.progress.masteryLevel).toBe('learning');
      expect(result.wasNewlyMastered).toBe(false);
    });

    it('should increment correct count on correct answer', () => {
      recordAnswer('word-1', true);
      const result = recordAnswer('word-1', true);

      expect(result.progress.correctCount).toBe(2);
      expect(result.progress.consecutiveCorrect).toBe(2);
      expect(result.progress.incorrectCount).toBe(0);
    });

    it('should reset consecutive count on incorrect answer', () => {
      recordAnswer('word-1', true);
      recordAnswer('word-1', true);
      const result = recordAnswer('word-1', false);

      expect(result.progress.correctCount).toBe(2);
      expect(result.progress.incorrectCount).toBe(1);
      expect(result.progress.consecutiveCorrect).toBe(0);
      expect(result.progress.masteryLevel).toBe('new');
    });

    it('should mark word as mastered after 3 consecutive correct', () => {
      recordAnswer('word-1', true);
      recordAnswer('word-1', true);
      const result = recordAnswer('word-1', true);

      expect(result.progress.masteryLevel).toBe('mastered');
      expect(result.wasNewlyMastered).toBe(true);
    });

    it('should set lastSeenAt timestamp', () => {
      const result = recordAnswer('word-1', true);

      expect(result.progress.lastSeenAt).toBeTruthy();
      expect(new Date(result.progress.lastSeenAt!).getTime()).toBeCloseTo(Date.now(), -3);
    });

    it('should update total stats', () => {
      recordAnswer('word-1', true);
      const stats = getStats();

      expect(stats.totalWordsReviewed).toBe(1);
      expect(stats.todayReviewedCount).toBe(1);
    });

    it('should increment totalWordsMastered when word is mastered', () => {
      recordAnswer('word-1', true);
      recordAnswer('word-1', true);
      recordAnswer('word-1', true);

      const stats = getStats();
      expect(stats.totalWordsMastered).toBe(1);
    });
  });

  describe('mastery levels', () => {
    it('should be "new" with 0 consecutive correct', () => {
      const result = recordAnswer('word-1', false);
      expect(result.progress.masteryLevel).toBe('new');
    });

    it('should be "learning" with 1-2 consecutive correct', () => {
      const result1 = recordAnswer('word-1', true);
      expect(result1.progress.masteryLevel).toBe('learning');

      const result2 = recordAnswer('word-1', true);
      expect(result2.progress.masteryLevel).toBe('learning');
    });

    it('should be "mastered" with 3+ consecutive correct', () => {
      recordAnswer('word-1', true);
      recordAnswer('word-1', true);
      const result = recordAnswer('word-1', true);
      expect(result.progress.masteryLevel).toBe('mastered');

      // Should stay mastered even with more correct answers
      const result2 = recordAnswer('word-1', true);
      expect(result2.progress.masteryLevel).toBe('mastered');
    });
  });

  describe('streak tracking', () => {
    it('should start streak on first review', () => {
      recordAnswer('word-1', true);
      const stats = getStats();

      expect(stats.currentStreak).toBe(1);
    });

    it('should update lastActiveDate to today', () => {
      recordAnswer('word-1', true);
      const stats = getStats();

      const today = new Date();
      const expectedDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      expect(stats.lastActiveDate).toBe(expectedDate);
    });

    it('should track longest streak', () => {
      // Simulate first day
      recordAnswer('word-1', true);
      let stats = getStats();

      expect(stats.currentStreak).toBe(1);
      expect(stats.longestStreak).toBe(1);

      // Simulate gap (reset and set old date)
      stats.currentStreak = 5;
      stats.longestStreak = 5;
      setStats(stats);

      // Reset streak by simulating a gap day
      stats = getStats();
      stats.lastActiveDate = '2020-01-01'; // Old date
      setStats(stats);

      recordAnswer('word-2', true);
      stats = getStats();

      // Streak should reset but longest should be preserved
      expect(stats.currentStreak).toBe(1);
      expect(stats.longestStreak).toBe(5);
    });
  });

  describe('checkGoalMet', () => {
    it('should return false when no reviews today', () => {
      expect(checkGoalMet(5)).toBe(false);
    });

    it('should return true when goal is met', () => {
      recordAnswer('word-1', true);
      recordAnswer('word-2', true);
      recordAnswer('word-3', true);
      recordAnswer('word-4', true);
      recordAnswer('word-5', true);

      expect(checkGoalMet(5)).toBe(true);
    });

    it('should return false when goal not met', () => {
      recordAnswer('word-1', true);
      recordAnswer('word-2', true);

      expect(checkGoalMet(5)).toBe(false);
    });
  });

  describe('getWordProgress', () => {
    it('should return default progress for unknown word', () => {
      const progress = getWordProgress('unknown-word');

      expect(progress.wordId).toBe('unknown-word');
      expect(progress.masteryLevel).toBe('new');
      expect(progress.correctCount).toBe(0);
    });

    it('should return saved progress for known word', () => {
      recordAnswer('word-1', true);
      recordAnswer('word-1', true);

      const progress = getWordProgress('word-1');

      expect(progress.wordId).toBe('word-1');
      expect(progress.correctCount).toBe(2);
      expect(progress.masteryLevel).toBe('learning');
    });
  });

  describe('getAllWordProgress', () => {
    it('should return empty map when no progress', () => {
      const all = getAllWordProgress();
      expect(all.size).toBe(0);
    });

    it('should return all tracked words', () => {
      recordAnswer('word-1', true);
      recordAnswer('word-2', false);
      recordAnswer('word-3', true);

      const all = getAllWordProgress();

      expect(all.size).toBe(3);
      expect(all.has('word-1')).toBe(true);
      expect(all.has('word-2')).toBe(true);
      expect(all.has('word-3')).toBe(true);
    });
  });
});
