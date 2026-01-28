/**
 * Types for word examples and relationships.
 * These are stored in separate JSON files and loaded on demand.
 */

/**
 * Word family member - a related form of a word
 */
export interface WordFamilyMember {
  term: string;
  partOfSpeech: string;
}

/**
 * Complete relationship data for a word
 */
export interface WordRelationships {
  antonyms?: string[];
  wordFamily?: WordFamilyMember[];
  etymology?: string;
  roots?: string[];
}

/**
 * Examples data keyed by wordId
 */
export type ExamplesData = Record<string, string[]>;

/**
 * Relationships data keyed by wordId
 */
export type RelationshipsData = Record<string, WordRelationships>;

/**
 * A single etymological root component
 */
export interface EtymologicalRoot {
  root: string;
  language: string;
  literalMeaning: string;
}

/**
 * Structured etymology data for a word
 */
export interface WordEtymology {
  languageOfOrigin: string;
  roots: EtymologicalRoot[];
  evolution: string;
  enteredEnglish: string;
  plainEnglishSummary: string;
}

/**
 * Etymology data keyed by wordId
 */
export type EtymologyData = Record<string, WordEtymology>;
