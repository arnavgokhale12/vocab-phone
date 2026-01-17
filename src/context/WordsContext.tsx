import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED_WORDS } from "../data/seedWords";
import { Word } from "../types/word";
import { getJson, setJson } from "../utils/storage";
import { setSharedString, setWidgetQueue } from "../native/appGroup";
import { getAllProgress } from "../services/storage/mmkvStorage";
import { WordProgress } from "../types/wordProgress";

type WordsState = {
  words: Word[];
  todayGoal: number;
  setTodayGoal: (n: number) => void;
  todayWords: Word[];
  todayKey: string;
  refreshTodayIfNeeded: () => Promise<void>;
};

const WordsContext = createContext<WordsState | null>(null);

function yyyyMmDd(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return y + "-" + m + "-" + day;
}

function seededPick(ids: string[], seed: string, n: number) {
  let x = 2166136261;
  for (let i = 0; i < seed.length; i++) x = (x ^ seed.charCodeAt(i)) * 16777619;

  const arr = [...ids];
  for (let i = arr.length - 1; i > 0; i--) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    const j = Math.abs(x) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, n);
}

const MAX_REVIEW_WORDS = 3;

/**
 * Select review words from progress data
 * Prioritizes: lower mastery level, then older lastSeenAt
 */
function selectReviewWords(
  allProgress: Map<string, WordProgress>,
  excludeIds: Set<string>,
  today: string
): string[] {
  const masteryOrder = { new: 0, learning: 1, mastered: 2 };

  const candidates = Array.from(allProgress.values())
    .filter((p) => {
      // Skip mastered words and words already in today's new set
      if (p.masteryLevel === "mastered") return false;
      if (excludeIds.has(p.wordId)) return false;
      // Only include words seen before today
      if (!p.lastSeenAt) return false;
      const seenDate = p.lastSeenAt.split("T")[0];
      if (seenDate >= today) return false;
      return true;
    })
    .sort((a, b) => {
      // Priority: lower mastery first
      const masteryDiff = masteryOrder[a.masteryLevel] - masteryOrder[b.masteryLevel];
      if (masteryDiff !== 0) return masteryDiff;
      // Then: older lastSeenAt first
      const aDate = a.lastSeenAt ?? "";
      const bDate = b.lastSeenAt ?? "";
      return aDate.localeCompare(bDate);
    });

  return candidates.slice(0, MAX_REVIEW_WORDS).map((p) => p.wordId);
}

const STORAGE_KEYS = {
  goal: "vocab.todayGoal",
  today: "vocab.todaySet",
} as const;

type TodaySet = { date: string; wordIds: string[] };

export function WordsProvider({ children }: { children: React.ReactNode }) {
  const [todayGoal, setTodayGoalState] = useState<number>(10);
  const [todaySet, setTodaySet] = useState<TodaySet>({
    date: yyyyMmDd(),
    wordIds: [],
  });

  useEffect(() => {
    (async () => {
      const g = await getJson<number>(STORAGE_KEYS.goal);
      if (g) setTodayGoalState(g);

      const t = await getJson<TodaySet>(STORAGE_KEYS.today);
      if (t) setTodaySet(t);
    })();
  }, []);

  async function setTodayGoal(n: number) {
    setTodayGoalState(n);
    await setJson(STORAGE_KEYS.goal, n);
    await refreshTodayIfNeeded(true);
  }

  async function refreshTodayIfNeeded(force = false) {
    const today = yyyyMmDd();
    if (force || todaySet.date !== today || todaySet.wordIds.length !== todayGoal) {
      const ids = SEED_WORDS.map(w => w.id);
      const picked = seededPick(ids, today, todayGoal);
      const next = { date: today, wordIds: picked };
      setTodaySet(next);
      await setJson(STORAGE_KEYS.today, next);
    }
  }

  useEffect(() => {
    refreshTodayIfNeeded();
  }, [todayGoal]);

  const todayWords = useMemo(() => {
    const wordMap = new Map(SEED_WORDS.map(w => [w.id, w]));
    const newWordIds = new Set(todaySet.wordIds);

    // Get new words for today
    const newWords = todaySet.wordIds.map(id => wordMap.get(id)).filter(Boolean) as Word[];

    // Get review words (words seen before but not mastered)
    const allProgress = getAllProgress();
    const reviewIds = selectReviewWords(allProgress, newWordIds, todaySet.date);
    const reviewWords = reviewIds.map(id => wordMap.get(id)).filter(Boolean) as Word[];

    // Return review words first, then new words
    return [...reviewWords, ...newWords];
  }, [todaySet]);

  // Sync words to widget
  useEffect(() => {
    if (!todayWords || todayWords.length === 0) return;

    const firstWord = todayWords[0];

    // Sync simple daily_word for backward compat
    setSharedString("daily_word", firstWord.term);

    // Sync full word queue for interactive widget
    setWidgetQueue(todayWords);
  }, [todayWords]);

  return (
    <WordsContext.Provider
      value={{
        words: SEED_WORDS,
        todayGoal,
        setTodayGoal,
        todayWords,
        todayKey: todaySet.date,
        refreshTodayIfNeeded,
      }}
    >
      {children}
    </WordsContext.Provider>
  );
}

export function useWords() {
  const ctx = useContext(WordsContext);
  if (!ctx) throw new Error("useWords must be used within WordsProvider");
  return ctx;
}
