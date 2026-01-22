import { createMMKV } from 'react-native-mmkv';
import {
  WordProgress,
  UserStats,
  createDefaultProgress,
  createDefaultStats,
} from '../../types/wordProgress';
import { DailyQuizStatus, QuizSession } from '../../types/quiz';
import {
  CustomWord,
  CustomList,
  CustomListSettings,
  DEFAULT_MIX_COUNT,
  MAX_MIX_COUNT,
  MAX_WORDS_PER_LIST,
} from '../../types/customList';
import { SessionSummary } from '../../types/sessionSummary';

// Initialize MMKV instance
export const storage = createMMKV({
  id: 'vocab-phone-storage',
});

// Storage keys
const KEYS = {
  PROGRESS: 'word_progress',
  STATS: 'user_stats',
  DAILY_QUIZ_STATUS: 'daily_quiz_status',
  QUIZ_SESSION: 'quiz_session',
  LEARN_SESSION: 'learn_session',
  BOOKMARKS: 'bookmarks',
  PLACEMENT_TEST: 'placement_test',
  WEEKLY_GOALS: 'weekly_goals',
  NOTIFICATION_SETTINGS: 'notification_settings',
  CUSTOM_LISTS: 'custom_lists',
  CUSTOM_LIST_SETTINGS: 'custom_list_settings',
  LAST_SESSION_SUMMARY: 'last_session_summary',
} as const;

// --- Learn Session State ---

export interface LearnSessionState {
  dateKey: string;
  lastIndex: number;
  lastWordId: string | null;
  completed: boolean;
}

// --- Bookmarks ---

export interface BookmarkEntry {
  wordId: string;
  term: string;
  definition: string;
  bookmarkedAt: number;
}

// --- Word Progress ---

/**
 * Validate that a parsed object has the required WordProgress fields
 * Returns a sanitized WordProgress or null if invalid
 * Handles migration for existing users (missing numericMasteryLevel defaults to 0)
 */
function validateWordProgress(wordId: string, data: unknown): WordProgress | null {
  if (!data || typeof data !== 'object') return null;

  const p = data as Partial<WordProgress>;

  // Ensure required fields exist with valid types
  if (typeof p.wordId !== 'string') return null;

  // Validate and clamp numericMasteryLevel to [0, 3]
  let numericMastery = 0;
  if (typeof p.numericMasteryLevel === 'number') {
    numericMastery = Math.max(0, Math.min(3, Math.floor(p.numericMasteryLevel)));
  }

  // Return sanitized object with defaults for missing fields
  return {
    wordId: p.wordId,
    masteryLevel: ['new', 'learning', 'mastered'].includes(p.masteryLevel as string)
      ? (p.masteryLevel as WordProgress['masteryLevel'])
      : 'new',
    correctCount: typeof p.correctCount === 'number' && p.correctCount >= 0 ? p.correctCount : 0,
    incorrectCount: typeof p.incorrectCount === 'number' && p.incorrectCount >= 0 ? p.incorrectCount : 0,
    consecutiveCorrect: typeof p.consecutiveCorrect === 'number' && p.consecutiveCorrect >= 0 ? p.consecutiveCorrect : 0,
    lastSeenAt: typeof p.lastSeenAt === 'string' ? p.lastSeenAt : null,
    nextReviewDate: typeof p.nextReviewDate === 'string' ? p.nextReviewDate : null,
    numericMasteryLevel: numericMastery,
  };
}

