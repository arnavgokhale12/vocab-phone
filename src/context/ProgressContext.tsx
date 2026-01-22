import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import { WordProgress, UserStats, createDefaultStats } from '../types/wordProgress';
import {
  getAllProgress,
  getStats,
  markDayCompleted,
  isDayCompleted,
} from '../services/storage/mmkvStorage';
import {
  recordAnswer as recordAnswerService,
  checkGoalMet,
} from '../services/MasteryService';
import { setWidgetStats } from '../native/appGroup';
import { scheduleDailyReminder } from '../services/NotificationService';

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

  // Mark day as completed when daily goal is met
  useEffect(() => {
    if (todayProgress.goal > 0 && todayProgress.learned >= todayProgress.goal) {
      const today = new Date();
      const dateKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      if (!isDayCompleted(dateKey)) {
        markDayCompleted(dateKey);
      }
    }
  }, [todayProgress.learned, todayProgress.goal]);

  // Reschedule notification when app comes to foreground (streak state may have changed)
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App has come to the foreground - reschedule notification with current streak state
        scheduleDailyReminder();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

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
