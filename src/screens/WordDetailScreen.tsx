import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Speech from 'expo-speech';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SEED_WORDS } from '../data/seedWords';
import { Word } from '../types/word';
import { WordRelationships, WordEtymology } from '../types/wordContent';
import { getProgress, isBookmarked, toggleBookmark } from '../services/storage/mmkvStorage';
import { getExamples, hasExamples } from '../services/ExamplesService';
import { getRelationships, hasRelationships } from '../services/RelationshipsService';
import { getEtymology, hasEtymology } from '../services/EtymologyService';
import { WordProgress } from '../types/wordProgress';
import {
  GradientBackground,
  GlassCard,
  CapsuleBadge,
  MasteryBadge,
  HighlightedExample,
  RelatedTermPill,
  EtymologyCard,
} from '../components';
import {
  colors,
  typography,
  spacing,
  borderRadius,
  glassmorphism,
} from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'WordDetail'>;

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';

  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatRelativeDate(dateStr: string | null): string {
  if (!dateStr) return 'Never';

  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return formatDate(dateStr);
}

export default function WordDetailScreen({ route }: Props) {
  const { wordId } = route.params;
  const [word, setWord] = useState<Word | null>(null);
  const [progress, setProgress] = useState<WordProgress | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [examples, setExamples] = useState<string[]>([]);
  const [relationships, setRelationships] = useState<WordRelationships | null>(null);
  const [etymology, setEtymology] = useState<WordEtymology | null>(null);
  const [showAllExamples, setShowAllExamples] = useState(false);

  useEffect(() => {
    const foundWord = SEED_WORDS.find((w) => w.id === wordId);
    setWord(foundWord ?? null);

    if (foundWord) {
      setProgress(getProgress(foundWord.id));
      setBookmarked(isBookmarked(foundWord.id));

      // Load examples and relationships
      if (hasExamples(foundWord.id)) {
        setExamples(getExamples(foundWord.id));
      } else {
        setExamples([]);
      }

      if (hasRelationships(foundWord.id)) {
        setRelationships(getRelationships(foundWord.id));
      } else {
        setRelationships(null);
      }

      if (hasEtymology(foundWord.id)) {
        setEtymology(getEtymology(foundWord.id));
      } else {
        setEtymology(null);
      }
    }
  }, [wordId]);

  const handleToggleBookmark = () => {
    if (word) {
      const newState = toggleBookmark(word.id, word.term, word.definition);
      setBookmarked(newState);
    }
  };

  const speakWord = () => {
    if (word) {
      Speech.speak(word.term, {
        language: 'en-US',
        rate: 0.8,
        pitch: 1.0,
      });
    }
  };

  if (!word) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>Word not found</Text>
          </GlassCard>
        </View>
      </GradientBackground>
    );
  }

  const correctCount = progress?.correctCount ?? 0;
  const incorrectCount = progress?.incorrectCount ?? 0;
  const totalAttempts = correctCount + incorrectCount;
  const accuracy = totalAttempts > 0 ? (correctCount / totalAttempts) * 100 : 0;

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Word Header */}
        <GlassCard elevated style={styles.wordCard}>
          <View style={styles.headerRow}>
            <CapsuleBadge label={word.partOfSpeech} />
            <MasteryBadge
              level={progress?.numericMasteryLevel ?? 0}
              size="medium"
            />
          </View>

          <Text style={styles.term}>{word.term}</Text>

          <View style={styles.pronunciationRow}>
            <Text style={styles.pronunciation}>{word.pronunciation}</Text>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={speakWord}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-high" size={20} color={colors.accentBlue} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={handleToggleBookmark}
              activeOpacity={0.7}
            >
              <Ionicons
                name={bookmarked ? 'heart' : 'heart-outline'}
                size={20}
                color={bookmarked ? colors.accentPurple : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.definitionContainer}>
            <Text style={styles.definition}>{word.definition}</Text>
          </View>

          <View style={styles.exampleContainer}>
            <Text style={styles.example}>"{word.example}"</Text>
          </View>

          {word.synonyms && word.synonyms.length > 0 && (
            <View style={styles.relatedTermsContainer}>
              <Text style={styles.relatedTermsLabel}>Similar:</Text>
              <View style={styles.relatedTermsList}>
                {word.synonyms.map((synonym, index) => (
                  <RelatedTermPill key={index} term={synonym} variant="synonym" />
                ))}
              </View>
            </View>
          )}

          {relationships?.antonyms && relationships.antonyms.length > 0 && (
            <View style={styles.relatedTermsContainer}>
              <Text style={styles.relatedTermsLabel}>Opposite:</Text>
              <View style={styles.relatedTermsList}>
                {relationships.antonyms.map((antonym, index) => (
                  <RelatedTermPill key={index} term={antonym} variant="antonym" />
                ))}
              </View>
            </View>
          )}

          {relationships?.wordFamily && relationships.wordFamily.length > 0 && (
            <View style={styles.relatedTermsContainer}>
              <Text style={styles.relatedTermsLabel}>Word Family:</Text>
              <View style={styles.relatedTermsList}>
                {relationships.wordFamily.map((member, index) => (
                  <RelatedTermPill
                    key={index}
                    term={member.term}
                    partOfSpeech={member.partOfSpeech}
                    variant="family"
                  />
                ))}
              </View>
            </View>
          )}
        </GlassCard>

        {/* Examples */}
        {examples.length > 0 && (
          <GlassCard style={styles.examplesCard}>
            <Text style={styles.sectionTitle}>Examples</Text>
            {(showAllExamples ? examples : examples.slice(0, 2)).map(
              (ex, index) => (
                <HighlightedExample
                  key={index}
                  sentence={ex}
                  targetWord={word.term}
                />
              ),
            )}
            {examples.length > 2 && (
              <TouchableOpacity
                onPress={() => setShowAllExamples(!showAllExamples)}
                activeOpacity={0.7}
              >
                <Text style={styles.showMoreText}>
                  {showAllExamples
                    ? 'Show less'
                    : `Show all ${examples.length} examples`}
                </Text>
              </TouchableOpacity>
            )}
          </GlassCard>
        )}

        {/* Etymology */}
        {etymology && (
          <GlassCard style={styles.etymologyCard}>
            <EtymologyCard etymology={etymology} />
          </GlassCard>
        )}

        {/* Stats Card */}
        <GlassCard style={styles.statsCard}>
          <Text style={styles.statsTitle}>Statistics</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {totalAttempts > 0 ? `${Math.round(accuracy)}%` : '—'}
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {correctCount}
              </Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {incorrectCount}
              </Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>

            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalAttempts}</Text>
              <Text style={styles.statLabel}>Times Seen</Text>
            </View>
          </View>

          <View style={styles.dateStats}>
            <View style={styles.dateRow}>
              <Text style={styles.dateLabel}>Last Seen</Text>
              <Text style={styles.dateValue}>
                {formatRelativeDate(progress?.lastSeenAt ?? null)}
              </Text>
            </View>

            {progress?.nextReviewDate && (
              <View style={styles.dateRow}>
                <Text style={styles.dateLabel}>Next Review</Text>
                <Text style={styles.dateValue}>
                  {formatDate(progress.nextReviewDate)}
                </Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Difficulty */}
        <GlassCard style={styles.difficultyCard}>
          <View style={styles.difficultyRow}>
            <Text style={styles.difficultyLabel}>Difficulty</Text>
            <View style={styles.difficultyStars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= word.difficulty ? 'star' : 'star-outline'}
                  size={16}
                  color={
                    star <= word.difficulty
                      ? colors.warning
                      : colors.textSubtle
                  }
                />
              ))}
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
    paddingBottom: spacing.xxl,
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  wordCard: {
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  term: {
    ...typography.displayMedium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  pronunciationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  pronunciation: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: 'italic',
    flex: 1,
  },
  iconButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.glassOverlay,
  },
  definitionContainer: {
    marginBottom: spacing.md,
  },
  definition: {
    ...typography.bodyLarge,
    color: colors.text,
  },
  exampleContainer: {
    ...glassmorphism.overlay,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  example: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  relatedTermsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  relatedTermsLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  relatedTermsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    flex: 1,
  },
  examplesCard: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  showMoreText: {
    ...typography.label,
    color: colors.accentBlue,
    marginTop: spacing.xs,
  },
  etymologyCard: {
    marginBottom: spacing.md,
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  statsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  dateStats: {
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  dateValue: {
    ...typography.body,
    color: colors.text,
  },
  difficultyCard: {
    marginBottom: spacing.md,
  },
  difficultyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  difficultyLabel: {
    ...typography.body,
    color: colors.textSecondary,
  },
  difficultyStars: {
    flexDirection: 'row',
    gap: 2,
  },
  errorCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  errorText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
