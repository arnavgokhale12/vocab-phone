import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { SEED_WORDS } from "../data/seedWords";
import { Word } from "../types/word";
import { getJson, setJson } from "../utils/storage";
import { setSharedString } from "../native/appGroup";

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
    const map = new Map(SEED_WORDS.map(w => [w.id, w]));
    return todaySet.wordIds.map(id => map.get(id)).filter(Boolean) as Word[];
  }, [todaySet]);

  // 🔹 THIS IS THE ONLY NEW LOGIC 🔹
  useEffect(() => {
    const w = todayWords?.[0];
    if (!w) return;

    const text = (w as any).word ?? (w as any).term ?? (w as any).id;
    if (!text) return;

    setSharedString("daily_word", String(text));
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
