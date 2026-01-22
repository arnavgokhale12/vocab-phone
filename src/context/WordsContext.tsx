import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED_WORDS } from "../data/seedWords";
import { Word } from "../types/word";
import { getJson, setJson } from "../utils/storage";
import { setSharedString, setWidgetQueue } from "../native/appGroup";
import {
  getAllProgress,
  getEstimatedLevel,
  getEnabledCustomWords,
  getCustomListMixCount,
} from "../services/storage/mmkvStorage";
import { WordProgress } from "../types/wordProgress";
import { CustomWord } from "../types/customList";

type WordsState = {
  words: Word[];
  todayGoal: number;
  setTodayGoal: (n: number) => void;
  todayWords: Word[];
  todayKey: string;
  refreshTodayIfNeeded: (force?: boolean) => Promise<void>;
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

/**
 * Seeded word selection with difficulty bias based on estimated user level.
 *
 * Distribution for estimated level k:
 * - 60% from difficulty k-1 to k+1 (comfort zone)
 * - 30% from difficulty k (exact match)
 * - 10% from difficulty k+2 (stretch words)
 *
 * This keeps selection deterministic (same seed = same words) while
 * biasing toward appropriate difficulty.
 */
function seededPickWithDifficultyBias(
  words: Word[],
  seed: string,
  n: number,
  estimatedLevel: number
): string[] {
  // Create word pools by difficulty proximity to estimated level
  const comfort: Word[] = []; // k-1, k, k+1
  const stretch: Word[] = [];  // k+2
  const other: Word[] = [];    // everything else

  for (const word of words) {
    const diff = word.difficulty - estimatedLevel;
    if (diff >= -1 && diff <= 1) {
      comfort.push(word);
    } else if (diff === 2) {
      stretch.push(word);
    } else {
      other.push(word);
    }
  }

  // Initialize seeded RNG
  let x = 2166136261;
  for (let i = 0; i < seed.length; i++) x = (x ^ seed.charCodeAt(i)) * 16777619;

  // Shuffle each pool deterministically
  const shuffle = (arr: Word[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      const j = Math.abs(x) % (i + 1);
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const shuffledComfort = shuffle(comfort);
  const shuffledStretch = shuffle(stretch);
  const shuffledOther = shuffle(other);

  // Calculate how many to pick from each pool
  // 70% comfort, 20% stretch, 10% other (roughly)
  const comfortCount = Math.ceil(n * 0.7);
  const stretchCount = Math.ceil(n * 0.2);
  const otherCount = n - comfortCount - stretchCount;

  // Pick from each pool
  const result: Word[] = [];

  // Add comfort zone words
  for (let i = 0; i < comfortCount && i < shuffledComfort.length; i++) {
    result.push(shuffledComfort[i]);
  }

  // Add stretch words
  for (let i = 0; i < stretchCount && i < shuffledStretch.length; i++) {
    result.push(shuffledStretch[i]);
  }

  // Add other words if needed
  for (let i = 0; i < otherCount && i < shuffledOther.length; i++) {
    result.push(shuffledOther[i]);
  }

  // If we don't have enough, fill from remaining pools
  const allRemaining = [
    ...shuffledComfort.slice(comfortCount),
    ...shuffledStretch.slice(stretchCount),
    ...shuffledOther.slice(otherCount),
  ];

  for (let i = 0; result.length < n && i < allRemaining.length; i++) {
    result.push(allRemaining[i]);
  }

  // Final shuffle to mix the pools
  const finalResult = shuffle(result.slice(0, n));

  return finalResult.map(w => w.id);
}

const MAX_REVIEW_WORDS = 3;

/**
 * Convert a CustomWord to a Word for use in the learning flow.
 * Custom words get default values for optional fields.
 */
function customWordToWord(cw: CustomWord): Word {
  return {
    id: cw.id,
    term: cw.term,
    definition: cw.definition,
    partOfSpeech: 'other',
    pronunciation: '',
    example: '',
    difficulty: 3,
    tags: ['custom'],
  };
}

/**
 * Seeded shuffle of custom words for deterministic daily selection.
 */
function seededShuffleCustomWords(words: CustomWord[], seed: string): CustomWord[] {
  let x = 2166136261;
  for (let i = 0; i < seed.length; i++) x = (x ^ seed.charCodeAt(i)) * 16777619;

  const arr = [...words];
  for (let i = arr.length - 1; i > 0; i--) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    const j = Math.abs(x) % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

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
      // Get user's estimated level for difficulty-biased selection
      const estimatedLevel = getEstimatedLevel();

      // Get custom list settings
      const mixCount = getCustomListMixCount();
      const enabledCustomWords = getEnabledCustomWords();

      // Calculate how many custom words to include
      const actualMixCount = Math.min(mixCount, enabledCustomWords.length, todayGoal);
      const seedWordCount = todayGoal - actualMixCount;

      // Use difficulty-biased selection for seed words
      const seedWordIds = seededPickWithDifficultyBias(SEED_WORDS, today, seedWordCount, estimatedLevel);

      // Select custom words using seeded shuffle
      const shuffledCustom = seededShuffleCustomWords(enabledCustomWords, today + "_custom");
      const selectedCustomIds = shuffledCustom.slice(0, actualMixCount).map(cw => cw.id);

      // Combine seed word IDs and custom word IDs
      const combinedIds = [...seedWordIds, ...selectedCustomIds];

      const next = { date: today, wordIds: combinedIds };
      setTodaySet(next);
      await setJson(STORAGE_KEYS.today, next);
    }
  }

  useEffect(() => {
    refreshTodayIfNeeded();
  }, [todayGoal]);

  const todayWords = useMemo(() => {
    const seedWordMap = new Map(SEED_WORDS.map(w => [w.id, w]));
    const newWordIds = new Set(todaySet.wordIds);

    // Get enabled custom words for lookup
    const enabledCustomWords = getEnabledCustomWords();
    const customWordMap = new Map(enabledCustomWords.map(cw => [cw.id, customWordToWord(cw)]));

    // Combined word map (seed words + custom words)
    const combinedMap = new Map([...seedWordMap, ...customWordMap]);

    // Get new words for today
    const newWords = todaySet.wordIds.map(id => combinedMap.get(id)).filter(Boolean) as Word[];

    // Get review words (words seen before but not mastered) - only from seed words
    const allProgress = getAllProgress();
    const reviewIds = selectReviewWords(allProgress, newWordIds, todaySet.date);
    const reviewWords = reviewIds.map(id => seedWordMap.get(id)).filter(Boolean) as Word[];

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
