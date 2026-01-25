// User Profile types for authentication and preferences

export interface UserProfile {
  appleUserId: string | null;
  email: string | null;
  displayName: string | null;
  givenName: string | null;
  familyName: string | null;
  signedInAt: string | null; // ISO timestamp
}

export type PronunciationAccent = 'american' | 'british';
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5; // 1=beginner, 5=advanced

export interface AppPreferences {
  pronunciationAccent: PronunciationAccent;
  autoplayPronunciation: boolean;
  hapticsEnabled: boolean;
  difficultyPreference: DifficultyLevel;
}

export interface AccuracyStats {
  last7Days: {
    correct: number;
    total: number;
    percentage: number;
  };
  lifetime: {
    correct: number;
    total: number;
    percentage: number;
  };
}

export interface ExportData {
  exportedAt: string; // ISO timestamp
  appVersion: string;
  profile: UserProfile | null;
  stats: import('./wordProgress').UserStats;
  preferences: AppPreferences;
  wordProgress: Record<string, import('./wordProgress').WordProgress>;
  bookmarks: Record<string, import('../services/storage/mmkvStorage').BookmarkEntry>;
  customLists: Record<string, import('./customList').CustomList>;
  dailyCompletions: Record<string, boolean>;
  placementTest: import('../services/storage/mmkvStorage').PlacementTestResult;
}

// Default values
export function createDefaultUserProfile(): UserProfile {
  return {
    appleUserId: null,
    email: null,
    displayName: null,
    givenName: null,
    familyName: null,
    signedInAt: null,
  };
}

export function createDefaultAppPreferences(): AppPreferences {
  return {
    pronunciationAccent: 'american',
    autoplayPronunciation: false,
    hapticsEnabled: true,
    difficultyPreference: 3,
  };
}
