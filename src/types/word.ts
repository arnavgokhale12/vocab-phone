export type PartOfSpeech = "noun" | "verb" | "adj" | "adv" | "phrase" | "other";

export type Word = {
  id: string;
  term: string;
  partOfSpeech: PartOfSpeech;
  definition: string;
  example: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
};

export type UserWordProgress = {
  wordId: string;
  status: "new" | "learning" | "reviewing" | "mastered";
  timesSeen: number;
  timesCorrect: number;
  timesIncorrect: number;
  successStreak: number;
  lastReviewedAt?: string;
  nextReviewAt?: string;
  isFavorite: boolean;
  addedAt: string;
};
