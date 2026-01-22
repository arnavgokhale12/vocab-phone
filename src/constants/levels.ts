/**
 * Lexi Levels - Progression system based on mastered words.
 *
 * A word is "mastered" when numericMasteryLevel == 3.
 * Levels are earned by accumulating mastered words.
 */

export type LevelId = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';

export interface LevelDefinition {
  id: LevelId;
  name: string;
  minMastered: number; // Minimum mastered words to reach this level
  color: string;       // Primary color for badges
  icon: string;        // Emoji icon
}

/**
 * Level thresholds based on 100 total words in database.
 * Each level represents meaningful vocabulary progress.
 */
export const LEVELS: LevelDefinition[] = [
  {
    id: 'bronze',
    name: 'Bronze',
    minMastered: 0,
    color: '#CD7F32',
    icon: '🥉',
  },
  {
    id: 'silver',
    name: 'Silver',
    minMastered: 10,
    color: '#C0C0C0',
    icon: '🥈',
  },
  {
    id: 'gold',
    name: 'Gold',
    minMastered: 25,
    color: '#FFD700',
    icon: '🥇',
  },
  {
    id: 'platinum',
    name: 'Platinum',
    minMastered: 50,
    color: '#E5E4E2',
    icon: '💎',
  },
  {
    id: 'diamond',
    name: 'Diamond',
    minMastered: 75,
    color: '#B9F2FF',
    icon: '👑',
  },
];

/**
 * Get level definition by ID
 */
export function getLevelById(id: LevelId): LevelDefinition {
  return LEVELS.find(l => l.id === id) ?? LEVELS[0];
}

/**
 * Get the maximum level (for progress calculations)
 */
export function getMaxLevel(): LevelDefinition {
  return LEVELS[LEVELS.length - 1];
}

/**
 * Total words in the vocabulary database.
 * Used for calculating overall mastery percentage.
 */
export const TOTAL_WORDS = 100;
