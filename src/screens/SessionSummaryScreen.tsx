import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { SessionSummary, WeakWord } from '../types/sessionSummary';
import { getLastSessionSummary, clearLastSessionSummary } from '../services/storage/mmkvStorage';
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

type Props = NativeStackScreenProps<RootStackParamList, 'SessionSummary'>;

function getAccuracyMessage(accuracy: number): string {
  if (accuracy >= 100) return 'Perfect session! 🎉';
  if (accuracy >= 80) return 'Great work! 💪';
  if (accuracy >= 60) return 'Good progress! 📈';
  if (accuracy >= 40) return 'Keep practicing! 📚';
  return 'Room to improve! 💡';
}

export default function SessionSummaryScreen({ route, navigation }: Props) {
  const routeSummary = route.params?.summary;
  const [summary, setSummary] = useState<SessionSummary | null>(routeSummary ?? null);

  // Load from storage if not passed via params (app reload case)
  useEffect(() => {
    if (!summary) {
      const stored = getLastSessionSummary();
      if (stored) {
        setSummary(stored);
      }
    }
  }, [summary]);

  // Trigger success haptic
  useEffect(() => {
    if (summary) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [summary]);

  const handleReviewWeakWords = () => {
    if (summary && summary.weakWords.length > 0) {
      navigation.replace('WeakWordsQuiz', {
        weakWords: summary.weakWords,
      });
    }
  };

  const handleDone = () => {
    clearLastSessionSummary();
    navigation.popToTop();
  };

  if (!summary) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <GlassCard style={styles.errorCard}>
            <Text style={styles.errorText}>No session data available</Text>
            <GradientButton
              title="Go Home"
              onPress={() => navigation.popToTop()}
              variant="primary"
            />
          </GlassCard>
        </View>
      </GradientBackground>
    );
  }

  const sessionTypeLabel = summary.sessionType === 'learn' ? 'Learning Session' : 'Quiz';
  const message = getAccuracyMessage(summary.accuracy);

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Main Stats Card */}
        <GlassCard elevated style={styles.mainCard}>
          <Text style={styles.title}>{sessionTypeLabel} Complete!</Text>

          <View style={styles.accuracyCircle}>
            <Text style={styles.accuracyNumber}>{Math.round(summary.accuracy)}%</Text>
            <Text style={styles.accuracyLabel}>Accuracy</Text>
          </View>

          <Text style={styles.message}>{message}</Text>
        </GlassCard>

        {/* Stats Breakdown */}
        <GlassCard style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{summary.totalWords}</Text>
              <Text style={styles.statLabel}>Words</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.success }]}>
                {summary.correctCount}
              </Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.error }]}>
                {summary.incorrectCount}
              </Text>
              <Text style={styles.statLabel}>Incorrect</Text>
            </View>
          </View>

          <View style={styles.breakdownRow}>
            <View style={styles.breakdownItem}>
              <Ionicons name="sparkles" size={16} color={colors.accentPurple} />
              <Text style={styles.breakdownText}>
                {summary.newWords} new word{summary.newWords !== 1 ? 's' : ''}
              </Text>
            </View>
            <View style={styles.breakdownItem}>
              <Ionicons name="refresh" size={16} color={colors.accentBlue} />
              <Text style={styles.breakdownText}>
                {summary.reviewWords} review{summary.reviewWords !== 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Weak Words Section */}
        {summary.weakWords.length > 0 && (
          <View style={styles.weakWordsSection}>
            <Text style={styles.sectionTitle}>Words to Practice</Text>
            {summary.weakWords.map((word) => (
              <View key={word.wordId} style={styles.weakWordItem}>
                <View style={styles.weakWordIcon}>
                  <Ionicons
                    name="alert-circle"
                    size={20}
                    color={colors.warning}
                  />
                </View>
                <View style={styles.weakWordContent}>
                  <Text style={styles.weakWordTerm}>{word.term}</Text>
                  <Text style={styles.weakWordReason}>
                    {word.reason === 'incorrect' ? 'Answered incorrectly' : 'Needs more practice'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {summary.weakWords.length > 0 && (
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
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.xl,
    paddingBottom: spacing.xxl,
  },
  mainCard: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  accuracyCircle: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  accuracyNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: colors.accentPurple,
    lineHeight: 64,
  },
  accuracyLabel: {
    ...typography.label,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  message: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  statsCard: {
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.glassBorder,
  },
  statValue: {
    ...typography.h2,
    color: colors.text,
  },
  statLabel: {
    ...typography.caption,
    color: colors.textMuted,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  breakdownText: {
    ...typography.body,
    color: colors.textSecondary,
  },
  weakWordsSection: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  weakWordItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.warning + '40',
  },
  weakWordIcon: {
    marginRight: spacing.sm,
  },
  weakWordContent: {
    flex: 1,
  },
  weakWordTerm: {
    ...typography.bodyLarge,
    color: colors.text,
    fontWeight: '600',
  },
  weakWordReason: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  actions: {
    marginTop: 'auto',
    gap: spacing.md,
  },
  errorCard: {
    alignItems: 'center',
    gap: spacing.md,
  },
  errorText: {
    ...typography.body,
    color: colors.textMuted,
  },
});
