import React, { useEffect, useState, useRef, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Speech from "expo-speech";
import * as Haptics from "expo-haptics";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/AppNavigator";
import { useWords } from "../context/WordsContext";
import { useProgress } from "../context/ProgressContext";
import { setWidgetState } from "../native/appGroup";
import {
  addSeenWord,
  getLearnSession,
  updateLearnSessionIndex,
  markLearnSessionComplete,
  isBookmarked,
  toggleBookmark,
  hasAskedNotificationPermission,
  markNotificationPermissionAsked,
  setNotificationsEnabled,
  setLastSessionSummary,
  getAllProgress,
} from "../services/storage/mmkvStorage";
import { SessionSummary, WordSessionResult, WeakWord } from "../types/sessionSummary";
import {
  requestPermission,
  scheduleDailyReminder,
} from "../services/NotificationService";
import { getEtymology } from "../services/EtymologyService";
import {
  GradientBackground,
  GlassCard,
  GradientButton,
  CapsuleBadge,
  EtymologyCard,
} from "../components";
import {
  colors,
  typography,
  spacing,
  borderRadius,
  glassmorphism,
} from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "Learn">;

export default function LearnScreen({ navigation }: Props) {
  const { todayWords, todayKey, refreshTodayIfNeeded } = useWords();
  const { recordAnswer } = useProgress();
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Track session results for summary
  const sessionResults = useRef<WordSessionResult[]>([]);
  const firstSeenDatesRef = useRef<Map<string, string>>(new Map());
  const lastTodayKeyRef = useRef<string>(todayKey);

  // Clear session data when day changes to prevent stale data
  useEffect(() => {
    if (lastTodayKeyRef.current !== todayKey) {
      sessionResults.current = [];
      firstSeenDatesRef.current.clear();
      setIdx(0);
      setRevealed(false);
      setInitialized(false);
      lastTodayKeyRef.current = todayKey;
    }
  }, [todayKey]);

  useEffect(() => {
    refreshTodayIfNeeded();
  }, [refreshTodayIfNeeded]);

  // Capture word progress at session start to determine new vs review
  useEffect(() => {
    if (todayWords.length > 0 && firstSeenDatesRef.current.size === 0) {
      const allProgress = getAllProgress();
      for (const [wordId, progress] of allProgress.entries()) {
        if (progress.lastSeenAt) {
          firstSeenDatesRef.current.set(wordId, progress.lastSeenAt.split('T')[0]);
        }
      }
    }
  }, [todayWords]);

  // Load session state on mount (resume from last index)
  useEffect(() => {
    if (todayWords.length === 0 || initialized) return;

    const session = getLearnSession();
    if (session && session.dateKey === todayKey && !session.completed) {
      // Resume from last index, clamped to valid range
      const resumeIdx = Math.min(session.lastIndex, todayWords.length - 1);
      setIdx(Math.max(0, resumeIdx));
    }
    setInitialized(true);
  }, [todayWords, todayKey, initialized]);

  // Persist index changes
  useEffect(() => {
    if (!initialized || todayWords.length === 0) return;

    const currentWord = todayWords[idx];
    if (currentWord) {
      updateLearnSessionIndex(idx, currentWord.id);
    }
  }, [idx, todayWords, initialized]);

  // Reset idx if it exceeds todayWords length (can happen on goal/date change)
  useEffect(() => {
    if (idx > 0 && idx >= todayWords.length) {
      setIdx(0);
      setRevealed(false);
    }
  }, [idx, todayWords.length]);

  const handleAnswer = (correct: boolean) => {
    const currentWord = todayWords[idx];
    if (currentWord) {
      recordAnswer(currentWord.id, correct);

      // Track result for session summary
      const lastSeenDate = firstSeenDatesRef.current.get(currentWord.id);
      const isFirstSeenToday = !lastSeenDate || lastSeenDate === todayKey;

      sessionResults.current.push({
        wordId: currentWord.id,
        term: currentWord.term,
        definition: currentWord.definition,
        isCorrect: correct,
        isFirstSeenToday,
      });
    }
    setRevealed(false);
    setIdx((i) => i + 1);
  };

  // Update widget when current word changes
  useEffect(() => {
    const currentWord = todayWords[idx];
    if (currentWord) {
      setWidgetState(currentWord);
    }
  }, [idx, todayWords]);

  // Track seen words for quiz when revealed
  useEffect(() => {
    const currentWord = todayWords[idx];
    if (currentWord && revealed) {
      addSeenWord(currentWord.id);
    }
  }, [idx, todayWords, revealed]);

  // Update bookmark state when current word changes
  useEffect(() => {
    const currentWord = todayWords[idx];
    if (currentWord) {
      setBookmarked(isBookmarked(currentWord.id));
    }
  }, [idx, todayWords]);

  const handleToggleBookmark = () => {
    const currentWord = todayWords[idx];
    if (currentWord) {
      const newState = toggleBookmark(currentWord.id, currentWord.term, currentWord.definition);
      setBookmarked(newState);
    }
  };

  const speakWord = (term: string) => {
    Speech.speak(term, {
      language: "en-US",
      rate: 0.8,
      pitch: 1.0,
    });
  };

  const w = todayWords[idx];
  const etymology = w ? getEtymology(w.id) : null;

  // Build session summary and navigate
  const buildAndNavigateToSummary = useCallback(() => {
    const results = sessionResults.current;
    const correctCount = results.filter(r => r.isCorrect).length;
    const incorrectCount = results.filter(r => !r.isCorrect).length;
    const newWords = results.filter(r => r.isFirstSeenToday).length;
    const reviewWords = results.filter(r => !r.isFirstSeenToday).length;
    const accuracy = results.length > 0 ? (correctCount / results.length) * 100 : 0;

    // Find weak words (incorrect answers + lowest accuracy)
    const weakWords: WeakWord[] = results
      .filter(r => !r.isCorrect)
      .slice(0, 2)
      .map(r => ({
        wordId: r.wordId,
        term: r.term,
        definition: r.definition,
        reason: 'incorrect' as const,
      }));

    const summary: SessionSummary = {
      sessionType: 'learn',
      date: todayKey,
      timestamp: Date.now(),
      totalWords: results.length,
      newWords,
      reviewWords,
      correctCount,
      incorrectCount,
      accuracy,
      results,
      weakWords,
    };

    // Persist for app reload case
    setLastSessionSummary(summary);

    // Navigate to summary
    navigation.replace('SessionSummary', { summary });
  }, [todayKey, navigation]);

  // Mark session complete when all words are done
  useEffect(() => {
    if (initialized && todayWords.length > 0 && idx >= todayWords.length) {
      markLearnSessionComplete();

      // Ask for notification permission after first session completion
      if (!hasAskedNotificationPermission()) {
        promptForNotificationPermission();
      }

      // Navigate to session summary
      buildAndNavigateToSummary();
    }
  }, [idx, todayWords.length, initialized, buildAndNavigateToSummary]);

  async function promptForNotificationPermission() {
    markNotificationPermissionAsked();
    const granted = await requestPermission();
    if (granted) {
      setNotificationsEnabled(true);
      await scheduleDailyReminder();
    }
  }

  // When session is complete, we navigate to summary - show empty state while transitioning
  if (!w) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <GlassCard elevated style={styles.doneCard}>
            <Text style={styles.doneTitle}>Session Complete!</Text>
            <Text style={styles.doneSubtitle}>Loading summary...</Text>
          </GlassCard>
        </View>
      </GradientBackground>
    );
  }

  const progress = `${idx + 1} of ${todayWords.length}`;

  return (
    <GradientBackground>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={styles.progress}>{progress}</Text>

        <GlassCard elevated style={styles.wordCard}>
          <CapsuleBadge label={w.partOfSpeech} />
          <Text style={styles.term}>{w.term}</Text>
          <View style={styles.pronunciationRow}>
            <Text style={styles.pronunciation}>{w.pronunciation}</Text>
            <TouchableOpacity
              style={styles.speakerButton}
              onPress={() => speakWord(w.term)}
              activeOpacity={0.7}
            >
              <Ionicons name="volume-high" size={20} color={colors.accentBlue} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.bookmarkButton}
              onPress={handleToggleBookmark}
              activeOpacity={0.7}
            >
              <Ionicons
                name={bookmarked ? "heart" : "heart-outline"}
                size={20}
                color={bookmarked ? colors.accentPurple : colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          {revealed ? (
            <View style={styles.meaningContainer}>
              <Text style={styles.definition}>{w.definition}</Text>
              <View style={styles.exampleContainer}>
                <Text style={styles.example}>"{w.example}"</Text>
              </View>
              {w.synonyms && w.synonyms.length > 0 && (
                <View style={styles.synonymsContainer}>
                  <Text style={styles.synonymsLabel}>Similar:</Text>
                  <View style={styles.synonymsList}>
                    {w.synonyms.slice(0, 3).map((synonym, index) => (
                      <View key={index} style={styles.synonymPill}>
                        <Text style={styles.synonymText}>{synonym}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
              {etymology && (
                <View style={styles.etymologySection}>
                  <EtymologyCard etymology={etymology} compact />
                </View>
              )}
            </View>
          ) : (
            <Text style={styles.hint}>Tap below to reveal the meaning</Text>
          )}
        </GlassCard>

        <View style={styles.actions}>
          {!revealed ? (
            <GradientButton
              title="Reveal"
              onPress={() => setRevealed(true)}
              variant="primary"
            />
          ) : (
            <>
              <GradientButton
                title="Review Again"
                onPress={() => handleAnswer(false)}
                variant="glass"
              />
              <GradientButton
                title="Got It!"
                onPress={() => handleAnswer(true)}
                variant="primary"
              />
            </>
          )}
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
    justifyContent: "center",
  },
  container: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: "center",
  },
  progress: {
    ...typography.label,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  wordCard: {
    marginBottom: spacing.lg,
  },
  term: {
    ...typography.displayMedium,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  pronunciationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  pronunciation: {
    ...typography.body,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  speakerButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accentBlue + "20",
  },
  bookmarkButton: {
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.accentPurple + "20",
  },
  hint: {
    ...typography.body,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  meaningContainer: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  definition: {
    ...typography.bodyLarge,
    color: colors.text,
    marginBottom: spacing.md,
  },
  exampleContainer: {
    ...glassmorphism.overlay,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  example: {
    ...typography.body,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  synonymsContainer: {
    marginTop: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  synonymsLabel: {
    ...typography.label,
    color: colors.textMuted,
  },
  synonymsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  synonymPill: {
    backgroundColor: colors.accentBlue + "25",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  synonymText: {
    ...typography.label,
    color: colors.accentBlue,
  },
  etymologySection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  actions: {
    gap: spacing.md,
  },
  doneCard: {
    alignItems: "center",
  },
  doneTitle: {
    ...typography.displayMedium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  doneSubtitle: {
    ...typography.bodyLarge,
    color: colors.textSecondary,
    textAlign: "center",
  },
});