export function getAllProgress(): Map<string, WordProgress> {
  const json = storage.getString(KEYS.PROGRESS);
  if (!json) return new Map();

  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    const result = new Map<string, WordProgress>();

    for (const [key, value] of Object.entries(obj)) {
      const validated = validateWordProgress(key, value);
      if (validated) {
        result.set(key, validated);
      }
      // Skip invalid entries silently - they'll be recreated as needed
    }

    return result;
  } catch (e) {
    // Log error for debugging but don't crash
    console.error('Failed to parse word progress from storage:', e);
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

/**
 * Validate that a parsed object has the required UserStats fields
 * Returns a sanitized UserStats or null if invalid
 */
function validateUserStats(data: unknown): UserStats | null {
  if (!data || typeof data !== 'object') return null;

  const s = data as Partial<UserStats>;

  // Return sanitized object with defaults for missing/invalid fields
  return {
    currentStreak: typeof s.currentStreak === 'number' && s.currentStreak >= 0 ? s.currentStreak : 0,
    longestStreak: typeof s.longestStreak === 'number' && s.longestStreak >= 0 ? s.longestStreak : 0,
    lastActiveDate: typeof s.lastActiveDate === 'string' ? s.lastActiveDate : '',
    totalWordsReviewed: typeof s.totalWordsReviewed === 'number' && s.totalWordsReviewed >= 0 ? s.totalWordsReviewed : 0,
    totalWordsMastered: typeof s.totalWordsMastered === 'number' && s.totalWordsMastered >= 0 ? s.totalWordsMastered : 0,
    todayReviewedCount: typeof s.todayReviewedCount === 'number' && s.todayReviewedCount >= 0 ? s.todayReviewedCount : 0,
    todayGoalMet: typeof s.todayGoalMet === 'boolean' ? s.todayGoalMet : false,
  };
}

/**
 * Get today's date as YYYY-MM-DD in local time
 */
function getLocalTodayString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getStats(): UserStats {
  const json = storage.getString(KEYS.STATS);
  if (!json) return createDefaultStats();

  try {
    const parsed = JSON.parse(json);
    const validated = validateUserStats(parsed);
    if (!validated) return createDefaultStats();

    // Check if it's a new day and reset daily counters
    const today = getLocalTodayString();
    if (validated.lastActiveDate && validated.lastActiveDate !== today) {
      // It's a new day - reset daily counters but keep the stats object unchanged in storage
      // The actual reset will happen when recordAnswer is called (preserves streak logic)
      return {
        ...validated,
        todayReviewedCount: 0,
        todayGoalMet: false,
      };
    }

    return validated;
  } catch (e) {
    console.error('Failed to parse user stats from storage:', e);
    return createDefaultStats();
  }
}

export function setStats(stats: UserStats): void {
  storage.set(KEYS.STATS, JSON.stringify(stats));
}

// --- Daily Quiz Status ---

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function getDailyQuizStatus(): DailyQuizStatus | null {
  const json = storage.getString(KEYS.DAILY_QUIZ_STATUS);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as DailyQuizStatus;
    // Reset if it's a new day
    if (parsed.date !== getTodayDateString()) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse daily quiz status:', e);
    return null;
  }
}

export function setDailyQuizStatus(status: DailyQuizStatus): void {
  storage.set(KEYS.DAILY_QUIZ_STATUS, JSON.stringify(status));
}

export function addSeenWord(wordId: string): void {
  const today = getTodayDateString();
  const current = getDailyQuizStatus();

  if (current && current.date === today) {
    // Only add if not already in the list
    if (!current.seenWordIds.includes(wordId)) {
      current.seenWordIds.push(wordId);
      setDailyQuizStatus(current);
    }
  } else {
    // New day, create fresh status
    setDailyQuizStatus({
      date: today,
      seenWordIds: [wordId],
      quizTaken: false,
      quizScore: null,
    });
  }
}

export function getSeenWordIds(): string[] {
  const status = getDailyQuizStatus();
  return status?.seenWordIds ?? [];
}

// --- Quiz Session ---

export function getQuizSession(): QuizSession | null {
  const json = storage.getString(KEYS.QUIZ_SESSION);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as QuizSession;
    // Only return if it's from today
    if (parsed.date !== getTodayDateString()) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse quiz session:', e);
    return null;
  }
}

export function setQuizSession(session: QuizSession): void {
  storage.set(KEYS.QUIZ_SESSION, JSON.stringify(session));
}

export function markQuizComplete(score: number): void {
  const status = getDailyQuizStatus();
  if (status) {
    status.quizTaken = true;
    status.quizScore = score;
    setDailyQuizStatus(status);
  }
}

