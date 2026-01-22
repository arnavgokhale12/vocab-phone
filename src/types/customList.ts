export interface CustomWord {
  id: string;
  term: string;
  definition: string;
  addedAt: number;
}

export interface CustomList {
  id: string;
  name: string;
  words: CustomWord[];
  includeInDaily: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface CustomListSettings {
  mixCount: number; // 0-5, default 2
}

export const MAX_WORDS_PER_LIST = 20;
export const DEFAULT_MIX_COUNT = 2;
export const MAX_MIX_COUNT = 5;
