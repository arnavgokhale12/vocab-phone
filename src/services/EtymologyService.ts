/**
 * EtymologyService - Loads and provides access to structured etymology data.
 * Uses static import to bundle data with the app.
 */

import etymologyData from '../data/etymology.json';
import { EtymologyData, WordEtymology } from '../types/wordContent';

// Type assertion for imported JSON
const ETYMOLOGIES: EtymologyData = etymologyData as EtymologyData;

/**
 * Get structured etymology for a word.
 * Returns null if no etymology exists.
 */
export function getEtymology(wordId: string): WordEtymology | null {
  return ETYMOLOGIES[wordId] ?? null;
}

/**
 * Check if a word has structured etymology data.
 */
export function hasEtymology(wordId: string): boolean {
  return wordId in ETYMOLOGIES;
}

/**
 * Get count of words with etymology data (for analytics/debugging).
 */
export function getEtymologyWordCount(): number {
  return Object.keys(ETYMOLOGIES).length;
}