// --- Learn Session ---

function getLocalDateString(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getLearnSession(): LearnSessionState | null {
  const json = storage.getString(KEYS.LEARN_SESSION);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as LearnSessionState;
    const today = getLocalDateString();
    // Reset if it's a new day
    if (parsed.dateKey !== today) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse learn session:', e);
    return null;
  }
}

export function setLearnSession(state: LearnSessionState): void {
  storage.set(KEYS.LEARN_SESSION, JSON.stringify(state));
}

export function updateLearnSessionIndex(index: number, wordId: string | null): void {
  const today = getLocalDateString();
  const current = getLearnSession();

  if (current && current.dateKey === today && !current.completed) {
    current.lastIndex = index;
    current.lastWordId = wordId;
    setLearnSession(current);
  } else {
    // Create new session for today
    setLearnSession({
      dateKey: today,
      lastIndex: index,
      lastWordId: wordId,
      completed: false,
    });
  }
}

export function markLearnSessionComplete(): void {
  const today = getLocalDateString();
  const current = getLearnSession();

  if (current && current.dateKey === today) {
    current.completed = true;
    setLearnSession(current);
  } else {
    setLearnSession({
      dateKey: today,
      lastIndex: 0,
      lastWordId: null,
      completed: true,
    });
  }
}

export function clearLearnSession(): void {
  storage.remove(KEYS.LEARN_SESSION);
}

// --- Bookmarks ---

function validateBookmarkEntry(data: unknown): BookmarkEntry | null {
  if (!data || typeof data !== 'object') return null;
  const b = data as Partial<BookmarkEntry>;

  if (typeof b.wordId !== 'string' || !b.wordId) return null;
  if (typeof b.term !== 'string') return null;
  if (typeof b.definition !== 'string') return null;

  return {
    wordId: b.wordId,
    term: b.term,
    definition: b.definition,
    bookmarkedAt: typeof b.bookmarkedAt === 'number' ? b.bookmarkedAt : Date.now(),
  };
}

export function getBookmarks(): Map<string, BookmarkEntry> {
  const json = storage.getString(KEYS.BOOKMARKS);
  if (!json) return new Map();

  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    const result = new Map<string, BookmarkEntry>();

    for (const [key, value] of Object.entries(obj)) {
      const validated = validateBookmarkEntry(value);
      if (validated) {
        result.set(key, validated);
      }
    }

    return result;
  } catch (e) {
    console.error('Failed to parse bookmarks:', e);
    return new Map();
  }
}

export function setBookmark(wordId: string, term: string, definition: string): void {
  const all = getBookmarks();
  all.set(wordId, {
    wordId,
    term,
    definition,
    bookmarkedAt: Date.now(),
  });

  const obj = Object.fromEntries(all);
  storage.set(KEYS.BOOKMARKS, JSON.stringify(obj));
}

export function removeBookmark(wordId: string): void {
  const all = getBookmarks();
  all.delete(wordId);

  const obj = Object.fromEntries(all);
  storage.set(KEYS.BOOKMARKS, JSON.stringify(obj));
}

export function isBookmarked(wordId: string): boolean {
  const all = getBookmarks();
  return all.has(wordId);
}

export function toggleBookmark(wordId: string, term: string, definition: string): boolean {
  if (isBookmarked(wordId)) {
    removeBookmark(wordId);
    return false;
  } else {
    setBookmark(wordId, term, definition);
    return true;
  }
}

// --- Placement Test ---

export interface PlacementTestResult {
  hasCompleted: boolean;
  score: number; // 0-10
  estimatedLevel: number; // 1-5
  completedAt: string | null; // ISO timestamp
}

/**
 * Validate PlacementTestResult from storage
 * Returns validated result or default (not completed)
 */
