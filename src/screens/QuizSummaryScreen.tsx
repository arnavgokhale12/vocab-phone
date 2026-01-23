import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { getScoreMessage } from '../services/QuizService';
import { SEED_WORDS } from '../data/seedWords';
import { WeakWord } from '../types/sessionSummary';
import {
  GradientBackground,
  GlassCard,
  GradientButton,
} from '../components';
import {
  colors,
  typography,
  spacing,
  borderRadius,
} from '../theme';
import { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizSummary'>;

export default function QuizSummaryScreen({ route, navigation }: Props) {
  const { score, total, results } = route.params;
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  const message = getScoreMessage(score, total);

  // Build weak words list from incorrect answers
  const weakWords = useMemo<WeakWord[]>(() => {
    const incorrectResults = results.filter(r => !r.isCorrect);
    const wordMap = new Map(SEED_WORDS.map(w => [w.id, w]));

    return incorrectResults.slice(0, 2).map(r => {
      const word = wordMap.get(r.wordId);
      return {
        wordId: r.wordId,
        term: r.term,
        definition: word?.definition ?? '',
        reason: 'incorrect' as const,
      };
    });
  }, [results]);

  // Trigger success haptic on quiz completion
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleReviewWeakWords = () => {
    if (weakWords.length > 0) {
      navigation.replace('WeakWordsQuiz', { weakWords });
    }
  };

  const handleDone = () => {
    navigation.popToTop();
  };

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <GlassCard elevated style={styles.scoreCard}>
          <Text style={styles.scoreTitle}>Quiz Complete!</Text>
          <View style={styles.scoreCircle}>
            <Text style={styles.scoreNumber}>{score}</Text>
            <Text style={styles.scoreDivider}>of</Text>
            <Text style={styles.scoreTotal}>{total}</Text>
          </View>
          <Text style={styles.percentage}>{percentage}%</Text>
          <Text style={styles.message}>{message}</Text>
        </GlassCard>

        <Text style={styles.resultsTitle}>Results</Text>

        <View style={styles.resultsList}>
          {results.map((result, index) => (
            <View key={index} style={styles.resultItem}>
              <View style={styles.resultIcon}>
                <Ionicons
                  name={result.isCorrect ? 'checkmark-circle' : 'close-circle'}
                  size={24}
                  color={result.isCorrect ? '#4CAF50' : '#F44336'}
                />
              </View>
              <View style={styles.resultContent}>
                <Text style={styles.resultTerm}>{result.term}</Text>
                {!result.isCorrect && (
                  <Text style={styles.resultHint}>Review this word tomorrow</Text>
                )}
              </View>
            </View>
          ))}
        </View>

        <View style={styles.actions}>
          {weakWords.length > 0 && (
            <GradientButton
              title="Review Weak Words"
              onPress={handleReviewWeakWords}
              variant="glass"
            />
          )}
          <GradientButton
            title="Done"
            onPress={handleDone}
            variant="primary"
          />
        </View>
      </ScrollView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
  },
  scoreCard: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scoreTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  scoreCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  scoreNumber: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.accentPurple,
    lineHeight: 72,
  },
  scoreDivider: {
    ...typography.label,
    color: colors.textMuted,
    marginVertical: spacing.xs,
  },
  scoreTotal: {
    ...typography.h2,
    color: colors.textSecondary,
  },
  percentage: {
    ...typography.h3,
    color: colors.accentBlue,
    marginBottom: spacing.md,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  resultsTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.md,
  },
  resultsList: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  resultIcon: {
    marginRight: spacing.sm,
  },
  resultContent: {
    flex: 1,
  },
  resultTerm: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  resultHint: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    marginTop: 'auto',
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
});
