import { NativeModules, Platform } from "react-native";
import { Word } from "../types/word";

const MOD = NativeModules.AppGroupStore;

export function setSharedString(key: string, value: string) {
  if (Platform.OS !== "ios") return;
  MOD?.setString?.(key, value);
}

export async function getSharedString(key: string): Promise<string | null> {
  if (Platform.OS !== "ios") return null;
  if (!MOD?.getString) return null;
  return (await MOD.getString(key)) ?? null;
}

/**
 * Set widget state with current word info for interactive widget
 */
export function setWidgetState(word: Word) {
  if (Platform.OS !== "ios") return;

  const state = {
    wordId: word.id,
    term: word.term,
    definition: word.definition,
    partOfSpeech: word.partOfSpeech,
    pronunciation: word.pronunciation,
    synonyms: word.synonyms ?? [],
  };

  MOD?.setString?.("widget_current_word", JSON.stringify(state));
}

/**
 * Set the word queue for the widget to cycle through
 */
export function setWidgetQueue(words: Word[]) {
  if (Platform.OS !== "ios") return;

  const queue = words.map((w) => ({
    wordId: w.id,
    term: w.term,
    definition: w.definition,
    partOfSpeech: w.partOfSpeech,
    pronunciation: w.pronunciation,
    synonyms: w.synonyms ?? [],
  }));

  MOD?.setString?.("widget_word_queue", JSON.stringify(queue));

  // Also set the first word as current
  if (words.length > 0) {
    setWidgetState(words[0]);
  }
}

/**
 * Set widget stats for progress display
 */
export function setWidgetStats(stats: {
  learned: number;
  goal: number;
  streak: number;
}) {
  if (Platform.OS !== "ios") return;

  MOD?.setString?.("widget_stats", JSON.stringify(stats));
}
