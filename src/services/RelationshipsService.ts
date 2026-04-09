/**
 * RelationshipsService - Provides access to word relationship data.
 * Currently a stub (no relationships data bundled).
 */

import { WordRelationships } from '../types/wordContent';

/**
 * Get relationship data for a word (antonyms, word family, etc.).
 * Returns null if no relationships exist.
 */
export function getRelationships(_wordId: string): WordRelationships | null {
  return null;
}

/**
 * Check if a word has relationship data.
 */
export function hasRelationships(_wordId: string): boolean {
  return false;
}
