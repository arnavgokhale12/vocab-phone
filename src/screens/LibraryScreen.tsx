import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SEED_WORDS } from '../data/seedWords';
import { Word } from '../types/word';
import { MasteryLevel } from '../types/wordProgress';
import { getAllProgress, isBookmarked } from '../services/storage/mmkvStorage';
import { GradientBackground, GlassCard, MasteryBadge } from '../components';
import { colors, typography, spacing, borderRadius, glassmorphism } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Library'>;

type FilterType = 'all' | 'bookmarked' | 'needs_work' | 'mastered';

interface EnrichedWord extends Word {
  numericMasteryLevel: number;
  masteryLevel: MasteryLevel;
  correctCount: number;
  incorrectCount: number;
  lastSeenAt: string | null;
  nextReviewDate: string | null;
  totalAttempts: number;
  accuracy: number;
  hasProgress: boolean;
  isBookmarked: boolean;
}

const FILTERS: { key: FilterType; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'bookmarked', label: 'Bookmarked' },
  { key: 'needs_work', label: 'Needs Work' },
  { key: 'mastered', label: 'Mastered' },
];

function getEnrichedWords(): EnrichedWord[] {
  const allProgress = getAllProgress();

  return SEED_WORDS.map((word) => {
    const progress = allProgress.get(word.id);
    const correctCount = progress?.correctCount ?? 0;
    const incorrectCount = progress?.incorrectCount ?? 0;
    const totalAttempts = correctCount + incorrectCount;

    return {
      ...word,
      numericMasteryLevel: progress?.numericMasteryLevel ?? 0,
      masteryLevel: progress?.masteryLevel ?? 'new',
      correctCount,
      incorrectCount,
      lastSeenAt: progress?.lastSeenAt ?? null,
      nextReviewDate: progress?.nextReviewDate ?? null,
      totalAttempts,
      accuracy: totalAttempts > 0 ? correctCount / totalAttempts : 0,
      hasProgress: totalAttempts > 0,
      isBookmarked: isBookmarked(word.id),
    };
  });
}

function filterWords(words: EnrichedWord[], filter: FilterType): EnrichedWord[] {
  switch (filter) {
    case 'bookmarked':
      return words.filter((w) => w.isBookmarked);
    case 'needs_work':
      // numericMasteryLevel 0-1 OR accuracy < 50% (with attempts)
      return words.filter(
        (w) =>
          w.numericMasteryLevel <= 1 ||
          (w.totalAttempts > 0 && w.accuracy < 0.5)
      );
    case 'mastered':
      return words.filter((w) => w.numericMasteryLevel === 3);
    default:
      return words;
  }
}

function formatLastSeen(dateStr: string | null): string {
  if (!dateStr) return 'Never';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

export default function LibraryScreen({ navigation }: Props) {
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [words, setWords] = useState<EnrichedWord[]>([]);

  useFocusEffect(
    useCallback(() => {
      setWords(getEnrichedWords());
    }, [])
  );

  const filteredWords = useMemo(
    () => filterWords(words, activeFilter),
    [words, activeFilter]
  );

  const renderWordCard = ({ item }: { item: EnrichedWord }) => (
    <TouchableOpacity
      style={styles.wordCard}
      activeOpacity={0.7}
      onPress={() => navigation.navigate('WordDetail', { wordId: item.id })}
    >
      <View style={styles.wordCardContent}>
        <View style={styles.wordCardLeft}>
          <Text style={styles.wordTerm}>{item.term}</Text>
          <Text style={styles.wordLastSeen}>
            {formatLastSeen(item.lastSeenAt)}
          </Text>
        </View>
        <View style={styles.wordCardRight}>
          <MasteryBadge level={item.numericMasteryLevel} />
          {item.hasProgress && (
            <Text style={styles.accuracyText}>
              {Math.round(item.accuracy * 100)}%
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <GradientBackground>
      <View style={styles.container}>
        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter.key;
            return (
              <TouchableOpacity
                key={filter.key}
                style={[styles.filterChip, isActive && styles.filterChipActive]}
                onPress={() => setActiveFilter(filter.key)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isActive && styles.filterChipTextActive,
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Word Count */}
        <Text style={styles.wordCount}>
          {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''}
        </Text>

        {/* Word List */}
        {filteredWords.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {activeFilter === 'bookmarked'
                ? 'No bookmarked words yet'
                : activeFilter === 'mastered'
                ? 'No mastered words yet'
                : activeFilter === 'needs_work'
                ? 'No words need work'
                : 'No words found'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredWords}
            renderItem={renderWordCard}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xxl + spacing.xl,
  },
  filterContainer: {
    maxHeight: 44,
    marginBottom: spacing.md,
  },
  filterContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    ...glassmorphism.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  filterChipActive: {
    backgroundColor: colors.accentPurple,
    borderColor: colors.accentPurple,
  },
  filterChipText: {
    ...typography.label,
    color: colors.textSecondary,
  },
  filterChipTextActive: {
    color: colors.text,
    fontWeight: '600',
  },
  wordCount: {
    ...typography.label,
    color: colors.textMuted,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  wordCard: {
    ...glassmorphism.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  wordCardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wordCardLeft: {
    flex: 1,
  },
  wordCardRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  wordTerm: {
    ...typography.h3,
    color: colors.text,
    marginBottom: 2,
  },
  wordLastSeen: {
    ...typography.caption,
    color: colors.textMuted,
  },
  accuracyText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
