import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import { WordProgress, UserStats, createDefaultStats } from '../types/wordProgress';
import {
  getAllProgress,
  getStats,
  setStats,
} from '../services/storage/mmkvStorage';
import {
  recordAnswer as recordAnswerService,
  checkGoalMet,
  markGoalMet,
} from '../services/MasteryService';
import { setWidgetStats } from '../native/appGroup';

interface ProgressContextValue {
  // Progress data
  progress: Map<string, WordProgress>;
  stats: UserStats;

  // Actions
  recordAnswer: (wordId: string, isCorrect: boolean) => void;
  refreshProgress: () => void;

  // Computed
  isGoalMet: (dailyGoal: number) => boolean;
  todayProgress: { learned: number; goal: number };
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

interface ProviderProps {
  children: React.ReactNode;
  todayGoal: number;
}

export function ProgressProvider({ children, todayGoal }: ProviderProps) {
  const [progress, setProgress] = useState<Map<string, WordProgress>>(new Map());
  const [stats, setStatsState] = useState<UserStats>(createDefaultStats);

  // Load initial data
  useEffect(() => {
    refreshProgress();
  }, []);

  const refreshProgress = useCallback(() => {
    setProgress(getAllProgress());
    setStatsState(getStats());
  }, []);

  const recordAnswer = useCallback(
    (wordId: string, isCorrect: boolean) => {
      const result = recordAnswerService(wordId, isCorrect);

      // Refresh local state
      refreshProgress();

      // Sync stats to widget
      syncStatsToWidget();

      return result;
    },
    [refreshProgress]
  );

  const isGoalMet = useCallback(
    (dailyGoal: number) => {
      return checkGoalMet(dailyGoal);
    },
    [stats]
  );

  // Sync stats to widget via App Groups
  const syncStatsToWidget = useCallback(() => {
    if (Platform.OS !== 'ios') return;

    const currentStats = getStats();
    setWidgetStats({
      learned: currentStats.todayReviewedCount,
      goal: todayGoal,
      streak: currentStats.currentStreak,
    });
  }, [todayGoal]);

  // Initial sync
  useEffect(() => {
    syncStatsToWidget();
  }, [syncStatsToWidget]);

  const todayProgress = {
    learned: stats.todayReviewedCount,
    goal: todayGoal,
  };

  return (
    <ProgressContext.Provider
      value={{
        progress,
        stats,
        recordAnswer,
        refreshProgress,
        isGoalMet,
        todayProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const ctx = useContext(ProgressContext);
  if (!ctx) {
    throw new Error('useProgress must be used within ProgressProvider');
  }
  return ctx;
}