function validatePlacementTestResult(data: unknown): PlacementTestResult {
  if (!data || typeof data !== 'object') {
    return createDefaultPlacementResult();
  }

  const p = data as Partial<PlacementTestResult>;

  return {
    hasCompleted: typeof p.hasCompleted === 'boolean' ? p.hasCompleted : false,
    score: typeof p.score === 'number' && p.score >= 0 && p.score <= 10
      ? Math.floor(p.score)
      : 0,
    estimatedLevel: typeof p.estimatedLevel === 'number' && p.estimatedLevel >= 1 && p.estimatedLevel <= 5
      ? Math.floor(p.estimatedLevel)
      : 3, // Default to middle level
    completedAt: typeof p.completedAt === 'string' ? p.completedAt : null,
  };
}

export function createDefaultPlacementResult(): PlacementTestResult {
  return {
    hasCompleted: false,
    score: 0,
    estimatedLevel: 3, // Default middle level until test is taken
    completedAt: null,
  };
}

export function getPlacementTestResult(): PlacementTestResult {
  const json = storage.getString(KEYS.PLACEMENT_TEST);
  if (!json) return createDefaultPlacementResult();

  try {
    const parsed = JSON.parse(json);
    return validatePlacementTestResult(parsed);
  } catch (e) {
    console.error('Failed to parse placement test result:', e);
    return createDefaultPlacementResult();
  }
}

export function setPlacementTestResult(result: PlacementTestResult): void {
  storage.set(KEYS.PLACEMENT_TEST, JSON.stringify(result));
}

export function hasCompletedPlacementTest(): boolean {
  return getPlacementTestResult().hasCompleted;
}

export function getEstimatedLevel(): number {
  return getPlacementTestResult().estimatedLevel;
}

/**
 * Calculate estimated level from placement test score.
 * Score 0-2: Level 1 (beginner)
 * Score 3-4: Level 2
 * Score 5-6: Level 3
 * Score 7-8: Level 4
 * Score 9-10: Level 5 (advanced)
 */
export function calculateEstimatedLevel(score: number): number {
  if (score <= 2) return 1;
  if (score <= 4) return 2;
  if (score <= 6) return 3;
  if (score <= 8) return 4;
  return 5;
}

export function completePlacementTest(score: number): PlacementTestResult {
  const estimatedLevel = calculateEstimatedLevel(score);
  const result: PlacementTestResult = {
    hasCompleted: true,
    score: Math.max(0, Math.min(10, Math.floor(score))),
    estimatedLevel,
    completedAt: new Date().toISOString(),
  };
  setPlacementTestResult(result);
  return result;
}

// --- Weekly Goals ---

export interface WeeklyGoalState {
  weeklyTargetDays: number; // 1-7, default 5
  dailyCompletions: Record<string, boolean>; // dateKey (YYYY-MM-DD) -> completed
}

function createDefaultWeeklyGoalState(): WeeklyGoalState {
  return {
    weeklyTargetDays: 5,
    dailyCompletions: {},
  };
}

function validateWeeklyGoalState(data: unknown): WeeklyGoalState {
  if (!data || typeof data !== 'object') {
    return createDefaultWeeklyGoalState();
  }

  const w = data as Partial<WeeklyGoalState>;

  const weeklyTargetDays =
    typeof w.weeklyTargetDays === 'number' &&
    w.weeklyTargetDays >= 1 &&
    w.weeklyTargetDays <= 7
      ? Math.floor(w.weeklyTargetDays)
      : 5;

  const dailyCompletions: Record<string, boolean> = {};
  if (w.dailyCompletions && typeof w.dailyCompletions === 'object') {
    for (const [key, value] of Object.entries(w.dailyCompletions)) {
      if (typeof value === 'boolean') {
        dailyCompletions[key] = value;
      }
    }
  }

  return { weeklyTargetDays, dailyCompletions };
}

function getWeeklyGoalState(): WeeklyGoalState {
  const json = storage.getString(KEYS.WEEKLY_GOALS);
  if (!json) return createDefaultWeeklyGoalState();

  try {
    const parsed = JSON.parse(json);
    return validateWeeklyGoalState(parsed);
  } catch (e) {
    console.error('Failed to parse weekly goals:', e);
    return createDefaultWeeklyGoalState();
  }
}

function setWeeklyGoalState(state: WeeklyGoalState): void {
  storage.set(KEYS.WEEKLY_GOALS, JSON.stringify(state));
}

export function getWeeklyTargetDays(): number {
  return getWeeklyGoalState().weeklyTargetDays;
}

export function setWeeklyTargetDays(days: number): void {
  const state = getWeeklyGoalState();
  state.weeklyTargetDays = Math.max(1, Math.min(7, Math.floor(days)));
  setWeeklyGoalState(state);
}

export function getDailyCompletions(): Record<string, boolean> {
  return getWeeklyGoalState().dailyCompletions;
}

export function markDayCompleted(dateKey: string): void {
  const state = getWeeklyGoalState();
  state.dailyCompletions[dateKey] = true;
  setWeeklyGoalState(state);
  pruneOldCompletions();
}

export function isDayCompleted(dateKey: string): boolean {
  const completions = getDailyCompletions();
  return completions[dateKey] === true;
}

/**
 * Get the Monday of the week containing the given date (ISO week starts Monday)
 */
function getWeekStartMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Format date as YYYY-MM-DD in local time
 */
function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface WeekDayData {
  dateKey: string;
  dayName: string;
  completed: boolean;
  isToday: boolean;
  isFuture: boolean;
}

/**
 * Get current week's completion data (Mon-Sun)
 */
export function getCurrentWeekCompletions(): WeekDayData[] {
  const today = new Date();
  const todayKey = formatDateKey(today);
  const monday = getWeekStartMonday(today);
  const completions = getDailyCompletions();

  const dayNames = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const result: WeekDayData[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateKey = formatDateKey(date);

    result.push({
      dateKey,
      dayName: dayNames[i],
      completed: completions[dateKey] === true,
      isToday: dateKey === todayKey,
      isFuture: date > today,
    });
  }

  return result;
}

/**
 * Clean up old completion data (keep last 4 weeks)
 */
export function pruneOldCompletions(): void {
  const state = getWeeklyGoalState();
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const cutoffKey = formatDateKey(fourWeeksAgo);

  const prunedCompletions: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(state.dailyCompletions)) {
    if (key >= cutoffKey) {
      prunedCompletions[key] = value;
    }
  }

  if (Object.keys(prunedCompletions).length !== Object.keys(state.dailyCompletions).length) {
    state.dailyCompletions = prunedCompletions;
    setWeeklyGoalState(state);
  }
}

// --- Notification Settings ---

export interface NotificationSettings {
  enabled: boolean;           // Default false until permission granted
  reminderHour: number;       // 0-23, default 19 (7 PM)
  reminderMinute: number;     // 0-59, default 0
  permissionAsked: boolean;   // Track if we've asked for permission
}

function createDefaultNotificationSettings(): NotificationSettings {
  return {
    enabled: false,
    reminderHour: 19, // 7 PM
    reminderMinute: 0,
    permissionAsked: false,
  };
}

function validateNotificationSettings(data: unknown): NotificationSettings {
  if (!data || typeof data !== 'object') {
    return createDefaultNotificationSettings();
  }

  const n = data as Partial<NotificationSettings>;

  return {
    enabled: typeof n.enabled === 'boolean' ? n.enabled : false,
    reminderHour:
      typeof n.reminderHour === 'number' && n.reminderHour >= 0 && n.reminderHour <= 23
        ? Math.floor(n.reminderHour)
        : 19,
    reminderMinute:
      typeof n.reminderMinute === 'number' && n.reminderMinute >= 0 && n.reminderMinute <= 59
        ? Math.floor(n.reminderMinute)
        : 0,
    permissionAsked: typeof n.permissionAsked === 'boolean' ? n.permissionAsked : false,
  };
}

export function getNotificationSettings(): NotificationSettings {
  const json = storage.getString(KEYS.NOTIFICATION_SETTINGS);
  if (!json) return createDefaultNotificationSettings();

  try {
    const parsed = JSON.parse(json);
    return validateNotificationSettings(parsed);
  } catch (e) {
    console.error('Failed to parse notification settings:', e);
    return createDefaultNotificationSettings();
  }
}

export function setNotificationSettings(settings: NotificationSettings): void {
  storage.set(KEYS.NOTIFICATION_SETTINGS, JSON.stringify(settings));
}

export function setNotificationsEnabled(enabled: boolean): void {
  const settings = getNotificationSettings();
  settings.enabled = enabled;
  setNotificationSettings(settings);
}

export function setReminderTime(hour: number, minute: number): void {
  const settings = getNotificationSettings();
  settings.reminderHour = Math.max(0, Math.min(23, Math.floor(hour)));
  settings.reminderMinute = Math.max(0, Math.min(59, Math.floor(minute)));
  setNotificationSettings(settings);
}

export function hasAskedNotificationPermission(): boolean {
  return getNotificationSettings().permissionAsked;
}

export function markNotificationPermissionAsked(): void {
  const settings = getNotificationSettings();
  settings.permissionAsked = true;
  setNotificationSettings(settings);
}

// --- Custom Lists ---

function validateCustomWord(data: unknown): CustomWord | null {
  if (!data || typeof data !== 'object') return null;
  const w = data as Partial<CustomWord>;

  if (typeof w.id !== 'string' || !w.id) return null;
  if (typeof w.term !== 'string' || !w.term.trim()) return null;
  if (typeof w.definition !== 'string' || !w.definition.trim()) return null;

  return {
    id: w.id,
    term: w.term.trim(),
    definition: w.definition.trim(),
    addedAt: typeof w.addedAt === 'number' ? w.addedAt : Date.now(),
  };
}

function validateCustomList(data: unknown): CustomList | null {
  if (!data || typeof data !== 'object') return null;
  const l = data as Partial<CustomList>;

  if (typeof l.id !== 'string' || !l.id) return null;
  if (typeof l.name !== 'string' || !l.name.trim()) return null;

  const words: CustomWord[] = [];
  if (Array.isArray(l.words)) {
    for (const w of l.words) {
      const validated = validateCustomWord(w);
      if (validated && words.length < MAX_WORDS_PER_LIST) {
        words.push(validated);
      }
    }
  }

  return {
    id: l.id,
    name: l.name.trim(),
    words,
    includeInDaily: typeof l.includeInDaily === 'boolean' ? l.includeInDaily : false,
    createdAt: typeof l.createdAt === 'number' ? l.createdAt : Date.now(),
    updatedAt: typeof l.updatedAt === 'number' ? l.updatedAt : Date.now(),
  };
}

export function getCustomLists(): Map<string, CustomList> {
  const json = storage.getString(KEYS.CUSTOM_LISTS);
  if (!json) return new Map();

  try {
    const obj = JSON.parse(json) as Record<string, unknown>;
    const result = new Map<string, CustomList>();

    for (const [key, value] of Object.entries(obj)) {
      const validated = validateCustomList(value);
      if (validated) {
        result.set(key, validated);
      }
    }

    return result;
  } catch (e) {
    console.error('Failed to parse custom lists:', e);
    return new Map();
  }
}

export function getCustomList(listId: string): CustomList | null {
  const all = getCustomLists();
  return all.get(listId) ?? null;
}

export function saveCustomList(list: CustomList): void {
  const all = getCustomLists();
  list.updatedAt = Date.now();
  all.set(list.id, list);
  storage.set(KEYS.CUSTOM_LISTS, JSON.stringify(Object.fromEntries(all)));
}

export function deleteCustomList(listId: string): void {
  const all = getCustomLists();
  all.delete(listId);
  storage.set(KEYS.CUSTOM_LISTS, JSON.stringify(Object.fromEntries(all)));
}

export function createNewCustomList(name: string): CustomList {
  return {
    id: `list_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: name.trim(),
    words: [],
    includeInDaily: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function addWordToCustomList(listId: string, term: string, definition: string): boolean {
  const list = getCustomList(listId);
  if (!list) return false;
  if (list.words.length >= MAX_WORDS_PER_LIST) return false;

  const newWord: CustomWord = {
    id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    term: term.trim(),
    definition: definition.trim(),
    addedAt: Date.now(),
  };

  list.words.push(newWord);
  saveCustomList(list);
  return true;
}

export function removeWordFromCustomList(listId: string, wordId: string): void {
  const list = getCustomList(listId);
  if (!list) return;

  list.words = list.words.filter(w => w.id !== wordId);
  saveCustomList(list);
}

export function toggleCustomListInDaily(listId: string): boolean {
  const list = getCustomList(listId);
  if (!list) return false;

  list.includeInDaily = !list.includeInDaily;
  saveCustomList(list);
  return list.includeInDaily;
}

export function setCustomListIncludeInDaily(listId: string, include: boolean): void {
  const list = getCustomList(listId);
  if (!list) return;

  list.includeInDaily = include;
  saveCustomList(list);
}

export function getEnabledCustomWords(): CustomWord[] {
  const lists = getCustomLists();
  const result: CustomWord[] = [];

  for (const list of lists.values()) {
    if (list.includeInDaily) {
      result.push(...list.words);
    }
  }

  return result;
}

// --- Custom List Settings ---

function createDefaultCustomListSettings(): CustomListSettings {
  return {
    mixCount: DEFAULT_MIX_COUNT,
  };
}

function validateCustomListSettings(data: unknown): CustomListSettings {
  if (!data || typeof data !== 'object') {
    return createDefaultCustomListSettings();
  }

  const s = data as Partial<CustomListSettings>;

  return {
    mixCount:
      typeof s.mixCount === 'number' && s.mixCount >= 0 && s.mixCount <= MAX_MIX_COUNT
        ? Math.floor(s.mixCount)
        : DEFAULT_MIX_COUNT,
  };
}

export function getCustomListSettings(): CustomListSettings {
  const json = storage.getString(KEYS.CUSTOM_LIST_SETTINGS);
  if (!json) return createDefaultCustomListSettings();

  try {
    const parsed = JSON.parse(json);
    return validateCustomListSettings(parsed);
  } catch (e) {
    console.error('Failed to parse custom list settings:', e);
    return createDefaultCustomListSettings();
  }
}

export function setCustomListMixCount(count: number): void {
  const settings = getCustomListSettings();
  settings.mixCount = Math.max(0, Math.min(MAX_MIX_COUNT, Math.floor(count)));
  storage.set(KEYS.CUSTOM_LIST_SETTINGS, JSON.stringify(settings));
}

export function getCustomListMixCount(): number {
  return getCustomListSettings().mixCount;
}

// --- Session Summary ---

export function getLastSessionSummary(): SessionSummary | null {
  const json = storage.getString(KEYS.LAST_SESSION_SUMMARY);
  if (!json) return null;

  try {
    const parsed = JSON.parse(json) as SessionSummary;
    // Only return if from today (session summaries are ephemeral)
    const today = getLocalTodayString();
    if (parsed.date !== today) {
      return null;
    }
    return parsed;
  } catch (e) {
    console.error('Failed to parse session summary:', e);
    return null;
  }
}

export function setLastSessionSummary(summary: SessionSummary): void {
  storage.set(KEYS.LAST_SESSION_SUMMARY, JSON.stringify(summary));
}

export function clearLastSessionSummary(): void {
  storage.set(KEYS.LAST_SESSION_SUMMARY, '');
}

/**
 * Get word IDs that were first seen today (for determining new vs review)
 */
export function getWordFirstSeenDates(): Map<string, string> {
  const allProgress = getAllProgress();
  const result = new Map<string, string>();

  for (const [wordId, progress] of allProgress.entries()) {
    if (progress.lastSeenAt) {
      // Extract just the date part
      const date = progress.lastSeenAt.split('T')[0];
      result.set(wordId, date);
    }
  }

  return result;
}

// --- Utility ---

export function clearAll(): void {
  storage.clearAll();
}
